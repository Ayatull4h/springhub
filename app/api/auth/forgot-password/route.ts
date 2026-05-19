import { NextResponse } from "next/server";
import { SignJWT, type JWTPayload } from "jose";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "springhub-dev-secret-key-change-in-production"
);

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    if (!email) {
      return NextResponse.json({ error: "Email wajib diisi" }, { status: 400 });
    }

    const profile = await prisma.profile.findUnique({ where: { email } });
    if (!profile) {
      return NextResponse.json({ error: "Email tidak ditemukan" }, { status: 404 });
    }

    const token = await new SignJWT({ email, userId: profile.id } as unknown as JWTPayload)
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("1h")
      .sign(SECRET);

    return NextResponse.json({
      success: true,
      message: "Link reset password telah dikirim ke email Anda.",
      _devToken: process.env.NODE_ENV === "development" ? token : undefined,
      _devUrl: process.env.NODE_ENV === "development" ? `/reset-password?token=${token}` : undefined,
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
