import { NextResponse } from "next/server";
import { prisma, getErrorMessage, isDatabaseError } from "@/lib/prisma";
import { getSession, isAdmin as checkAdmin } from "@/lib/auth";
export const dynamic = "force-dynamic";

// GET /api/admin/events/:id/registrations — daftar pendaftar (admin only, berisi WA/email)
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || !(await checkAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    const { id } = await params;
    const { searchParams } = new URL(request.url);

    if (searchParams.get("format") === "csv") {
      const regs = await prisma.eventRegistration.findMany({
        where: { eventId: id },
        orderBy: { createdAt: "asc" },
      });
      const event = await prisma.event.findUnique({ where: { id }, select: { title: true } });
      const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
      const csv = [
        "nama,domisili,hari,wa,email,terdaftar",
        ...regs.map((r) => [r.nama, r.domisili, r.hari, r.wa, r.email, r.createdAt.toISOString()].map(esc).join(",")),
      ].join("\n");
      const safe = (event?.title || "event").toLowerCase().replace(/[^a-z0-9]+/g, "_").slice(0, 40);
      return new Response(csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="pendaftar_${safe}.csv"`,
        },
      });
    }

    const registrations = await prisma.eventRegistration.findMany({
      where: { eventId: id },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ registrations, total: registrations.length });
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error, "Gagal memuat pendaftar.") },
      { status: isDatabaseError(error) ? 503 : 500 }
    );
  }
}
