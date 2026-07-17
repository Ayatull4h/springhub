import { NextResponse } from "next/server";
import { jwtVerify, type JWTPayload } from "jose";
import { prisma, getErrorMessage, isDatabaseError } from "@/lib/prisma";
import { getJwtSecret } from "@/lib/jwt";
import { hashPassword } from "@/lib/auth";
import { authLimiter } from "@/lib/rate-limit";
import { auditLog } from "@/lib/audit";

export const dynamic = "force-dynamic";

const SECRET = getJwtSecret();

export async function POST(request: Request) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json({ error: "Token dan password wajib diisi" }, { status: 400 });
    }

    if (password.length < 8 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
      return NextResponse.json({ error: "Password minimal 8 karakter, harus mengandung huruf besar, huruf kecil, dan angka" }, { status: 400 });
    }

    let payload: { email: string; userId: string };
    try {
      const { payload: p } = await jwtVerify(token, SECRET);
      if (!p || typeof p !== "object") {
        return NextResponse.json({ error: "Token tidak valid atau sudah kadaluarsa" }, { status: 400 });
      }
      const pData = p as Record<string, unknown>;
      if (typeof pData.email !== "string" || typeof pData.userId !== "string") {
        return NextResponse.json({ error: "Token tidak valid atau sudah kadaluarsa" }, { status: 400 });
      }
      payload = { email: pData.email, userId: pData.userId };
    } catch {
      return NextResponse.json({ error: "Token tidak valid atau sudah kadaluarsa" }, { status: 400 });
    }

    // Rate limit per userId
    const limiter = await authLimiter.check(`reset-pw:${payload.userId}`);
    if (!limiter.allowed) {
      return NextResponse.json({ error: "Terlalu banyak permintaan. Silakan coba lagi nanti." }, { status: 429 });
    }

    const passwordHash = await hashPassword(password);
    await prisma.profile.update({
      where: { id: payload.userId },
      data: { passwordHash },
    });

    auditLog("reset-password", `Password reset for user ${payload.userId}`);

    return NextResponse.json({ success: true, message: "Password berhasil diubah. Silakan login." });
  } catch (error) {
    console.error("Reset password error:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: getErrorMessage(error, "Gagal mereset password.") },
      { status: isDatabaseError(error) ? 503 : 500 }
    );
  }
}
