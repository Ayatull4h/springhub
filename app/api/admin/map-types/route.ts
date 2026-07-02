import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const types = await prisma.mapPointType.findMany({
      include: {
        categories: { orderBy: { sortOrder: "asc" } },
        _count: { select: { points: true, forms: true } },
      },
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json({ types });
  } catch (error) {
    console.error("GET /api/admin/map-types error:", error);
    return NextResponse.json({ error: "Gagal memuat data" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { slug, name, description, icon, categories } = body;

    // Check slug uniqueness
    const existing = await prisma.mapPointType.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json({ error: "Slug sudah digunakan" }, { status: 409 });
    }

    const type = await prisma.mapPointType.create({
      data: {
        slug,
        name,
        description: description || "",
        icon: icon || "MapPin",
        sortOrder: await prisma.mapPointType.count(),
        categories: categories?.length
          ? {
              create: categories.map((c: { slug: string; name: string; color: string }, i: number) => ({
                slug: c.slug,
                name: c.name,
                color: c.color || "#2563eb",
                sortOrder: i,
              })),
            }
          : undefined,
      },
      include: { categories: { orderBy: { sortOrder: "asc" } } },
    });

    return NextResponse.json({ type }, { status: 201 });
  } catch (error) {
    console.error("POST /api/admin/map-types error:", error);
    return NextResponse.json({ error: "Gagal membuat tipe" }, { status: 500 });
  }
}
