import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

function isAdmin(session: { userId: string; role: string } | null) {
  return session?.role === "admin";
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string; fieldId: string } }
) {
  const session = await getSession();
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await request.json();
    const { fieldId, label, type, required, placeholder, helpText, options, sortOrder } = body;

    const existing = await prisma.formField.findUnique({
      where: { formId_fieldId: { formId: params.id, fieldId: params.fieldId } },
    });
    if (!existing) {
      return NextResponse.json({ error: "Field not found" }, { status: 404 });
    }

    const field = await prisma.formField.update({
      where: { id: existing.id },
      data: {
        ...(fieldId !== undefined && { fieldId }),
        ...(label !== undefined && { label }),
        ...(type !== undefined && { type }),
        ...(required !== undefined && { required }),
        ...(placeholder !== undefined && { placeholder }),
        ...(helpText !== undefined && { helpText }),
        ...(options !== undefined && { options: JSON.stringify(options) }),
        ...(sortOrder !== undefined && { sortOrder }),
      },
    });

    return NextResponse.json({ field });
  } catch (error) {
    console.error("Update field error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string; fieldId: string } }
) {
  const session = await getSession();
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const existing = await prisma.formField.findUnique({
      where: { formId_fieldId: { formId: params.id, fieldId: params.fieldId } },
    });
    if (!existing) {
      return NextResponse.json({ error: "Field not found" }, { status: 404 });
    }

    await prisma.formField.delete({
      where: { id: existing.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete field error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
