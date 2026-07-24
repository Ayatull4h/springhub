import { NextResponse } from "next/server";
import { prisma, getErrorMessage, isDatabaseError } from "@/lib/prisma";
import { publicLimiter } from "@/lib/rate-limit";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const limitCheck = await publicLimiter.check(`springs:${ip}`);
    if (!limitCheck.allowed) {
      return NextResponse.json({ error: "Terlalu banyak permintaan." }, { status: 429 });
    }

    const springs = await prisma.spring.findMany({
      select: {
        id: true,
        name: true,
        snappedLat: true,
        snappedLng: true,
        province: true,
        regency: true,
        healthScore: true,
        healthStatus: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { reports: { where: { status: "approved" } } } },
      },
      orderBy: { name: "asc" },
    });

    // Kelompokkan spring berdasarkan snapped location (grid 5km)
    const groupsMap = new Map<string, typeof springs>();
    for (const s of springs) {
      if (s.snappedLat === null || s.snappedLng === null) continue;
      const key = `${s.snappedLat.toFixed(3)}_${s.snappedLng.toFixed(3)}`;
      if (!groupsMap.has(key)) groupsMap.set(key, []);
      groupsMap.get(key)!.push(s);
    }

    const groups = Array.from(groupsMap.entries())
      .map(([key, items]) => {
        const [lat, lng] = key.split("_").map(Number);
        const totalReports = items.reduce((sum, s) => sum + (s._count?.reports || 0), 0);
        const latest = items.reduce((latest, s) =>
          !latest || (s.updatedAt && s.updatedAt > latest.updatedAt) ? s : latest
        , items[0]);
        return {
          snappedLat: lat,
          snappedLng: lng,
          totalSprings: items.length,
          totalReports,
          springs: items.map(s => ({
            id: s.id,
            name: s.name,
            province: s.province,
            regency: s.regency,
            healthScore: s.healthScore,
            healthStatus: s.healthStatus,
            reportCount: s._count?.reports || 0,
            updatedAt: s.updatedAt,
          })),
          latestName: items.length === 1 ? items[0].name : `${items.length} mata air`,
          latestRegion: latest?.province ? [latest.province, latest.regency].filter(Boolean).join(", ") : "",
          latestUpdate: latest?.updatedAt,
        };
      })
      .sort((a, b) => {
        if (b.totalReports !== a.totalReports) return b.totalReports - a.totalReports;
        return (b.latestUpdate?.getTime() || 0) - (a.latestUpdate?.getTime() || 0);
      });

    return NextResponse.json({ groups });
  } catch (error) {
    console.error("Springs list error:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: getErrorMessage(error, "Terjadi kesalahan.") },
      { status: isDatabaseError(error) ? 503 : 500 }
    );
  }
}
