import { NextResponse } from "next/server";
import { prisma, getErrorMessage, isDatabaseError } from "@/lib/prisma";
export const dynamic = "force-dynamic";
import { getSession } from "@/lib/auth";
import { verifyCsrfToken } from "@/lib/csrf";
import { auditLog } from "@/lib/audit";

function isAdmin(session: { userId: string; role: string } | null) {
  return session?.role === "admin";
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string; fieldId: string } }
) {
  // CSRF protection
  const csrfToken = request.headers.get("x-csrf-token");
  if (!csrfToken || !(await verifyCsrfToken(csrfToken))) {
    return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
  }
  const session = await getSession();
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  try {
    const body = await request.json();
    const { fieldId, label, labelEn, type, required, placeholder, helpText, options, optionsEn, sortOrder } = body;

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
        ...(labelEn !== undefined && { labelEn }),
        ...(optionsEn !== undefined && { optionsEn: JSON.stringify(optionsEn) }),
        ...(sortOrder !== undefined && { sortOrder }),
      },
    });

    auditLog("put field", "field " + field.id);
    return NextResponse.json({ field });
  } catch (error) {
    console.error("Update field error::", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: getErrorMessage(error, "Gagal mengupdate data.") },
      { status: isDatabaseError(error) ? 503 : 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string; fieldId: string } }
) {
  // CSRF protection
  const csrfToken = request.headers.get("x-csrf-token");
  if (!csrfToken || !(await verifyCsrfToken(csrfToken))) {
    return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
  }
  const session = await getSession();
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
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
    console.error("Delete field error::", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: getErrorMessage(error, "Gagal menghapus data.") },
      { status: isDatabaseError(error) ? 503 : 500 }
    );
  }
}
