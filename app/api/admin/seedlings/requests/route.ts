import { NextResponse } from "next/server";
import { getSession, isAdmin as checkAdmin } from "@/lib/auth";
import { prisma, getErrorMessage } from "@/lib/prisma";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || !(await checkAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const requests = await prisma.seedlingRequest.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        requester: { select: { id: true, username: true } },
        owner: { select: { id: true, username: true } },
        seedling: { select: { species: true, stock: true } },
      },
    });

    return NextResponse.json({ requests });
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error, "Gagal memuat permintaan") },
      { status: 500 }
    );
  }
}
