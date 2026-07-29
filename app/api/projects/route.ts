import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma, getErrorMessage } from "@/lib/prisma";
import { logError } from "@/lib/error-logger";
import { uploadPhoto } from "@/lib/upload-photo";
import { buildPhotoUrls } from "@/lib/photo-url";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const limitParam = url.searchParams.get("limit") || url.searchParams.get("per_page") || "50";
    const pageParam = url.searchParams.get("page") || "1";
    const limit = Math.min(Math.max(parseInt(limitParam, 10) || 50, 1), 200);
    const page = Math.max(parseInt(pageParam, 10) || 1, 1);
    const skip = (page - 1) * limit;

    const where = { status: "approved" as const };

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip,
        select: {
          id: true,
          title: true,
          summary: true,
          region: true,
          status: true,
          goalAmount: true,
          raisedAmount: true,
          typeId: true,
          likes: true,
          comments: true,
          createdAt: true,
          featuredPhotoId: true,
          user: { select: { username: true } },
          photos: { select: { id: true, storagePath: true }, take: 1 },
          _count: { select: { donations: true, commentList: true, photos: true } },
        },
      }),
      prisma.project.count({ where }),
    ]);

    const normalized = projects.map((p) => ({
      ...p,
      _count: { donations: p._count.donations, comments: p._count.commentList },
      featuredPhoto: p.featuredPhotoId
        ? p.photos.find(ph => ph.id === p.featuredPhotoId) || null
        : p.photos[0] || null,
      photos: buildPhotoUrls(p.photos),
    }));
    return NextResponse.json({ projects: normalized, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (err) {
    console.error("[Projects GET]", err);
    await logError({ message: "Projects GET error", level: "error", source: "api", stack: err instanceof Error ? err.stack : "" }).catch(() => {});
    return NextResponse.json({ projects: [] }, { status: 200 });
  }
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await prisma.profile.findUnique({
    where: { id: session.userId },
    select: { points: true, username: true, email: true, role: true, phone: true },
  });

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const canSubmit = profile.role === "admin" || profile.role === "field_lead";
  if (!canSubmit) {
    return NextResponse.json(
      { error: "Hanya Field Lead dan Admin yang bisa submit proyek. Kumpulkan 20.000 poin untuk jadi Field Lead." },
      { status: 403 }
    );
  }

  const contentType = request.headers.get("content-type") || "";
  if (!contentType.includes("multipart/form-data")) {
    return NextResponse.json({ error: "Multipart form data required" }, { status: 400 });
  }

  const formData = await request.formData();
  const fieldData: Record<string, unknown> = {};
  const photoFiles: File[] = [];
  const fieldPhotos: string[] = [];

  for (const [key, value] of formData.entries()) {
    if (key.startsWith("foto_") && typeof value === "object" && value !== null && (value as any).size > 0) {
      photoFiles.push(value as File);
      fieldPhotos.push(key);
    } else if (key === "proposalFile" && typeof value === "object" && value !== null) {
      const buffer = Buffer.from(await value.arrayBuffer());
      fieldData.proposalFile = `data:${value.type};base64,${buffer.toString("base64")}`;
    } else if (key !== "form_slug" && key !== "_submit_time" && key !== "_website" && key !== "_captured_at") {
      fieldData[key] = value as string;
    }
  }

  if (fieldPhotos.length < 3) {
    return NextResponse.json({ error: "Wajib upload 3 foto lokasi proyek." }, { status: 400 });
  }

  // Build summary from field data
  const title = (fieldData.B1_judul as string) || "";
  const tempat = (fieldData.B3_tempat as string) || "";
  const jenis = Array.isArray(fieldData.B2_jenis) ? (fieldData.B2_jenis as string[]).join(", ") : (fieldData.B2_jenis as string) || "";
  const latar = (fieldData.B4_latar as string) || "";
  const biaya = (fieldData.D1_biaya as string) || "";
  const region = tempat;
  const summary = latar.substring(0, 500);

  const project = await prisma.project.create({
    data: {
      title: title || "Proyek Baru",
      summary,
      region,
      typeId: jenis || "restoration",
      goalAmount: 0,
      contactName: (fieldData.A_nama as string) || profile.username,
      contactEmail: (fieldData.A_email as string) || profile.email,
      contactPhone: (fieldData.A_wa as string) || profile.phone || "",
      fieldData: JSON.stringify(fieldData),
      userId: session.userId,
      status: "pending",
    },
  });

  // Upload photos — simpan file ke disk + DB
  let featuredPhotoId: string | null = null;
  for (let i = 0; i < photoFiles.length; i++) {
    const file = photoFiles[i] as File;
    try {
      const result = await uploadPhoto(file, `projects/${project.id}`);
      const photo = await prisma.projectPhoto.create({
        data: { projectId: project.id, storagePath: result.path, mimeType: file.type || "image/jpeg" },
      });
      if (i === 0) featuredPhotoId = photo.id;
    } catch {}
  }

  // Set featured photo
  if (featuredPhotoId) {
    await prisma.project.update({
      where: { id: project.id },
      data: { featuredPhotoId },
    });
  }

  return NextResponse.json({ success: true, project }, { status: 201 });
}
