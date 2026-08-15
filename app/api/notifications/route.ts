import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { logError } from "@/lib/error-logger";
import { sendNotificationEmail } from "@/lib/email";
import { verifyCsrfToken } from "@/lib/csrf";
export const dynamic = "force-dynamic";

// GET /api/notifications — list notifications for current user
export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const url = new URL(request.url);
    const limitParam = url.searchParams.get("limit") || url.searchParams.get("per_page") || "50";
    const pageParam = url.searchParams.get("page") || "1";
    const limit = Math.min(Math.max(parseInt(limitParam, 10) || 50, 1), 200);
    const page = Math.max(parseInt(pageParam, 10) || 1, 1);
    const skip = (page - 1) * limit;

    const where = { userId: session.userId };

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip,
      }),
      prisma.notification.count({ where }),
    ]);

    return NextResponse.json({ notifications, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (err) {
    console.error("[Notifications GET]", err);
    await logError({ message: "Notifications GET error", level: "error", source: "api", stack: err instanceof Error ? err.stack : "" }).catch(() => {});
    return NextResponse.json({ notifications: [], error: "Gagal memuat notifikasi" }, { status: 200 });
  }
}

// POST /api/notifications — create notification (admin or system use)
export async function POST(req: Request) {
  try {
    // CSRF
    const csrfToken = req.headers.get("x-csrf-token");
    if (!csrfToken || !(await verifyCsrfToken(csrfToken))) {
      return NextResponse.json({ error: "Invalid CSRF" }, { status: 403 });
    }

    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    // Whitelist tipe + batas panjang (M-1/L-1: cegah self-spam & input tak terduga)
    const allowedTypes = ["info", "event", "report-approved", "report-rejected", "seedling-request", "points-earned"];
    const type = allowedTypes.includes(body.type) ? body.type : "info";
    const title = String(body.title || "").slice(0, 200);
    const noteBody = String(body.body || "").slice(0, 2000);
    const link = String(body.link || "").slice(0, 500);
    if (!title) return NextResponse.json({ error: "Judul wajib diisi" }, { status: 400 });

    const notification = await prisma.notification.create({
      data: {
        userId: session.userId,
        type,
        title,
        body: noteBody,
        link,
      },
    });

    // Send email notification for event type
    if (type === "event" || type === "report-approved" || type === "report-rejected") {
      const user = await prisma.profile.findUnique({
        where: { id: notification.userId },
        select: { email: true },
      });
      if (user?.email) {
        sendNotificationEmail(
          user.email,
          title,
          noteBody
        ).catch(() => {
          // Email failure is non-critical
        });
      }
    }

    return NextResponse.json({ notification }, { status: 201 });
  } catch (err) {
    console.error("[Notifications POST]", err);
    return NextResponse.json({ error: "Gagal membuat notifikasi" }, { status: 500 });
  }
}
