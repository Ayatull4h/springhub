import { NextResponse } from "next/server";
import { prisma, getErrorMessage, isDatabaseError } from "@/lib/prisma";
import { safeParseJson } from "@/lib/utils";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const form = await prisma.form.findUnique({
      where: { slug: params.slug },
      include: {
        fields: {
          orderBy: { sortOrder: "asc" },
          select: {
            id: true,
            fieldId: true,
            label: true,
            labelEn: true,
            type: true,
            required: true,
            placeholder: true,
            helpText: true,
            options: true,
            optionsEn: true,
            sortOrder: true,
          },
        },
      },
    });

    if (!form || !form.isActive) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    // Parse options JSON string to array for each field
    const parsed = {
      ...form,
      fields: form.fields.map((field: { options: string; optionsEn: string }) => ({
        ...field,
        options: safeParseJson(field.options),
        optionsEn: safeParseJson(field.optionsEn),
      })),
    };

    return NextResponse.json({ form: parsed });
  } catch (error) {
    console.error("Form fetch error:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: getErrorMessage(error, "Terjadi kesalahan.") },
      { status: isDatabaseError(error) ? 503 : 500 }
    );
  }
}
