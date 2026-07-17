import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma, getErrorMessage } from "@/lib/prisma";
import { verifyCsrfToken } from "@/lib/csrf";
export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const csrfToken = request.headers.get("x-csrf-token");
    if (!csrfToken || !(await verifyCsrfToken(csrfToken))) {
      return NextResponse.json({ error: "Invalid CSRF" }, { status: 403 });
    }

    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: "Harus login" }, { status: 401 });
    }

    const body = await request.json();
    const requestId = body.requestId;

    if (!requestId) {
      return NextResponse.json({ error: "requestId wajib diisi" }, { status: 400 });
    }

    const seedReq = await prisma.seedlingRequest.findUnique({
      where: { id: requestId },
    });

    if (!seedReq) {
      return NextResponse.json({ error: "Permintaan tidak ditemukan" }, { status: 404 });
    }

    if (seedReq.ownerId !== session.userId) {
      return NextResponse.json({ error: "Hanya pemilik yang bisa setujui" }, { status: 403 });
    }

    if (seedReq.status !== "admin_approved") {
      return NextResponse.json(
        { error: "Status permintaan bukan 'admin_approved'" },
        { status: 400 }
      );
    }

    await prisma.seedlingRequest.update({
      where: { id: requestId },
      data: { status: "owner_approved" },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error, "Gagal menyetujui permintaan") },
      { status: 500 }
    );
  }
}
