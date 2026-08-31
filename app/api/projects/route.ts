import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma, getErrorMessage } from "@/lib/prisma";
import { verifyCsrfToken } from "@/lib/csrf";
import { apiLimiter } from "@/lib/rate-limit";
import { uploadPhoto } from "@/lib/upload-photo";
import { list } from "@/controllers/projectController";
import { guard } from "@/middlewares/guard";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    try { await guard(request, { rate: "public", csrf: false }); } catch (e) { if (e instanceof Response) return e; throw e; }
    return list(request);
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }
}

export async function POST(request: Request) {
  try {
    // CSRF
    const csrfToken = request.headers.get("x-csrf-token");
    if (!csrfToken || !(await verifyCsrfToken(csrfToken))) {
      return NextResponse.json({ error: "Invalid CSRF" }, { status: 403 });
    }

    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limit
    const limitResult = await apiLimiter.check(`project:${session.userId}`);
    if (!limitResult.allowed) {
      return NextResponse.json(
        { error: "Terlalu banyak permintaan. Silakan coba lagi nanti." },
        { status: 429 }
      );
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

    // ── Anti-spam: Time Gate ──
    const submitTime = formData.get("_submit_time") as string;
    if (submitTime) {
      const parsedTime = parseInt(submitTime, 10);
      if (!isNaN(parsedTime) && Date.now() - parsedTime < 3000) {
        return NextResponse.json(
          { error: "Terlalu cepat. Silakan isi formulir dengan benar." },
          { status: 429 }
        );
      }
    }

    // ── Anti-spam: Honeypot ──
    const honeypot = formData.get("_website") as string;
    if (honeypot) {
      return NextResponse.json({ success: true, honeypot: true });
    }

    const fieldData: Record<string, unknown> = {};
    const photoFiles: File[] = [];
    const fieldPhotos: string[] = [];

    for (const [key, value] of formData.entries()) {
      if (key.startsWith("foto_") && typeof value === "object" && value !== null && (value as any).size > 0) {
        if (photoFiles.length < 5) {
          photoFiles.push(value as File);
          fieldPhotos.push(key);
        }
      } else if (key === "proposalFile" && typeof value === "object" && value !== null) {
        // C-3: batasi ukuran dokumen (maks 5MB) + hanya PDF/DOC/DOCX
        const arrayBuffer = await value.arrayBuffer();
        if (arrayBuffer.byteLength > 5 * 1024 * 1024) {
          return NextResponse.json(
            { error: "File proposal maksimal 5MB." },
            { status: 400 }
          );
        }
        const mime = (value.type || "").toLowerCase();
        if (mime && !["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"].includes(mime)) {
          return NextResponse.json(
            { error: "File proposal harus PDF atau DOC/DOCX." },
            { status: 400 }
          );
        }
        const buffer = Buffer.from(arrayBuffer);
        fieldData.proposalFile = `data:${mime || "application/pdf"};base64,${buffer.toString("base64")}`;
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
  } catch (error) {
    console.error("Projects POST error:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: getErrorMessage(error, "Gagal menyimpan proyek.") },
      { status: 500 }
    );
  }
}
