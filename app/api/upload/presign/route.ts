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

// GET /api/upload/presign?folder=reports&filename=photo.jpg&contentType=image/jpeg
export async function GET(request: Request) {
  try {
    const session = await getSession();
    const rateKey = session?.userId ?? (request.headers.get("x-forwarded-for") || "unknown");
    const limiter = await uploadLimiter.check(`presign:${rateKey}`);
    if (!limiter.allowed) {
      return NextResponse.json({ error: "Terlalu banyak permintaan" }, { status: 429 });
    }

    const url = new URL(request.url);
    const folder = url.searchParams.get("folder") || "reports";
    const contentType = url.searchParams.get("contentType") || "image/jpeg";

    const filename = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;

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
    });
  } catch (error) {
    console.error("Presign error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
