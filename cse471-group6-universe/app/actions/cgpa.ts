"use server"

import { PrismaClient } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers' // <-- ADD THIS IMPORT

const prisma = new PrismaClient()

export async function saveAcademicGoal(data: {
  semesterNumber: number;
  currentCgpa: number;
  completedCredits: number;
  targetCgpa: number;
  upcomingCredits: number;
  requiredGpa: number;
  isPossible: boolean;
  courses: { name: string; credits: number; targetGrade: string }[];
}) {
  try {
    // NEW: Check exactly who is logged in by reading the cookie
    const userId = cookies().get('userId')?.value;

    if (!userId) {
      return { success: false, message: "Error: You must be logged in to save your planner." };
    }

    await prisma.academicGoal.create({
      data: {
        userId: userId, // <-- NOW WE LINK TO THE REAL LOGGED-IN USER!
        semesterNumber: data.semesterNumber,
        currentCgpa: data.currentCgpa,
        completedCredits: data.completedCredits,
        targetCgpa: data.targetCgpa,
        upcomingCredits: data.upcomingCredits,
        requiredGpa: data.requiredGpa,
        isPossible: data.isPossible,
        
        simulatedCourses: {
          create: data.courses.map(course => ({
            name: course.name,
            credits: course.credits,
            targetGrade: course.targetGrade,
          }))
        }
      },
    });

    revalidatePath('/cgpa-forecast');
    return { success: true, message: "Forecast successfully saved to your profile!" };
  } catch (error) {
    console.error("Database Error:", error);
    return { success: false, message: "Failed to persist data to PostgreSQL." };
  }
}