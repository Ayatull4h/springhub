import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { verifyCsrfToken } from "@/lib/csrf";
import { auditLog } from "@/lib/audit";
import { prisma, getErrorMessage, isDatabaseError } from "@/lib/prisma";
export const dynamic = "force-dynamic";

const MAX_BATCH = 200;

export async function POST(request: Request) {
  try {
    const csrfToken = request.headers.get("x-csrf-token");
    if (!csrfToken || !(await verifyCsrfToken(csrfToken))) {
      return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
    }

    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json().catch(() => null);
    const reportIds: string[] = Array.isArray(body?.reportIds) ? body.reportIds.filter((id: unknown) => typeof id === "string" && id.length > 0) : [];
    const springId = typeof body?.springId === "string" && body.springId.trim() ? body.springId.trim() : "";

    if (reportIds.length === 0 || !springId) {
      return NextResponse.json({ error: "reportIds dan springId wajib diisi." }, { status: 400 });
    }
    if (reportIds.length > MAX_BATCH) {
      return NextResponse.json({ error: `Maksimal ${MAX_BATCH} laporan per batch.` }, { status: 400 });
    }

    const spring = await prisma.spring.findUnique({ where: { id: springId }, select: { id: true, name: true } });
    if (!spring) {
      return NextResponse.json({ error: "Spring tidak ditemukan." }, { status: 404 });
    }

    const result = await prisma.report.updateMany({
      where: { id: { in: reportIds }, springId: null },
      data: { springId },
    });

    auditLog("orphan-link", `Linked ${result.count} orphan reports to spring ${spring.name} (${spring.id})`, {
      reportIds: reportIds.slice(0, 20),
      springId,
    });

    return NextResponse.json({ success: true, count: result.count, springId });
  } catch (error) {
    console.error("Admin orphan link POST error:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: getErrorMessage(error, "Gagal menautkan laporan ke spring.") },
      { status: isDatabaseError(error) ? 503 : 500 }
    );
  }
}