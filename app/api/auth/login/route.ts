import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyPassword, createSession, getSession } from "@/lib/auth";
import { getExistingGuestId } from "@/lib/guest";

const loginSchema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(1, "Password wajib diisi"),
});

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (session) {
      return NextResponse.json(
        { error: "Already logged in" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;

    const profile = await prisma.profile.findUnique({ where: { email } });
    if (!profile) {
      return NextResponse.json(
        { error: "Email atau password salah" },
        { status: 401 }
      );
    }

    const valid = await verifyPassword(password, profile.passwordHash);
    if (!valid) {
      return NextResponse.json(
        { error: "Email atau password salah" },
        { status: 401 }
      );
    }

    await createSession({
      userId: profile.id,
      role: profile.role,
      username: profile.username,
    });

    // Claim guest reports if any
    const guestId = getExistingGuestId();
    if (guestId) {
      await prisma.report.updateMany({
        where: { guestId },
        data: { userId: profile.id, guestId: null },
      });
      await prisma.pointsLog.updateMany({
        where: { guestId },
        data: { userId: profile.id, guestId: null },
      });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: profile.id,
        email: profile.email,
        username: profile.username,
        role: profile.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
