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

    const types = await prisma.mapPointType.findMany({
      include: {
        categories: { orderBy: { sortOrder: "asc" } },
        _count: { select: { points: true, forms: true } },
      },
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json({ types });
  } catch (err) {
    console.error("GET /api/admin/map-types error:", err);
    await logError({ message: "Admin map types GET error", level: "error", source: "api", stack: err instanceof Error ? err.stack : "" }).catch(() => {});
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

    auditLog("post map-type", "created map-type " + type.id);
    return NextResponse.json({ type }, { status: 201 });
  } catch (err) {
    console.error("POST /api/admin/map-types error:", err);
    await logError({ message: "Admin map types POST error", level: "error", source: "api", stack: err instanceof Error ? err.stack : "" }).catch(() => {});
    return NextResponse.json({ error: "Gagal membuat tipe" }, { status: 500 });
  }
}
