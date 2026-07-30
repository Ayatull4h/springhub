import { NextResponse } from "next/server";
import { prisma, getErrorMessage, isDatabaseError } from "@/lib/prisma";
export const dynamic = "force-dynamic";
import { buildPhotoUrl } from "@/lib/photo-url";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const spring = await prisma.spring.findUnique({
      where: { id: params.id },
      include: {
        reports: {
          where: { isActive: true },
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
    // Cari juga report non-spring dalam radius 250m (≈ 0.00225°) — untuk tab aktivitas
    const nearbyReports = spring.snappedLat && spring.snappedLng ? await prisma.report.findMany({
      where: {
        id: { notIn: spring.reports.map(r => r.id) },
        status: "approved",
        snappedLat: { gte: spring.snappedLat - 0.0025, lte: spring.snappedLat + 0.0025 },
        snappedLng: { gte: spring.snappedLng - 0.0025, lte: spring.snappedLng + 0.0025 },
        // Previously excluded spring-monitoring/restoration, but orphaned reports without direct springId link would be invisible
        // Now include all form types so even unlinked reports show up via snapped coords
      },
      include: {
        user: { select: { id: true, username: true, email: true, region: true } },
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
