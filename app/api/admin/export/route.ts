import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma, getErrorMessage, isDatabaseError } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { buildPhotoUrl } from "@/lib/photo-url";


export const dynamic = "force-dynamic";

function escapeCsv(val: unknown): string {
  const s = String(val ?? "");
  if (s.includes(",") || s.includes('"') || s.includes("\n")) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function toCsv(rows: string[][], headers: string[]): string {
  return [headers.join(","), ...rows.map((r) => r.map(escapeCsv).join(","))].join("\n");
}

export async function GET(request: Request) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const url = new URL(request.url);
  const entity = url.searchParams.get("entity") || "users";
  const startDate = url.searchParams.get("startDate") || url.searchParams.get("from");
  const endDate = url.searchParams.get("endDate") || url.searchParams.get("to");
  const springId = url.searchParams.get("springId") || url.searchParams.get("id");
  const format = url.searchParams.get("format") || "csv";
  const notify = url.searchParams.get("notify") === "true";

  const dateFilter: Record<string, unknown> = {};
  if (startDate || endDate) {
    dateFilter.createdAt = {
      ...(startDate ? { gte: new Date(startDate) } : {}),
      ...(endDate ? { lt: new Date(endDate) } : {}),
    };
  }

  try {
    let csv = "";
    let filename = "";
      switch (entity) {
      case "users": {
        const users = await prisma.profile.findMany({
          where: { ...dateFilter },
          orderBy: { createdAt: "desc" },
          select: { id: true, username: true, email: true, phone: true, role: true, region: true, points: true, trustScore: true, createdAt: true },
        });
        csv = toCsv(
          users.map((u) => [u.id, u.username, u.email, u.phone, u.role, u.region, String(u.points), String(u.trustScore), u.createdAt.toISOString()]),
          ["ID", "Username", "Email", "Phone", "Role", "Region", "Points", "TrustScore", "CreatedAt"]
        );
        filename = `springhub-users-${startDate || "all"}.csv`;
        break;
      }

      case "reports": {
        const where: Record<string, unknown> = { ...dateFilter };
        if (springId) where.springId = springId;
        const reports = await prisma.report.findMany({
          where,
          orderBy: { createdAt: "desc" },
          include: { user: { select: { username: true } }, photos: { select: { id: true, storagePath: true, fieldId: true }, take: 10 } },
        });
        csv = toCsv(
          reports.map((r) => [r.id, r.user?.username || "guest", r.formSlug, r.status, String(r.preciseLat ?? ""), String(r.preciseLng ?? ""), String(r.snappedLat ?? ""), String(r.snappedLng ?? ""), r.reviewedById || "", r.createdAt.toISOString(), r.photos.map((p) => buildPhotoUrl(p.storagePath)).join("; ")]),
          ["ID", "User", "FormSlug", "Status", "PreciseLat", "PreciseLng", "SnappedLat", "SnappedLng", "ReviewedBy", "CreatedAt", "PhotoURLs"]
        );
        filename = `springhub-reports-${springId || startDate || "all"}.csv`;
        break;
      }

      case "spring": {
        const where: Record<string, unknown> = {};
        if (springId) where.id = springId;
        const springs = await prisma.spring.findMany({
          where,
          orderBy: { name: "asc" },
          include: {
            _count: { select: { reports: true } },
          },
        });
        csv = toCsv(
          springs.map((s) => [s.id, s.name, s.province, s.regency, String(s.healthScore ?? ""), s.healthStatus || "", s.createdAt.toISOString(), String(s._count.reports)]),
          ["ID", "Name", "Province", "Regency", "HealthScore", "HealthStatus", "CreatedAt", "ReportCount"]
        );
        filename = `springhub-springs-${springId || startDate || "all"}.csv`;
        break;
      }

      case "donations": {
        const donations = await prisma.donation.findMany({
          where: { ...dateFilter },
          orderBy: { createdAt: "desc" },
          include: { user: { select: { username: true } }, project: { select: { title: true } } },
        });
        csv = toCsv(
          donations.map((d) => [d.id, d.user?.username || "anon", d.invoiceId, String(d.amountIdr), d.tierId, d.donorName, d.donorEmail, d.status, d.paidAt?.toISOString() || "", d.createdAt.toISOString(), d.project?.title || ""]),
          ["ID", "User", "InvoiceID", "Amount(Rp)", "Tier", "DonorName", "DonorEmail", "Status", "PaidAt", "CreatedAt", "Project"]
        );
        filename = `springhub-donations-${startDate || "all"}.csv`;
        break;
      }

      case "projects": {
        const projects = await prisma.project.findMany({
          where: { ...dateFilter },
          orderBy: { createdAt: "desc" },
          include: { user: { select: { username: true, email: true } } },
        });
        csv = toCsv(
          projects.map((p) => [p.id, p.title, p.typeId, p.status, p.region, String(p.goalAmount), String(p.raisedAmount), p.contactName, p.contactEmail, p.contactPhone, p.user?.username || "", p.user?.email || "", p.createdAt.toISOString()]),
          ["ID", "Title", "Type", "Status", "Region", "GoalAmount", "RaisedAmount", "ContactName", "ContactEmail", "ContactPhone", "User", "UserEmail", "CreatedAt"]
        );
        filename = `springhub-projects-${startDate || "all"}.csv`;
        break;
      }

      case "feedback": {
        const feedback = await prisma.feedback.findMany({
          where: { ...dateFilter },
          orderBy: { createdAt: "desc" },
        });
        csv = toCsv(
          feedback.map((f) => [f.id, f.type, f.kritik, f.saran, f.bugDescription, f.status, f.userId || "", f.createdAt.toISOString()]),
          ["ID", "Type", "Kritik", "Saran", "BugDescription", "Status", "UserID", "CreatedAt"]
        );
        filename = `springhub-feedback-${startDate || "all"}.csv`;
        break;
      }

      case "points": {
        const logs = await prisma.pointsLog.findMany({
          where: { ...dateFilter },
          orderBy: { createdAt: "desc" },
          include: { user: { select: { username: true } } },
        });
        csv = toCsv(
          logs.map((l) => [l.id, l.user?.username || l.guestId || "unknown", String(l.amount), l.reason, l.reportId || "", l.createdAt.toISOString()]),
          ["ID", "User", "Amount", "Reason", "ReportID", "CreatedAt"]
        );
        filename = `springhub-points-${startDate || "all"}.csv`;
        break;
      }

      default:
        return NextResponse.json({ error: "Invalid entity. Valid: users, reports, donations, projects, feedback, points, photos, spring" }, { status: 400 });
    }

    if (notify && session?.userId) {
      const admin = await prisma.profile.findUnique({
        where: { id: session.userId },
        select: { email: true },
      });
      if (admin?.email) {
        sendEmail({ to: admin.email, subject: `Export ${entity} siap — ${filename}`, html: `<div>File <strong>${filename}</strong> siap di-download. ${csv.split("\n").length - 1} baris data.</div>` }).catch(() => {});
      }
    }

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "application/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json({ error: getErrorMessage(error, "Terjadi kesalahan.") }, { status: isDatabaseError(error) ? 503 : 500 });
  }
}
