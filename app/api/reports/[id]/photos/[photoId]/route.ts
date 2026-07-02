import { NextResponse } from "next/server";
import { prisma, getErrorMessage, isDatabaseError } from "@/lib/prisma";
export const dynamic = "force-dynamic";
import { getSession } from "@/lib/auth";
import { getGuestId } from "@/lib/guest";
import { deletePhoto } from "@/lib/upload-photo";

/**
 * DELETE /api/reports/[id]/photos/[photoId]
 * Hapus satu foto dari laporan.
 * Hanya pemilik laporan atau admin yang bisa hapus.
 */
export async function DELETE(
  _request: Request,
  { params }: { params: { id: string; photoId: string } }
) {
  try {
    const session = await getSession();
    const guestId = getGuestId();

    if (!session?.userId && !guestId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const photo = await prisma.reportPhoto.findUnique({
      where: { id: params.photoId },
      include: { report: { select: { userId: true, guestId: true, status: true } } },
    });

    if (!photo) {
      return NextResponse.json({ error: "Photo not found" }, { status: 404 });
    }

    // Ownership check
    const isOwner =
      (session?.userId && photo.report.userId === session.userId) ||
      (!session?.userId && guestId && photo.report.guestId === guestId);
    const isAdmin = session?.role === "admin";

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Only allow deletion from pending reports (unless admin)
    if (!isAdmin && photo.report.status !== "pending") {
      return NextResponse.json(
        { error: "Hanya laporan pending yang bisa diedit fotonya" },
        { status: 400 }
      );
    }

    // Delete from storage
    if (photo.storagePath) {
      await deletePhoto(photo.storagePath).catch((e) => {
        console.warn("[DELETE photo] Storage deletion failed:", e);
      });
    }

    // Delete from DB
    await prisma.reportPhoto.delete({ where: { id: params.photoId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Photo delete error:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: getErrorMessage(error, "Terjadi kesalahan.") },
      { status: isDatabaseError(error) ? 503 : 500 }
    );
  }
}
