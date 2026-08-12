import { NextResponse } from "next/server";
import { randomBytes, createHash } from "crypto";
import { prisma, getErrorMessage, isDatabaseError } from "@/lib/prisma";
import { sendEmail, buildResetPasswordEmail } from "@/lib/email";
import { authLimiter } from "@/lib/rate-limit";
import { auditLog } from "@/lib/audit";
import { getClientIp } from "@/lib/auth";

export const dynamic = "force-dynamic";

const TOKEN_TTL_MIN = 30;

type PasswordResetTokenRow = {
  id: string;
  expiresAt: Date;
  usedAt: Date | null;
  profileId: string;
};

const pwdResetTokens = (prisma as unknown as {
  passwordResetToken: {
    create(args: { data: { tokenHash: string; expiresAt: Date; profileId: string } }): Promise<{ id: string }>;
    findUnique(args: { where: { tokenHash: string } }): Promise<PasswordResetTokenRow | null>;
  };
}).passwordResetToken;

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    if (!email) {
      return NextResponse.json({ error: "Email wajib diisi" }, { status: 400 });
    }

    // Always return the same message to prevent email enumeration
    const genericMessage = "Jika email terdaftar, link reset telah dikirim.";

    const profile = await prisma.profile.findUnique({ where: { email } });
    if (!profile) {
      return NextResponse.json({ success: true, message: genericMessage });
    }

    const emailLimiter = await authLimiter.check(`forgot-pw:${email}`);
    if (!emailLimiter.allowed) {
      return NextResponse.json({ error: "Terlalu banyak permintaan. Silakan coba lagi nanti." }, { status: 429 });
    }
    const ipLimiter = await authLimiter.check(`forgot-pw-ip:${getClientIp(request)}`);
    if (!ipLimiter.allowed) {
      return NextResponse.json({ error: "Terlalu banyak permintaan. Silakan coba lagi nanti." }, { status: 429 });
    }

    const token = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(token).digest("hex");
    await pwdResetTokens.create({
      data: {
        tokenHash,
        expiresAt: new Date(Date.now() + TOKEN_TTL_MIN * 60_000),
        profileId: profile.id,
      },
    });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const resetUrl = `${baseUrl}/reset-password?token=${token}`;

    auditLog("forgot-password", `Reset requested for ${email}`);

    if ((process.env.EMAIL_PROVIDER || "log") === "log") {
      console.log(`[EMAIL] Password reset link for ${email}: ${resetUrl}`);
    }
    const emailContent = buildResetPasswordEmail(resetUrl);
    await sendEmail({
      to: email,
      ...emailContent,
    });

    return NextResponse.json({
      success: true,
      message: genericMessage,
    });
  } catch (error) {
    console.error("Forgot password error:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: getErrorMessage(error, "Gagal memproses reset password.") },
      { status: isDatabaseError(error) ? 503 : 500 }
    );
  }
}