import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";
import { getSession } from "@/lib/auth";

function isAdmin(session: { userId: string; role: string } | null) {
  return session?.role === "admin";
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const form = await prisma.form.findUnique({
      where: { id: params.id },
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
      where: { formId_fieldId: { formId: params.id, fieldId } },
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
        formId: params.id,
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

    return NextResponse.json({ field }, { status: 201 });
  } catch (error) {
    console.error("Create field error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
