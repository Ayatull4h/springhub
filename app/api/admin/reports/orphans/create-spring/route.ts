import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { verifyCsrfToken } from "@/lib/csrf";
import { auditLog } from "@/lib/audit";
import { prisma, getErrorMessage, isDatabaseError } from "@/lib/prisma";
export const dynamic = "force-dynamic";

const MAX_BATCH = 200;

const typeSlugCandidates: Record<string, string[]> = {
  "spring-monitoring": ["spring"],
  "spring-restoration": ["conservation", "spring"],
  "trench-development": ["trench"],
  "tree-planting": ["tree-planting"],
  "seedling-stock": ["seedling", "spring"],
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "mata-air";
}

function parseFieldData(raw: string | null): Record<string, unknown> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed !== null ? (parsed as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

export async function POST(request: Request) {
  try {
    const csrfToken = request.headers.get("x-csrf-token");
    if (!csrfToken || !(await verifyCsrfToken(csrfToken))) {
      return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
    }

    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json().catch(() => null);
    const reportIds: string[] = Array.isArray(body?.reportIds) ? body.reportIds.filter((id: unknown) => typeof id === "string" && id.length > 0) : [];
    const name = typeof body?.name === "string" && body.name.trim() ? body.name.trim() : "";
    const province = typeof body?.province === "string" ? body.province.trim() : "";
    const regency = typeof body?.regency === "string" ? body.regency.trim() : "";

    if (reportIds.length === 0) {
      return NextResponse.json({ error: "Pilih minimal satu laporan." }, { status: 400 });
    }
    if (reportIds.length > MAX_BATCH) {
      return NextResponse.json({ error: `Maksimal ${MAX_BATCH} laporan per batch.` }, { status: 400 });
    }

    const reports = await prisma.report.findMany({
      where: { id: { in: reportIds }, springId: null },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        formSlug: true,
        fieldData: true,
        snappedLat: true,
        snappedLng: true,
        preciseLat: true,
        preciseLng: true,
      },
    });

    if (reports.length === 0) {
      return NextResponse.json({ error: "Laporan tidak ditemukan atau sudah ter-link ke spring lain." }, { status: 404 });
    }

    const first = reports[0];
    const snappedLat = first.snappedLat ?? first.preciseLat;
    const snappedLng = first.snappedLng ?? first.preciseLng;
    if (snappedLat === null || snappedLng === null) {
      return NextResponse.json({ error: "Laporan terpilih tidak memiliki koordinat." }, { status: 400 });
    }

    const fieldData = parseFieldData(first.fieldData);
    const springName =
      name ||
      (typeof fieldData?.spring_name === "string" && fieldData.spring_name.trim()) ||
      (typeof fieldData?.B1_nama === "string" && fieldData.B1_nama.trim()) ||
      (typeof fieldData?.A_kegiatan === "string" && fieldData.A_kegiatan.trim()) ||
      "Mata Air";
    const springProvince =
      province ||
      (typeof fieldData?.A_provinsi === "string" ? fieldData.A_provinsi : "") ||
      (typeof fieldData?.province === "string" ? fieldData.province : "") ||
      "";
    const springRegency = regency || (typeof fieldData?.regency === "string" ? fieldData.regency : "") || "";

    const spring = await prisma.spring.create({
      data: {
        name: springName.slice(0, 200),
        snappedLat,
        snappedLng,
        province: springProvince.slice(0, 100),
        regency: springRegency.slice(0, 100),
        status: "active",
        isDummy: false,
      },
    });

    const result = await prisma.report.updateMany({
      where: { id: { in: reportIds }, springId: null },
      data: { springId: spring.id },
    });

    let mapPointCreated = false;
    let mapPointId: string | null = null;
    const candidates = typeSlugCandidates[first.formSlug] || [];
    if (candidates.length > 0) {
      try {
        const type = await prisma.mapPointType.findFirst({
          where: { slug: { in: candidates }, isActive: true },
          select: { id: true, slug: true },
          orderBy: { sortOrder: "asc" },
        });
        if (type) {
          const mapPoint = await prisma.mapPoint.create({
            data: {
              typeId: type.id,
              name: springName.slice(0, 200),
              slug: `${slugify(springName)}-${Date.now().toString(36)}`,
              snappedLat,
              snappedLng,
              province: springProvince.slice(0, 100),
              regency: springRegency.slice(0, 100),
              isActive: true,
            },
          });
          mapPointId = mapPoint.id;
          mapPointCreated = true;
          await prisma.report.updateMany({
            where: { id: { in: reportIds }, springId: spring.id },
            data: { mapPointId: mapPoint.id },
          });
        }
      } catch (e) {
        console.warn("[Orphan create-spring] MapPoint creation skipped:", e instanceof Error ? e.message : e);
      }
    }

    auditLog("orphan-create-spring", `Created spring "${spring.name}" (${spring.id}) from ${result.count} orphan reports`, {
      reportIds: reportIds.slice(0, 20),
      springId: spring.id,
      mapPointCreated,
    });

    return NextResponse.json({
      success: true,
      springId: spring.id,
      springName: spring.name,
      count: result.count,
      mapPointCreated,
      mapPointId,
    });
  } catch (error) {
    console.error("Admin orphan create-spring POST error:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: getErrorMessage(error, "Gagal membuat spring dari laporan.") },
      { status: isDatabaseError(error) ? 503 : 500 }
    );
  }
}