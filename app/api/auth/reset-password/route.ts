import { NextResponse } from "next/server";
import { jwtVerify, type JWTPayload } from "jose";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";

export const dynamic = "force-dynamic";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "springhub-dev-secret-key-change-in-production"
);

export async function POST(request: Request) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json({ error: "Token dan password wajib diisi" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password minimal 6 karakter" }, { status: 400 });
    }

    let payload: { email: string; userId: string };
    try {
      const { payload: p } = await jwtVerify(token, SECRET);
      payload = p as unknown as { email: string; userId: string };
    } catch {
      return NextResponse.json({ error: "Token tidak valid atau sudah kadaluarsa" }, { status: 400 });
    }

    const passwordHash = await hashPassword(password);
    await prisma.profile.update({
      where: { id: payload.userId },
      data: { passwordHash },
    });

    return NextResponse.json({ success: true, message: "Password berhasil diubah. Silakan login." });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
