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
    const limitParam = url.searchParams.get("limit") || url.searchParams.get("per_page") || "20";
    const pageParam = url.searchParams.get("page") || "1";
    const limit = Math.min(Math.max(parseInt(limitParam, 10) || 20, 1), 100);
    const page = Math.max(parseInt(pageParam, 10) || 1, 1);
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (["pending", "active", "rejected", "exhausted"].includes(statusFilter)) {
      where.status = statusFilter;
    }

    const [seedlings, total] = await Promise.all([
      prisma.seedling.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip,
        include: {
          user: { select: { id: true, username: true, email: true } },
        },
      }),
      prisma.seedling.count({ where }),
    ]);

    return NextResponse.json({
      seedlings,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error, "Gagal memuat data bibit") },
      { status: 500 }
    );
  }
}
