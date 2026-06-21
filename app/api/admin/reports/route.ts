import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma, getErrorMessage, isDatabaseError } from "@/lib/prisma";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const reports = await prisma.report.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, username: true, email: true } },
        reviewedBy: { select: { username: true } },
        pointsLogs: { select: { amount: true } },
        _count: { select: { photos: true } },
      },
    });

    const mapped = reports.map((r) => ({
      ...r,
      submitter: r.user
        ? { type: "user", id: r.user.id, name: r.user.username, email: r.user.email }
        : { type: "guest", id: r.guestId, name: `Guest (${r.guestId?.slice(0, 8)}...)`, email: null },
      user: undefined,
      guestId: undefined,
    }));

    return NextResponse.json({ reports: mapped });
  } catch (error) {
    console.error("Admin reports GET error:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: getErrorMessage(error, "Gagal memuat laporan.") },
      { status: isDatabaseError(error) ? 503 : 500 }
    );
  }
}
