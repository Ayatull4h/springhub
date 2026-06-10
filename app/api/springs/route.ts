import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
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
    console.error("Springs list error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
