import { NextResponse } from "next/server";
import { prisma, getErrorMessage, isDatabaseError } from "@/lib/prisma";
export const dynamic = "force-dynamic";
import { getSession } from "@/lib/auth";
import { verifyCsrfToken } from "@/lib/csrf";
import { awardReportPoints, checkDailyStreak, updateTrustScore } from "@/lib/points";
import { auditLog } from "@/lib/audit";
import { computeSpringHealth } from "@/lib/health-score";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // CSRF protection
    const csrfToken = request.headers.get("x-csrf-token");
    if (!csrfToken || !(await verifyCsrfToken(csrfToken))) {
      return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
    }

    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const report = await prisma.report.findUnique({
      where: { id: (await params).id },
    });

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    if (report.status !== "pending") {
      return NextResponse.json({ error: "Report already reviewed" }, { status: 400 });
    }

    // Parse optional featuredPhotoId + narasi landing (ID & EN) dari request body
    let featuredPhotoId: string | null = null;
    let landingNarrative = "";
    let landingNarrativeEn = "";
    try {
      const body = await request.json();
      featuredPhotoId = body.featuredPhotoId || null;
      landingNarrative = typeof body.landingNarrative === "string" ? body.landingNarrative.trim() : "";
      landingNarrativeEn = typeof body.landingNarrativeEn === "string" ? body.landingNarrativeEn.trim() : "";
    } catch {
      // No body — that's fine, just approve without featured photo
    }

    if (landingNarrative.length > 1000) {
      return NextResponse.json(
        { error: "Narasi landing maksimal 1000 karakter." },
        { status: 400 }
      );
    }
    if (landingNarrativeEn.length > 1000) {
      return NextResponse.json(
        { error: "Narasi landing (EN) maksimal 1000 karakter." },
        { status: 400 }
      );
    }

    // Validate featuredPhotoId belongs to this report
    if (featuredPhotoId) {
      const photo = await prisma.reportPhoto.findFirst({
        where: { id: featuredPhotoId, reportId: (await params).id },
      });
      if (!photo) {
        return NextResponse.json(
          { error: "Featured photo not found in this report" },
          { status: 400 }
        );
      }
    }

    // Validasi: minimal foto sebelum approve (default 3; rorak cukup 1 foto)
    const minPhotos = report.formSlug === "trench-development" ? 1 : 3;
    const photoCount = await prisma.reportPhoto.count({ where: { reportId: report.id } });
    if (photoCount < minPhotos) {
      return NextResponse.json(
        { error: `Minimal ${minPhotos} foto diperlukan untuk approve. Saat ini: ${photoCount} foto.` },
        { status: 400 }
      );
    }

    await prisma.report.update({
      where: { id: (await params).id },
      data: {
        status: "approved",
        reviewedById: session.userId,
        featuredPhotoId,
        landingNarrative,
        landingNarrativeEn,
      },
    });

    // ── Auto-merge backstop: laporan yatim dicoba digabungkan ──
    // (nama identik + lokasi ≤10 m). Kalau ketemu, springId diisi di sini
    // agar logika hijau/aktif & health di bawah ikut jalan.
    if (!report.springId) {
      try {
        const { findMatchingSpringId } = await import("@/lib/spring-match");
        const matched = await findMatchingSpringId(
          prisma,
          report.formSlug,
          report.fieldData,
          report.preciseLat,
          report.preciseLng,
          report.id
        );
        if (matched) {
          await prisma.report.update({
            where: { id: report.id },
            data: { springId: matched },
          });
          report.springId = matched;
        }
      } catch {
        // non-critical
      }
    }

    const fieldData = JSON.parse(
      typeof report.fieldData === "string"
        ? report.fieldData
        : JSON.stringify(report.fieldData ?? {})
    );

    if (report.userId) {
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

    // ── Aktifkan seedling kalau laporan seedling ──
    const species = ((fieldData?.B2_nama_lokal || fieldData?.species) as string || "").trim();
    if (report.formSlug.includes("seedling") && species) {
      const seedling = await prisma.seedling.findFirst({
        where: { userId: report.userId || "", species },
        orderBy: { createdAt: "desc" },
      });
      if (seedling && seedling.status === "pending") {
        await prisma.seedling.update({
          where: { id: seedling.id },
          data: { status: "active" },
        });
      }
    }

    // ── Health scoring untuk spring-survey ──
    if (report.formSlug === "spring-monitoring" && report.springId) {
      try {
        const health = computeSpringHealth(fieldData);
        await prisma.spring.update({
          where: { id: report.springId },
          data: {
            healthScore: health.score,
            healthStatus: health.status,
            lastSurveyedAt: new Date(),
          },
        });
      } catch {
        // Health scoring non-critical
      }
    }

    // ── Restorasi = mata air dianggap pulih (hijau di map) + ikut aktif ──
    if (report.formSlug === "spring-restoration" && report.springId) {
      try {
        await prisma.spring.update({
          where: { id: report.springId },
          data: { healthScore: 100, healthStatus: "sehat" },
        });
        // Spring yang masih pending ikut diaktifkan — tidak perlu acc dua kali
        await prisma.spring.updateMany({
          where: { id: report.springId, status: "pending" },
          data: { status: "active" },
        });
      } catch {
        // Health/status update non-critical
      }
    }

    auditLog("post report", "post report");


    return NextResponse.json({ success: true, status: "approved" });
  } catch (error) {
    console.error("Approve error:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: getErrorMessage(error, "Gagal approve laporan.") },
      { status: isDatabaseError(error) ? 503 : 500 }
    );
  }
}
