import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma, getErrorMessage, isDatabaseError } from "@/lib/prisma";
export const dynamic = "force-dynamic";
import { verifyPassword, createSession, getSession, getClientIp } from "@/lib/auth";
import { verifyCsrfToken } from "@/lib/csrf";
import { getExistingGuestId } from "@/lib/guest";
import { authLimiter, loginLockout } from "@/lib/rate-limit";
import { auditLog } from "@/lib/audit";

const loginSchema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(1, "Password wajib diisi"),
});

const DUMMY_PASSWORD_HASH = "$2b$12$msG/.NLlzDcFEYRy.6i8PeweEPzXOcDd9SAqtOydJQAmu.UbsEGfO";

export async function POST(request: Request) {
  try {
    const csrfToken = request.headers.get("x-csrf-token");
    if (!csrfToken || !(await verifyCsrfToken(csrfToken))) {
      return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
    }

    const ip = getClientIp(request);
    const ipLimiter = await authLimiter.check(`login:${ip}`);
    if (!ipLimiter.allowed) {
      return NextResponse.json(
        { error: "Terlalu banyak percobaan login. Silakan coba lagi nanti." },
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
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;
    const normalizedEmail = email.toLowerCase().trim();

    const profile = await prisma.profile.findUnique({ where: { email: normalizedEmail } });

    // bcrypt.compare selalu dijalankan (hash asli atau dummy) agar timing tidak
    // membocorkan apakah email terdaftar.
    const valid = await verifyPassword(password, profile?.passwordHash ?? DUMMY_PASSWORD_HASH);

    if (!profile || !valid) {
      if (profile) {
        // Lockout tetap dihitung, tapi respons disamakan agar attacker
        // tidak bisa membedakan email terdaftar vs tidak (enumeration oracle).
        await loginLockout.check(`lock:${ip}:${profile.id}`);
      }
      return NextResponse.json(
        { error: "Email atau password salah" },
        { status: 401 }
      );
    }

    // Login berhasil — reset lockout counter
    await loginLockout.reset(`lock:${ip}:${profile.id}`);
    const proto = request.headers.get("x-forwarded-proto") || request.headers.get("x-forwarded-scheme") || "https";
    await createSession({
      userId: profile.id,
      role: profile.role,
      username: profile.username,
      phone: profile.phone,
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

    auditLog("login", `User ${profile.id} logged in`);

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
    console.error("Login error:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: getErrorMessage(error, "Gagal login. Silakan coba lagi.") },
      { status: isDatabaseError(error) ? 503 : 500 }
    );
  }
}
