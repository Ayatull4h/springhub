import { NextResponse } from "next/server";
import { SignJWT, type JWTPayload } from "jose";
import { prisma } from "@/lib/prisma";
import { getJwtSecret } from "@/lib/jwt";
import { sendEmail, buildResetPasswordEmail } from "@/lib/email";
import { authLimiter } from "@/lib/rate-limit";
import { auditLog } from "@/lib/audit";

export const dynamic = "force-dynamic";

const SECRET = getJwtSecret();

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

    // Rate limit per email
    const limiter = await authLimiter.check(`forgot-pw:${email}`);
    if (!limiter.allowed) {
      return NextResponse.json({ error: "Terlalu banyak permintaan. Silakan coba lagi nanti." }, { status: 429 });
    }

    const jwtPayload: JWTPayload = { email, userId: profile.id };
    const token = await new SignJWT(jwtPayload)
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("1h")
      .sign(SECRET);

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const resetUrl = `${baseUrl}/reset-password?token=${token}`;

    auditLog("forgot-password", `Reset requested for ${email}`);

    // Send email (or log in dev mode)
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
    console.error("Forgot password error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
