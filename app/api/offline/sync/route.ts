import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma, getErrorMessage, isDatabaseError } from "@/lib/prisma";
export const dynamic = "force-dynamic";

/**
 * POST /api/offline/sync
 * Upload tracking points and close session
 */
export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { trackingPoints, totalDistance, springCount } = body;

    // Get active session
    const activeSession = await prisma.offlineSession.findFirst({
      where: { userId: session.userId, isActive: true },
    });

    if (!activeSession) {
      return NextResponse.json({ error: "No active session" }, { status: 400 });
    }

    // Save tracking points
    if (Array.isArray(trackingPoints) && trackingPoints.length > 0) {
      await prisma.trackingPoint.createMany({
        data: trackingPoints.map((tp: any) => ({
          sessionId: activeSession.id,
          lat: tp.lat,
          lng: tp.lng,
          accuracy: tp.accuracy ?? null,
          isSpringMarker: tp.isSpringMarker ?? false,
          springName: tp.springName ?? null,
          recordedAt: new Date(tp.recordedAt),
        })),
        skipDuplicates: true,
      });
    }

    // Update session stats
    await prisma.offlineSession.update({
      where: { id: activeSession.id },
      data: {
        totalDistance: totalDistance ?? null,
        isActive: false,
        endedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      stats: {
        trackingPoints: trackingPoints?.length ?? 0,
        springCount: springCount ?? 0,
        totalDistance: totalDistance ?? null,
      },
    });
  } catch (error) {
    console.error("[OfflineSync] POST error:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: getErrorMessage(error, "Terjadi kesalahan.") },
      { status: isDatabaseError(error) ? 503 : 500 }
    );
  }
}
