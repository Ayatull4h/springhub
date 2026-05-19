import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { status, note } = body;

    const validStatuses = ["under_review", "approved", "rejected", "completed"];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be one of: " + validStatuses.join(", ") },
        { status: 400 }
      );
    }

    const project = await prisma.project.update({
      where: { id: params.id },
      data: { status },
    });

    return NextResponse.json({ success: true, project });
  } catch (error) {
    console.error("PATCH /api/admin/projects/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
