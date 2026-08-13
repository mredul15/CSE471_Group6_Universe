"use server";

import { PrismaClient } from '@prisma/client';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

const prisma = new PrismaClient();

// Helper to get authorized user
async function getAuthUserId() {
  const cookieStore = await cookies();
  return cookieStore.get('userId')?.value;
}

export async function getBudgetData(month?: number, year?: number) {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return { success: false, message: "Unauthorized", user: null, budget: null, expenses: [] };
    }

    const currentDate = new Date();
    const targetMonth = month !== undefined ? month : currentDate.getMonth() + 1; // 1-12
    const targetYear = year !== undefined ? year : currentDate.getFullYear();

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, department: true, semester: true, currentCgpa: true }
    });

    const budget = await prisma.budget.findUnique({
      where: {
        userId_month_year: {
          userId,
          month: targetMonth,
          year: targetYear
        }
      }
    });

    // Fetch expenses for the specified month and year
    const startOfMonth = new Date(targetYear, targetMonth - 1, 1);
    const endOfMonth = new Date(targetYear, targetMonth, 0, 23, 59, 59, 999);

    const expenses = await prisma.expense.findMany({
      where: {
        userId,
        date: {
          gte: startOfMonth,
          lte: endOfMonth
        }
      },
      orderBy: { date: 'desc' }
    });

    return { success: true, user, budget, expenses, month: targetMonth, year: targetYear };
  } catch (error) {
    console.error("Budget Fetch Error:", error);
    return { success: false, message: "Error fetching budget data", user: null, budget: null, expenses: [] };
  }
}

export async function updateBudget(amount: number, month: number, year: number) {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return { success: false, message: "Unauthorized" };
    }

    await prisma.budget.upsert({
      where: {
        userId_month_year: {
          userId,
          month,
          year
        }
      },
      update: { amount },
      create: {
        userId,
        amount,
        month,
        year
      }
    });

    revalidatePath('/budget');
    revalidatePath('/dashboard');
    return { success: true, message: "Budget updated successfully!" };
  } catch (error) {
    console.error("Update Budget Error:", error);
    return { success: false, message: "Failed to update budget limit." };
  }
}

export async function addExpense(data: { amount: number; category: string; description?: string; date: string }) {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return { success: false, message: "Unauthorized" };
    }

    await prisma.expense.create({
      data: {
        userId,
        amount: data.amount,
        category: data.category.toUpperCase(),
        description: data.description || "",
        date: new Date(data.date)
      }
    });

    revalidatePath('/budget');
    revalidatePath('/dashboard');
    return { success: true, message: "Expense logged successfully!" };
  } catch (error) {
    console.error("Add Expense Error:", error);
    return { success: false, message: "Failed to log expense." };
  }
}

export async function deleteExpense(id: string) {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return { success: false, message: "Unauthorized" };
    }

    // Verify ownership
    const expense = await prisma.expense.findFirst({
      where: { id, userId }
    });

    if (!expense) {
      return { success: false, message: "Expense not found." };
    }

    await prisma.expense.delete({
      where: { id }
    });

    revalidatePath('/budget');
    revalidatePath('/dashboard');
    return { success: true, message: "Expense deleted successfully!" };
  } catch (error) {
    console.error("Delete Expense Error:", error);
    return { success: false, message: "Failed to delete expense." };
  }
}

export interface AIInsightCard {
  title: string;
  type: 'info' | 'success' | 'warning' | 'danger';
  icon: string;
  message: string;
}

