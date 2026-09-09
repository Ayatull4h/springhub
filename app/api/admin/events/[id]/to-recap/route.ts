import { NextResponse } from "next/server";
import { prisma, getErrorMessage, isDatabaseError } from "@/lib/prisma";
import { getSession, isAdmin as checkAdmin } from "@/lib/auth";
import { verifyCsrfToken } from "@/lib/csrf";
import { auditLog } from "@/lib/audit";
export const dynamic = "force-dynamic";

// POST /api/admin/events/:id/to-recap — jadikan rekap di Latest Media (draf, admin)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const csrfToken = request.headers.get("x-csrf-token");
    if (!csrfToken || !(await verifyCsrfToken(csrfToken))) {
      return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
    }
    const session = await getSession();
    if (!session || !(await checkAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    const { id } = await params;
    const event = await prisma.event.findUnique({
      where: { id },
      include: { _count: { select: { registrations: true } } },
    });
    if (!event) return NextResponse.json({ error: "Jadwal tidak ditemukan" }, { status: 404 });

    const item = await prisma.contentBlock.create({
      data: {
        section: "media",
        type: "event",
        title: `Rekap: ${event.title}`,
        subtitle: event.location,
        description: `${event.description} Diikuti ${event._count.registrations} peserta.`,
        imageUrl: event.imageUrl,
        linkUrl: "",
        linkLabel: "",
        sortOrder: 0,
        isActive: true,
      },
    });
    auditLog("event to-recap", `Rekap dibuat dari jadwal: ${event.title}`);
    return NextResponse.json({ success: true, item }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error, "Gagal membuat rekap.") },
      { status: isDatabaseError(error) ? 503 : 500 }
    );
  }
}
