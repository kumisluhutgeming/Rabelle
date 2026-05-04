"use server";

import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function registerUser(formData: FormData) {
  const name = formData.get("name") as string;
  const username = formData.get("username") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!name || !username || !email || !password) {
    return { error: "Semua kolom wajib diisi" };
  }

  if (password !== confirmPassword) {
    return { error: "Password tidak cocok" };
  }

  // Check if email or username exists
  const existingUser = await prisma.users.findFirst({
    where: {
      OR: [
        { email },
        { username }
      ]
    }
  });

  if (existingUser) {
    return { exists: true, error: "Tampaknya Anda sudah memiliki akun (Email/Username sudah ada). Silakan login di sini." };
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    await prisma.users.create({
      data: {
        name,
        username,
        email,
        password: hashedPassword,
        is_admin: false,
        role: "viewers",
        created_at: new Date(),
        updated_at: new Date()
      }
    });

    return { success: true };
  } catch (error) {
    return { error: "Gagal membuat akun. Silakan coba lagi." };
  }
}
