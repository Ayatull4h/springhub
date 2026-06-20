import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await prisma.profile.findUnique({
      where: { id: session.userId },
      select: { points: true, trustScore: true },
    });

    const logs = await prisma.pointsLog.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    const totalEarned = logs.reduce((sum: number, l: { amount: number }) => sum + l.amount, 0);

    return NextResponse.json({
      points: profile?.points ?? 0,
      trustScore: profile?.trustScore ?? 50,
      totalEarned,
      logs,
    });
  } catch (err) {
    console.error("[User Points GET]", err);
    return NextResponse.json({ points: 0, trustScore: 50, totalEarned: 0, logs: [] }, { status: 200 });
  }
}
