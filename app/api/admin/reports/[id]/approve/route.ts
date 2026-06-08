import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";
import { getSession } from "@/lib/auth";
import { awardReportPoints, checkDailyStreak, updateTrustScore } from "@/lib/points";

export async function POST(
  request: Request,
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

    // Parse optional featuredPhotoId from request body
    let featuredPhotoId: string | null = null;
    try {
      const body = await request.json();
      featuredPhotoId = body.featuredPhotoId || null;
    } catch {
      // No body — that's fine, just approve without featured photo
    }

    // Validate featuredPhotoId belongs to this report
    if (featuredPhotoId) {
      const photo = await prisma.reportPhoto.findFirst({
        where: { id: featuredPhotoId, reportId: params.id },
      });
      if (!photo) {
        return NextResponse.json(
          { error: "Featured photo not found in this report" },
          { status: 400 }
        );
      }
    }

    await prisma.report.update({
      where: { id: params.id },
      data: {
        status: "approved",
        reviewedById: session.userId,
        featuredPhotoId,
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

      await prisma.notification.create({
        data: {
          userId: report.userId,
          type: "report-approved",
          title: `Laporan ${report.formSlug} disetujui!`,
          body: "Poin Anda bertambah. Terima kasih atas kontribusinya.",
          link: "/profile",
        },
      });
    }

    return NextResponse.json({ success: true, status: "approved" });
  } catch (error) {
    console.error("Approve error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
