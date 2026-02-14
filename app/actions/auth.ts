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
  const start = Date.now();
  const email = (formData.get("email") as string) || "";
  const password = (formData.get("password") as string) || "";
  const rememberMe = formData.get("rememberMe") === "on";

  function msPassed() {
    return Date.now() - start;
  }

  function waitRemaining() {
    const remaining = 3000 - msPassed();
    if (remaining > 0) return new Promise((r) => setTimeout(r, remaining));
    return Promise.resolve();
  }

  if (!email || !password) {
    await waitRemaining();
    return { error: "El correo y la contraseña son requeridos" };
  }

  // Si contiene @ validar formato de correo, si no, puede ser username
  const emailRegex = /^\S+@\S+\.\S+$/;
  if (email.includes("@") && !emailRegex.test(email)) {
    await waitRemaining();
    return { error: "Formato de correo inválido" };
  }

  if (password.length < 8) {
    await waitRemaining();
    return { error: "La contraseña debe tener mínimo 8 caracteres" };
  }

  try {
    const result = await login(email, password, rememberMe);

    if (!result.success) {
      await waitRemaining();
      return { error: result.error || "Credenciales inválidas" };
    }
  } catch (error) {
    console.error("Login error:", error);
    await waitRemaining();
    return { error: "Error al iniciar sesión" };
  }

  await waitRemaining();
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
