"use server";

import { PrismaClient } from '@prisma/client';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { GoogleGenAI } from '@google/genai';

const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function getAuthUserId() {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('userId')?.value;
    return userId || null;
  } catch (error) {
    console.error("Auth Cookie Error:", error);
    return null;
  }
}

export async function getBudgetData(month?: number, year?: number) {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return { success: false, message: "Unauthorized", user: null, budget: null, expenses: [] };
    }

    const currentDate = new Date();
    const targetMonth = month !== undefined ? month : currentDate.getMonth() + 1;
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

    const parsedAmount = parseFloat(String(amount));
    if (isNaN(parsedAmount) || parsedAmount < 0) {
      return { success: false, message: "Invalid budget amount." };
    }

    const existingBudget = await prisma.budget.findUnique({
      where: {
        userId_month_year: {
          userId,
          month,
          year
        }
      }
    });

    if (existingBudget) {
      await prisma.budget.update({
        where: { id: existingBudget.id },
        data: { amount: parsedAmount }
      });
    } else {
      await prisma.budget.create({
        data: {
          userId,
          amount: parsedAmount,
          month,
          year
        }
      });
    }

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
        amount: Number(data.amount),
        category: (data.category || 'OTHER').toUpperCase(),
        description: data.description || "",
        date: data.date ? new Date(data.date) : new Date()
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

    let shortageForecastText = "";
    let shortageType: 'success' | 'warning' | 'danger' | 'info' = 'success';

    if (totalBudget === 0) {
      shortageForecastText = "Please set a monthly budget limit to enable AI shortage forecasting.";
      shortageType = 'info';
    } else if (remaining < 0) {
      shortageForecastText = `Budget Overspent! You have exceeded your budget by Tk ${Math.abs(remaining).toFixed(2)}. Stop non-essential expenses immediately!`;
      shortageType = 'danger';
    } else {
      const prompt = `You are an expert AI financial advisor for a university student. 
      Total Monthly Budget: Tk ${totalBudget}
      Total Spent So Far: Tk ${totalSpent}
      Remaining Budget: Tk ${remaining}
      Daily Average Spend: Tk ${dailyAverage.toFixed(2)}
      
      Provide a detailed financial health assessment and shortage forecast highlighting specific risks and actionable control measures.`;

      try {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
        });
        shortageForecastText = response.text || `On Track! You are spending Tk ${dailyAverage.toFixed(2)}/day on average.`;
      } catch (apiError) {
        console.error("Gemini API Call Failed:", apiError);
        shortageForecastText = `On Track! You are spending Tk ${dailyAverage.toFixed(2)}/day on average.`;
      }

      shortageType = projectedTotal > totalBudget ? 'warning' : 'success';
    }

    const categoryTotals: { [key: string]: number } = {
      FOOD: 0,
      TRANSIT: 0,
      PRINTING: 0,
      ACADEMIC: 0,
      ENTERTAINMENT: 0,
      OTHER: 0
    };
    expenses.forEach(e => {
      const cat = (e.category || 'OTHER').toUpperCase();
      if (categoryTotals[cat] !== undefined) {
        categoryTotals[cat] += e.amount;
      } else {
        categoryTotals['OTHER'] += e.amount;
      }
    });

    let highestCategory = 'FOOD';
    let maxAmount = -1;
    for (const [cat, amt] of Object.entries(categoryTotals)) {
      if (amt > maxAmount) {
        maxAmount = amt;
        highestCategory = cat;
      }
    }

    const insights: AIInsightCard[] = [];

    try {
      const recommendationPrompt = `Act as an expert, practical financial mentor for a university student. 
      Financial Data:
      - Budget: Tk ${totalBudget}
      - Total Spent: Tk ${totalSpent}
      - Remaining: Tk ${remaining}
      - Breakdown: Food = Tk ${categoryTotals['FOOD']}, Transit = Tk ${categoryTotals['TRANSIT']}, Entertainment = Tk ${categoryTotals['ENTERTAINMENT']}, Academic & Printing = Tk ${categoryTotals['PRINTING'] + categoryTotals['ACADEMIC']}, Other = Tk ${categoryTotals['OTHER']}
      - Highest Expense Category: ${highestCategory} (Tk ${maxAmount})

      Instructions: Write a rich, detailed, narrative financial recommendation (4 to 5 long paragraphs, NO bullet points). 
      1. First, deeply analyze the highest spending category (${highestCategory}). Explain why spending heavily here is draining the wallet, and give concrete, practical alternative lifestyle ideas and habits to minimize it.
      2. Second, go through the other remaining active expense categories one by one. Provide clever, actionable tips and alternative paths to cut costs in those secondary sectors as well.
      3. Give inspiring, practical lifestyle advice on how to manage daily routines and save money for the rest of the month.`;

      const completion = await groq.chat.completions.create({
        model: "llama-3.1-8b-instant",
        messages: [{ role: "user", content: recommendationPrompt }],
        temperature: 0.8,
        max_tokens: 1000,
      });

      const recommendationText = completion.choices[0]?.message?.content || `Your total expenditure has reached Tk ${totalSpent} against your Tk ${totalBudget} budget, with the heaviest outflow concentrated in ${highestCategory}. To fix this, you should immediately adopt alternative lifestyle habits for ${highestCategory}, such as reducing cafe outings or preparing home meals. Additionally, review your secondary expenses in transit, printing, and academic sectors, minimizing daily costs step-by-step to secure your financial standing for the rest of the month.`;

      insights.push({
        title: `AI Lifestyle & Financial Recommendations (Focus: ${highestCategory})`,
        type: shortageType,
        icon: "💡",
        message: recResponse.text || "Optimize your daily campus transit and food costs to maximize monthly savings and prevent overspending."
      });
    } catch (err: any) {
      console.error("Groq Recommendation Error:", err);
      // ফেইল করলেও যেন বড় ও ডিটেইলড সাজেশন দেখায় তার সুব্যবস্থা
      insights.push({
        title: `AI Lifestyle & Financial Recommendations (Focus: ${highestCategory})`,
        type: "warning",
        icon: "💡",
        message: `Looking at your current spending of Tk ${totalSpent} out of your Tk ${totalBudget} budget, your major financial leakage is happening in the ${highestCategory} category. To turn things around, you need to radically change your approach: for ${highestCategory}, try avoiding unnecessary expenditures, plan ahead, and adopt budget-friendly alternatives like home-cooked food or shared commutes. Furthermore, look closely at your secondary sectors such as transit, academic books, and printing costs. By optimizing your daily routes, buying second-hand notes, and cutting down casual hangouts, you can easily save a significant amount of money and ensure complete financial security for the rest of the month.`
      });
    }

    return {
      success: true,
      insights,
      shortageForecast: {
        dailyAverage,
        projectedTotal,
        projectedShortage: projectedTotal > totalBudget ? projectedTotal - totalBudget : 0,
        text: shortageForecastText,
        type: shortageType
      }
    };
  } catch (error) {
    console.error("AI Insights Error:", error);
    return { success: false, insights: [], shortageForecast: null };
  }
}