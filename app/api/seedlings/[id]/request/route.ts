import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma, getErrorMessage } from "@/lib/prisma";
import { verifyCsrfToken } from "@/lib/csrf";
export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const csrfToken = request.headers.get("x-csrf-token");
    if (!csrfToken || !(await verifyCsrfToken(csrfToken))) {
      return NextResponse.json({ error: "Invalid CSRF" }, { status: 403 });
    }

    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: "Harus login dulu" }, { status: 401 });
    }

    // Ambil bibit
    const seedling = await prisma.seedling.findUnique({
      where: { id: params.id },
    });

    if (!seedling) {
      return NextResponse.json({ error: "Bibit tidak ditemukan" }, { status: 404 });
    }

    if (seedling.status !== "active") {
      return NextResponse.json({ error: "Bibit belum tersedia" }, { status: 400 });
    }

    if (seedling.stock < 1) {
      return NextResponse.json({ error: "Stok bibit habis" }, { status: 400 });
    }

    // Gak bisa minta bibit sendiri
    if (seedling.userId === session.userId) {
      return NextResponse.json({ error: "Gak bisa minta bibit sendiri" }, { status: 400 });
    }

    const body = await request.json();
    const quantity = parseInt(body.quantity, 10) || 1;
    const message = body.message || "";

    if (quantity < 1 || quantity > seedling.stock) {
      return NextResponse.json(
        { error: "Jumlah tidak valid" },
        { status: 400 }
      );
    }

    const req = await prisma.seedlingRequest.create({
      data: {
        seedlingId: seedling.id,
        requesterId: session.userId,
        ownerId: seedling.userId,
        quantity,
        message,
        status: "pending",
      },
    });

    return NextResponse.json({ request: req }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error, "Gagal mengirim permintaan") },
      { status: 500 }
    );
  }
}
