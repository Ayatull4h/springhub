import { NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getSession } from "@/lib/auth";
import { uploadLimiter } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const s3 = new S3Client({
  region: "auto",
  endpoint: process.env.S3_ENDPOINT || "",
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY || "",
    secretAccessKey: process.env.S3_SECRET_KEY || "",
  },
  forcePathStyle: true,
});

const BUCKET = process.env.S3_BUCKET || "springhub-photos";
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
// folder aman: huruf/angka/-/_/slash, tanpa "..", tanpa karakter aneh
const FOLDER_RE = /^[a-z0-9-_]+(\/[a-z0-9-_]+)*$/;

// GET /api/upload/presign?folder=reports&contentType=image/jpeg
export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const limiter = await uploadLimiter.check(`presign:${session.userId}`);
    if (!limiter.allowed) {
      return NextResponse.json({ error: "Terlalu banyak permintaan" }, { status: 429 });
    }

    const url = new URL(request.url);
    const rawFolder = url.searchParams.get("folder") || "reports";
    const folder = rawFolder.replace(/^\/+|\/+$/g, "");
    if (!FOLDER_RE.test(folder)) {
      return NextResponse.json({ error: "Folder tidak valid" }, { status: 400 });
    }

    const contentType = url.searchParams.get("contentType") || "image/jpeg";
    if (!ALLOWED_MIME_TYPES.includes(contentType)) {
      return NextResponse.json({ error: "Format gambar tidak didukung" }, { status: 400 });
    }

    const ext = contentType === "image/png" ? "png" : contentType === "image/webp" ? "webp" : "jpg";
    const filename = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const command = new PutObjectCommand({
      Bucket: BUCKET,
      Key: filename,
      ContentType: contentType,
      CacheControl: "public, max-age=31536000, immutable",
    });

    const presignedUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });

    const publicUrl = process.env.S3_PUBLIC_URL
      ? `${process.env.S3_PUBLIC_URL}/${filename}`
      : `${process.env.S3_ENDPOINT}/${BUCKET}/${filename}`;

    return NextResponse.json({
      presignedUrl,
      publicUrl,
      path: filename,
      // konsisten dengan lib/upload-photo.ts (10MB) — hint untuk client
      maxSizeMb: 10,
    });
  } catch (error) {
    console.error("Presign error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
