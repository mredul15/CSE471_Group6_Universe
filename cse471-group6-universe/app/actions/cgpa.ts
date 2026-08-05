"use server"

import { PrismaClient } from '@prisma/client'
import { revalidatePath } from 'next/cache'

const prisma = new PrismaClient()

export async function saveAcademicGoal(data: {
  currentCgpa: number;
  completedCredits: number;
  targetCgpa: number;
  upcomingCredits: number;
  requiredGpa: number;
  isPossible: boolean;
}) {
  try {
    await prisma.academicGoal.create({
      data: {
        currentCgpa: data.currentCgpa,
        completedCredits: data.completedCredits,
        targetCgpa: data.targetCgpa,
        upcomingCredits: data.upcomingCredits,
        requiredGpa: data.requiredGpa,
        isPossible: data.isPossible,
      },
    });

    revalidatePath('/cgpa-forecast');
    return { success: true, message: "Simulation saved to Planner!" };
  } catch (error) {
    return { success: false, message: "Failed to save goal." };
  }
}