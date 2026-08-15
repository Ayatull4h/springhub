import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { verifyCsrfToken } from "@/lib/csrf";
import { auditLog } from "@/lib/audit";

export const dynamic = "force-dynamic";

/**
 * PATCH /api/admin/errors/[id]
 *
 * Mark error as read / unread.
 * Body: { read: boolean }
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const body = await request.json();

    if (typeof body.read !== "boolean") {
      return NextResponse.json({ error: "Field 'read' (boolean) required" }, { status: 400 });
    }

    await prisma.appError.update({
      where: { id },
      data: { read: body.read },
    });

    auditLog("update error read", `Tandai error ${id} read=${body.read}`);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Admin error PATCH error:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: "Gagal memperbarui error log" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/errors/[id]
 *
 * Hapus satu error.
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    await prisma.appError.delete({ where: { id } });

    auditLog("delete error", `Hapus error ${id}`);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Admin error DELETE error:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: "Gagal menghapus error log" },
      { status: 500 }
    );
  }
}
