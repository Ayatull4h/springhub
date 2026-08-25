import { NextResponse } from "next/server";
import { prisma, getErrorMessage, isDatabaseError } from "@/lib/prisma";
export const dynamic = "force-dynamic";
import { getSession } from "@/lib/auth";
import { updateTrustScore } from "@/lib/points";
import { verifyCsrfToken } from "@/lib/csrf";
import { auditLog } from "@/lib/audit";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // CSRF protection
  const csrfToken = request.headers.get("x-csrf-token");
  if (!csrfToken || !(await verifyCsrfToken(csrfToken))) {
    return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
  }
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json().catch(() => ({ note: "" }));

    const report = await prisma.report.findUnique({
      where: { id: (await params).id },
    });

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    if (report.status !== "pending") {
      return NextResponse.json({ error: "Report already reviewed" }, { status: 400 });
    }

    await prisma.report.update({
      where: { id: (await params).id },
      data: {
        status: "rejected",
        reviewedById: session.userId,
        reviewNote: body.note ?? "",
      },
    });

    if (report.userId) {
      // Trust score: -50 only if user has been rejected >2 times before
      try {
        const rejectCount = await prisma.report.count({
          where: { userId: report.userId, status: "rejected" },
        });
        if (rejectCount >= 3) {
          await updateTrustScore(report.userId, false);
        }
      } catch (e) {
        console.error("Trust score update failed (non-blocking):", e);
      }

      try {
        await prisma.pointsLog.create({
          data: {
            userId: report.userId,
            reportId: (await params).id,
            amount: 0,
            reason: `Laporan ${report.formSlug} ditolak`,
            metadata: JSON.stringify({ status: "rejected" }),
          },
        });
      } catch (e) {
        console.error("PointsLog create failed (non-blocking):", e);
      }

      try {
        await prisma.notification.create({
          data: {
            userId: report.userId,
            type: "report-rejected",
            title: `Laporan ${report.formSlug} ditolak`,
            body: body.note || "Laporan Anda tidak memenuhi kriteria validasi.",
            link: "/profile",
          },
        });
      } catch (e) {
        console.error("Notification create failed (non-blocking):", e);
      }
    }

    // ── Tolak seedling kalau laporan seedling ──
    if (report.formSlug.includes("seedling") && report.userId) {
      try {
        const fieldData = JSON.parse(
          typeof report.fieldData === "string" ? report.fieldData : JSON.stringify(report.fieldData ?? {})
        );
        const species = (fieldData?.species as string || "").trim();
        if (species) {
          const seedling = await prisma.seedling.findFirst({
            where: { userId: report.userId, species, status: "pending" },
            orderBy: { createdAt: "desc" },
          });
          if (seedling) {
            await prisma.seedling.update({
              where: { id: seedling.id },
              data: { status: "rejected" },
            });
          }
        }
      } catch (e) {
        console.warn("[Seedling] Reject error:", e);
      }
    }

    auditLog("post report", "post report");
    return NextResponse.json({ success: true, status: "rejected" });
  } catch (error) {
    console.error("Reject error:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: getErrorMessage(error, "Gagal menolak laporan.") },
      { status: isDatabaseError(error) ? 503 : 500 }
    );
  }
}
