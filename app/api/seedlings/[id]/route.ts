import { NextResponse } from "next/server";
import { prisma, getErrorMessage } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    const isAdmin = session?.role === "admin";

    const seedling = await prisma.seedling.findUnique({
      where: { id: params.id },
      include: {
        // C-1: phone tidak pernah diekspos publik — kontak lewat route /contact yang punya ownership check
        user: { select: { id: true, username: true, points: true, ...(isAdmin ? { phone: true } : {}) } },
        photos: { select: { id: true, storagePath: true, createdAt: true }, orderBy: { createdAt: "asc" } },
        report: { include: { photos: { select: { id: true, storagePath: true }, orderBy: { createdAt: "asc" }, take: 5 } } },
      },
    });

    if (!seedling) {
      return NextResponse.json({ error: "Bibit tidak ditemukan" }, { status: 404 });
    }

    // Publik hanya bisa lihat seedling active
    if (!isAdmin && seedling.status !== "active") {
      return NextResponse.json({ error: "Bibit tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({ seedling });
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error, "Gagal mengambil detail bibit") },
      { status: 500 }
    );
  }
}
