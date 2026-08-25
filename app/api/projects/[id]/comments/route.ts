import { NextResponse } from "next/server";
import { prisma, getErrorMessage } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { verifyCsrfToken } from "@/lib/csrf";
import { apiLimiter } from "@/lib/rate-limit";
export const dynamic = "force-dynamic";

// GET /api/projects/[id]/comments — list comments by project
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const comments = await prisma.comment.findMany({
      where: { projectId: (await params).id },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        user: { select: { username: true } },
      },
    });
    return NextResponse.json({ comments });
  } catch (err) {
    console.error("GET /api/projects/[id]/comments error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// POST /api/projects/[id]/comments — add comment
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    // CSRF
    const csrfToken = req.headers.get("x-csrf-token");
    if (!csrfToken || !(await verifyCsrfToken(csrfToken))) {
      return NextResponse.json({ error: "Invalid CSRF" }, { status: 403 });
    }

    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Login required" }, { status: 401 });
    }

    // Rate limit
    const limitResult = await apiLimiter.check(`comment:${session.userId}`);
    if (!limitResult.allowed) {
      return NextResponse.json(
        { error: "Terlalu banyak permintaan. Silakan coba lagi nanti." },
        { status: 429 }
      );
    }

    const { text } = await req.json();
    if (!text || text.trim().length === 0) {
      return NextResponse.json({ error: "Comment text required" }, { status: 400 });
    }
    // Batasi panjang komentar (konsisten dengan .max(500) di forms)
    const trimmed = text.trim();
    if (trimmed.length > 500) {
      return NextResponse.json({ error: "Komentar maksimal 500 karakter." }, { status: 400 });
    }
    // Verify project exists
    const project = await prisma.project.findUnique({ where: { id: (await params).id } });
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    const comment = await prisma.comment.create({
      data: {
        projectId: (await params).id,
        userId: session.userId,
        text: trimmed,
      },
      include: {
        user: { select: { username: true } },
      },
    });
    // Also increment project comments count
    await prisma.project.update({
      where: { id: (await params).id },
      data: { comments: { increment: 1 } },
    });
    return NextResponse.json({ comment }, { status: 201 });
  } catch (err) {
    console.error("POST /api/projects/[id]/comments error:", err);
    return NextResponse.json({ error: getErrorMessage(err, "Gagal menyimpan komentar.") }, { status: 500 });
  }
}
