import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";
import { getSession } from "@/lib/auth";
import { getGuestId } from "@/lib/guest";

// ─── In-Memory Rate Limiter ─────────────────────────────────────────────────
// Simple burst protection. For production, replace with Upstash / Vercel KV.
const rateLimits = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute window
const RATE_LIMIT_MAX = 10; // max requests per window
const DAILY_FEEDBACK_LIMIT = 3; // max feedback per user per day

// Periodic cleanup every 5 minutes to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimits.entries()) {
    if (now > entry.resetAt) rateLimits.delete(key);
  }
}, 5 * 60 * 1000);

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const entry = rateLimits.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimits.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count++;
  return true;
}

// ─── Valid Feedback Types ───────────────────────────────────────────────────
const VALID_TYPES = ["bug", "kritik", "saran", "both"] as const;

// ─── POST /api/feedback — Submit feedback ───────────────────────────────────
export async function POST(request: Request) {
  try {
    const session = await getSession();
    const guestId = getGuestId();
    const rateKey = session?.userId ?? guestId;

    // --- Burst rate limit (in-memory) ---
    if (!checkRateLimit(rateKey)) {
      return NextResponse.json(
        { error: "Terlalu banyak permintaan. Silakan coba lagi nanti." },
        { status: 429 }
      );
    }

    // --- Request body size check ---
    const contentLength = request.headers.get("content-length");
    if (contentLength && parseInt(contentLength) > 5_000_000) { // 5MB max
      return NextResponse.json(
        { error: "Request terlalu besar. Maksimal 5MB." },
        { status: 413 }
      );
    }

    // --- Parse JSON body ---
    let body: Record<string, unknown>;
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      return NextResponse.json(
        { error: "Body request harus berupa JSON yang valid." },
        { status: 400 }
      );
    }

    const { type, kritik, saran, bugDescription, bugScreenshot } = body as {
      type?: string;
      kritik?: string;
      saran?: string;
      bugDescription?: string;
      bugScreenshot?: string;
    };

    // --- Type validation ---
    if (!type || !VALID_TYPES.includes(type as (typeof VALID_TYPES)[number])) {
      return NextResponse.json(
        {
          error:
            "Tipe feedback harus salah satu dari: bug, kritik, saran, both.",
        },
        { status: 400 }
      );
    }

    // --- Field validations (min 10 characters) ---
    if (type === "bug" || type === "both") {
      if (
        !bugDescription ||
        typeof bugDescription !== "string" ||
        bugDescription.trim().length < 10
      ) {
        return NextResponse.json(
          {
            error:
              "Deskripsi bug harus diisi minimal 10 karakter.",
          },
          { status: 400 }
        );
      }
    }

    if (type === "kritik" || type === "both") {
      if (
        !kritik ||
        typeof kritik !== "string" ||
        kritik.trim().length < 10
      ) {
        return NextResponse.json(
          {
            error:
              "Kritik harus diisi minimal 10 karakter.",
          },
          { status: 400 }
        );
      }
    }

    if (type === "saran" || type === "both") {
      if (
        !saran ||
        typeof saran !== "string" ||
        saran.trim().length < 10
      ) {
        return NextResponse.json(
          {
            error:
              "Saran harus diisi minimal 10 karakter.",
          },
          { status: 400 }
        );
      }
    }

    // --- Daily limit check (logged-in users only) ---
    if (session?.userId) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const todayCount = await prisma.feedback.count({
        where: {
          userId: session.userId,
          createdAt: { gte: today, lt: tomorrow },
        },
      });

      if (todayCount >= DAILY_FEEDBACK_LIMIT) {
        return NextResponse.json(
          {
            error:
              "Batas feedback harian (3) tercapai. Coba lagi besok.",
          },
          { status: 429 }
        );
      }
    }

    // --- Validate screenshot (optional base64 data URL) ---
    const screenshot =
      typeof bugScreenshot === "string" && bugScreenshot.length > 0
        ? bugScreenshot
        : "";

    // --- Persist to database ---
    const feedback = await prisma.feedback.create({
      data: {
        type,
        kritik: (kritik ?? "").trim(),
        saran: (saran ?? "").trim(),
        bugDescription: (bugDescription ?? "").trim(),
        bugScreenshot: screenshot,
        userId: session?.userId ?? null,
        status: "open",
      },
    });

    return NextResponse.json({
      success: true,
      id: feedback.id,
    });
  } catch (error) {
    console.error("Feedback submission error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
