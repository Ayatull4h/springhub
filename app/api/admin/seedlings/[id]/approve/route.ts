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

    const seedling = await prisma.seedling.findUnique({
      where: { id: (await params).id },
    });

    if (!seedling) {
      return NextResponse.json({ error: "Bibit tidak ditemukan" }, { status: 404 });
    }

    if (seedling.status !== "pending") {
      return NextResponse.json(
        { error: "Status bibit bukan 'pending'" },
        { status: 400 }
      );
    }

    await prisma.seedling.update({
      where: { id: (await params).id },
      data: { status: "active" },
    });

    auditLog("seedling approve", `Bibit ${seedling.species} disetujui`);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error, "Gagal menyetujui bibit") },
      { status: 500 }
    );
  }
}
