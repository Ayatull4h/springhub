import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma, getErrorMessage } from "@/lib/prisma";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: "Harus login" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "outgoing";

    let where: Record<string, unknown> = {};

    if (type === "outgoing") {
      // Permintaan yang saya kirim
      where.requesterId = session.userId;
    } else {
      // Permintaan masuk ke bibit saya
      where.ownerId = session.userId;
    }

    const requests = await prisma.seedlingRequest.findMany({
      where,
      include: {
        seedling: {
          select: {
            id: true,
            species: true,
            quantity: true,
            province: true,
            regency: true,
          },
        },
        requester: { select: { id: true, username: true, phone: true } },
        owner: { select: { id: true, username: true, phone: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ requests });
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error, "Gagal mengambil data permintaan") },
      { status: 500 }
    );
  }
}
