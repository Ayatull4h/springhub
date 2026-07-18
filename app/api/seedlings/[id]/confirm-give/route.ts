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

    // Hanya pemilik yang bisa klik Selesai
    if (seedReq.ownerId !== session.userId) {
      return NextResponse.json({ error: "Hanya pemilik yang bisa konfirmasi" }, { status: 403 });
    }

    if (seedReq.status !== "owner_approved") {
      return NextResponse.json(
        { error: "Status permintaan tidak sesuai" },
        { status: 400 }
      );
    }

    await prisma.seedlingRequest.update({
      where: { id: requestId },
      data: { status: "given" },
    });

    // Notif ke peminta: "Ayo ambil! Pemilik udah ngasih bibit"
    try {
      await prisma.notification.create({
        data: {
          userId: seedReq.requesterId,
          type: "seedling-ready",
          title: "Bibit siap diambil!",
          body: "Pemilik sudah konfirmasi memberikan bibit. Klik Terima untuk menyelesaikan transaksi.",
          link: "/seedlings",
        },
      });
    } catch (e) { console.warn("[Seedling] Notif error:", e); }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error, "Gagal konfirmasi") },
      { status: 500 }
    );
  }
}
