import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma, getErrorMessage, isDatabaseError } from "@/lib/prisma";

/**
 * POST /api/offline/session
 * Create a new offline session
 */
export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const selectedForms = body.selectedForms || [];
    const mode = body.mode || "full";

    // Close any existing active sessions
    await prisma.offlineSession.updateMany({
      where: { userId: session.userId, isActive: true },
      data: { isActive: false, endedAt: new Date() },
    });

    // Create new session
    const offlineSession = await prisma.offlineSession.create({
      data: {
        userId: session.userId,
        selectedForms: JSON.stringify(selectedForms),
        isActive: true,
      },
    });

    return NextResponse.json({ session: offlineSession });
  } catch (error) {
    console.error("[OfflineSession] POST error:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: getErrorMessage(error, "Terjadi kesalahan.") },
      { status: isDatabaseError(error) ? 503 : 500 }
    );
  }
}

/**
 * GET /api/offline/session
 * Get active session for current user
 */
export async function GET() {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const activeSession = await prisma.offlineSession.findFirst({
      where: { userId: session.userId, isActive: true },
      include: { trackingPoints: { take: 1, orderBy: { recordedAt: "desc" } } },
    });

    return NextResponse.json({ session: activeSession });
  } catch (error) {
    console.error("[OfflineSession] GET error:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: getErrorMessage(error, "Terjadi kesalahan.") },
      { status: isDatabaseError(error) ? 503 : 500 }
    );
  }
}

/**
 * DELETE /api/offline/session
 * Close active session
 */
export async function DELETE() {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.offlineSession.updateMany({
      where: { userId: session.userId, isActive: true },
      data: { isActive: false, endedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[OfflineSession] DELETE error:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: getErrorMessage(error, "Terjadi kesalahan.") },
      { status: isDatabaseError(error) ? 503 : 500 }
    );
  }
}
