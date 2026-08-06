"use server";

import { PrismaClient } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

const prisma = new PrismaClient();

export async function registerUser(data: {
  name: string;
  email: string;
  password: string;
  department: string;
  semester: number;
  currentCgpa: number;
}) {
  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      return { success: false, message: "User with this email already exists!" };
    }

    // Create user in PostgreSQL
    await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: data.password, 
        department: data.department,
        semester: data.semester,
        currentCgpa: data.currentCgpa,
      },
    });

    revalidatePath('/login');
    return { success: true, message: "Registration successful!" };
  } catch (error) {
    console.error("Registration Error:", error);
    return { success: false, message: "Failed to register user." };
  }
}

export async function loginUser(data: { email: string; password: string }) {
  try {
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      return { success: false, message: "User not found. Please register first." };
    }

    if (user.password !== data.password) {
      return { success: false, message: "Wrong password. Click 'Forgot password?' if you need help." };
    }

    // FIX FOR NEXT.JS 15+: cookies() must be awaited!
    (await cookies()).set('userId', user.id, { path: '/' });

    return { success: true, message: "Login successful!" };
  } catch (error) {
    console.error("Login Error:", error);
    return { success: false, message: "An error occurred during login." };
  }
}