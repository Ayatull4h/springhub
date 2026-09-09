import { NextResponse } from "next/server";
import { prisma, getErrorMessage, isDatabaseError } from "@/lib/prisma";
import { getSession, isAdmin as checkAdmin } from "@/lib/auth";
import { verifyCsrfToken } from "@/lib/csrf";
import { uploadPhoto } from "@/lib/upload-photo";
import { buildPhotoUrl } from "@/lib/photo-url";
import { auditLog } from "@/lib/audit";
export const dynamic = "force-dynamic";

// POST /api/admin/events/upload — upload thumbnail event (admin)
export async function POST(request: Request) {
  try {
    const csrfToken = request.headers.get("x-csrf-token");
    if (!csrfToken || !(await verifyCsrfToken(csrfToken))) {
      return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
    }
    const session = await getSession();
    if (!session || !(await checkAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    const formData = await request.formData();
    const file = formData.get("photo") as File | null;
    if (!file || file.size === 0) {
      return NextResponse.json({ error: "File foto wajib diisi" }, { status: 400 });
    }
    const result = await uploadPhoto(file, "events");
    auditLog("event thumbnail", `Thumbnail diupload: ${result.path}`);
    return NextResponse.json({ success: true, url: buildPhotoUrl(result.path), path: result.path }, { status: 201 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "";
    if (msg.includes("HEIC") || msg.includes("10MB") || msg.includes("Format")) {
      return NextResponse.json({ error: msg }, { status: 400 });
    }
    return NextResponse.json(
      { error: getErrorMessage(error, "Gagal upload thumbnail.") },
      { status: isDatabaseError(error) ? 503 : 500 }
    );
  }
}

// GET /api/admin/events/upload?q=&page=1&limit=24 — galeri foto SpringHub untuk dipilih (admin)
export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session || !(await checkAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    const url = new URL(request.url);
    const q = (url.searchParams.get("q") || "").trim().slice(0, 100);
    const limit = Math.min(Math.max(parseInt(url.searchParams.get("limit") || "24", 10) || 24, 1), 100);
    const page = Math.max(parseInt(url.searchParams.get("page") || "1", 10) || 1, 1);
    const where = q ? { storagePath: { contains: q, mode: "insensitive" as const } } : {};
    const [photos, total] = await Promise.all([
      prisma.reportPhoto.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: (page - 1) * limit,
        select: { id: true, storagePath: true, createdAt: true },
      }),
      prisma.reportPhoto.count({ where }),
    ]);
    return NextResponse.json({
      photos: photos.map((p) => ({ ...p, url: buildPhotoUrl(p.storagePath) })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error, "Gagal memuat galeri.") },
      { status: isDatabaseError(error) ? 503 : 500 }
    );
  }
}
