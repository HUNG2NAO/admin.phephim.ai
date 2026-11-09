import { NextRequest, NextResponse } from "next/server";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import sharp from "sharp";
import { requireAdmin, adminErrorResponse } from "@/lib/auth";
import { validateSlug } from "@/lib/validation";

export const runtime = "nodejs";
const MAX_UPLOAD_SIZE = 4 * 1024 * 1024;
const VALID_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function getR2Client(): S3Client {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET;
  const publicUrl = process.env.R2_PUBLIC_URL;

  if (!accountId || !accessKeyId || !secretAccessKey || !bucket || !publicUrl) {
    throw new Error("R2_NOT_CONFIGURED");
  }

  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    let r2Client: S3Client;
    try {
      r2Client = getR2Client();
    } catch {
      return NextResponse.json({ error: "R2_NOT_CONFIGURED" }, { status: 503 });
    }

    const contentLength = Number(request.headers.get("content-length") || 0);
    if (contentLength > MAX_UPLOAD_SIZE + 16_384) {
      return NextResponse.json({ error: "FILE_TOO_LARGE" }, { status: 413 });
    }

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

    const output = await image
      .rotate()
      .resize({ width: 1000, height: 1600, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 84, effort: 4 })
      .toBuffer();

    const timestamp = Date.now();
    const key = `posters/${slug}/${timestamp}.webp`;
    const bucket = process.env.R2_BUCKET!;
    const publicUrl = process.env.R2_PUBLIC_URL!;

    await r2Client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: output,
        ContentType: "image/webp",
        CacheControl: "public, max-age=31536000, immutable",
      })
    );

    const url = `${publicUrl.replace(/\/$/, "")}/${key}`;
    return NextResponse.json({ url, key }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return adminErrorResponse(error);
  }
}