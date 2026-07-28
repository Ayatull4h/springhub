import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logError } from "@/lib/error-logger";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const firstOfMonth = new Date();
    firstOfMonth.setDate(1);
    firstOfMonth.setHours(0, 0, 0, 0);

    // ── Run ALL independent queries in parallel ──────────────────────
    // This cuts total wall-clock time from sum-of-sequential to max-of-parallel.
    const [
      totalReports,
      approvedReports,
      treeReports,
      trenchReports,
      reportsThisMonth,
      approvedThisMonth,
      treeThisMonth,
      trenchThisMonth,
      totalUsers,
      totalProjects,
      totalCoursesCompleted,
      totalDonations,
      restoredReports,
      seedlingReports,
      topVolunteers,
    ] = await Promise.all([
      // impactStats — total counts
      prisma.report.count({ where: { isActive: true } }),
      prisma.report.count({ where: { status: "approved", isActive: true } }),
      prisma.report.count({ where: { formSlug: "tree-planting", isActive: true } }),
      prisma.report.count({ where: { formSlug: "trench-development", isActive: true } }),

      // impactStats — this month counts
      prisma.report.count({ where: { createdAt: { gte: firstOfMonth }, isActive: true } }),
      prisma.report.count({ where: { createdAt: { gte: firstOfMonth }, status: "approved", isActive: true } }),
      prisma.report.count({ where: { createdAt: { gte: firstOfMonth }, formSlug: "tree-planting", isActive: true } }),
      prisma.report.count({ where: { createdAt: { gte: firstOfMonth }, formSlug: "trench-development", isActive: true } }),

      // monthlyProgress — user, project, course, donation
      prisma.profile.count(),
      prisma.project.count(),
      prisma.coursesProgress.count({ where: { completed: true } }),
      prisma.donation.aggregate({
        _sum: { amountIdr: true },
        where: { status: "paid" },
      }),

      // monthlyProgress — form-slug counts
      prisma.report.count({ where: { formSlug: "spring-restoration", isActive: true } }),
      prisma.report.count({ where: { formSlug: "seedling-stock", isActive: true } }),

      // topVolunteers
      prisma.profile.findMany({
        where: { role: { in: ["volunteer", "field_lead", "admin"] }, points: { gt: 0 } },
        orderBy: { points: "desc" },
        take: 5,
        select: { username: true, region: true, points: true },
      }),
    ]);

    // ── impactStats ──────────────────────────────────────────────────
    const impactStats = [
      {
        label: "Monitored Springs",
        value: totalReports,
        display: totalReports >= 500 ? `${totalReports}+` : String(totalReports),
        delta: `+${reportsThisMonth} this month`,
        icon: "droplet" as const,
        color: "text-blue-600",
      },
      {
        label: "Restored Springs",
        value: approvedReports,
        display: approvedReports >= 30 ? `${approvedReports}+` : String(approvedReports),
        delta: `+${approvedThisMonth} this month`,
        icon: "sparkles" as const,
        color: "text-emerald-600",
      },
      {
        label: "Endemic Trees Planted",
        value: treeReports,
        display: treeReports.toLocaleString("id-ID"),
        delta: `+${treeThisMonth} this month`,
        icon: "tree" as const,
        color: "text-green-600",
      },
      {
        label: "Rorak (Trench)",
        value: trenchReports,
        display: trenchReports.toLocaleString("id-ID"),
        delta: `+${trenchThisMonth} this month`,
        icon: "layers" as const,
        color: "text-amber-800",
      },
    ];

    // ── monthlyProgress ──────────────────────────────────────────────
    const monthlyProgress = [
      { label: "Tree Planting", value: treeThisMonth, total: Math.max(treeThisMonth * 4, 100), suffix: "now" },
      { label: "Spring Monitoring", value: reportsThisMonth, total: Math.max(reportsThisMonth * 4, 100), suffix: "now" },
      { label: "Spring Restoration", value: restoredReports, total: Math.max(restoredReports * 4, 30), suffix: "now" },
      { label: "Rorak (Trench)", value: trenchThisMonth, total: Math.max(trenchThisMonth * 4, 50), suffix: "now" },
      { label: "Seedling Stock", value: seedlingReports, total: Math.max(seedlingReports * 4, 100), suffix: "now" },
      { label: "Active Users", value: totalUsers, total: Math.max(totalUsers * 2, 200), suffix: "joined" },
      { label: "Projects Submitted", value: totalProjects, total: Math.max(totalProjects * 2, 15), suffix: "now" },
      { label: "Courses Completed", value: totalCoursesCompleted, total: Math.max(totalCoursesCompleted * 2, 100), suffix: "joined" },
      { label: "Total Donations (IDR)", value: totalDonations._sum.amountIdr || 0, total: Math.max((totalDonations._sum.amountIdr || 0) * 2, 50000000), suffix: "now" },
      { label: "Kawasan Terlindungi (Ha)", value: 0, total: 100, suffix: "now" },
    ];

    // ── topRegions ───────────────────────────────────────────────────
    // Instead of loading ALL reports + groupBy on JSON string (no index),
    // we query at most 500 recent active reports and extract region from
    // their JSON fieldData. This is a pragmatic trade-off: the "top 5"
    // regions will converge with just a few hundred reports.
    const recentReports = await prisma.report.findMany({
      where: { isActive: true },
      select: {
        fieldData: true,
        formSlug: true,
        spring: { select: { province: true, regency: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 500,
    });

    const regionMap = new Map<string, { reports: number; trees: number; trenches: number }>();

    for (const rpt of recentReports) {
      let region: string | null = null;

      // Prefer the spring's own province/regency fields (no parsing needed)
      if (rpt.spring?.province) {
        region = rpt.spring.province;
      } else {
        // Fallback: parse JSON fieldData
        try {
          const data = JSON.parse(rpt.fieldData);
          region = data.province || data.region || null;
        } catch {
          // ignore
        }
      }

      if (!region) region = "Unknown";

      const entry = regionMap.get(region) || { reports: 0, trees: 0, trenches: 0 };
      entry.reports += 1;
      if (rpt.formSlug === "tree-planting") entry.trees += 1;
      if (rpt.formSlug === "trench-development") entry.trenches += 1;
      regionMap.set(region, entry);
    }

    // Fallback: profiles.region if no report data
    if (regionMap.size <= 1) {
      const profilesByRegion = await prisma.profile.groupBy({
        by: ["region"],
        where: { region: { not: "" } },
        _count: { id: true },
      });
      for (const p of profilesByRegion) {
        regionMap.set(p.region, { reports: p._count.id, trees: 0, trenches: 0 });
      }
    }

    const topRegions = Array.from(regionMap.entries())
      .map(([name, data]) => ({
        rank: 0,
        name,
        detail: `${data.reports} springs · ${data.trees} trees · ${data.trenches} rorak`,
        totalReports: data.reports,
      }))
      .sort((a, b) => b.totalReports - a.totalReports)
      .slice(0, 5)
      .map((item, idx) => ({ ...item, rank: idx + 1 }));

    // ── topVolunteers ────────────────────────────────────────────────
    const topVolunteersFormatted = topVolunteers.map((v, idx) => ({
      rank: idx + 1,
      name: v.username || "Anonymous",
      region: v.region || "Unknown",
      points: v.points,
    }));

    return NextResponse.json({
      impactStats,
      monthlyProgress,
      topRegions,
      topVolunteers: topVolunteersFormatted,
    });
  } catch (err) {
    console.error("Dashboard API error:", err);
    await logError({
      message: "Dashboard API error",
      level: "error",
      source: "api",
      stack: err instanceof Error ? err.stack : "",
      metadata: { error: String(err) },
    }).catch(() => {});
    return NextResponse.json(
      { error: "Failed to load dashboard data" },
      { status: 500 }
    );
  }
}
