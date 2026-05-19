import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getExistingGuestId } from "@/lib/guest";
import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";

export async function POST() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const guestId = getExistingGuestId();
  if (!guestId) {
    return NextResponse.json({ claimed: 0 });
  }

  const result = await prisma.report.updateMany({
    where: { guestId },
    data: { userId: session.userId, guestId: null },
  });

  await prisma.pointsLog.updateMany({
    where: { guestId },
    data: { userId: session.userId, guestId: null },
  });

  return NextResponse.json({ claimed: result.count });
}
