import { NextResponse } from "next/server";
import { getSession, hashPassword, verifyPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logError } from "@/lib/error-logger";
import { verifyCsrfToken } from "@/lib/csrf";
import { z } from "zod";

export const dynamic = "force-dynamic";

const updateSchema = z.object({
  username: z.string().min(2).optional(),
  region: z.string().optional(),
  phone: z.string().optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8, "Password minimal 8 karakter").optional(),
});

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await prisma.profile.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        phone: true,
        region: true,
        points: true,
        trustScore: true,
        createdAt: true,
      },
    });

    if (!profile) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const reports = await prisma.report.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        formSlug: true,
        status: true,
        createdAt: true,
      },
    });

    const pointsLogs = await prisma.pointsLog.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        amount: true,
        reason: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ profile, reports, pointsLogs });
  } catch (err) {
    console.error("[User Profile GET]", err);
    await logError({ message: "User Profile GET error", level: "error", source: "api", stack: err instanceof Error ? err.stack : "" }).catch(() => {});
    return NextResponse.json({ error: "Gagal memuat profil" }, { status: 200 });
  }
}

export async function PUT(request: Request) {
  try {
    // CSRF — penting: route ini bisa mengubah password (akun takeover via CSRF)
    const csrfToken = request.headers.get("x-csrf-token");
    if (!csrfToken || !(await verifyCsrfToken(csrfToken))) {
      return NextResponse.json({ error: "Invalid CSRF" }, { status: 403 });
    }

    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Data tidak valid", details: parsed.error.flatten() }, { status: 400 });
    }

    const data: any = {};

    if (parsed.data.username) data.username = parsed.data.username;
    if (parsed.data.region) data.region = parsed.data.region;
    if (parsed.data.phone !== undefined) data.phone = parsed.data.phone;

    if (parsed.data.newPassword) {
      if (!parsed.data.currentPassword) {
        return NextResponse.json({ error: "Password saat ini diperlukan" }, { status: 400 });
      }
      const profile = await prisma.profile.findUnique({ where: { id: session.userId } });
      if (!profile || !(await verifyPassword(parsed.data.currentPassword, profile.passwordHash))) {
        return NextResponse.json({ error: "Password saat ini salah" }, { status: 400 });
      }
      data.passwordHash = await hashPassword(parsed.data.newPassword);
    }

    const updated = await prisma.profile.update({
      where: { id: session.userId },
      data,
      select: { id: true, username: true, email: true, region: true, role: true, points: true },
    });

    return NextResponse.json({ success: true, user: updated });
  } catch (err) {
    console.error("Profile update error:", err);
    await logError({ message: "Profile update error", level: "error", source: "api", stack: err instanceof Error ? err.stack : "" }).catch(() => {});
    return NextResponse.json({ error: "Gagal mengupdate profil" }, { status: 500 });
  }
}
