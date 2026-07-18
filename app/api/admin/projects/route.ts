import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma, getErrorMessage, isDatabaseError } from "@/lib/prisma";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const url = new URL(request.url);
    const limitParam = url.searchParams.get("limit") || url.searchParams.get("per_page") || "50";
    const pageParam = url.searchParams.get("page") || "1";
    const limit = Math.min(Math.max(parseInt(limitParam, 10) || 50, 1), 200);
    const page = Math.max(parseInt(pageParam, 10) || 1, 1);
    const skip = (page - 1) * limit;

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        orderBy: { createdAt: "desc" },
        take: limit,
        skip,
        include: {
          user: { select: { id: true, username: true, email: true } },
          _count: { select: { donations: true } },
        },
      }),
      prisma.project.count(),
    ]);

    return NextResponse.json({ projects, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    console.error("GET /api/admin/projects error::", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: getErrorMessage(error, "Gagal memuat data.") },
      { status: isDatabaseError(error) ? 503 : 500 }
    );
  }
}
