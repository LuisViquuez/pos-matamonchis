"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/app/actions/auth";
import {
  getAllUsers,
  createUser,
  updateUser,
  toggleUserStatus,
} from "@/services/users";
import type { User } from "@/types/models";
import {
  createUserSchema,
  updateUserSchema,
  type CreateUserDTO,
  type UpdateUserDTO,
} from "@/types/dto";
import { ZodError } from "zod";

type SafeUser = Omit<User, "password_hash">;

export async function getUsersListAction() {
  await requireAdmin();
  return getAllUsers();
}

export async function createUserAction(
  data: CreateUserDTO,
): Promise<{ success: boolean; error?: string; user?: SafeUser }> {
  try {
    await requireAdmin();

    const validatedData = createUserSchema.parse(data);

    const user = await createUser(validatedData);

    revalidatePath("/dashboard/users");
    return { success: true, user };
  } catch (error) {
    console.error("Error creating user:", error);
    if (error instanceof ZodError) {
      return {
        success: false,
        error: error.issues[0]?.message ?? "Datos inválidos",
      };
    }
    if (
      error instanceof Error &&
      (error.message.includes("Email already exists") ||
        error.message.includes("duplicate"))
    ) {
      return { success: false, error: "El correo ya está registrado" };
    }
    return { success: false, error: "Error al crear el usuario" };
  }
}

export async function updateUserAction(
  id: number,
  data: Omit<UpdateUserDTO, "id">,
): Promise<{ success: boolean; error?: string; user?: SafeUser }> {
  try {
    await requireAdmin();

    const validatedData = updateUserSchema.parse({ id, ...data });

    const user = await updateUser(validatedData);

    revalidatePath("/dashboard/users");
    return { success: true, user };
  } catch (error) {
    console.error("Error updating user:", error);
    if (error instanceof ZodError) {
      return {
        success: false,
        error: error.issues[0]?.message ?? "Datos inválidos",
      };
    }
    if (
      error instanceof Error &&
      (error.message.includes("Email already exists") ||
        error.message.includes("duplicate"))
    ) {
      return { success: false, error: "El correo ya está registrado" };
    }
    return { success: false, error: "Error al actualizar el usuario" };
  }
}

export async function toggleUserStatusAction(
  id: number,
): Promise<{ success: boolean; error?: string }> {
  try {
    const currentUser = await requireAdmin();

    if (currentUser.id === id) {
      return {
        success: false,
        error: "No puedes cambiar tu propio estado",
      };
    }

    await toggleUserStatus(id);
    revalidatePath("/dashboard/users");
    return { success: true };
  } catch (error) {
    console.error("Error toggling user status:", error);
    return { success: false, error: "Error al cambiar el estado del usuario" };
  }
}
