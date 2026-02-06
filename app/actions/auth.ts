"use server";

import { redirect } from "next/navigation";
import {
  login,
  logout,
  getCurrentUser as getAuthUser,
  requireAuth as authRequireAuth,
  requireAdmin as authRequireAdmin,
} from "@/lib/auth";
import type { AuthUser } from "@/types/models";

export async function loginAction(
  _prevState: { error?: string } | null,
  formData: FormData
): Promise<{ error?: string }> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const rememberMe = formData.get("rememberMe") === "on";

  if (!email || !password) {
    return { error: "Email y contraseña son requeridos" };
  }

  try {
    const result = await login(email, password, rememberMe);

    if (!result.success) {
      return { error: result.error || "Credenciales inválidas" };
    }
  } catch (error) {
    console.error("Login error:", error);
    return { error: "Error al iniciar sesión" };
  }

  redirect("/dashboard");
}

export async function logoutAction() {
  await logout();
  redirect("/login");
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  return getAuthUser();
}

export async function requireAuth(): Promise<AuthUser> {
  try {
    return await authRequireAuth();
  } catch {
    redirect("/login");
  }
}

export async function requireAdmin(): Promise<AuthUser> {
  try {
    return await authRequireAdmin();
  } catch {
    redirect("/dashboard");
  }
}
