import { NextResponse } from "next/server";
import { getSession, isAdmin as checkAdmin } from "@/lib/auth";
import { prisma, getErrorMessage } from "@/lib/prisma";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session || !(await checkAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const url = new URL(request.url);
    const statusFilter = url.searchParams.get("status") || "";

    const where: Record<string, unknown> = {};
    if (["pending", "active", "merged"].includes(statusFilter)) {
      where.status = statusFilter;
    }

    const springs = await prisma.spring.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        _count: { select: { reports: true } },
      },
    });

    const mapped = springs.map((s) => ({
      id: s.id,
      name: s.name,
      province: s.province,
      regency: s.regency,
      status: s.status,
      reportCount: s._count.reports,
      createdAt: s.createdAt,
    }));

    return NextResponse.json({ springs: mapped });
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error, "Gagal memuat data") },
      { status: 500 }
    );
  }
}
