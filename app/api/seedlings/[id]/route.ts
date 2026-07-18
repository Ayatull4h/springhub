import { NextResponse } from "next/server";
import { prisma, getErrorMessage } from "@/lib/prisma";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const seedling = await prisma.seedling.findUnique({
      where: { id: params.id },
      include: {
        user: { select: { id: true, username: true, points: true, phone: true } },
        photos: { select: { id: true, storagePath: true, createdAt: true }, orderBy: { createdAt: "asc" } },
      },
    });

    if (!seedling) {
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
