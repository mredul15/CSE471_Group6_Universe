"use server"

import { PrismaClient } from '@prisma/client'
import { revalidatePath } from 'next/cache'

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
    await prisma.academicGoal.create({
      data: {
        semesterNumber: data.semesterNumber,
        currentCgpa: data.currentCgpa,
        completedCredits: data.completedCredits,
        targetCgpa: data.targetCgpa,
        upcomingCredits: data.upcomingCredits,
        requiredGpa: data.requiredGpa,
        isPossible: data.isPossible,
        
        // This automatically loops through and saves every course to the database 
        // linked perfectly to this specific semester goal!
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
    return { success: true, message: "Semester & Courses saved to Planner!" };
  } catch (error) {
    console.error("Database Error:", error);
    return { success: false, message: "Failed to save data." };
  }
}