import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logError } from "@/lib/error-logger";

export async function GET() {
  try {
    const types = await prisma.mapPointType.findMany({
      where: { isActive: true },
      include: {
        categories: {
          select: { id: true, slug: true, name: true, color: true },
          orderBy: { sortOrder: "asc" },
        },
        _count: { select: { points: { where: { isActive: true } } } },
      },
      orderBy: { sortOrder: "asc" },
    });

    // Get count per category
    const categoryCounts = await prisma.mapPoint.groupBy({
      by: ["categoryId"],
      where: { isActive: true, categoryId: { not: null } },
      _count: true,
    });
    const countMap = new Map(
      (categoryCounts as Array<{ categoryId: string | null; _count: number }>).map(
        (c) => [c.categoryId, c._count] as [string | null, number]
      )
    );

    const result = (types as Array<Record<string, unknown>>).map((t: Record<string, unknown>) => ({
      id: t.id as string,
      slug: t.slug as string,
      name: t.name as string,
      icon: t.icon as string,
      count: ((t._count as Record<string, number>)?.points || 0) as number,
      categories: ((t.categories as Array<Record<string, unknown>>) || []).map(
        (c: Record<string, unknown>) => ({
          id: c.id as string,
          slug: c.slug as string,
          name: c.name as string,
          color: c.color as string,
          count: countMap.get(c.id as string) || 0,
        })
      ),
    }));

    return NextResponse.json({ types: result });
  } catch (err) {
    console.error("GET /api/map-points/types error:", err);
    await logError({ message: "Map points types error", level: "error", source: "api", stack: err instanceof Error ? err.stack : "" }).catch(() => {});
    return NextResponse.json({ error: "Gagal memuat data" }, { status: 500 });
  }
}
