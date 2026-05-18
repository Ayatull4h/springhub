import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const donations = await prisma.donation.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { id: true, username: true, email: true } },
      project: { select: { id: true, title: true } },
    },
  });

  return NextResponse.json({ donations });
}
