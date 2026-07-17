import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const types = await prisma.mapPointType.findMany({
      where: { isActive: true },
      include: {
        categories: {
          select: { id: true, slug: true, name: true, color: true },
          orderBy: { sortOrder: "asc" },
        },
      },
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json({ types });
  } catch (error) {
    console.error("GET /api/map-types error:", error);
    return NextResponse.json({ error: "Gagal memuat tipe map" }, { status: 500 });
  }
}
