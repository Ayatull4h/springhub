import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

  return NextResponse.json({ ok: true });
}

/**
 * DELETE /api/admin/errors/[id]
 *
 * Hapus satu error.
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

  return NextResponse.json({ ok: true });
}
