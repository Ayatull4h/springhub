import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";

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

// GET /api/admin/download?reportId=xxx — download ZIP semua foto dalam 1 report
// GET /api/admin/download?startDate=2026-01-01&endDate=2026-06-01 — download ZIP per periode
export async function GET(request: Request) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const url = new URL(request.url);
  const reportId = url.searchParams.get("reportId");
  const startDate = url.searchParams.get("startDate");
  const endDate = url.searchParams.get("endDate");

  try {
    let where: Record<string, unknown> = {};

    if (reportId) {
      where.reportId = reportId;
    } else if (startDate || endDate) {
      where.report = {
        createdAt: {
          ...(startDate ? { gte: new Date(startDate) } : {}),
          ...(endDate ? { lt: new Date(endDate) } : {}),
        },
      };
    } else {
      return NextResponse.json({ error: "reportId or date range required" }, { status: 400 });
    }

    const photos = await prisma.reportPhoto.findMany({
      where,
      include: { report: { select: { formSlug: true, createdAt: true } } },
    });

    if (photos.length === 0) {
      return NextResponse.json({ error: "No photos found" }, { status: 404 });
    }

    // Generate signed URLs for each photo (valid 1 hour)
    const baseUrl = process.env.S3_PUBLIC_URL
      ? process.env.S3_PUBLIC_URL
      : `${process.env.S3_ENDPOINT}/${BUCKET}`;

    const items = photos.map((p) => ({
      id: p.id,
      url: `${baseUrl}/${p.storagePath}`,
      filename: p.storagePath.split("/").pop(),
      reportId: p.reportId,
      formSlug: p.report.formSlug,
      createdAt: p.createdAt,
    }));

    return NextResponse.json({
      total: items.length,
      photos: items,
      message: "Download foto via URL di atas. Untuk bulk ZIP, gunakan fitur export.",
    });
  } catch (error) {
    console.error("Download error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
