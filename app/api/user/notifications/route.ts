import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ notifications: [], unread: 0 });
  }

  const userId = session.userId;

  const recentPoints = await prisma.pointsLog.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: { amount: true, reason: true, createdAt: true },
  });

  const recentReports = await prisma.report.findMany({
    where: { userId, status: { in: ["approved", "rejected"] } },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: { formSlug: true, status: true, createdAt: true },
  });

  const notifications = [
    ...recentPoints.map((p: { amount: number; reason: string; createdAt: Date }) => ({
      type: "points" as const,
      message: `+${p.amount} pts: ${p.reason}`,
      time: p.createdAt.toISOString(),
      icon: "sparkles" as const,
    })),
    ...recentReports.map((r: { formSlug: string; status: string; createdAt: Date }) => ({
      type: (r.status === "approved" ? "success" : "error") as "success" | "error",
      message: `Laporan ${r.formSlug} ${r.status === "approved" ? "disetujui ✅" : "ditolak ❌"}`,
      time: r.createdAt.toISOString(),
      icon: (r.status === "approved" ? "check" : "x") as "check" | "x",
    })),
  ]
    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
    .slice(0, 10);

  return NextResponse.json({ notifications, unread: notifications.length });
}
