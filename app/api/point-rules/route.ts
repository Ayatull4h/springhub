import { NextResponse } from "next/server";
import { prisma, getErrorMessage, isDatabaseError } from "@/lib/prisma";
export const dynamic = "force-dynamic";
import { getOrSet } from "@/lib/cache";

// Public endpoint — no auth required, only returns active rules
export async function GET() {
  try {
    const rules = await getOrSet("point-rules", "active", () =>
      prisma.pointRule.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
        select: { id: true, name: true, description: true, points: true, category: true, icon: true, sortOrder: true },
      }),
      3600
    );

    return NextResponse.json({ rules });
  } catch (error) {
    console.error("Failed to fetch public point rules:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: getErrorMessage(error, "Terjadi kesalahan.") },
      { status: isDatabaseError(error) ? 503 : 500 }
    );
  }
}
