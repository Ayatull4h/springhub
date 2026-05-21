import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const donation = await prisma.treeDonation.update({
      where: { id: params.id },
      data: body,
    });
    return NextResponse.json({ success: true, donation });
  } catch {
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}
