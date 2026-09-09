import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma, getErrorMessage, isDatabaseError } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getGuestId } from "@/lib/guest";
import { verifyCsrfToken } from "@/lib/csrf";
import { apiLimiter } from "@/lib/rate-limit";
import { auditLog } from "@/lib/audit";
export const dynamic = "force-dynamic";

const phoneRegex = /^(0[1-9]\d{8,11}|\+62\d{8,13})$/;

const registerSchema = z.object({
  nama: z.string().min(2, "Nama minimal 2 huruf").max(100),
  domisili: z.string().max(200).optional().default(""),
  hari: z.coerce.number().int().min(1).max(30),
  wa: z.string().regex(phoneRegex, "Nomor WA tidak valid (cth 0812... / +62812...)"),
  email: z.string().email("Email tidak valid").max(200),
});

// POST /api/events/:id/register — daftar event (tanpa kuota, anti-spam berlapis)
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
    const guestId = await getGuestId();
    const rateKey = session?.userId ?? guestId ?? request.headers.get("x-forwarded-for") ?? "unknown";
    const limitResult = await apiLimiter.check(`event-register:${rateKey}`);
    if (!limitResult.allowed) {
      return NextResponse.json({ error: "Terlalu banyak permintaan. Silakan coba lagi nanti." }, { status: 429 });
    }

    const body = await request.json();

    // Honeypot anti-bot
    if (body._website) {
      return NextResponse.json({ success: true, honeypot: true });
    }

    // Time gate: <3 detik = bot
    if (body._submit_time) {
      const elapsed = Date.now() - parseInt(String(body._submit_time), 10);
      if (!isNaN(elapsed) && elapsed < 3000) {
        return NextResponse.json({ error: "Terlalu cepat. Silakan isi formulir dengan benar." }, { status: 429 });
      }
    }

    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validasi gagal", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { id } = await params;
    const event = await prisma.event.findUnique({ where: { id } });
    if (!event || !event.isActive) {
      return NextResponse.json({ error: "Event tidak ditemukan" }, { status: 404 });
    }
    if (event.endDate < new Date()) {
      return NextResponse.json({ error: "Pendaftaran sudah ditutup (event selesai)" }, { status: 400 });
    }

    const { nama, domisili, hari, wa, email } = parsed.data;

    // Dedupe: WA / email yang sama tidak bisa daftar 2x di event yang sama
    const existing = await prisma.eventRegistration.findFirst({
      where: { eventId: id, OR: [{ wa }, { email }] },
      select: { id: true },
    });
    if (existing) {
      return NextResponse.json({ success: true, duplicated: true, registration: { id: existing.id } });
    }

    const registration = await prisma.eventRegistration.create({
      data: { eventId: id, nama, domisili: domisili || "", hari, wa, email },
    });

    auditLog("event register", `Pendaftar baru untuk event ${event.title}`);

    return NextResponse.json({ success: true, registration: { id: registration.id } }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error, "Gagal mendaftar.") },
      { status: isDatabaseError(error) ? 503 : 500 }
    );
  }
}
