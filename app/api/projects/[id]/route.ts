import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const project = await prisma.project.findUnique({
      where: { id: params.id },
      include: {
        user: { select: { username: true } },
        _count: { select: { donations: true, commentList: true } },
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const normalized = {
      ...project,
      _count: { donations: project._count.donations, comments: project._count.commentList },
    };
    return NextResponse.json({ project: normalized });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
