import { NextResponse } from "next/server";
import { prisma, getErrorMessage, isDatabaseError } from "@/lib/prisma";
import { safeParseJson } from "@/lib/utils";
export const dynamic = "force-dynamic";
import { getOrSet } from "@/lib/cache";

// GET /api/forms — semua form aktif dengan fields-nya (publik, no auth)
export async function GET() {
  try {
    const forms = await getOrSet("forms", "active", async () => {
      const data = await prisma.form.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
        include: {
          fields: {
            orderBy: { sortOrder: "asc" },
            select: {
              id: true, fieldId: true, label: true, labelEn: true, type: true,
              required: true, placeholder: true, helpText: true,
              options: true, optionsEn: true, sortOrder: true,
            },
          },
          mapType: { select: { id: true, slug: true, name: true, icon: true } },
        },
      });

      return data.map((form: { fields: { options: string; optionsEn: string }[] } & Record<string, unknown>) => ({
        ...form,
        fields: form.fields.map((field: { options: string; optionsEn: string }) => ({
          ...field,
          options: safeParseJson(field.options),
          optionsEn: safeParseJson(field.optionsEn),
        })),
      }));
    }, 300);

    return NextResponse.json({ forms });
  } catch (error) {
    console.error("Public forms fetch error:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: getErrorMessage(error, "Terjadi kesalahan.") },
      { status: isDatabaseError(error) ? 503 : 500 }
    );
  }
}
