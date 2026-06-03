import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    // Increment likes
    const updated = await prisma.project.update({
      where: { id },
      data: { likes: { increment: 1 } },
    });
    return NextResponse.json({ likes: updated.likes });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
