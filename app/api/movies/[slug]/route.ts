import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, adminErrorResponse } from "@/lib/auth";
import { MoviePatchSchema, validateSlug } from "@/lib/validation";
import { patchMovie, EditConflictError, NotFoundError } from "@/lib/movies";

export const runtime = "nodejs";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const actor = await requireAdmin();
    const { slug } = await params;
    if (!validateSlug(slug)) return NextResponse.json({ error: "INVALID_SLUG" }, { status: 400 });
    const sizeHeader = Number(request.headers.get("content-length") || 0);
    if (sizeHeader > 8_000) return NextResponse.json({ error: "PAYLOAD_TOO_LARGE" }, { status: 413 });
    const payload: unknown = await request.json();
    const parsed = MoviePatchSchema.safeParse(payload);
    if (!parsed.success) return NextResponse.json({ error: "VALIDATION_ERROR", details: parsed.error.flatten() }, { status: 400 });
    const updated = await patchMovie(slug, actor, parsed.data);
    return NextResponse.json({ ok: true, updated }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof EditConflictError) return NextResponse.json({ error: "VERSION_CONFLICT" }, { status: 409 });
    if (error instanceof NotFoundError) return NextResponse.json({ error: "MOVIE_NOT_FOUND" }, { status: 404 });
    return adminErrorResponse(error);
  }
}
