import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma, getErrorMessage, isDatabaseError } from "@/lib/prisma";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const url = new URL(request.url);
    const statusFilter = url.searchParams.get("status") || "all";
    const clusterMode = url.searchParams.get("cluster") === "1";
    const limitParam = url.searchParams.get("limit") || url.searchParams.get("per_page") || "50";
    const pageParam = url.searchParams.get("page") || "1";
    const limit = Math.min(Math.max(parseInt(limitParam, 10) || 50, 1), 200);
    const page = Math.max(parseInt(pageParam, 10) || 1, 1);
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { springId: null };
    if (statusFilter !== "all" && ["pending", "approved", "rejected"].includes(statusFilter)) {
      where.status = statusFilter;
    }

    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip,
        include: {
          user: { select: { id: true, username: true, email: true } },
          reviewedBy: { select: { username: true } },
          form: { select: { slug: true, title: true, isActive: true } },
          _count: { select: { photos: true } },
        },
      }),
      prisma.report.count({ where }),
    ]);

    const mapped = reports.map((r) => ({
      id: r.id,
      formSlug: r.formSlug,
      status: r.status,
      isActive: r.isActive,
      isDummy: r.isDummy,
      fieldData: typeof r.fieldData === "string" ? r.fieldData : JSON.stringify(r.fieldData ?? {}),
      preciseLat: r.preciseLat,
      preciseLng: r.preciseLng,
      snappedLat: r.snappedLat,
      snappedLng: r.snappedLng,
      createdAt: r.createdAt,
      formTitle: r.form?.title ?? null,
      photoCount: r._count.photos,
      submitter: r.user
        ? { type: "user", id: r.user.id, name: r.user.username, email: r.user.email }
        : { type: "guest", id: r.guestId, name: `Guest (${r.guestId?.slice(0, 8)}...)`, email: null },
    }));

    if (clusterMode) {
      const clusters: Array<{
        key: string;
        lat: number | null;
        lng: number | null;
        count: number;
        reports: typeof mapped;
      }> = [];
      const map = new Map<string, typeof mapped>();
      for (const r of mapped) {
        if (r.snappedLat === null || r.snappedLng === null) continue;
        const lat = Math.round(r.snappedLat * 1000) / 1000;
        const lng = Math.round(r.snappedLng * 1000) / 1000;
        const key = `${lat.toFixed(3)}_${lng.toFixed(3)}`;
        if (!map.has(key)) {
          map.set(key, []);
          clusters.push({ key, lat, lng, count: 0, reports: [] });
        }
        const cluster = clusters.find((c) => c.key === key)!;
        cluster.reports.push(r);
        cluster.count += 1;
      }
      clusters.sort((a, b) => b.count - a.count);
      return NextResponse.json({
        clusters,
        total,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      });
    }

    return NextResponse.json({
      reports: mapped,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Admin orphan reports GET error:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: getErrorMessage(error, "Gagal memuat laporan yatim.") },
      { status: isDatabaseError(error) ? 503 : 500 }
    );
  }
}