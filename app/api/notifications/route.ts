import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { logError } from "@/lib/error-logger";
import { sendNotificationEmail } from "@/lib/email";
export const dynamic = "force-dynamic";

// GET /api/notifications — list notifications for current user
export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const notifications = await prisma.notification.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({ notifications });
  } catch (err) {
    console.error("[Notifications GET]", err);
    await logError({ message: "Notifications GET error", level: "error", source: "api", stack: err instanceof Error ? err.stack : "" }).catch(() => {});
    return NextResponse.json({ notifications: [], error: "Gagal memuat notifikasi" }, { status: 200 });
  }
}

// POST /api/notifications — create notification (admin or system use)
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const notification = await prisma.notification.create({
    data: {
      userId: session.userId,
      type: body.type || "info",
      title: body.title,
      body: body.body || "",
      link: body.link || "",
    },
  });

  // Send email notification for event type
  if (body.type === "event" || body.type === "report-approved" || body.type === "report-rejected") {
    const user = await prisma.profile.findUnique({
      where: { id: notification.userId },
      select: { email: true },
    });
    if (user?.email) {
      sendNotificationEmail(
        user.email,
        body.title || notification.title,
        body.body || notification.body
      ).catch(() => {
        // Email failure is non-critical
      });
    }
  }

  return NextResponse.json({ notification }, { status: 201 });
}
