import { NextResponse } from "next/server";
import { prisma, getErrorMessage, isDatabaseError } from "@/lib/prisma";
export const dynamic = "force-dynamic";
import { getOrSet } from "@/lib/cache";
import { publicLimiter } from "@/lib/rate-limit";

// GET /api/courses — list semua course aktif
export async function GET(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
    const lim = await publicLimiter.check(`courses:${ip}`);
    if (!lim.allowed) return NextResponse.json({ error: "Terlalu banyak permintaan." }, { status: 429 });
    const courses = await getOrSet("courses", "active", () =>
      prisma.course.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
        include: {
          modules: {
            orderBy: { sortOrder: "asc" },
            select: { id: true, title: true, sortOrder: true },
          },
        },
      }),
      300
    );
    return NextResponse.json({ courses });
  } catch (error) {
    console.error("Courses fetch error:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: getErrorMessage(error, "Terjadi kesalahan.") },
      { status: isDatabaseError(error) ? 503 : 500 }
    );
  }
}
