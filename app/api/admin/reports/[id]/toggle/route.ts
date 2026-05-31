import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const report = await prisma.report.findUnique({ where: { id: params.id } });
    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    const updated = await prisma.report.update({
      where: { id: params.id },
      data: { isActive: !report.isActive },
    });

    return NextResponse.json({ isActive: updated.isActive });
  } catch (error) {
    console.error("Toggle report error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
