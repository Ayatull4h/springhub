import { NextResponse } from "next/server";
import { prisma, getErrorMessage, isDatabaseError } from "@/lib/prisma";
import { publicLimiter } from "@/lib/rate-limit";
export const dynamic = "force-dynamic";

// GET /api/events — daftar event mendatang yang aktif (publik, tanpa PII pendaftar)
export async function GET(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const limitCheck = await publicLimiter.check(`events:${ip}`);
    if (!limitCheck.allowed) {
      return NextResponse.json({ error: "Terlalu banyak permintaan." }, { status: 429 });
    }

    const now = new Date();
    const events = await prisma.event.findMany({
      where: { isActive: true, endDate: { gte: now } },
      orderBy: { startDate: "asc" },
      select: {
        id: true,
        title: true,
        description: true,
        location: true,
        startDate: true,
        endDate: true,
        googleFormUrl: true,
        imageUrl: true,
        _count: { select: { registrations: true } },
      },
    });

    return NextResponse.json({ events });
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error, "Terjadi kesalahan.") },
      { status: isDatabaseError(error) ? 503 : 500 }
    );
  }
}
