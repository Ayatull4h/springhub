import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const leaders = await prisma.profile.findMany({
      where: { role: { not: "admin" } },
      orderBy: { points: "desc" },
      take: 20,
      select: {
        id: true,
        username: true,
        region: true,
        points: true,
      },
    });

    const totalReports = await prisma.report.count({
      where: { status: "approved" },
    });

    const totalVolunteers = await prisma.profile.count({
      where: { role: { not: "admin" } },
    });

    return NextResponse.json({
      leaders,
      stats: {
        totalReports,
        totalVolunteers,
      },
    });
  } catch (error) {
    console.error("Leaderboard error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
