import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const JWT_SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || "phephim-admin-secret-change-in-production"
);
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || "";

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + "phephim-salt");
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const hashed = await hashPassword(password);
  return hashed === hash;
}

export async function createSession(username: string): Promise<string> {
  const token = await new SignJWT({ username, role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
  return token;
}

export async function verifySession(token: string): Promise<{ username: string; role: string } | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as { username: string; role: string };
  } catch {
    return null;
  }
}

export async function getSession(): Promise<{ username: string; role: string } | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-session")?.value;
  if (!token) return null;
  return verifySession(token);
}

export async function requireAuth(request: NextRequest): Promise<NextResponse | null> {
  const token = request.cookies.get("auth-session")?.value;
  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }
  const session = await verifySession(token);
  if (!session) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }
  return null;
}

export async function loginAction(formData: FormData): Promise<{ success: boolean; error?: string }> {
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;
  
  if (!username || !password) {
    return { success: false, error: "Vui lòng nhập tài khoản và mật khẩu" };
  }
  
  if (username !== ADMIN_USERNAME) {
    return { success: false, error: "Tài khoản không tồn tại" };
  }
  
  if (!ADMIN_PASSWORD_HASH) {
    return { success: false, error: "Chưa cấu hình mật khẩu admin" };
  }
  
  const valid = await verifyPassword(password, ADMIN_PASSWORD_HASH);
  if (!valid) {
    return { success: false, error: "Mật khẩu không đúng" };
  }
  
  const token = await createSession(username);
  const cookieStore = await cookies();
  cookieStore.set("auth-session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
  
  return { success: true };
}

export async function logoutAction(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete("auth-session");
}

export class AdminAccessError extends Error {
  constructor(public readonly code: "UNAUTHENTICATED" | "FORBIDDEN" | "NOT_CONFIGURED") {
    super(code);
  }
}

export async function requireAdmin(): Promise<string> {
  const session = await getSession();
  if (!session) throw new AdminAccessError("UNAUTHENTICATED");
  return session.username;
}

export function adminErrorResponse(error: unknown): NextResponse {
  if (error instanceof AdminAccessError) {
    const status = error.code === "UNAUTHENTICATED" ? 401 : error.code === "FORBIDDEN" ? 403 : 503;
    return NextResponse.json({ error: error.code }, { status });
  }
  console.error("Admin API error", error instanceof Error ? error.message : "unknown");
  return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 });
}