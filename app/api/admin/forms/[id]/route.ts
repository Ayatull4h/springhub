import { NextResponse } from "next/server";
import { prisma, getErrorMessage, isDatabaseError } from "@/lib/prisma";
export const dynamic = "force-dynamic";
import { getSession } from "@/lib/auth";

function isAdmin(session: { userId: string; role: string } | null) {
  return session?.role === "admin";
}

// GET /api/admin/forms/[id] — detail form dengan fields
export async function GET(
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
      include: { fields: { orderBy: { sortOrder: "asc" } } },
    });
    if (!form) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }
    return NextResponse.json({ form });
  } catch (error) {
    console.error("Admin form fetch error:", error);
    return NextResponse.json(
      { error: getErrorMessage(error, "Terjadi kesalahan.") },
      { status: isDatabaseError(error) ? 503 : 500 }
    );
  }
}

// PUT /api/admin/forms/[id] — update form dan fields-nya
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await request.json();
    const { slug, title, description, pointsOnSubmit, contributionType, isActive, sortOrder, fields } = body;

    // Check slug uniqueness if changed
    if (slug) {
      const existing = await prisma.form.findFirst({
        where: { slug, NOT: { id: params.id } },
      });
      if (existing) {
        return NextResponse.json(
          { error: "A form with this slug already exists" },
          { status: 409 }
        );
      }
    }

    // Update form metadata
    await prisma.form.update({
      where: { id: params.id },
      data: {
        ...(slug !== undefined && { slug }),
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(pointsOnSubmit !== undefined && { pointsOnSubmit }),
        ...(contributionType !== undefined && { contributionType }),
        ...(isActive !== undefined && { isActive }),
        ...(sortOrder !== undefined && { sortOrder }),
      },
    });

    // Update fields if provided
    if (fields && Array.isArray(fields)) {
      // Delete existing fields
      await prisma.formField.deleteMany({
        where: { formId: params.id },
      });

      // Create new fields
      if (fields.length > 0) {
        await prisma.formField.createMany({
          data: fields.map(
            (f: {
              fieldId: string;
              label: string;
              type?: string;
              required?: boolean;
              placeholder?: string;
              helpText?: string;
              options?: string[];
            }, i: number) => ({
              formId: params.id,
              fieldId: f.fieldId,
              label: f.label,
              type: f.type || "text",
              required: f.required ?? false,
              placeholder: f.placeholder || "",
              helpText: f.helpText || "",
              options: JSON.stringify(f.options || []),
              sortOrder: i,
            })
          ),
        });
      }
    }

    // Return updated form with fields
    const updated = await prisma.form.findUnique({
      where: { id: params.id },
      include: { fields: { orderBy: { sortOrder: "asc" } } },
    });

    return NextResponse.json({ form: updated });
  } catch (error) {
    console.error("Admin form update error:", error);
    return NextResponse.json(
      { error: getErrorMessage(error, "Terjadi kesalahan.") },
      { status: isDatabaseError(error) ? 503 : 500 }
    );
  }
}

// DELETE /api/admin/forms/[id] — soft-delete (deactivate) atau hard-delete jika tidak ada reports
export async function DELETE(
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
      select: { id: true, slug: true, title: true },
    });

    if (!form) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    // Check if any reports reference this form
    const reportCount = await prisma.report.count({
      where: { formSlug: form.slug },
    });

    if (reportCount > 0) {
      // Soft-delete: deactivate instead of delete
      await prisma.form.update({
        where: { id: params.id },
        data: { isActive: false },
      });
      return NextResponse.json({
        success: true,
        softDelete: true,
        message: `Form "${form.title}" dinonaktifkan karena ada ${reportCount} laporan yang merujuk padanya.`,
      });
    }

    // Hard-delete: no reports referencing this form
    await prisma.form.delete({
      where: { id: params.id },
    });
    return NextResponse.json({ success: true, softDelete: false });
  } catch (error) {
    console.error("Admin form delete error:", error);
    return NextResponse.json(
      { error: getErrorMessage(error, "Terjadi kesalahan.") },
      { status: isDatabaseError(error) ? 503 : 500 }
    );
  }
}