export async function getAISpendingInsights(month: number, year: number) {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return { success: false, insights: [], shortageForecast: null };
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return { success: false, insights: [], shortageForecast: null };
    }

    const budget = await prisma.budget.findUnique({
      where: {
        userId_month_year: {
          userId,
          month,
          year
        }
      }
    });

    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

    const expenses = await prisma.expense.findMany({
      where: {
        userId,
        date: {
          gte: startOfMonth,
          lte: endOfMonth
        }
      }
    });

    const totalBudget = budget?.amount || 0;
    const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
    const remaining = totalBudget - totalSpent;

    const daysInMonth = new Date(year, month, 0).getDate();
    const today = new Date();
    const currentDay = today.getMonth() + 1 === month && today.getFullYear() === year ? today.getDate() : daysInMonth;

    const dailyAverage = currentDay > 0 ? totalSpent / currentDay : 0;
    const projectedTotal = dailyAverage * daysInMonth;
    const projectedShortage = totalBudget > 0 && projectedTotal > totalBudget ? projectedTotal - totalBudget : 0;

    let shortageForecastText = "";
    let shortageType: 'success' | 'warning' | 'danger' | 'info' = 'success';

    if (totalBudget === 0) {
      shortageForecastText = "Please set a monthly budget limit to enable AI shortage forecasting.";
      shortageType = 'info';
    } else if (remaining < 0) {
      shortageForecastText = `Budget Overspent! You have exceeded your budget by Tk ${Math.abs(remaining).toFixed(2)}. Stop non-essential expenses immediately!`;
      shortageType = 'danger';
    } else if (projectedTotal > totalBudget) {
      const daysLeftToLive = dailyAverage > 0 ? remaining / dailyAverage : 0;
      const depletionDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + Math.floor(daysLeftToLive));
      shortageForecastText = `Shortage Warning: At your current spending rate of Tk ${dailyAverage.toFixed(2)}/day, your budget will run out on ${depletionDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}. You are projected to finish the month with a shortage of Tk ${projectedShortage.toFixed(2)}.`;
      shortageType = 'warning';
    } else {
      const savingsForecast = totalBudget - projectedTotal;
      shortageForecastText = `On Track! You are spending Tk ${dailyAverage.toFixed(2)}/day on average. You are projected to finish the month with Tk ${savingsForecast.toFixed(2)} in savings. Great job!`;
      shortageType = 'success';
    }

    // Category breakdown
    const categoryTotals: { [key: string]: number } = {
      FOOD: 0,
      TRANSIT: 0,
      PRINTING: 0,
      ACADEMIC: 0,
      ENTERTAINMENT: 0,
      OTHER: 0
    };
    expenses.forEach(e => {
      const cat = e.category.toUpperCase();
      if (categoryTotals[cat] !== undefined) {
        categoryTotals[cat] += e.amount;
      } else {
        categoryTotals['OTHER'] += e.amount;
      }
    });

    // Rule-Based AI Engine custom recommendations
    const insights: AIInsightCard[] = [];

    // General context based on CGPA and student profile
    if (user.currentCgpa < 3.0) {
      insights.push({
        title: "Academic Focus Recommendation",
        type: "warning",
        icon: "📚",
        message: `Your current CGPA is ${user.currentCgpa.toFixed(2)}. High spending on social/entertainment or transit indicates time spent outside campus routines. We suggest cutting back on non-essential travel to allocate more hours to coursework.`
      });
    } else if (user.currentCgpa >= 3.5) {
      insights.push({
        title: "Scholarship Track Profile",
        type: "success",
        icon: "🏅",
        message: `Excellent CGPA of ${user.currentCgpa.toFixed(2)}! Keep your expenses low in transit and printing by utilizing institutional digital study aids to maximize the benefits of any prospective waivers.`
      });
    }

    // Department & Printing recommendation
    const printingSpent = categoryTotals['PRINTING'] || 0;
    if (printingSpent > 300) {
      insights.push({
        title: "Academic Printing Audit",
        type: "danger",
        icon: "🖨️",
        message: `You spent Tk ${printingSpent.toFixed(2)} on academic printing. As a student in the ${user.department} department, consider sharing paper materials with project group peers or using free university library quotas to trim this cost.`
      });
    } else {
      insights.push({
        title: "Printing Economy",
        type: "success",
        icon: "📄",
        message: `Your printing expenses are well managed (Tk ${printingSpent.toFixed(2)}). Keep using digital notes to save on paper cost.`
      });
    }

    // Transit analysis
    const transitSpent = categoryTotals['TRANSIT'] || 0;
    if (transitSpent > 1000) {
      insights.push({
        title: "Transit Cost Optimizer",
        type: "warning",
        icon: "🚲",
        message: `Transit expense is Tk ${transitSpent.toFixed(2)} this month. Tip: Check the Campus Carpool Hub in the UniVerse app to share rides and split CNG or taxi fares with peers heading to the same locations.`
      });
    }

    // Food spending analysis
    const foodSpent = categoryTotals['FOOD'] || 0;
    if (totalBudget > 0 && foodSpent > 0.4 * totalBudget) {
      insights.push({
        title: "Food Budget Threshold Exceeded",
        type: "danger",
        icon: "🍔",
        message: `Food spending (Tk ${foodSpent.toFixed(2)}) is taking up over 40% of your total budget. Consider campus dining halls, student group meals, or packing snacks to curb dining out.`
      });
    }

    // Entertainment & Other
    const entertainmentSpent = categoryTotals['ENTERTAINMENT'] || 0;
    if (entertainmentSpent > 800) {
      insights.push({
        title: "Leisure Spending Cap",
        type: "warning",
        icon: "🎮",
        message: `Tk ${entertainmentSpent.toFixed(2)} was spent on Entertainment. Limiting recreational subscriptions or weekend cafes can immediately secure a savings buffer of Tk 500+ for the upcoming semester.`
      });
    }

    // Real AI integration if key is present (standard HTTP fetch can be used to prevent library warnings)
    if (process.env.OPENAI_API_KEY) {
      try {
        // AI queries can be executed directly via fetch to api.openai.com if needed.
      } catch (e) {
        console.error("OpenAI execution error:", e);
      }
    }

    return {
      success: true,
      insights,
      shortageForecast: {
        dailyAverage,
        projectedTotal,
        projectedShortage,
        text: shortageForecastText,
        type: shortageType
      }
    };
  } catch (error) {
    console.error("AI Insights Error:", error);
    return { success: false, insights: [], shortageForecast: null };
  }
}
