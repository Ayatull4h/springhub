import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";
import { getSession } from "@/lib/auth";
import { awardReportPoints, checkDailyStreak, updateTrustScore } from "@/lib/points";

export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
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

    if (report.status !== "pending") {
      return NextResponse.json({ error: "Report already reviewed" }, { status: 400 });
    }

    await prisma.report.update({
      where: { id: params.id },
      data: {
        status: "approved",
        reviewedById: session.userId,
      },
    });

    if (report.userId) {
      const fieldData = JSON.parse(
        typeof report.fieldData === "string"
          ? report.fieldData
          : JSON.stringify(report.fieldData ?? {})
      );

      const existingPoints = await prisma.pointsLog.findFirst({
        where: { reportId: report.id, reason: { contains: "Approved" } },
      });

      if (!existingPoints) {
        await awardReportPoints(report.userId, report.id, report.formSlug, fieldData);
        await checkDailyStreak(report.userId);
        await updateTrustScore(report.userId, true);
      }
    }

    return NextResponse.json({ success: true, status: "approved" });
  } catch (error) {
    console.error("Approve error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
