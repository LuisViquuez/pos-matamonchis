import { cookies } from "next/headers";
import { sql } from "./db";
import type { User, AuthUser } from "@/types/models";
import bcrypt from "bcryptjs";

const AUTH_COOKIE_NAME = "pos_auth_token";
const AUTH_USER_COOKIE = "pos_auth_user";

const SALT_ROUNDS = 10;

export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

// Simple token generation (in production, use proper JWT)
function generateToken(userId: number): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2);
  return Buffer.from(`${userId}:${timestamp}:${random}`).toString("base64");
}

function parseToken(token: string): number | null {
  try {
    const decoded = Buffer.from(token, "base64").toString();
    const [userId] = decoded.split(":");
    return parseInt(userId, 10);
  } catch {
    return null;
  }
}

export async function login(
  emailOrUsername: string,
  password: string,
  rememberMe: boolean,
): Promise<{
  success: boolean;
  user?: AuthUser;
  token?: string;
  error?: string;
}> {
  try {
    const users = (await sql`
      SELECT id, name, email, password_hash, role, is_active 
      FROM users 
      WHERE (email = ${emailOrUsername} OR name = ${emailOrUsername})
      LIMIT 1
    `) as User[];

    if (users.length === 0) {
      console.log("No user found with given email or username");
      return { success: false, error: "Credenciales inválidas" };
    }

    const user = users[0];

    if (!user.is_active) {
      console.log("Account is deactivated");
      return { success: false, error: "Account is deactivated" };
    }

    const isValid = await verifyPassword(password, user.password_hash || "");
    if (!isValid) {
      console.log("Password verification failed " + user.password_hash);

      return { success: false, error: "Credenciales inválidas" };
    }

    const token = generateToken(user.id);
    const authUser: AuthUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    const cookieStore = await cookies();
    const maxAge = 60 * 60 * 8; // 8 hours

    cookieStore.set(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge,
      path: "/",
    });

    cookieStore.set(AUTH_USER_COOKIE, JSON.stringify(authUser), {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge,
      path: "/",
    });

    return { success: true, user: authUser, token };
  } catch (error) {
    console.error("Login error:", error);
    return { success: false, error: "Ocurrió un error al iniciar sesión" };
  }
}

export async function logout(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE_NAME);
  cookieStore.delete(AUTH_USER_COOKIE);
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

    if (!token) {
      return null;
    }

    const userId = parseToken(token);
    if (!userId) {
      return null;
    }

    const users = (await sql`
      SELECT id, name, email, role, is_active 
      FROM users 
      WHERE id = ${userId} AND is_active = true
      LIMIT 1
    `) as User[];

    if (users.length === 0) {
      return null;
    }

    const user = users[0];
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
  } catch {
    return null;
  }
}

export async function requireAuth(): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}

export async function requireAdmin(): Promise<AuthUser> {
  const user = await requireAuth();
  if (user.role !== "admin") {
    throw new Error("Admin access required");
  }
  return user;
}

// Session management exports for compatibility
export async function createSession(user: AuthUser): Promise<string> {
  const token = generateToken(user.id);
  const cookieStore = await cookies();

  cookieStore.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 8,
    path: "/",
  });

  cookieStore.set(AUTH_USER_COOKIE, JSON.stringify(user), {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 8,
    path: "/",
  });

  return token;
}

export async function verifySession(token: string): Promise<AuthUser | null> {
  const userId = parseToken(token);
  if (!userId) {
    return null;
  }

  const users = (await sql`
    SELECT id, name, email, role, is_active 
    FROM users 
    WHERE id = ${userId} AND is_active = true
    LIMIT 1
  `) as User[];

  if (users.length === 0) {
    return null;
  }

  const user = users[0];
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

export async function deleteSession(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE_NAME);
  cookieStore.delete(AUTH_USER_COOKIE);
}
