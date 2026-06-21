import { NextResponse } from "next/server";
import { prisma, getErrorMessage, isDatabaseError } from "@/lib/prisma";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const springs = await prisma.spring.findMany({
      select: {
        id: true,
        name: true,
        snappedLat: true,
        snappedLng: true,
        province: true,
        regency: true,
        createdAt: true,
        _count: { select: { reports: { where: { status: "approved" } } } },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ springs });
  } catch (error) {
    console.error("Springs list error:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: getErrorMessage(error, "Terjadi kesalahan.") },
      { status: isDatabaseError(error) ? 503 : 500 }
    );
  }
}
