import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma, getErrorMessage } from "@/lib/prisma";
import { verifyCsrfToken } from "@/lib/csrf";
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

    // Hanya peminta yang bisa klik Terima
    if (seedReq.requesterId !== session.userId) {
      return NextResponse.json({ error: "Hanya peminta yang bisa konfirmasi" }, { status: 403 });
    }

    if (seedReq.status === "completed" || seedReq.status === "rejected" || seedReq.status === "cancelled") {
      return NextResponse.json(
        { error: "Permintaan sudah selesai atau dibatalkan" },
        { status: 400 }
      );
    }

    // Kurangi stok
    await prisma.$transaction([
      prisma.seedling.update({
        where: { id: seedReq.seedlingId },
        data: { stock: { decrement: seedReq.quantity } },
      }),
      prisma.seedlingRequest.update({
        where: { id: requestId },
        data: { status: "completed" },
      }),
    ]);

    // Kalau stok habis, update status seedling
    const seedling = await prisma.seedling.findUnique({
      where: { id: seedReq.seedlingId },
    });
    if (seedling && seedling.stock <= 0) {
      await prisma.seedling.update({
        where: { id: seedReq.seedlingId },
        data: { status: "exhausted" },
      });
    }

    // Notif ke pemilik: "Transaksi selesai!"
    try {
      await prisma.notification.create({
        data: {
          userId: seedReq.ownerId,
          type: "seedling-completed",
          title: "Transaksi bibit selesai!",
          body: `Bibit sudah diterima. Stok berkurang ${seedReq.quantity}.`,
          link: "/seedlings",
        },
      });
    } catch (e) { console.warn("[Seedling] Notif error:", e); }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error, "Gagal konfirmasi penerimaan") },
      { status: 500 }
    );
  }
}
