import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";

// Public endpoint — no auth required, only returns active rules
export async function GET() {
  try {
    const rules = await prisma.pointRule.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        name: true,
        description: true,
        points: true,
        category: true,
        icon: true,
        sortOrder: true,
      },
    });

    return NextResponse.json({ rules });
  } catch (error) {
    console.error("Failed to fetch public point rules:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
