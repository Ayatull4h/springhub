import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma, getErrorMessage, isDatabaseError } from "@/lib/prisma";
import { getSession, isAdmin as checkAdmin } from "@/lib/auth";
import { verifyCsrfToken } from "@/lib/csrf";
import { auditLog } from "@/lib/audit";
export const dynamic = "force-dynamic";

const eventSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(5000).optional().default(""),
  location: z.string().max(200).optional().default(""),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  googleFormUrl: z.string().max(500).optional().default(""),
  imageUrl: z.string().max(500).optional().default(""),
  isActive: z.boolean().optional().default(true),
});

async function requireAdmin() {
  const session = await getSession();
  if (!session || !(await checkAdmin())) return null;
  return session;
}

// GET /api/admin/events — semua jadwal + jumlah pendaftar (admin)
export async function GET() {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    const events = await prisma.event.findMany({
      orderBy: { startDate: "desc" },
      include: { _count: { select: { registrations: true } } },
    });
    return NextResponse.json({ events });
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error, "Gagal memuat jadwal.") },
      { status: isDatabaseError(error) ? 503 : 500 }
    );
  }
}

// POST /api/admin/events — buat jadwal baru (admin)
export async function POST(request: Request) {
  try {
    const csrfToken = request.headers.get("x-csrf-token");
    if (!csrfToken || !(await verifyCsrfToken(csrfToken))) {
      return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
    }
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    const body = await request.json();
    const parsed = eventSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Data tidak valid", details: parsed.error.flatten() }, { status: 400 });
    }
    const start = new Date(parsed.data.startDate);
    const end = new Date(parsed.data.endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) {
      return NextResponse.json({ error: "Rentang tanggal tidak valid" }, { status: 400 });
    }
    const event = await prisma.event.create({
      data: {
        title: parsed.data.title,
        description: parsed.data.description || "",
        location: parsed.data.location || "",
        startDate: start,
        endDate: end,
        googleFormUrl: parsed.data.googleFormUrl || "",
        imageUrl: parsed.data.imageUrl || "",
        isActive: parsed.data.isActive ?? true,
      },
    });
    auditLog("event create", `Jadwal baru: ${event.title}`);
    return NextResponse.json({ success: true, event }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error, "Gagal menyimpan jadwal.") },
      { status: isDatabaseError(error) ? 503 : 500 }
    );
  }
}
