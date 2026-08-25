import { NextResponse } from "next/server";
import { prisma, getErrorMessage, isDatabaseError } from "@/lib/prisma";
export const dynamic = "force-dynamic";
import { getSession } from "@/lib/auth";
import { verifyCsrfToken } from "@/lib/csrf";
import { auditLog } from "@/lib/audit";

function isAdmin(session: { userId: string; role: string } | null) {
  return session?.role === "admin";
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
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
    const form = await prisma.form.findUnique({
      where: { id: (await params).id },
      include: { fields: { orderBy: { sortOrder: "desc" }, take: 1 } },
    });
    if (!form) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    const body = await request.json();
    const { fieldId, label, type, required, placeholder, helpText, options, sortOrder } = body;

    if (!fieldId || !label || !type) {
      return NextResponse.json(
        { error: "fieldId, label, and type are required" },
        { status: 400 }
      );
    }

    const existing = await prisma.formField.findUnique({
      where: { formId_fieldId: { formId: (await params).id, fieldId } },
    });
    if (existing) {
      return NextResponse.json(
        { error: `Field with id "${fieldId}" already exists in this form` },
        { status: 409 }
      );
    }

    const defaultSortOrder = (form.fields[0]?.sortOrder ?? -1) + 1;

    const field = await prisma.formField.create({
      data: {
        formId: (await params).id,
        fieldId,
        label,
        type: type || "text",
        required: required ?? false,
        placeholder: placeholder || "",
        helpText: helpText || "",
        options: JSON.stringify(options || []),
        sortOrder: sortOrder ?? defaultSortOrder,
      },
    });

    auditLog("post create field", "post create field id=" + (await params).id);
    return NextResponse.json({ field }, { status: 201 });
  } catch (error) {
    console.error("Create field error::", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: getErrorMessage(error, "Gagal menambah data.") },
      { status: isDatabaseError(error) ? 503 : 500 }
    );
  }
}
