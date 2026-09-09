import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma, getErrorMessage, isDatabaseError } from "@/lib/prisma";
import { getSession, isAdmin as checkAdmin } from "@/lib/auth";
import { verifyCsrfToken } from "@/lib/csrf";
import { auditLog } from "@/lib/audit";
export const dynamic = "force-dynamic";

const eventSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(5000).optional(),
  location: z.string().max(200).optional(),
  startDate: z.string().min(1).optional(),
  endDate: z.string().min(1).optional(),
  googleFormUrl: z.string().max(500).optional(),
  imageUrl: z.string().max(500).optional(),
  isActive: z.boolean().optional(),
});

async function requireAdminCsrf(request: Request) {
  const csrfToken = request.headers.get("x-csrf-token");
  if (!csrfToken || !(await verifyCsrfToken(csrfToken))) return "csrf";
  const session = await getSession();
  if (!session || !(await checkAdmin())) return "auth";
  return null;
}

// PUT /api/admin/events/:id — ubah jadwal (admin)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const blocked = await requireAdminCsrf(request);
    if (blocked) return NextResponse.json({ error: blocked === "csrf" ? "Invalid CSRF token" : "Unauthorized" }, { status: 403 });

    const body = await request.json();
    const parsed = eventSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Data tidak valid", details: parsed.error.flatten() }, { status: 400 });
    }
    const { id } = await params;
    const data: Record<string, unknown> = { ...parsed.data };
    if (parsed.data.startDate) {
      const s = new Date(parsed.data.startDate);
      if (isNaN(s.getTime())) return NextResponse.json({ error: "Tanggal mulai tidak valid" }, { status: 400 });
      data.startDate = s;
    }
    if (parsed.data.endDate) {
      const e = new Date(parsed.data.endDate);
      if (isNaN(e.getTime())) return NextResponse.json({ error: "Tanggal selesai tidak valid" }, { status: 400 });
      data.endDate = e;
    }
    const event = await prisma.event.update({ where: { id }, data });
    auditLog("event update", `Jadwal diubah: ${event.title}`);
    return NextResponse.json({ success: true, event });
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error, "Gagal mengubah jadwal.") },
      { status: isDatabaseError(error) ? 503 : 500 }
    );
  }
}

// DELETE /api/admin/events/:id — hapus jadwal + pendaftar (admin)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const blocked = await requireAdminCsrf(request);
    if (blocked) return NextResponse.json({ error: blocked === "csrf" ? "Invalid CSRF token" : "Unauthorized" }, { status: 403 });

    const { id } = await params;
    const event = await prisma.event.findUnique({ where: { id }, select: { title: true } });
    if (!event) return NextResponse.json({ error: "Jadwal tidak ditemukan" }, { status: 404 });
    await prisma.event.delete({ where: { id } });
    auditLog("event delete", `Jadwal dihapus: ${event.title}`);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error, "Gagal menghapus jadwal.") },
      { status: isDatabaseError(error) ? 503 : 500 }
    );
  }
}
