import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export class AdminAccessError extends Error {
  constructor(public readonly code: "UNAUTHENTICATED" | "FORBIDDEN" | "NOT_CONFIGURED") {
    super(code);
  }
}

export async function requireAdmin(): Promise<string> {
  const allowed = (process.env.ADMIN_CLERK_USER_IDS || "").split(",").map((s) => s.trim()).filter(Boolean);
  if (!allowed.length) throw new AdminAccessError("NOT_CONFIGURED");
  const { userId } = await auth();
  if (!userId) throw new AdminAccessError("UNAUTHENTICATED");
  if (!allowed.includes(userId)) throw new AdminAccessError("FORBIDDEN");
  return userId;
}

export function adminErrorResponse(error: unknown): NextResponse {
  if (error instanceof AdminAccessError) {
    const status = error.code === "UNAUTHENTICATED" ? 401 : error.code === "FORBIDDEN" ? 403 : 503;
    return NextResponse.json({ error: error.code }, { status });
  }
  console.error("Admin API error", error instanceof Error ? error.message : "unknown");
  return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 });
}
