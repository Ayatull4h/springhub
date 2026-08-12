import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { prisma, getErrorMessage, isDatabaseError } from "@/lib/prisma";
import { hashPassword, deactivateUserSessions } from "@/lib/auth";
import { authLimiter } from "@/lib/rate-limit";
import { auditLog } from "@/lib/audit";

export const dynamic = "force-dynamic";

type PasswordResetTokenRow = {
  id: string;
  expiresAt: Date;
  usedAt: Date | null;
  profileId: string;
};

const pwdResetTokens = (prisma as unknown as {
  passwordResetToken: {
    findUnique(args: { where: { tokenHash: string } }): Promise<PasswordResetTokenRow | null>;
    update(args: { where: { id: string }; data: { usedAt: Date } }): Promise<unknown>;
  };
}).passwordResetToken;

function isValidPassword(password: string): boolean {
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password)
  );
}

export async function POST(request: Request) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json({ error: "Token dan password wajib diisi" }, { status: 400 });
    }

    if (!isValidPassword(password)) {
      return NextResponse.json({ error: "Password minimal 8 karakter, harus mengandung huruf besar, huruf kecil, dan angka" }, { status: 400 });
    }

    // Hanya hash token yang disimpan di DB — lookup pakai hash, bukan token asli.
    const tokenHash = createHash("sha256").update(token).digest("hex");
    const record = await pwdResetTokens.findUnique({ where: { tokenHash } });

    if (!record || record.usedAt !== null || record.expiresAt.getTime() < Date.now()) {
      return NextResponse.json({ error: "Token tidak valid atau sudah kadaluarsa" }, { status: 400 });
    }

    const limiter = await authLimiter.check(`reset-pw:${record.profileId}`);
    if (!limiter.allowed) {
      return NextResponse.json({ error: "Terlalu banyak permintaan. Silakan coba lagi nanti." }, { status: 429 });
    }

    const passwordHash = await hashPassword(password);

    // tandai single-use dulu, baru update password — token yang gagal tidak bisa dipakai ulang
    await pwdResetTokens.update({ where: { id: record.id }, data: { usedAt: new Date() } });
    await prisma.profile.update({
      where: { id: record.profileId },
      data: { passwordHash },
    });

    await deactivateUserSessions(record.profileId);

    auditLog("reset-password", `Password reset for user ${record.profileId}`);

    return NextResponse.json({ success: true, message: "Password berhasil diubah. Silakan login." });
  } catch (error) {
    console.error("Reset password error:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: getErrorMessage(error, "Gagal mereset password.") },
      { status: isDatabaseError(error) ? 503 : 500 }
    );
  }
}