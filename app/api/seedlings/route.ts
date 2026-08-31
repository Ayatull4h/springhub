import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma, getErrorMessage } from "@/lib/prisma";
import { verifyCsrfToken } from "@/lib/csrf";
import { apiLimiter, publicLimiter } from "@/lib/rate-limit";
import { guard } from "@/middlewares/guard";
import { list } from "@/controllers/seedlingController";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    try { await guard(request, { rate: "public", csrf: false }); } catch (e) { if (e instanceof Response) return e; throw e; }
    const session = await getSession();
    return list(request, session);
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }
}

export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
    const session = await getSession();
    const limiter = session?.userId ? apiLimiter : publicLimiter;
    const key = session?.userId ? `seedlings-post:${session.userId}` : `seedlings-post:${ip}`;
    const l = await limiter.check(key);
    if (!l.allowed) return NextResponse.json({ error: "Terlalu banyak permintaan." }, { status: 429 });

    const csrfToken = request.headers.get("x-csrf-token");
    if (!csrfToken || !(await verifyCsrfToken(csrfToken))) {
      return NextResponse.json({ error: "Invalid CSRF" }, { status: 403 });
    }

    if (!session?.userId) {
      return NextResponse.json({ error: "Harus login dulu" }, { status: 401 });
    }

    const body = await request.json();
    const { species, quantity, province, regency, notes } = body;

    if (!species || !quantity || !province) {
      return NextResponse.json(
        { error: "Jenis, jumlah, dan provinsi wajib diisi" },
        { status: 400 }
      );
    }

    if (quantity < 1 || quantity > 9999) {
      return NextResponse.json(
        { error: "Jumlah bibit tidak valid (min 1, maks 9999)" },
        { status: 400 }
      );
    }

    // Cek: user yang sama, jenis + provinsi sama, masih ada stok?
    const existing = await prisma.seedling.findFirst({
      where: {
        userId: session.userId,
        species,
        province,
        regency: regency || "",
        status: { in: ["pending", "active"] },
        stock: { gt: 0 },
      },
    });

    let seedling;
    if (existing) {
      // User yang sama, jenis sama — tambah stok doang
      seedling = await prisma.seedling.update({
        where: { id: existing.id },
        data: {
          quantity: existing.quantity + quantity,
          stock: existing.stock + quantity,
        },
      });
    } else {
      // Belum ada — bikin baru
      seedling = await prisma.seedling.create({
        data: {
          userId: session.userId,
          species,
          quantity,
          stock: quantity,
          province,
          regency: regency || "",
          notes: notes || "",
          status: "pending",
        },
      });
    }

    return NextResponse.json({ seedling }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error, "Gagal menyimpan bibit") },
      { status: 500 }
    );
  }
}
