import { NextResponse } from "next/server";
import { prisma, getErrorMessage } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { uploadPhoto } from "@/lib/upload-photo";
import { verifyCsrfToken } from "@/lib/csrf";
export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const csrfToken = request.headers.get("x-csrf-token");
    if (!csrfToken || !(await verifyCsrfToken(csrfToken))) {
      return NextResponse.json({ error: "Invalid CSRF" }, { status: 403 });
    }

    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: "Harus login" }, { status: 401 });
    }

    const seedling = await prisma.seedling.findUnique({
      where: { id: (await params).id },
    });

    if (!seedling) {
      return NextResponse.json({ error: "Bibit tidak ditemukan" }, { status: 404 });
    }

    if (seedling.userId !== session.userId) {
      return NextResponse.json({ error: "Hanya pemilik yang bisa upload foto" }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get("photo") as File | null;

    if (!file) {
      return NextResponse.json({ error: "File foto wajib diupload" }, { status: 400 });
    }

    const result = await uploadPhoto(file, "seedlings");

    const photo = await prisma.seedlingPhoto.create({
      data: {
        seedlingId: seedling.id,
        storagePath: result.path,
      },
    });

    return NextResponse.json({ photo }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error, "Gagal upload foto") },
      { status: 500 }
    );
  }
}