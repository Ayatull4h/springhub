import { NextResponse } from "next/server";
import { prisma, getErrorMessage, isDatabaseError } from "@/lib/prisma";
export const dynamic = "force-dynamic";
import { getSession } from "@/lib/auth";
import { getGuestId } from "@/lib/guest";
import { uploadPhoto } from "@/lib/upload-photo";
import { buildPhotoUrls } from "@/lib/photo-url";

/**
 * POST /api/reports/[id]/photos
 * Upload a photo for an existing report.
 * - Validates MIME type (jpeg, png, webp)
 * - Limits file size (max 10 MB)
 * - Strips EXIF metadata via sharp
 * - Compresses to 720p max dimension, JPEG quality 80
 * - Stores on local filesystem (served via Nginx)
 * - Records metadata in the ReportPhoto table
 *
 * Supports both authenticated users and guests (via guest_session_id cookie).
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    const guestId = getGuestId();

    if (!session?.userId && !guestId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const report = await prisma.report.findUnique({
      where: { id: params.id },
    });

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    // Ownership check: either authenticated user or guest who created the report
    const isOwner =
      (session?.userId && report.userId === session.userId) ||
      (!session?.userId && guestId && report.guestId === guestId);

    if (!isOwner) {
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

    const result = await uploadPhoto(file, `reports/${params.id}`);

    const photo = await prisma.reportPhoto.create({
      data: {
        reportId: params.id,
        fieldId,
        storagePath: result.path,
        mimeType: "image/jpeg",
        width: result.width,
        height: result.height,
      },
    });

    return NextResponse.json(
      { success: true, photo: { ...photo, url: result.url } },
      { status: 201 }
    );
  } catch (error) {
    console.error("Photo upload error:", {
      message: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      reportId: params.id,
    });
    return NextResponse.json(
      {
        error: getErrorMessage(error, "Terjadi kesalahan."),
        reportId: params.id,
      },
      { status: isDatabaseError(error) ? 503 : 500 }
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

    const photosWithUrls = buildPhotoUrls(photos);

    return NextResponse.json({ photos: photosWithUrls });
  } catch (error) {
    console.error("Photo fetch error:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: getErrorMessage(error, "Terjadi kesalahan.") },
      { status: isDatabaseError(error) ? 503 : 500 }
    );
  }
}
