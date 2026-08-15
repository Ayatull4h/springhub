import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma, getErrorMessage, isDatabaseError } from "@/lib/prisma";
import { verifyCsrfToken } from "@/lib/csrf";
export const dynamic = "force-dynamic";

/**
 * POST /api/offline/sync
 * Upload tracking points — session tetap aktif (jangan di-end)
 * Gunakan DELETE /api/offline/session untuk mengakhiri session
 */
export async function POST(request: Request) {
  try {
    // CSRF
    const csrfToken = request.headers.get("x-csrf-token");
    if (!csrfToken || !(await verifyCsrfToken(csrfToken))) {
      return NextResponse.json({ error: "Invalid CSRF" }, { status: 403 });
    }

    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { trackingPoints, totalDistance, springCount } = body;

    // M-5: batasi jumlah titik + validasi koordinat (cegah DB bloat/DoS)
    const points = Array.isArray(trackingPoints) ? trackingPoints.slice(0, 500) : [];
    for (const tp of points) {
      if (typeof tp.lat !== "number" || typeof tp.lng !== "number") {
        return NextResponse.json(
          { error: "Data titik tidak valid" },
          { status: 400 }
        );
      }
      if (tp.lat < -90 || tp.lat > 90 || tp.lng < -180 || tp.lng > 180) {
        return NextResponse.json(
          { error: "Koordinat di luar rentang valid" },
          { status: 400 }
        );
      }
      if (tp.recordedAt && isNaN(new Date(tp.recordedAt).getTime())) {
        return NextResponse.json(
          { error: "Waktu titik tidak valid" },
          { status: 400 }
        );
      }
    }

    // Get active session
    const activeSession = await prisma.offlineSession.findFirst({
      where: { userId: session.userId, isActive: true },
    });

    if (!activeSession) {
      return NextResponse.json({ error: "No active session" }, { status: 400 });
    }

    // Save tracking points
    if (points.length > 0) {
      await prisma.trackingPoint.createMany({
        data: points.map((tp: any) => ({
          sessionId: activeSession.id,
          lat: tp.lat,
          lng: tp.lng,
          accuracy: typeof tp.accuracy === "number" ? tp.accuracy : null,
          // Dukungan field markerType (frontend) + isSpringMarker/springName (backend)
          isSpringMarker: tp.isSpringMarker ?? (tp.markerType === "spring"),
          springName: tp.springName ?? (tp.markerType === "spring" ? (tp.name ?? null) : null),
          recordedAt: tp.recordedAt ? new Date(tp.recordedAt) : new Date(),
        })),
        skipDuplicates: true,
      });
    }

    // Update session stats — jangan end session, biarkan tetap aktif
    await prisma.offlineSession.update({
      where: { id: activeSession.id },
      data: {
        totalDistance: typeof totalDistance === "number" ? totalDistance : null,
      },
    });

    return NextResponse.json({
      success: true,
      stats: {
        trackingPoints: points.length,
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
