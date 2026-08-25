import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";
import { getSession } from "@/lib/auth";
import { verifyCsrfToken } from "@/lib/csrf";
import { apiLimiter } from "@/lib/rate-limit";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    // CSRF
    const csrfToken = req.headers.get("x-csrf-token");
    if (!csrfToken || !(await verifyCsrfToken(csrfToken))) {
      return NextResponse.json({ error: "Invalid CSRF" }, { status: 403 });
    }

    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limit
    const limitResult = await apiLimiter.check(`like:${session.userId}`);
    if (!limitResult.allowed) {
      return NextResponse.json(
        { error: "Terlalu banyak permintaan. Silakan coba lagi nanti." },
        { status: 429 }
      );
    }

    const { id } = await params;
    const userId = session.userId;

    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const existing = await prisma.like.findUnique({
      where: { userId_projectId: { userId, projectId: id } },
    });

    if (existing) {
      await prisma.like.delete({ where: { id: existing.id } });
      await prisma.project.update({
        where: { id },
        data: { likes: { decrement: 1 } },
      });
      const updated = await prisma.project.findUnique({
        where: { id },
        select: { likes: true },
      });
      return NextResponse.json({ liked: false, likes: updated?.likes ?? 0 });
    }

    await prisma.like.create({ data: { userId, projectId: id } });
    await prisma.project.update({
      where: { id },
      data: { likes: { increment: 1 } },
    });
    const updated = await prisma.project.findUnique({
      where: { id },
      select: { likes: true },
    });
    return NextResponse.json({ liked: true, likes: updated?.likes ?? 0 });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    const { id } = await params;

    // Total likes from denormalized Project.likes (includes seed data + new toggles)
    const project = await prisma.project.findUnique({
      where: { id },
      select: { likes: true },
    });
    const likes = project?.likes ?? 0;

    let liked = false;
    if (session) {
      const existing = await prisma.like.findUnique({
        where: { userId_projectId: { userId: session.userId, projectId: id } },
      });
      liked = !!existing;
    }

    return NextResponse.json({ liked, likes });
  } catch {
    return NextResponse.json({ liked: false, likes: 0 });
  }
}
