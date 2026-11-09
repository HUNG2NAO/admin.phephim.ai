import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import sharp from "sharp";
import { requireAdmin, adminErrorResponse } from "@/lib/auth";
import { validateSlug } from "@/lib/validation";

export const runtime = "nodejs";
const MAX_UPLOAD_SIZE = 4 * 1024 * 1024;
const VALID_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    if (!process.env.BLOB_READ_WRITE_TOKEN) return NextResponse.json({ error: "BLOB_NOT_CONFIGURED" }, { status: 503 });
    const contentLength = Number(request.headers.get("content-length") || 0);
    if (contentLength > MAX_UPLOAD_SIZE + 16_384) return NextResponse.json({ error: "FILE_TOO_LARGE" }, { status: 413 });
    const data = await request.formData();
    const slug = String(data.get("slug") || "");
    const file = data.get("file");
    if (!validateSlug(slug)) return NextResponse.json({ error: "INVALID_SLUG" }, { status: 400 });
    if (!(file instanceof File)) return NextResponse.json({ error: "IMAGE_REQUIRED" }, { status: 400 });
    if (!VALID_TYPES.has(file.type)) return NextResponse.json({ error: "INVALID_IMAGE_TYPE" }, { status: 400 });
    if (file.size < 50 || file.size > MAX_UPLOAD_SIZE) return NextResponse.json({ error: "FILE_TOO_LARGE" }, { status: 413 });

    const content = Buffer.from(await file.arrayBuffer());
    const image = sharp(content, { failOn: "error", limitInputPixels: 20_000_000 });
    const metadata = await image.metadata();
    if (!metadata.width || !metadata.height || !["jpeg", "png", "webp"].includes(metadata.format || "")) {
      return NextResponse.json({ error: "INVALID_IMAGE_DATA" }, { status: 400 });
    }
    const output = await image.rotate().resize({ width: 1000, height: 1600, fit: "inside", withoutEnlargement: true }).webp({ quality: 84, effort: 4 }).toBuffer();
    const filename = `posters/${slug}/${Date.now()}.webp`;
    const blob = await put(filename, output, { access: "public", contentType: "image/webp", addRandomSuffix: true });
    // Upload does not modify catalog. Saving an edit is a separate authenticated PATCH.
    return NextResponse.json({ url: blob.url }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
