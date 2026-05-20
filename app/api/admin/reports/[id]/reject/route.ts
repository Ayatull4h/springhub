import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";
import { getSession } from "@/lib/auth";
import { updateTrustScore } from "@/lib/points";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json().catch(() => ({ note: "" }));

    const report = await prisma.report.findUnique({
      where: { id: params.id },
    });

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    if (report.status !== "pending") {
      return NextResponse.json({ error: "Report already reviewed" }, { status: 400 });
    }

    await prisma.report.update({
      where: { id: params.id },
      data: {
        status: "rejected",
        reviewedById: session.userId,
        reviewNote: body.note ?? "",
      },
    });

    if (report.userId) {
      await updateTrustScore(report.userId, false);

      await prisma.pointsLog.create({
        data: {
          userId: report.userId,
          reportId: params.id,
          amount: 0,
          reason: `Laporan ${report.formSlug} ditolak`,
          metadata: JSON.stringify({ status: "rejected" }),
        },
      });
    }

    return NextResponse.json({ success: true, status: "rejected" });
  } catch (error) {
    console.error("Reject error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
