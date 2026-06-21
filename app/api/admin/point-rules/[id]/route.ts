import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma, getErrorMessage, isDatabaseError } from "@/lib/prisma";
export const dynamic = "force-dynamic";

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { name, description, points, category, icon, isActive, sortOrder } = body;

    const data: Record<string, unknown> = {};
    if (name !== undefined) data.name = name;
    if (description !== undefined) data.description = description;
    if (points !== undefined) data.points = Number(points);
    if (category !== undefined) data.category = category;
    if (icon !== undefined) data.icon = icon;
    if (isActive !== undefined) data.isActive = isActive;
    if (sortOrder !== undefined) data.sortOrder = sortOrder;

    const rule = await prisma.pointRule.update({
      where: { id: params.id },
      data,
    });

    return NextResponse.json({ rule });
  } catch (error) {
    console.error("Failed to update point rule::", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: getErrorMessage(error, "Gagal mengupdate data.") },
      { status: isDatabaseError(error) ? 503 : 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    await prisma.pointRule.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete point rule::", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: getErrorMessage(error, "Gagal menghapus data.") },
      { status: isDatabaseError(error) ? 503 : 500 }
    );
  }
}
