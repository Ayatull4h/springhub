import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ unread: 0 });

    const unread = await prisma.notification.count({
      where: { userId: session.userId, isRead: false },
    });

    return NextResponse.json({ unread });
  } catch (err) {
    console.error("[Notifications Unread GET]", err);
    return NextResponse.json({ unread: 0 }, { status: 200 });
  }
}
