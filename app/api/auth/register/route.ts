import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma, getErrorMessage, isDatabaseError } from "@/lib/prisma";
export const dynamic = "force-dynamic";
import { hashPassword, createSession, getSession } from "@/lib/auth";
import { getExistingGuestId } from "@/lib/guest";
import { authLimiter } from "@/lib/rate-limit";
import { auditLog } from "@/lib/audit";

const registerSchema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(8, "Password minimal 8 karakter"),
  username: z.string().min(2, "Username minimal 2 karakter").optional(),
});

export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const ipLimiter = await authLimiter.check(`register:${ip}`);
    if (!ipLimiter.allowed) {
      return NextResponse.json(
        { error: "Terlalu banyak permintaan. Silakan coba lagi nanti." },
        { status: 429 }
      );
    }

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

    await createSession({
      userId: profile.id,
      role: profile.role,
      username: profile.username,
    });

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

    auditLog("register", `User ${profile.id} registered`);

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
    console.error("Register error:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: getErrorMessage(error, "Gagal mendaftar. Silakan coba lagi.") },
      { status: isDatabaseError(error) ? 503 : 500 }
    );
  }
}
