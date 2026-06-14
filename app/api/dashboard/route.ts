import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // ── impactStats ──────────────────────────────────────────────────────
    const totalReports = await prisma.report.count({ where: { isActive: true } });
    const approvedReports = await prisma.report.count({
      where: { status: "approved", isActive: true },
    });
    const treeReports = await prisma.report.count({
      where: { formSlug: "tree_planting", isActive: true },
    });
    const trenchReports = await prisma.report.count({
      where: { formSlug: "trench_development", isActive: true },
    });

    // This month stats for delta
    const firstOfMonth = new Date();
    firstOfMonth.setDate(1);
    firstOfMonth.setHours(0, 0, 0, 0);

    const reportsThisMonth = await prisma.report.count({
      where: { createdAt: { gte: firstOfMonth }, isActive: true },
    });
    const approvedThisMonth = await prisma.report.count({
      where: { createdAt: { gte: firstOfMonth }, status: "approved", isActive: true },
    });
    const treeThisMonth = await prisma.report.count({
      where: { createdAt: { gte: firstOfMonth }, formSlug: "tree_planting", isActive: true },
    });
    const trenchThisMonth = await prisma.report.count({
      where: { createdAt: { gte: firstOfMonth }, formSlug: "trench_development", isActive: true },
    });

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

    // ── monthlyProgress ──────────────────────────────────────────────────
    // Real monthly data
    const totalUsers = await prisma.profile.count();
    const totalProjects = await prisma.project.count();
    const totalCoursesCompleted = await prisma.coursesProgress.count({
      where: { completed: true },
    });
    const totalDonations = await prisma.donation.aggregate({
      _sum: { amountIdr: true },
      where: { status: "paid" },
    });
    const restoredReports = await prisma.report.count({
      where: { formSlug: "spring_restoration", isActive: true },
    });
    const seedlingReports = await prisma.report.count({
      where: { formSlug: "seedling_stock", isActive: true },
    });

    // Use 25% growth heuristic for "total" values (this month count x 4 for estimated annual)
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
      { label: "Kawasan Terlindungi (Ha)", value: 0, total: 100, suffix: "now" }, // Not tracked yet
    ];

    // ── topRegions ───────────────────────────────────────────────────────
    const reportsByRegion = await prisma.report.groupBy({
      by: ["fieldData"],
      where: { isActive: true },
    });

    // Parse fieldData JSON and extract region/province info
    const regionMap = new Map<string, { reports: number; trees: number; trenches: number }>();

    const allReports = await prisma.report.findMany({
      where: { isActive: true },
      select: {
        fieldData: true,
        formSlug: true,
      },
    });

    for (const rpt of allReports) {
      try {
        const data = JSON.parse(rpt.fieldData);
        const region = data.province || data.region || "Unknown";
        const entry = regionMap.get(region) || { reports: 0, trees: 0, trenches: 0 };
        entry.reports += 1;
        if (rpt.formSlug === "tree_planting") entry.trees += 1;
        if (rpt.formSlug === "trench_development") entry.trenches += 1;
        regionMap.set(region, entry);
      } catch {
        // Skip invalid JSON
      }
    }

    // Fallback to profiles.region if no report data
    if (regionMap.size === 0) {
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

    // ── topVolunteers ────────────────────────────────────────────────────
    const volunteers = await prisma.profile.findMany({
      where: {
        role: { in: ["volunteer", "admin"] },
        points: { gt: 0 },
      },
      orderBy: { points: "desc" },
      take: 5,
      select: {
        username: true,
        region: true,
        points: true,
      },
    });

    const topVolunteers = volunteers.map((v, idx) => ({
      rank: idx + 1,
      name: v.username || "Anonymous",
      region: v.region || "Unknown",
      points: v.points,
    }));

    return NextResponse.json({
      impactStats,
      monthlyProgress,
      topRegions,
      topVolunteers,
    });
  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json(
      { error: "Failed to load dashboard data" },
      { status: 500 }
    );
  }
}
