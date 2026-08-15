import { NextResponse } from "next/server";
import { getSession, isAdmin as checkAdmin } from "@/lib/auth";
import { prisma, getErrorMessage } from "@/lib/prisma";
import { verifyCsrfToken } from "@/lib/csrf";
import { auditLog } from "@/lib/audit";
export const dynamic = "force-dynamic";

/**
 * POST /api/admin/seedlings/[id]/approve-request
 * Admin menyetujui permintaan bibit (seedlingRequest) → status completed,
 * stok dikurangi, notifikasi dikirim ke peminta.
 * Diperlukan karena halaman admin/seedlings/requests memanggil endpoint ini
 * (sebelumnya 404 — route tidak pernah dibuat setelah refactor alur request).
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // CSRF
    const csrfToken = request.headers.get("x-csrf-token");
    if (!csrfToken || !(await verifyCsrfToken(csrfToken))) {
      return NextResponse.json({ error: "Invalid CSRF" }, { status: 403 });
    }

    const session = await getSession();
    if (!session || !(await checkAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
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

    // Pastikan request milik seedling yang dimaksud
    if (seedReq.seedlingId !== params.id) {
      return NextResponse.json({ error: "Permintaan tidak cocok dengan bibit" }, { status: 400 });
    }

    if (seedReq.status === "completed" || seedReq.status === "rejected" || seedReq.status === "cancelled") {
      return NextResponse.json(
        { error: "Permintaan sudah selesai atau dibatalkan" },
        { status: 400 }
      );
    }

    // Kurangi stok + tandai selesai (transaksi atomik)
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

    // Notif ke peminta
    try {
      await prisma.notification.create({
        data: {
          userId: seedReq.requesterId,
          type: "seedling-request",
          title: "Permintaan bibit disetujui!",
          body: `Permintaan ${seedReq.quantity} bibit ${seedling?.species || ""} telah disetujui admin. Hubungi pemilik untuk pengambilan.`,
          link: "/seedlings",
        },
      });
    } catch (e) { console.warn("[Seedling] Notif error:", e); }

    auditLog("seedling request approve", `Request ${requestId} disetujui admin`);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Admin seedling request approve error:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: getErrorMessage(error, "Gagal menyetujui permintaan") },
      { status: 500 }
    );
  }
}
