import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/forms — semua form aktif dengan fields-nya (publik, no auth)
export async function GET() {
  try {
    const forms = await prisma.form.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      include: {
        fields: {
          orderBy: { sortOrder: "asc" },
          select: {
            id: true,
            fieldId: true,
            label: true,
            type: true,
            required: true,
            placeholder: true,
            helpText: true,
            options: true,
            sortOrder: true,
          },
        },
      },
    });

    // Parse options JSON string to array for each field
    const parsed = forms.map((form: { fields: { options: string }[] } & Record<string, unknown>) => ({
      ...form,
      fields: form.fields.map((field: { options: string }) => ({
        ...field,
        options: JSON.parse(field.options),
      })),
    }));

    return NextResponse.json({ forms: parsed });
  } catch (error) {
    console.error("Public forms fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
