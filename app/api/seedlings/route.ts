import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma, getErrorMessage } from "@/lib/prisma";
import { verifyCsrfToken } from "@/lib/csrf";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const mine = searchParams.get("mine");
    const species = searchParams.get("species");
    const province = searchParams.get("province");

    const session = await getSession();

    const where: Record<string, unknown> = { status: "active" };

    if (mine === "1" && session?.userId) {
      where.userId = session.userId;
      delete where.status;
    }

    if (species) where.species = { contains: species, mode: "insensitive" };
    if (province) where.province = province;

    const seedlings = await prisma.seedling.findMany({
      where,
      include: {
        user: { select: { id: true, username: true, points: true, region: true } },
        photos: { select: { id: true, storagePath: true }, orderBy: { createdAt: "asc" } },
        report: { include: { photos: { select: { id: true, storagePath: true }, orderBy: { createdAt: "asc" }, take: 5 } } },
        _count: { select: { requests: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ seedlings });
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error, "Gagal mengambil data bibit") },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const csrfToken = request.headers.get("x-csrf-token");
    if (!csrfToken || !(await verifyCsrfToken(csrfToken))) {
      return NextResponse.json({ error: "Invalid CSRF" }, { status: 403 });
    }

    const session = await getSession();
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
