import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { logError } from "@/lib/error-logger";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const typeSlug = searchParams.get("type");
    const categorySlug = searchParams.get("category");
    const limitParam = searchParams.get("limit") || searchParams.get("per_page") || "200";
    const pageParam = searchParams.get("page") || "1";
    const limit = Math.min(Math.max(parseInt(limitParam, 10) || 200, 1), 200);
    const page = Math.max(parseInt(pageParam, 10) || 1, 1);
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { isActive: true };

    if (typeSlug) {
      const type = await prisma.mapPointType.findUnique({
        where: { slug: typeSlug },
        select: { id: true },
      });
      if (type) where.typeId = type.id;
    }

    if (categorySlug && typeSlug) {
      const category = await prisma.mapPointCategory.findUnique({
        where: { typeId_slug: { typeId: where.typeId as string, slug: categorySlug } },
        select: { id: true },
      });
      if (category) where.categoryId = category.id;
    }

    const [points, total] = await Promise.all([
      prisma.mapPoint.findMany({
        where,
        include: {
          type: { select: { id: true, slug: true, name: true, icon: true } },
          category: { select: { id: true, slug: true, name: true, color: true } },
          reports: {
            where: { status: "approved" },
            select: { id: true, formSlug: true, createdAt: true },
            orderBy: { createdAt: "desc" },
            take: 1,
          },
          _count: { select: { reports: { where: { status: "approved" } } } },
        },
        orderBy: { name: "asc" },
        take: limit,
        skip,
      }),
      prisma.mapPoint.count({ where }),
    ]);

    const result = (points as Array<Record<string, unknown>>).map((p: Record<string, unknown>) => ({
      id: p.id as string,
      type: p.type,
      category: p.category,
      name: p.name as string,
      slug: p.slug as string,
      snappedLat: p.snappedLat as number | null,
      snappedLng: p.snappedLng as number | null,
      province: p.province as string,
      regency: p.regency as string,
      reportCount: (p._count as Record<string, number>)?.reports || 0,
      latestReport: ((p.reports as Array<Record<string, unknown>>) || [])[0] || null,
    }));

    return NextResponse.json({
      points: result,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error("GET /api/map-points error:", err);
    await logError({ message: "Map points GET error", level: "error", source: "api", stack: err instanceof Error ? err.stack : "" }).catch(() => {});
    return NextResponse.json({ error: "Gagal memuat titik map" }, { status: 500 });
  }
}
