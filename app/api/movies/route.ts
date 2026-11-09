import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, adminErrorResponse } from "@/lib/auth";
import { listMovies } from "@/lib/movies";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const q = request.nextUrl.searchParams.get("q") || "";
    const status = request.nextUrl.searchParams.get("status") || "all";
    const page = Number(request.nextUrl.searchParams.get("page") || 1);
    const pageSize = Number(request.nextUrl.searchParams.get("pageSize") || 24);
    const result = await listMovies({ q, status, page, pageSize });
    return NextResponse.json(result, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
