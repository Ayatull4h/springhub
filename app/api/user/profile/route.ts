import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await prisma.profile.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      email: true,
      username: true,
      role: true,
      phone: true,
      region: true,
      points: true,
      trustScore: true,
      createdAt: true,
    },
  });

  if (!profile) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const reports = await prisma.report.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      formSlug: true,
      status: true,
      createdAt: true,
    },
  });

  const pointsLogs = await prisma.pointsLog.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      amount: true,
      reason: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ profile, reports, pointsLogs });
}

export async function PUT(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { username, phone, region } = body;

  const profile = await prisma.profile.update({
    where: { id: session.userId },
    data: {
      ...(username !== undefined && { username }),
      ...(phone !== undefined && { phone }),
      ...(region !== undefined && { region }),
    },
  });

  return NextResponse.json({
    success: true,
    user: {
      id: profile.id,
      username: profile.username,
      phone: profile.phone,
      region: profile.region,
    },
  });
}
