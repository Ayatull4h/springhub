import { NextResponse } from "next/server";
import { prisma, getErrorMessage, isDatabaseError } from "@/lib/prisma";
export const dynamic = "force-dynamic";
import { buildPhotoUrl } from "@/lib/photo-url";
import { publicLimiter } from "@/lib/rate-limit";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
    const limit = await publicLimiter.check(`springs-id:${ip}`);
    if (!limit.allowed) {
      return NextResponse.json({ error: "Terlalu banyak permintaan." }, { status: 429 });
    }
    const spring = await prisma.spring.findUnique({
      where: { id: (await params).id },
      include: {
        reports: {
          // C-2: hanya report approved yang tampil publik
          where: { isActive: true, status: "approved" },
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            formSlug: true,
            status: true,
            fieldData: true,
            snappedLat: true,
            snappedLng: true,
            featuredPhotoId: true,
            createdAt: true,
            user: { select: { username: true, region: true } },
            photos: {
              orderBy: { createdAt: "asc" },
              select: {
                id: true,
                fieldId: true,
                storagePath: true,
                mimeType: true,
                width: true,
                height: true,
                createdAt: true,
              },
            },
          },
        },
      },
    });

    if (!spring) {
      return NextResponse.json({ error: "Spring not found" }, { status: 404 });
    }

    // Cari spring lain di snapped location yang SAMA (umbul asem & umbul pengilon)
    const siblings = await prisma.spring.findMany({
      where: {
        snappedLat: spring.snappedLat,
        snappedLng: spring.snappedLng,
        id: { not: spring.id },
        isDummy: false,
      },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });

    // Map reports → enrich with parsed fieldData + photo URLs
    // Cari juga report dalam radius ~2km untuk semua tipe form (termasuk spring-monitoring yg terpisah)
    const nearbyReports = spring.snappedLat && spring.snappedLng ? await prisma.report.findMany({
      where: {
        id: { notIn: spring.reports.map(r => r.id) },
        isActive: true,
        status: "approved",
        snappedLat: { gte: spring.snappedLat - 0.02, lte: spring.snappedLat + 0.02 },
        snappedLng: { gte: spring.snappedLng - 0.02, lte: spring.snappedLng + 0.02 },
      },
      include: {
        user: { select: { id: true, username: true, region: true } },
        photos: { select: { id: true, storagePath: true, width: true, height: true } },
        reviewedBy: { select: { username: true } },
      },
      take: 100,
      orderBy: { createdAt: "desc" },
    }) : [];

    const allReports = [...spring.reports, ...nearbyReports];

    const reports = allReports.map((r) => {
      let parsedFieldData: Record<string, unknown> = {};
      try {
        parsedFieldData = JSON.parse(r.fieldData);
      } catch { /* ignore */ }

      const photosWithUrls = r.photos.map((p) => ({
        ...p,
        url: buildPhotoUrl(p.storagePath),
      }));

      return {
        id: r.id,
        formSlug: r.formSlug,
        status: r.status,
        createdAt: r.createdAt,
        snappedLat: r.snappedLat,
        snappedLng: r.snappedLng,
        username: r.user?.username || "Anonymous",
        region: r.user?.region || "",
        // Field-data yang relevan dari form
        springName: (parsedFieldData.spring_name as string) || (parsedFieldData.B1_nama as string) || "",
        province: (parsedFieldData.province as string) || "",
        regency: (parsedFieldData.regency as string) || "",
        notes: (parsedFieldData.notes as string) || "",
        treeCount: (parsedFieldData.tree_count as string) || "",
        photos: photosWithUrls,
        featuredPhotoId: r.featuredPhotoId,
      };
    });

    // Compute stats
    const stats = {
      totalReports: reports.length,
      approvedReports: reports.filter((r) => r.status === "approved").length,
      pendingReports: reports.filter((r) => r.status === "pending").length,
      monitoring: reports.filter((r) => r.formSlug === "spring-monitoring").length,
      restoration: reports.filter((r) => r.formSlug === "spring-restoration").length,
      treePlanting: reports.filter((r) => r.formSlug === "tree-planting").length,
      trench: reports.filter((r) => r.formSlug === "trench-development").length,
      seedling: reports.filter((r) => r.formSlug === "seedling-stock").length,
      totalPhotos: reports.reduce((sum, r) => sum + r.photos.length, 0),
      firstReport: reports.length > 0
        ? reports[reports.length - 1]?.createdAt.toISOString()
        : null,
      lastReport: reports.length > 0
        ? reports[0]?.createdAt.toISOString()
        : null,
    };

    return NextResponse.json({
      spring: {
        id: spring.id,
        name: spring.name,
        snappedLat: spring.snappedLat,
        snappedLng: spring.snappedLng,
        province: spring.province,
        regency: spring.regency,
        village: spring.village,
        subdistrict: spring.subdistrict,
        createdAt: spring.createdAt,
        updatedAt: spring.updatedAt,
        reports,
        stats,
        siblings,
      },
    });
  } catch (error) {
    console.error("Spring detail error:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: getErrorMessage(error, "Terjadi kesalahan.") },
      { status: isDatabaseError(error) ? 503 : 500 }
    );
  }
}
