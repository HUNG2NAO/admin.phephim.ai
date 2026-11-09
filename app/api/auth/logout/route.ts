import { logoutAction } from "@/lib/auth";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST() {
  await logoutAction();
  return NextResponse.json({ success: true });
}