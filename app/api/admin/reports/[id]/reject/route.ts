import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
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

  await prisma.report.update({
    where: { id: params.id },
    data: {
      status: "rejected",
      reviewedById: session.userId,
      reviewNote: body.note ?? "",
    },
  });

  return NextResponse.json({ success: true, status: "rejected" });
}
