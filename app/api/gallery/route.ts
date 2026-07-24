import { NextResponse } from "next/server";
import { prisma, getErrorMessage, isDatabaseError } from "@/lib/prisma";
import { buildPhotoUrl } from "@/lib/photo-url";

export const dynamic = "force-dynamic";

/**
 * GET /api/gallery?formSlug=spring_monitoring&limit=20
 *
 * Returns approved reports that have a featured photo, sorted by newest first.
 * Used for the publication gallery to show before/after progression over time.
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const formSlug = url.searchParams.get("formSlug");
    const limit = parseInt(url.searchParams.get("limit") || "50", 10);

    const where: Record<string, unknown> = {
      status: "approved",
      featuredPhotoId: { not: null },
    };

    if (formSlug) {
      where.formSlug = formSlug;
    }

    const reports = await prisma.report.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: Math.min(limit, 100),
      select: {
        id: true,
        formSlug: true,
        createdAt: true,
        snappedLat: true,
        snappedLng: true,
        fieldData: true,
        featuredPhotoId: true,
        user: { select: { username: true, region: true } },
        photos: {
          select: { id: true, storagePath: true, width: true, height: true },
        },
      },
    });

    const gallery = reports.map((r) => {
      const featured = r.photos.find((p) => p.id === r.featuredPhotoId);
      let parsedFieldData: Record<string, unknown> = {};
      try { parsedFieldData = JSON.parse(typeof r.fieldData === "string" ? r.fieldData : "{}"); } catch {}
      return {
        reportId: r.id,
        formSlug: r.formSlug,
        createdAt: r.createdAt,
        snappedLat: r.snappedLat,
        snappedLng: r.snappedLng,
        username: r.user?.username || "guest",
        region: r.user?.region || "",
        province: (parsedFieldData.province as string) || "",
        detailName: (parsedFieldData.B1_nama as string) ||
                    (parsedFieldData.T_nama_lokal as string) ||
                    (parsedFieldData.spring_name as string) ||
                    (parsedFieldData.species as string) || "",
        detailCount: (parsedFieldData.count as string) || "",
        photo: featured
          ? {
              id: featured.id,
              url: buildPhotoUrl(featured.storagePath),
              width: featured.width,
              height: featured.height,
            }
          : null,
      };
    });

    return NextResponse.json({ gallery, total: gallery.length });
  } catch (error) {
    console.error("Gallery fetch error:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: getErrorMessage(error, "Terjadi kesalahan.") },
      { status: isDatabaseError(error) ? 503 : 500 }
    );
  }
}
