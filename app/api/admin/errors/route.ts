import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { verifyCsrfToken } from "@/lib/csrf";
import { auditLog } from "@/lib/audit";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/errors
 *
 * Mengambil daftar error log. Hanya admin yang bisa akses.
 * Query params:
 *   - level: filter by level (info, warning, error, critical)
 *   - source: filter by source (frontend, api, worker, database)
 *   - read: filter by read status (true, false)
 *   - limit: number of records (default 50)
 *   - offset: pagination offset (default 0)
 */
export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const profile = await prisma.profile.findUnique({
    where: { id: session.userId },
    select: { role: true },
  });

  if (!profile || profile.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const level = searchParams.get("level");
  const source = searchParams.get("source");
  const read = searchParams.get("read");
  const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 200);
  const offset = parseInt(searchParams.get("offset") || "0", 10);

  const where: Record<string, unknown> = {};
  if (level && ["info", "warning", "error", "critical"].includes(level)) {
    where.level = level;
  }
  if (source && ["frontend", "api", "worker", "database"].includes(source)) {
    where.source = source;
  }
  if (read === "true") where.read = true;
  if (read === "false") where.read = false;

  const [errors, total] = await Promise.all([
    prisma.appError.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    }),
    prisma.appError.count({ where }),
  ]);

  const unread = await prisma.appError.count({ where: { read: false } });

  return NextResponse.json({ errors, total, unread });
}

/**
 * DELETE /api/admin/errors
 *
 * Hapus semua error yang sudah dibaca (read = true).
 */
export async function DELETE(request: Request) {
  try {
    // CSRF
    const csrfToken = request.headers.get("x-csrf-token");
    if (!csrfToken || !(await verifyCsrfToken(csrfToken))) {
      return NextResponse.json({ error: "Invalid CSRF" }, { status: 403 });
    }

    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const profile = await prisma.profile.findUnique({
      where: { id: session.userId },
      select: { role: true },
    });

    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const result = await prisma.appError.deleteMany({
      where: { read: true },
    });

    auditLog("delete errors", `Hapus ${result.count} error yang sudah dibaca`);
    return NextResponse.json({ deleted: result.count });
  } catch (error) {
    console.error("Admin errors DELETE error:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: "Gagal menghapus error log" },
      { status: 500 }
    );
  }
}
