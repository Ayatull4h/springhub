import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const reports = await prisma.report.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { id: true, username: true, email: true } },
      reviewedBy: { select: { username: true } },
      pointsLogs: { select: { amount: true } },
    },
  });

  return NextResponse.json({ reports });
}
