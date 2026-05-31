import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";
import { verifyCsrfToken } from "@/lib/csrf";
import { newsletterLimiter } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    // CSRF check
    const csrfToken = request.headers.get("x-csrf-token");
    if (!csrfToken || !(await verifyCsrfToken(csrfToken))) {
      return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
    }

    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const limiter = await newsletterLimiter.check(`newsletter:${ip}`);
    if (!limiter.allowed) {
      return NextResponse.json({ error: "Terlalu banyak permintaan." }, { status: 429 });
    }

    const { email } = await request.json();
    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ error: "Email tidak valid" }, { status: 400 });
    }

    const existing = await prisma.pointsLog.findFirst({
      where: { reason: "newsletter", metadata: { contains: email.toLowerCase() } },
    });

    if (existing) {
      return NextResponse.json({ success: true, message: "Sudah terdaftar" });
    }

    await prisma.pointsLog.create({
      data: {
        amount: 0,
        reason: "newsletter",
        metadata: JSON.stringify({ email: email.toLowerCase(), subscribedAt: new Date().toISOString() }),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Newsletter error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
