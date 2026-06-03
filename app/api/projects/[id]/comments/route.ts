import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
export const dynamic = "force-dynamic";

// GET /api/projects/[id]/comments — list comments by project
export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const comments = await prisma.comment.findMany({
      where: { projectId: params.id },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        user: { select: { username: true } },
      },
    });
    return NextResponse.json({ comments });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// POST /api/projects/[id]/comments — add comment
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Login required" }, { status: 401 });
  }
  try {
    const { text } = await req.json();
    if (!text || text.trim().length === 0) {
      return NextResponse.json({ error: "Comment text required" }, { status: 400 });
    }
    const comment = await prisma.comment.create({
      data: {
        projectId: params.id,
        userId: session.userId,
        text: text.trim(),
      },
      include: {
        user: { select: { username: true } },
      },
    });
    // Also increment project comments count
    await prisma.project.update({
      where: { id: params.id },
      data: { comments: { increment: 1 } },
    });
    return NextResponse.json({ comment }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
