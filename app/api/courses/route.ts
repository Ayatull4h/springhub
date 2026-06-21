import { NextResponse } from "next/server";
import { prisma, getErrorMessage, isDatabaseError } from "@/lib/prisma";
export const dynamic = "force-dynamic";
import { getOrSet } from "@/lib/cache";

// GET /api/courses — list semua course aktif
export async function GET() {
  try {
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
