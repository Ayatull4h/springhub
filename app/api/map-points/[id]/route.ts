import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildPhotoUrl } from "@/lib/photo-url";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const point = await prisma.mapPoint.findUnique({
      where: { id },
      include: {
        type: { select: { id: true, slug: true, name: true, icon: true } },
        category: { select: { id: true, slug: true, name: true, color: true } },
        reports: {
          where: { status: "approved" },
          include: {
            photos: { orderBy: { createdAt: "asc" } },
            user: { select: { username: true } },
            form: { select: { title: true, slug: true } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!point) {
      return NextResponse.json({ error: "Titik tidak ditemukan" }, { status: 404 });
    }

    // Attach photo URLs — TANPA fieldData mentah (PII: nama, WA, koordinat presisi)
    const reportsWithPhotos = (point.reports as Array<Record<string, unknown>>).map((r: Record<string, unknown>) => {
      // Hanya ambil field non-PII dari fieldData (lokasi & data survei publik)
      let safeFieldData: Record<string, unknown> = {};
      try {
        const raw = typeof r.fieldData === "string" ? JSON.parse(r.fieldData) : (r.fieldData as Record<string, unknown>);
        for (const [k, v] of Object.entries(raw || {})) {
          const kl = k.toLowerCase();
          if (kl.startsWith("a_") || kl.includes("nama") || kl.includes("wa") || kl.includes("email") || kl.includes("no_hp") || kl.includes("hp")) continue;
          if (kl.includes("lat") || kl.includes("lng") || kl.includes("lon")) continue;
          safeFieldData[k] = v;
        }
      } catch {}
      return {
        id: r.id as string,
        formSlug: r.formSlug as string,
        formTitle: ((r.form as Record<string, string>)?.title || "") as string,
        fieldData: JSON.stringify(safeFieldData),
        status: r.status as string,
        user: r.user as { username: string } | null,
        createdAt: r.createdAt as Date,
        photos: ((r.photos as Array<Record<string, unknown>>) || []).map((p: Record<string, unknown>) => ({
          id: p.id as string,
          fieldId: p.fieldId as string,
          url: buildPhotoUrl(p.storagePath as string),
          width: p.width as number,
          height: p.height as number,
        })),
      };
    });

    const allPhotos = reportsWithPhotos.flatMap((r: { photos: Array<Record<string, unknown>> }) => r.photos);

    return NextResponse.json({
      point: {
        id: point.id,
        name: point.name,
        slug: point.slug,
        type: point.type,
        category: point.category,
        province: point.province,
        regency: point.regency,
        village: point.village,
        subdistrict: point.subdistrict,
        description: point.description,
        snappedLat: point.snappedLat,
        snappedLng: point.snappedLng,
        createdAt: point.createdAt,
        reportCount: reportsWithPhotos.length,
        photoCount: allPhotos.length,
        reports: reportsWithPhotos,
        allPhotos,
      },
    });
  } catch (error) {
    console.error("GET /api/map-points/[id] error:", error);
    return NextResponse.json({ error: "Gagal memuat detail titik" }, { status: 500 });
  }
}
