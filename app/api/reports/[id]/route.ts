import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";
import { getSession } from "@/lib/auth";
import { getGuestId } from "@/lib/guest";
import { deletePhoto } from "@/lib/upload-photo";

/**
 * DELETE /api/reports/[id]
 * Delete a report and all its associated photos (from DB cascade + storage).
 * Only the report owner (user or guest) can delete their own report.
 * Used for atomic rollback when photo uploads fail after report creation.
 */
export async function DELETE(
  _request: Request,
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
      include: { photos: true },
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

    // Only allow deletion of pending (unreviewed) reports
    if (report.status !== "pending") {
      return NextResponse.json(
        { error: "Hanya laporan pending yang bisa dihapus" },
        { status: 400 }
      );
    }

    // Delete photos from storage first (before DB cascade removes references)
    const photoPaths = report.photos.map((p) => p.storagePath).filter(Boolean);
    const deleteResults = await Promise.allSettled(
      photoPaths.map((path) => deletePhoto(path))
    );
    const storageErrors = deleteResults.filter(
      (r) => r.status === "rejected"
    ).length;
    if (storageErrors > 0) {
      console.warn(
        `[DELETE report] ${storageErrors}/${photoPaths.length} storage deletions failed for report ${params.id}`
      );
    }

    // Delete the report — ReportPhoto records cascade-delete automatically
    await prisma.report.delete({ where: { id: params.id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Report delete error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
