"use server";

import { PrismaClient } from '@prisma/client';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

const prisma = new PrismaClient();

type TaskInput = {
  title: string;
  course?: string;
  type: 'ASSIGNMENT' | 'QUIZ';
  dueAt: string;
  reminderHours: number;
  notes?: string;
};

async function getAuthenticatedUserId() {
  const cookieStore = await cookies();
  return cookieStore.get('userId')?.value;
}

export async function getSchedulerData() {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) return { success: false, message: 'Unauthorized', tasks: [] };

    const tasks = await prisma.academicTask.findMany({
      where: { userId },
      orderBy: [{ isCompleted: 'asc' }, { dueAt: 'asc' }],
    });

    return { success: true, tasks };
  } catch (error) {
    console.error('Scheduler Fetch Error:', error);
    return { success: false, message: 'Unable to load scheduled work.', tasks: [] };
  }
}

export async function createAcademicTask(data: TaskInput) {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) return { success: false, message: 'Please log in first.' };

    const title = data.title.trim();
    const dueAt = new Date(data.dueAt);
    if (!title || Number.isNaN(dueAt.getTime()) || dueAt <= new Date()) {
      return { success: false, message: 'Enter a title and a future deadline.' };
    }
    if (!['ASSIGNMENT', 'QUIZ'].includes(data.type)) {
      return { success: false, message: 'Select an assignment or quiz.' };
    }

    await prisma.academicTask.create({
      data: {
        userId,
        title,
        course: data.course?.trim() || null,
        type: data.type,
        dueAt,
        reminderHours: Math.min(Math.max(Math.round(data.reminderHours || 24), 1), 720),
        notes: data.notes?.trim() || null,
      },
    });
    revalidatePath('/scheduler');
    revalidatePath('/dashboard');
    return { success: true, message: 'Deadline added.' };
  } catch (error) {
    console.error('Create Task Error:', error);
    return { success: false, message: 'Unable to add the deadline.' };
  }
}

export async function toggleAcademicTask(taskId: string) {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) return { success: false, message: 'Unauthorized' };

    const task = await prisma.academicTask.findFirst({ where: { id: taskId, userId } });
    if (!task) return { success: false, message: 'Task not found.' };

    await prisma.academicTask.update({ where: { id: taskId }, data: { isCompleted: !task.isCompleted } });
    revalidatePath('/scheduler');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    console.error('Toggle Task Error:', error);
    return { success: false, message: 'Unable to update the task.' };
  }
}

export async function deleteAcademicTask(taskId: string) {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) return { success: false, message: 'Unauthorized' };

    const result = await prisma.academicTask.deleteMany({ where: { id: taskId, userId } });
    if (!result.count) return { success: false, message: 'Task not found.' };
    revalidatePath('/scheduler');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    console.error('Delete Task Error:', error);
    return { success: false, message: 'Unable to delete the task.' };
  }
}
