import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma, getErrorMessage } from "@/lib/prisma";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: "Harus login" }, { status: 401 });
    }

    // Cari request yang statusnya owner_approved, given, atau completed
    // dan requesternya adalah user yang login
    const request = await prisma.seedlingRequest.findFirst({
      where: {
        seedlingId: params.id,
        requesterId: session.userId,
        status: { in: ["owner_approved", "given", "completed"] },
      },
      select: { id: true, status: true },
    });

    if (!request) {
      return NextResponse.json(
        { error: "Kontak pemilik hanya bisa dilihat setelah permintaan disetujui pemilik" },
        { status: 403 }
      );
    }

    // Ambil nomor HP pemilik
    const seedling = await prisma.seedling.findUnique({
      where: { id: params.id },
      select: {
        userId: true,
        user: { select: { phone: true, username: true } },
      },
    });

    if (!seedling?.user?.phone) {
      return NextResponse.json({ error: "Pemilik belum daftarin nomor kontak" }, { status: 404 });
    }

    const waNumber = seedling.user.phone.replace(/[^0-9]/g, "");
    return NextResponse.json({
      phone: seedling.user.phone,
      waLink: `https://wa.me/${waNumber}`,
      ownerName: seedling.user.username,
    });
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error, "Gagal mengambil kontak") },
      { status: 500 }
    );
  }
}
