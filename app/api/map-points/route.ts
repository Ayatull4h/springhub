import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const typeSlug = searchParams.get("type");
    const categorySlug = searchParams.get("category");

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

    const points = await prisma.mapPoint.findMany({
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
    });

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

    return NextResponse.json({ points: result });
  } catch (error) {
    console.error("GET /api/map-points error:", error);
    return NextResponse.json({ error: "Gagal memuat titik map" }, { status: 500 });
  }
}
