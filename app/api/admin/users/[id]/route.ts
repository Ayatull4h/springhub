import { NextResponse } from "next/server";
import { prisma, getErrorMessage, isDatabaseError } from "@/lib/prisma";
import { getSession, deactivateUserSessions } from "@/lib/auth";
import { verifyCsrfToken } from "@/lib/csrf";
import { auditLog } from "@/lib/audit";
export const dynamic = "force-dynamic";

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
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

  try {
    const body = await request.json();
    const { role } = body;

    const validRoles = ["volunteer", "field_lead", "admin"];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    const user = await prisma.profile.update({
      where: { id: params.id },
      data: { role },
      select: { id: true, username: true, role: true },
    });
    // Cabut semua sesi aktif user — role baru berlaku seketika (revocation ledger)
    await deactivateUserSessions(params.id);
    auditLog("put user", "put user");


    return NextResponse.json({ success: true, user });
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error, "Failed to update role") },
      { status: isDatabaseError(error) ? 503 : 500 }
    );
  }
}
