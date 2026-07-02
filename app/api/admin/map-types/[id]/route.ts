import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const type = await prisma.mapPointType.findUnique({
      where: { id },
      include: { categories: { orderBy: { sortOrder: "asc" } } },
    });

    if (!type) {
      return NextResponse.json({ error: "Tipe tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({ type });
  } catch (error) {
    console.error("GET /api/admin/map-types/[id] error:", error);
    return NextResponse.json({ error: "Gagal memuat data" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { slug, name, description, icon, isActive, categories } = body;

    // Check slug uniqueness if changed
    if (slug) {
      const existing = await prisma.mapPointType.findFirst({
        where: { slug, id: { not: id } },
      });
      if (existing) {
        return NextResponse.json({ error: "Slug sudah digunakan" }, { status: 409 });
      }
    }

    // Update type metadata
    const type = await prisma.mapPointType.update({
      where: { id },
      data: {
        ...(slug !== undefined && { slug }),
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(icon !== undefined && { icon }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    // If categories provided, replace them
    if (categories) {
      await prisma.mapPointCategory.deleteMany({ where: { typeId: id } });
      await prisma.mapPointCategory.createMany({
        data: categories.map((c: { slug: string; name: string; color: string }, i: number) => ({
          typeId: id,
          slug: c.slug,
          name: c.name,
          color: c.color || "#2563eb",
          sortOrder: i,
        })),
      });
    }

    return NextResponse.json({ type });
  } catch (error) {
    console.error("PUT /api/admin/map-types/[id] error:", error);
    return NextResponse.json({ error: "Gagal update tipe" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Check if type has points
    const pointCount = await prisma.mapPoint.count({ where: { typeId: id } });
    if (pointCount > 0) {
      // Soft-deactivate instead of delete
      await prisma.mapPointType.update({
        where: { id },
        data: { isActive: false },
      });
      return NextResponse.json({ message: "Tipe dinonaktifkan (masih memiliki titik)" });
    }

    await prisma.mapPointType.delete({ where: { id } });
    return NextResponse.json({ message: "Tipe berhasil dihapus" });
  } catch (error) {
    console.error("DELETE /api/admin/map-types/[id] error:", error);
    return NextResponse.json({ error: "Gagal menghapus tipe" }, { status: 500 });
  }
}
