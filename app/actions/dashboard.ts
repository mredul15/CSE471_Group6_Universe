"use server";

import { PrismaClient } from '@prisma/client';
import { cookies } from 'next/headers';

const prisma = new PrismaClient();

export async function getDashboardData() {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('userId')?.value;

    if (!userId) {
      return { success: false, message: "Unauthorized", user: null, courses: [], latestGoal: null };
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        department: true,
        semester: true,
        currentCgpa: true,
      },
    });

    const courses = await prisma.course.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    const latestGoal = await prisma.academicGoal.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return { success: true, user, courses, latestGoal };
  } catch (error) {
    console.error("Dashboard Fetch Error:", error);
    return { success: false, message: "Failed to load dashboard data.", user: null, courses: [], latestGoal: null };
  }
}

export async function logoutUser() {
  const cookieStore = await cookies();
  cookieStore.delete('userId');
  return { success: true };
}