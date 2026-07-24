import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma, getErrorMessage, isDatabaseError } from "@/lib/prisma";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const url = new URL(request.url);
    const statusFilter = url.searchParams.get("status") || "";
    const limitParam = url.searchParams.get("limit") || url.searchParams.get("per_page") || "50";
    const pageParam = url.searchParams.get("page") || "1";
    const limit = Math.min(Math.max(parseInt(limitParam, 10) || 50, 1), 200);
    const page = Math.max(parseInt(pageParam, 10) || 1, 1);
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (statusFilter && ["pending", "approved", "rejected"].includes(statusFilter)) {
      where.status = statusFilter;
    }

    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip,
        include: {
          user: { select: { id: true, username: true, email: true } },
          reviewedBy: { select: { username: true } },
          pointsLogs: { select: { amount: true } },
          photos: { select: { id: true, storagePath: true }, take: 1, orderBy: { createdAt: "asc" } },
          _count: { select: { photos: true } },
        },
      }),
      prisma.report.count({ where }),
    ]);

    const mapped = reports.map((r) => ({
      ...r,
      submitter: r.user
        ? { type: "user", id: r.user.id, name: r.user.username, email: r.user.email }
        : { type: "guest", id: r.guestId, name: `Guest (${r.guestId?.slice(0, 8)}...)`, email: null },
      user: undefined,
      guestId: undefined,
    }));

    return NextResponse.json({ reports: mapped, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    console.error("Admin reports GET error:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: getErrorMessage(error, "Gagal memuat laporan.") },
      { status: isDatabaseError(error) ? 503 : 500 }
    );
  }
}
