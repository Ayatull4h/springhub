import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { POINTS_MAP } from "@/lib/forms";

export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const report = await prisma.report.findUnique({
    where: { id: params.id },
  });

  if (!report) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  // Update report status
  await prisma.report.update({
    where: { id: params.id },
    data: {
      status: "approved",
      reviewedById: session.userId,
    },
  });

  // Award points if user is logged in and points haven't been awarded
  if (report.userId) {
    const existingPoints = await prisma.pointsLog.findFirst({
      where: {
        reportId: report.id,
        reason: { contains: "approved" },
      },
    });

    if (!existingPoints) {
      const basePoints = POINTS_MAP[report.formSlug] ?? 0;
      const approvalPoints = basePoints > 0 ? basePoints : 25;

      await prisma.pointsLog.create({
        data: {
          userId: report.userId,
          reportId: report.id,
          amount: approvalPoints,
          reason: `Laporan disetujui: ${report.formSlug}`,
          metadata: JSON.stringify({ approved: true }),
        },
      });

      await prisma.profile.update({
        where: { id: report.userId },
        data: { points: { increment: approvalPoints } },
      });
    }
  }

  return NextResponse.json({ success: true, status: "approved" });
}
