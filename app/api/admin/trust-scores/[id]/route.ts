import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma, getErrorMessage, isDatabaseError } from "@/lib/prisma";
import { verifyCsrfToken } from "@/lib/csrf";
import { auditLog } from "@/lib/audit";
export const dynamic = "force-dynamic";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // CSRF protection
  const csrfToken = request.headers.get("x-csrf-token");
  if (!csrfToken || !(await verifyCsrfToken(csrfToken))) {
    return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
  }
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
    where: { id: (await params).id },
  });

  if (!profile) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  await prisma.profile.update({
    where: { id: (await params).id },
    data: { trustScore },
  });

  await prisma.pointsLog.create({
    data: {
      userId: (await params).id,
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
  auditLog("put trustScore", "put trustScore");


  return NextResponse.json({ success: true, trustScore });
}
