import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import sharp from "sharp";

/**
 * POST /api/reports/[id]/photos
 * Upload a photo for an existing report.
 * - Validates MIME type (jpeg, png, webp, avif)
 * - Limits file size (max 10 MB)
 * - Strips EXIF metadata via sharp
 * - Compresses to 720p max width, JPEG quality 80
 * - Stores on local filesystem (public/uploads/)
 * - Records metadata in the ReportPhoto table
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify the report exists and belongs to this user
    const report = await prisma.report.findUnique({
      where: { id: params.id },
    });

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    // Only the owner can upload photos to their report
    if (report.userId !== session.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get("photo") as File | null;
    const fieldId = (formData.get("field_id") as string) || "photo";

    if (!file) {
      return NextResponse.json(
        { error: "No photo provided" },
        { status: 400 }
      );
    }

    // ── MIME type validation ─────────────────────────────────────────────
    const allowedMimes = ["image/jpeg", "image/png", "image/webp", "image/avif"];
    if (!allowedMimes.includes(file.type)) {
      return NextResponse.json(
        {
          error:
            "Format file tidak didukung. Gunakan JPG, PNG, WebP, atau AVIF.",
        },
        { status: 400 }
      );
    }

    // ── File size validation (max 10 MB) ─────────────────────────────────
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File terlalu besar. Maksimal 10MB." },
        { status: 400 }
      );
    }

    // ── Read buffer → strip EXIF → compress 720p ────────────────────────
    const buffer = Buffer.from(await file.arrayBuffer());
    const compressed = await sharp(buffer)
      .resize({ width: 720, withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toBuffer();

    const metadata = await sharp(compressed).metadata();

    // ── Save to local filesystem ─────────────────────────────────────────
    const fs = await import("fs/promises");
    const path = await import("path");

    const uploadDir = path.join(
      process.cwd(),
      "public",
      "uploads",
      params.id
    );
    await fs.mkdir(uploadDir, { recursive: true });

    const filename = `${fieldId}-${Date.now()}.jpg`;
    const filePath = path.join(uploadDir, filename);
    await fs.writeFile(filePath, compressed);

    const storagePath = `/uploads/${params.id}/${filename}`;

    // ── Save record to database ──────────────────────────────────────────
    const photo = await prisma.reportPhoto.create({
      data: {
        reportId: params.id,
        fieldId,
        storagePath,
        mimeType: "image/jpeg",
        width: metadata.width || 0,
        height: metadata.height || 0,
      },
    });

    return NextResponse.json({ success: true, photo }, { status: 201 });
  } catch (error) {
    console.error("Photo upload error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/reports/[id]/photos
 * List all photos belonging to a report (publicly accessible).
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const photos = await prisma.reportPhoto.findMany({
      where: { reportId: params.id },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        fieldId: true,
        storagePath: true,
        mimeType: true,
        width: true,
        height: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ photos });
  } catch (error) {
    console.error("Photo fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
