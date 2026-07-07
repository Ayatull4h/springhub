import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { logError } from "@/lib/error-logger";
import { verifyCsrfToken } from "@/lib/csrf";
import { auditLog } from "@/lib/audit";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const points = await prisma.mapPoint.findMany({
      include: {
        type: { select: { id: true, slug: true, name: true } },
        category: { select: { id: true, slug: true, name: true, color: true } },
        _count: { select: { reports: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ points });
  } catch (error) {
    console.error("GET /api/admin/map-points error:", error);
    return NextResponse.json({ error: "Gagal memuat data" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  // CSRF protection
  const csrfToken = request.headers.get("x-csrf-token");
  if (!csrfToken || !(await verifyCsrfToken(csrfToken))) {
    return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
  }


  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const { typeSlug, categorySlug, name, description, province, regency, lat, lng } = body;

    const type = await prisma.mapPointType.findUnique({ where: { slug: typeSlug } });
    if (!type) {
      return NextResponse.json({ error: "Tipe tidak ditemukan" }, { status: 404 });
    }

    let categoryId: string | undefined;
    if (categorySlug) {
      const cat = await prisma.mapPointCategory.findUnique({
        where: { typeId_slug: { typeId: type.id, slug: categorySlug } },
      });
      if (cat) categoryId = cat.id;
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

    // Check slug uniqueness
    const existingSlug = await prisma.mapPoint.findUnique({ where: { slug } });
    if (existingSlug) {
      return NextResponse.json({ error: "Titik dengan nama ini sudah ada" }, { status: 409 });
    }

    const point = await prisma.mapPoint.create({
      data: {
        typeId: type.id,
        categoryId: categoryId || null,
        name,
        slug,
        snappedLat: lat || null,
        snappedLng: lng || null,
        province: province || "",
        regency,
        description: description || "",
      },
      include: {
        type: { select: { slug: true, name: true } },
        category: { select: { slug: true, name: true, color: true } },
      },
    });

    auditLog("post create map point", "post create map point id=" + point.id);
    return NextResponse.json({ point }, { status: 201 });
  } catch (err) {
    console.error("POST /api/admin/map-points error:", err);
    await logError({ message: "Admin map points POST error", level: "error", source: "api", stack: err instanceof Error ? err.stack : "" }).catch(() => {});
    return NextResponse.json({ error: "Gagal membuat titik" }, { status: 500 });
  }
}
