import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";
import { hashPassword, createSession, getSession } from "@/lib/auth";
import { getExistingGuestId } from "@/lib/guest";

const registerSchema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
  username: z.string().min(2, "Username minimal 2 karakter").optional(),
});

export async function POST(request: Request) {
  try {
    // If already logged in, redirect
    const session = await getSession();
    if (session) {
      return NextResponse.json(
        { error: "Already logged in" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { email, password, username } = parsed.data;

    // Check if email already exists
    const existing = await prisma.profile.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "Email sudah terdaftar" },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);

    const profile = await prisma.profile.create({
      data: {
        email,
        passwordHash,
        username: username ?? email.split("@")[0],
        role: "volunteer",
      },
    });

    // Create session
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
    console.error("Register error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
