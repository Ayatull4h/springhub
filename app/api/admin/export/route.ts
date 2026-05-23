import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const url = new URL(request.url);
  const entity = url.searchParams.get("entity") || "users";

  try {
    let csv = "";
    let filename = "";

    switch (entity) {
      case "users": {
        const users = await prisma.profile.findMany({
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            username: true,
            email: true,
            phone: true,
            role: true,
            region: true,
            points: true,
            trustScore: true,
            createdAt: true,
          },
        });
        csv = [
          "ID,Username,Email,Phone,Role,Region,Points,TrustScore,CreatedAt",
          ...users.map((u: { id: string; username: string; email: string; phone: string; role: string; region: string; points: number; trustScore: number; createdAt: Date }) =>
            [
              u.id,
              u.username,
              u.email,
              u.phone,
              u.role,
              u.region,
              u.points,
              u.trustScore,
              u.createdAt.toISOString(),
            ].join(",")
          ),
        ].join("\n");
        filename = "springhub-users.csv";
        break;
      }

      case "reports": {
        const reports = await prisma.report.findMany({
          orderBy: { createdAt: "desc" },
          include: { user: { select: { username: true } } },
        });
        csv = [
          "ID,User,FormSlug,Status,PreciseLat,PreciseLng,SnappedLat,SnappedLng,ReviewedBy,CreatedAt",
          ...reports.map((r: { id: string; user: { username: string } | null; formSlug: string; status: string; preciseLat: number | null; preciseLng: number | null; snappedLat: number | null; snappedLng: number | null; reviewedById: string | null; createdAt: Date }) =>
            [
              r.id,
              r.user?.username || "guest",
              r.formSlug,
              r.status,
              r.preciseLat ?? "",
              r.preciseLng ?? "",
              r.snappedLat ?? "",
              r.snappedLng ?? "",
              r.reviewedById || "",
              r.createdAt.toISOString(),
            ].join(",")
          ),
        ].join("\n");
        filename = "springhub-reports.csv";
        break;
      }

      case "donations": {
        const donations = await prisma.donation.findMany({
          orderBy: { createdAt: "desc" },
          include: { user: { select: { username: true } } },
        });
        csv = [
          "ID,User,InvoiceID,Amount(Rp),Tier,DonorName,DonorEmail,Status,PaidAt,CreatedAt",
          ...donations.map((d: { id: string; user: { username: string } | null; invoiceId: string; amountIdr: number; tierId: string; donorName: string; donorEmail: string; status: string; paidAt: Date | null; createdAt: Date }) =>
            [
              d.id,
              d.user?.username || "anon",
              d.invoiceId,
              d.amountIdr,
              d.tierId,
              d.donorName,
              d.donorEmail,
              d.status,
              d.paidAt?.toISOString() || "",
              d.createdAt.toISOString(),
            ].join(",")
          ),
        ].join("\n");
        filename = "springhub-donations.csv";
        break;
      }

      case "projects": {
        const projects = await prisma.project.findMany({
          orderBy: { createdAt: "desc" },
          include: { user: { select: { username: true, email: true } } },
        });
        csv = [
          "ID,Title,Type,Status,Region,GoalAmount,RaisedAmount,ContactName,ContactEmail,ContactPhone,User,UserEmail,CreatedAt",
          ...projects.map((p: { id: string; title: string; typeId: string; status: string; region: string; goalAmount: number; raisedAmount: number; contactName: string; contactEmail: string; contactPhone: string; user: { username: string; email: string } | null; createdAt: Date }) =>
            [
              p.id,
              `"${p.title.replace(/"/g, '""')}"`,
              p.typeId,
              p.status,
              p.region,
              p.goalAmount,
              p.raisedAmount,
              p.contactName,
              p.contactEmail,
              p.contactPhone,
              p.user?.username || "",
              p.user?.email || "",
              p.createdAt.toISOString(),
            ].join(",")
          ),
        ].join("\n");
        filename = "springhub-projects.csv";
        break;
      }

      default:
        return NextResponse.json({ error: "Invalid entity" }, { status: 400 });
    }

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("GET /api/admin/export error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
