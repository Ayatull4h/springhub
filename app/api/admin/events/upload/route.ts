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

// GET /api/admin/events/upload?limit=60 — galeri foto SpringHub untuk dipilih (admin)
export async function GET() {
  try {
    const session = await getSession();
    if (!session || !(await checkAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    const photos = await prisma.reportPhoto.findMany({
      orderBy: { createdAt: "desc" },
      take: 60,
      select: { id: true, storagePath: true, createdAt: true },
    });
    return NextResponse.json({ photos: photos.map((p) => ({ ...p, url: buildPhotoUrl(p.storagePath) })) });
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error, "Gagal memuat galeri.") },
      { status: isDatabaseError(error) ? 503 : 500 }
    );
  }
}
