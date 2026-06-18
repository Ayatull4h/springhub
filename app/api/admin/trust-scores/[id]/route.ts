import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const { trustScore } = body;

  if (typeof trustScore !== "number" || trustScore < 0 || trustScore > 100) {
    return NextResponse.json(
      { error: "Trust score must be a number between 0 and 100" },
      { status: 400 }
    );
  }

  const profile = await prisma.profile.findUnique({
    where: { id: params.id },
  });

  if (!profile) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  await prisma.profile.update({
    where: { id: params.id },
    data: { trustScore },
  });

  await prisma.pointsLog.create({
    data: {
      userId: params.id,
      amount: 0,
      reason: "Trust score diubah oleh admin",
      metadata: JSON.stringify({
        action: "manual_set",
        oldScore: profile.trustScore,
        newScore: trustScore,
        adminId: session.userId,
      }),
    },
  });

  return NextResponse.json({ success: true, trustScore });
}
