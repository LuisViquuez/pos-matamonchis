"use server";

import prisma from "@/lib/prisma";
import { requireAdmin, hashPassword } from "@/lib/auth";
import type { User } from "@/types/models";
import type { CreateUserDTO, UpdateUserDTO } from "@/types/dto";

type SafeUser = Omit<User, "password_hash">;

function serializeUser(user: {
  id: number;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: Date;
}): SafeUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role as User["role"],
    is_active: user.isActive,
    created_at: user.createdAt,
  };
}

export async function getUsers(): Promise<SafeUser[]> {
  await requireAdmin();

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
    orderBy: { name: "asc" },
  });
  return users.map(serializeUser);
}

export async function getUserById(
  id: number,
): Promise<SafeUser | null> {
  await requireAdmin();

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });
  return user ? serializeUser(user) : null;
}

export async function createUser(
  data: CreateUserDTO,
): Promise<SafeUser> {
  await requireAdmin();

  // Check if email already exists
  const existing = await prisma.user.findUnique({
    where: { email: data.email },
  });
  if (existing) throw new Error("Email already exists");

  const passwordHash = await hashPassword(data.password);

  const result = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      passwordHash,
      role: data.role,
      isActive: data.is_active ?? true,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });
  return serializeUser(result);
}

export async function updateUser(
  data: UpdateUserDTO,
): Promise<SafeUser> {
  await requireAdmin();

  const existing = await prisma.user.findUnique({
    where: { id: data.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });

  if (!existing) {
    throw new Error("User not found");
  }

  // If email is being changed, check it doesn't exist
  if (data.email && data.email !== existing.email) {
    const emailExists = await prisma.user.findFirst({
      where: { email: data.email, NOT: { id: data.id } },
    });
    if (emailExists) throw new Error("Email already exists");
  }

  const updateData: {
    name?: string;
    email?: string;
    role?: "admin" | "cashier";
    isActive?: boolean;
    passwordHash?: string;
  } = {};

  if (data.name !== undefined) {
    updateData.name = data.name;
  }
  if (data.email !== undefined) {
    updateData.email = data.email;
  }
  if (data.role !== undefined) {
    updateData.role = data.role;
  }
  if (data.is_active !== undefined) {
    updateData.isActive = data.is_active;
  }

  if (data.password) {
    updateData.passwordHash = await hashPassword(data.password);
  }

  if (Object.keys(updateData).length === 0) {
    return serializeUser(existing);
  }

  const result = await prisma.user.update({
    where: { id: data.id },
    data: updateData,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });
  return serializeUser(result);
}

export async function deleteUser(id: number): Promise<void> {
  await requireAdmin();

  // Soft delete - just deactivate
  await prisma.user.update({ where: { id }, data: { isActive: false } });
}

export async function toggleUserStatus(
  id: number,
): Promise<SafeUser> {
  await requireAdmin();

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      isActive: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });
  if (!user) throw new Error("User not found");
  const result = await prisma.user.update({
    where: { id },
    data: { isActive: !user.isActive },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });
  return serializeUser(result);
}

// Alias export for compatibility
export async function getAllUsers(): Promise<SafeUser[]> {
  return getUsers();
}
