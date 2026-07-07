import { NextResponse } from "next/server";
import { prisma, getErrorMessage, isDatabaseError } from "@/lib/prisma";
export const dynamic = "force-dynamic";
import { getSession } from "@/lib/auth";
import { verifyCsrfToken } from "@/lib/csrf";
import { auditLog } from "@/lib/audit";

function isAdmin(session: { userId: string; role: string } | null) {
  return session?.role === "admin";
}

// GET /api/admin/forms — semua form dengan field-nya
// Query params:
//   ?status=active   — hanya form aktif
//   ?status=inactive — hanya form tidak aktif
//   ?status=all      — semua (default)
export async function GET(request: Request) {
  const session = await getSession();
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  try {
    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get("status") || "all";

    const where: Record<string, unknown> = {};
    if (statusFilter === "active") where.isActive = true;
    else if (statusFilter === "inactive") where.isActive = false;

    const forms = await prisma.form.findMany({
      where,
      orderBy: { sortOrder: "asc" },
      include: {
        fields: { orderBy: { sortOrder: "asc" } },
        _count: { select: { reports: true } },
      },
    });
    return NextResponse.json({ forms });
  } catch (error) {
    console.error("Admin forms fetch error::", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: getErrorMessage(error, "Gagal memuat data.") },
      { status: isDatabaseError(error) ? 503 : 500 }
    );
  }
}

// POST /api/admin/forms — buat form baru
export async function POST(request: Request) {
  // CSRF protection
  const csrfToken = request.headers.get("x-csrf-token");
  if (!csrfToken || !(await verifyCsrfToken(csrfToken))) {
    return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
  }


  const session = await getSession();
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  try {
    const body = await request.json();
    const { slug, title, description, pointsOnSubmit, contributionType, fields } = body;

    if (!slug || !title) {
      return NextResponse.json(
        { error: "Slug and title are required" },
        { status: 400 }
      );
    }

    // Check slug uniqueness
    const existing = await prisma.form.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json(
        { error: "A form with this slug already exists" },
        { status: 409 }
      );
    }

    // Cari MapPointType berdasarkan contributionType dulu
    const contribToType: Record<string, string> = {
      monitoring: "spring",
      restoration: "spring",
      trench: "trench",
      tree_planting: "tree-planting",
      seedling_stock: "seedling",
    };
    const typeSlug = contribToType[contributionType || ""] || slug;
    let mapPointType = await prisma.mapPointType.findUnique({ where: { slug: typeSlug } });
    if (!mapPointType) {
      // Coba cari berdasarkan slug form (fallback)
      mapPointType = await prisma.mapPointType.findUnique({ where: { slug } });
    }
    if (!mapPointType) {
      // Bikin baru kalo belum ada
      mapPointType = await prisma.mapPointType.create({
        data: {
          slug,
          name: title,
          description: description ? `Titik untuk "${title}"` : `Titik untuk "${title}"`,
          icon: "MapPin",
          sortOrder: 0,
          isActive: true,
        },
      });
    }

    const form = await prisma.form.create({
      data: {
        slug,
        title,
        description: description || "",
        pointsOnSubmit: pointsOnSubmit ?? 25,
        contributionType: contributionType || "monitoring",
        mapTypeId: mapPointType.id,
        fields: fields?.length
          ? {
              create: fields.map(
                (f: {
                  fieldId: string;
                  label: string;
                  type?: string;
                  required?: boolean;
                  placeholder?: string;
                  helpText?: string;
                  options?: string[];
                  sortOrder?: number;
                }, i: number) => ({
                  fieldId: f.fieldId,
                  label: f.label,
                  type: f.type || "text",
                  required: f.required ?? false,
                  placeholder: f.placeholder || "",
                  helpText: f.helpText || "",
                  options: JSON.stringify(f.options || []),
                  sortOrder: f.sortOrder ?? i,
                })
              ),
            }
          : undefined,
      },
      include: { fields: { orderBy: { sortOrder: "asc" } }, mapType: true },
    });

    auditLog("post create form", "post create form id=" + form.id);
    return NextResponse.json({ form }, { status: 201 });
  } catch (error) {
    console.error("Admin form create error::", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: getErrorMessage(error, "Gagal menambah data.") },
      { status: isDatabaseError(error) ? 503 : 500 }
    );
  }
}
