import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ error: "Email tidak valid" }, { status: 400 });
    }

    // Cek duplicate (case insensitive)
    const existing = await prisma.profile.findFirst({
      where: { email: email.toLowerCase() },
    });

    // Simpan subscriber — kalau belum ada di DB, catat aja
    // Karena gak ada tabel subscriber, kita simpan di PointsLog dengan reason "newsletter"
    const existingSub = await prisma.pointsLog.findFirst({
      where: { reason: "newsletter", metadata: { contains: email.toLowerCase() } },
    });

    if (existingSub) {
      return NextResponse.json({ success: true, message: "Sudah terdaftar" });
    }

    // Simpan sebagai pointsLog khusus (sebagai temporary subscriber store)
    // Nanti bisa migrasi ke tabel subscribers sendiri
    await prisma.pointsLog.create({
      data: {
        amount: 0,
        reason: "newsletter",
        metadata: JSON.stringify({ email: email.toLowerCase(), subscribedAt: new Date().toISOString() }),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Newsletter error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
