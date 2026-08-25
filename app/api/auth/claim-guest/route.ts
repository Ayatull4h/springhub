import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getExistingGuestId } from "@/lib/guest";
import { verifyCsrfToken } from "@/lib/csrf";
import { prisma, getErrorMessage, isDatabaseError } from "@/lib/prisma";
import { apiLimiter } from "@/lib/rate-limit";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    // CSRF — state-changing endpoint
    const csrfToken = request.headers.get("x-csrf-token");
    if (!csrfToken || !(await verifyCsrfToken(csrfToken))) {
      return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
    }

    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const limitCheck = await apiLimiter.check(`claim-guest:${session.userId}`);
    if (!limitCheck.allowed) {
      return NextResponse.json(
        { error: "Terlalu banyak permintaan." },
        { status: 429 }
      );
    }

    const guestId = await getExistingGuestId();
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
  } catch (err) {
    console.error("[Claim Guest POST]", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { error: getErrorMessage(err, "Gagal klaim guest.") },
      { status: isDatabaseError(err) ? 503 : 500 }
    );
  }
}
