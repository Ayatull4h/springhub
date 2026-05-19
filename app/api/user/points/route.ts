import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";

export async function GET() {
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

  const totalEarned = logs.reduce((sum, l) => sum + l.amount, 0);

  return NextResponse.json({
    points: profile?.points ?? 0,
    trustScore: profile?.trustScore ?? 50,
    totalEarned,
    logs,
  });
}
