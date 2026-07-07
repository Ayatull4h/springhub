import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma, getErrorMessage, isDatabaseError } from "@/lib/prisma";
export const dynamic = "force-dynamic";
import { hashPassword, createSession, getSession } from "@/lib/auth";
import { getExistingGuestId } from "@/lib/guest";
import { authLimiter } from "@/lib/rate-limit";
import { auditLog } from "@/lib/audit";

const registerSchema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z
    .string()
    .min(8, "Password minimal 8 karakter")
    .regex(/[A-Z]/, "Password harus mengandung huruf BESAR")
    .regex(/[a-z]/, "Password harus mengandung huruf kecil")
    .regex(/[0-9]/, "Password harus mengandung angka"),
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

    const { email: rawEmail, password, username: rawUsername } = parsed.data;
    const email = rawEmail.toLowerCase().trim();

    // Cegah duplicate email — cek dua kali (application + database level)
    const existing = await prisma.profile.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "Email sudah terdaftar" },
        { status: 409 }
      );
    }

    let username = rawUsername ?? email.split("@")[0];
    const usernameTaken = await prisma.profile.findUnique({ where: { username } });
    if (usernameTaken) {
      let suffix = 1;
      while (await prisma.profile.findUnique({ where: { username: `${username}${suffix}` } })) {
        suffix++;
      }
      username = `${username}${suffix}`;
    }

    const passwordHash = await hashPassword(password);

    // Gunakan create dengan catch unique constraint sebagai jaring pengaman
    let profile;
    try {
      profile = await prisma.profile.create({
        data: {
          email,
          passwordHash,
          username,
          role: "volunteer",
        },
      });
    } catch (createErr) {
      if (createErr instanceof Prisma.PrismaClientKnownRequestError && createErr.code === "P2002") {
        const target = (createErr.meta?.target as string[]) || [];
        if (target.includes("email")) {
          return NextResponse.json({ error: "Email sudah terdaftar" }, { status: 409 });
        }
        if (target.includes("username")) {
          return NextResponse.json({ error: "Username sudah dipakai" }, { status: 409 });
        }
      }
      throw createErr; // Re-throw — akan di-catch oleh handler utama
    }

    const proto = request.headers.get("x-forwarded-proto") || request.headers.get("x-forwarded-scheme") || "https";
    await createSession({
      userId: profile.id,
      role: profile.role,
      username: profile.username,
    }, proto === "https");

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
