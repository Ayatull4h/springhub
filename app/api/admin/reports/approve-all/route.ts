import { NextResponse } from "next/server";
import { prisma, getErrorMessage, isDatabaseError } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { verifyCsrfToken } from "@/lib/csrf";
import { computeSpringHealth } from "@/lib/health-score";
import { auditLog } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const csrfToken = request.headers.get("x-csrf-token");
    if (!csrfToken || !(await verifyCsrfToken(csrfToken))) {
      return NextResponse.json({ error: "Invalid CSRF" }, { status: 403 });
    }

    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const pending = await prisma.report.findMany({
      where: { status: "pending" },
      select: { id: true, formSlug: true, springId: true, fieldData: true, userId: true },
    });

    let approved = 0;
    let healthScored = 0;

    for (const report of pending) {
      // Approve
      await prisma.report.update({
        where: { id: report.id },
        data: { status: "approved", reviewedById: session.userId },
      });

      // Health scoring for spring-survey
      if (report.formSlug === "spring-monitoring" && report.springId) {
        try {
          const fd = JSON.parse(
            typeof report.fieldData === "string" ? report.fieldData : "{}"
          );
          const health = computeSpringHealth(fd);
          await prisma.spring.update({
            where: { id: report.springId },
            data: {
              healthScore: health.score,
              healthStatus: health.status,
              lastSurveyedAt: new Date(),
            },
          });
          healthScored++;
        } catch {}
      }

      // Points
      if (report.userId) {
        const ptsMap: Record<string, number> = {
          "spring-monitoring": 100,
          "spring-restoration": 1000,
          "trench-development": 500,
          "tree-planting": 100,
          "seedling-stock": 100,
        };
        const pts = ptsMap[report.formSlug] || 25;
        await prisma.pointsLog.create({
          data: {
            userId: report.userId,
            reportId: report.id,
            amount: pts,
            reason: `Approved ${report.formSlug}`,
            metadata: JSON.stringify({ batchApprove: true }),
          },
        });
      }

      approved++;
    }

    // Recalculate all user points
    const users = await prisma.profile.findMany({ select: { id: true } });
    for (const u of users) {
      const total = await prisma.pointsLog.aggregate({
        where: { userId: u.id },
        _sum: { amount: true },
      });
      await prisma.profile.update({
        where: { id: u.id },
        data: { points: total._sum.amount || 0 },
      });
    }

    auditLog("approve-all", `Approved ${approved} pending reports`);

    return NextResponse.json({ success: true, approved, healthScored });
  } catch (error) {
    console.error("Approve-all error:", error);
    return NextResponse.json(
      { error: getErrorMessage(error, "Gagal approve semua.") },
      { status: isDatabaseError(error) ? 503 : 500 }
    );
  }
}
