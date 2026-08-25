import { NextRequest, NextResponse } from "next/server";
import { prisma, getErrorMessage, isDatabaseError } from "@/lib/prisma";
export const dynamic = "force-dynamic";

/**
 * GET /api/springs/bulk?ids=id1,id2,id3
 *
 * Lightweight bulk endpoint — returns only id + name for up to 50 springs.
 * Designed for map markers that need just the spring name, not the full detail.
 * Eliminates the N+1 problem of fetching each spring individually.
 */
export async function GET(request: NextRequest) {
  try {
    const idsParam = request.nextUrl.searchParams.get("ids");
    if (!idsParam) {
      return NextResponse.json(
        { error: "Query parameter 'ids' is required (comma-separated UUIDs)." },
        { status: 400 }
      );
    }

    const ids = idsParam
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
      .slice(0, 50); // safety limit

    if (ids.length === 0) {
      return NextResponse.json({ springs: [] });
    }

    const springs = await prisma.spring.findMany({
      where: { id: { in: ids }, status: "active" },
      select: {
        id: true,
        name: true,
        healthScore: true,
        healthStatus: true,
      },
    });

    return NextResponse.json({ springs });
  } catch (error) {
    console.error("Springs bulk error:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: getErrorMessage(error, "Terjadi kesalahan.") },
      { status: isDatabaseError(error) ? 503 : 500 }
    );
  }
}
