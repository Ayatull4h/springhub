import { NextResponse } from "next/server";
import { prisma, getErrorMessage, isDatabaseError } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
export const dynamic = "force-dynamic";

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { role } = body;

    const validRoles = ["user", "volunteer", "admin"];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    const user = await prisma.profile.update({
      where: { id: params.id },
      data: { role },
      select: { id: true, username: true, role: true },
    });

    return NextResponse.json({ success: true, user });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update role" }, { status: 500 });
  }
}
