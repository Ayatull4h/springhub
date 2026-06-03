import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ unread: 0 });

  const unread = await prisma.notification.count({
    where: { userId: session.userId, isRead: false },
  });

  return NextResponse.json({ unread });
}
