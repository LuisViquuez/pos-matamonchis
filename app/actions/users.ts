"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/app/actions/auth";
import { hashPassword } from "@/lib/auth";
import {
  getAllUsers,
  createUser,
  updateUser,
  toggleUserStatus,
} from "@/services/users";
import type { CreateUserDTO, UpdateUserDTO } from "@/types/dto";

export async function getUsersListAction() {
  await requireAdmin();
  return getAllUsers();
}

export async function createUserAction(
  data: CreateUserDTO
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();
    
    const passwordHash = await hashPassword(data.password);
    await createUser({
      name: data.name,
      email: data.email,
      password_hash: passwordHash,
      role: data.role,
    });
    
    revalidatePath("/dashboard/users");
    return { success: true };
  } catch (error) {
    console.error("Error creating user:", error);
    if (error instanceof Error && error.message.includes("duplicate")) {
      return { success: false, error: "El correo ya está registrado" };
    }
    return { success: false, error: "Error al crear el usuario" };
  }
}

export async function updateUserAction(
  id: number,
  data: UpdateUserDTO
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();
    
    const updateData: Record<string, unknown> = {
      name: data.name,
      email: data.email,
      role: data.role,
    };
    
    if (data.password) {
      updateData.password_hash = await hashPassword(data.password);
    }
    
    await updateUser(id, updateData);
    revalidatePath("/dashboard/users");
    return { success: true };
  } catch (error) {
    console.error("Error updating user:", error);
    return { success: false, error: "Error al actualizar el usuario" };
  }
}

export async function toggleUserStatusAction(
  id: number
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();
    await toggleUserStatus(id);
    revalidatePath("/dashboard/users");
    return { success: true };
  } catch (error) {
    console.error("Error toggling user status:", error);
    return { success: false, error: "Error al cambiar el estado del usuario" };
  }
}
