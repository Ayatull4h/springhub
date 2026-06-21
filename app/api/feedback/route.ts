import { NextResponse } from "next/server";
import { prisma, getErrorMessage, isDatabaseError } from "@/lib/prisma";
export const dynamic = "force-dynamic";
import { getSession } from "@/lib/auth";
import { getGuestId } from "@/lib/guest";
import { verifyCsrfToken } from "@/lib/csrf";
import { feedbackLimiter } from "@/lib/rate-limit";

const VALID_TYPES = ["bug", "kritik", "saran", "both"] as const;
const DAILY_FEEDBACK_LIMIT = 3;

export async function POST(request: Request) {
  try {
    // CSRF check
    const csrfToken = request.headers.get("x-csrf-token");
    if (!csrfToken || !(await verifyCsrfToken(csrfToken))) {
      return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
    }

    const session = await getSession();
    const guestId = getGuestId();
    const rateKey = session?.userId ?? guestId;

    const limiter = await feedbackLimiter.check(rateKey);
    if (!limiter.allowed) {
      return NextResponse.json(
        { error: "Terlalu banyak permintaan. Silakan coba lagi nanti." },
        { status: 429 }
      );
    }

    const contentLength = request.headers.get("content-length");
    if (contentLength && parseInt(contentLength) > 5_000_000) {
      return NextResponse.json(
        { error: "Request terlalu besar. Maksimal 5MB." },
        { status: 413 }
      );
    }

    let body: Record<string, unknown>;
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      return NextResponse.json(
        { error: "Body request harus berupa JSON yang valid." },
        { status: 400 }
      );
    }

    const { type, kritik, saran, bugDescription, bugScreenshot, bugScreenshots } = body as {
      type?: string;
      kritik?: string;
      saran?: string;
      bugDescription?: string;
      bugScreenshot?: string;
      bugScreenshots?: string[];
    };

    if (!type || !VALID_TYPES.includes(type as (typeof VALID_TYPES)[number])) {
      return NextResponse.json(
        { error: "Tipe feedback harus salah satu dari: bug, kritik, saran, both." },
        { status: 400 }
      );
    }

    if (type === "bug" || type === "both") {
      if (!bugDescription || typeof bugDescription !== "string" || bugDescription.trim().length < 10) {
        return NextResponse.json(
          { error: "Deskripsi bug harus diisi minimal 10 karakter." },
          { status: 400 }
        );
      }
    }

    if (type === "kritik" || type === "both") {
      if (!kritik || typeof kritik !== "string" || kritik.trim().length < 10) {
        return NextResponse.json(
          { error: "Kritik harus diisi minimal 10 karakter." },
          { status: 400 }
        );
      }
    }

    if (type === "saran" || type === "both") {
      if (!saran || typeof saran !== "string" || saran.trim().length < 10) {
        return NextResponse.json(
          { error: "Saran harus diisi minimal 10 karakter." },
          { status: 400 }
        );
      }
    }

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
          { error: "Batas feedback harian (3) tercapai. Coba lagi besok." },
          { status: 429 }
        );
      }
    }

    // Support both single screenshot (legacy) and array of screenshots
    const screenshots: string[] = [];
    if (Array.isArray(bugScreenshots)) {
      screenshots.push(...bugScreenshots.slice(0, 3));
    } else if (typeof bugScreenshot === "string" && bugScreenshot.length > 0) {
      screenshots.push(bugScreenshot);
    }

    const feedback = await prisma.feedback.create({
      data: {
        type,
        kritik: (kritik ?? "").trim(),
        saran: (saran ?? "").trim(),
        bugDescription: (bugDescription ?? "").trim(),
        bugScreenshot: screenshots.length > 0 ? screenshots[0] : "",
        userId: session?.userId ?? null,
        status: "open",
      },
    });

    return NextResponse.json({
      success: true,
      id: feedback.id,
    });
  } catch (error) {
    console.error("Feedback submission error:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: getErrorMessage(error, "Terjadi kesalahan.") },
      { status: isDatabaseError(error) ? 503 : 500 }
    );
  }
}
