import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const users = await prisma.profile.findMany({
    orderBy: { trustScore: "asc" },
    select: {
      id: true,
      email: true,
      username: true,
      role: true,
      region: true,
      points: true,
      trustScore: true,
      createdAt: true,
      _count: {
        select: {
          reports: { where: { status: "rejected" } },
        },
      },
    },
  });

  return NextResponse.json({ users });
}
