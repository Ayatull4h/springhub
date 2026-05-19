import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ user: null });
  }

  const profile = await prisma.profile.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      email: true,
      username: true,
      role: true,
      region: true,
      points: true,
      trustScore: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ user: profile });
}
