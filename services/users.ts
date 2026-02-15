"use server";

import prisma from "@/lib/prisma";
import { requireAdmin, hashPassword } from "@/lib/auth";
import type { User } from "@/types/models";
import type { CreateUserDTO, UpdateUserDTO } from "@/types/dto";

export async function getUsers(): Promise<Omit<User, "password_hash">[]> {
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
  return users as unknown as Omit<User, "password_hash">[];
}

export async function getUserById(
  id: number,
): Promise<Omit<User, "password_hash"> | null> {
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
  return user as unknown as Omit<User, "password_hash"> | null;
}

export async function createUser(
  data: CreateUserDTO,
): Promise<Omit<User, "password_hash">> {
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
  return result as unknown as Omit<User, "password_hash">;
}

export async function updateUser(
  data: UpdateUserDTO,
): Promise<Omit<User, "password_hash">> {
  await requireAdmin();

  const existing = await getUserById(data.id);
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

  // If password is provided, hash it
  let passwordUpdate = "";
  if (data.password) {
    const passwordHash = await hashPassword(data.password);
    await prisma.user.update({
      where: { id: data.id },
      data: { passwordHash },
    });
  }

  const result = await prisma.user.update({
    where: { id: data.id },
    data: {
      name: data.name ?? existing.name,
      email: data.email ?? existing.email,
      role: data.role ?? existing.role,
      isActive: data.is_active ?? existing.is_active,
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
  return result as unknown as Omit<User, "password_hash">;
}

export async function deleteUser(id: number): Promise<void> {
  await requireAdmin();

  // Soft delete - just deactivate
  await prisma.user.update({ where: { id }, data: { isActive: false } });
}

export async function toggleUserStatus(
  id: number,
): Promise<Omit<User, "password_hash">> {
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
  return result as unknown as Omit<User, "password_hash">;
}

// Alias export for compatibility
export async function getAllUsers(): Promise<Omit<User, "password_hash">[]> {
  return getUsers();
}
