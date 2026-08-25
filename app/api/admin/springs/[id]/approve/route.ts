import { NextResponse } from "next/server";
import { getSession, isAdmin as checkAdmin } from "@/lib/auth";
import { prisma, getErrorMessage } from "@/lib/prisma";
import { verifyCsrfToken } from "@/lib/csrf";
import { auditLog } from "@/lib/audit";
export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const csrfToken = request.headers.get("x-csrf-token");
    if (!csrfToken || !(await verifyCsrfToken(csrfToken))) {
      return NextResponse.json({ error: "Invalid CSRF" }, { status: 403 });
    }

    const session = await getSession();
    if (!session || !(await checkAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const spring = await prisma.spring.findUnique({ where: { id: (await params).id } });
    if (!spring) {
      return NextResponse.json({ error: "Spring tidak ditemukan" }, { status: 404 });
    }

    await prisma.spring.update({
      where: { id: (await params).id },
      data: { status: "active" },
    });

    auditLog("spring approve", `Spring ${spring.name} disetujui`);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error, "Gagal menyetujui spring") },
      { status: 500 }
    );
  }
}
