import { NextResponse } from "next/server";
import { prisma, getErrorMessage, isDatabaseError } from "@/lib/prisma";
export const dynamic = "force-dynamic";
import { getOrSet } from "@/lib/cache";

export async function GET() {
  try {
    const data = await getOrSet("leaderboard", "top20", async () => {
      const [leaders, totalReports, totalVolunteers] = await Promise.all([
        prisma.profile.findMany({
          where: { role: { not: "admin" } },
          orderBy: { points: "desc" },
          take: 20,
          select: { id: true, username: true, region: true, points: true },
        }),
        prisma.report.count({ where: { status: "approved" } }),
        prisma.profile.count({ where: { role: { not: "admin" } } }),
      ]);
      return { leaders, stats: { totalReports, totalVolunteers } };
    }, 60);

    return NextResponse.json(data);
  } catch (error) {
    console.error("Leaderboard error:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: getErrorMessage(error, "Terjadi kesalahan.") },
      { status: isDatabaseError(error) ? 503 : 500 }
    );
  }
}
