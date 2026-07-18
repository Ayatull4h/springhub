import { NextResponse } from "next/server";
import { prisma, getErrorMessage } from "@/lib/prisma";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const q = url.searchParams.get("q") || "";

    if (q.length < 2) {
      return NextResponse.json({ springs: [] });
    }

    const springs = await prisma.spring.findMany({
      where: {
        status: { in: ["pending", "active"] },
        name: { contains: q, mode: "insensitive" },
      },
      select: {
        id: true,
        name: true,
        province: true,
        regency: true,
        status: true,
        _count: { select: { reports: true } },
      },
      take: 10,
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ springs });
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error, "Gagal mencari spring") },
      { status: 500 }
    );
  }
}
