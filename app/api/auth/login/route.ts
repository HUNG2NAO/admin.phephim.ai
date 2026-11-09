import { loginAction } from "@/lib/auth";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  const formData = await request.formData();
  const result = await loginAction(formData);
  
  if (result.success) {
    return NextResponse.json({ success: true });
  }
  
  return NextResponse.json({ success: false, error: result.error }, { status: 401 });
}