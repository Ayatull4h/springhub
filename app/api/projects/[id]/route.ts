import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildPhotoUrls } from "@/lib/photo-url";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getSession();
    const isAdmin = session?.role === "admin";

    const project = await prisma.project.findUnique({
      where: { id: params.id },
      include: {
        user: { select: { username: true } },
        photos: { select: { id: true, storagePath: true }, orderBy: { createdAt: "asc" } },
        _count: { select: { donations: true, commentList: true } },
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Non-admin hanya bisa lihat project approved
    if (!isAdmin && project.status !== "approved") {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    let fieldData: Record<string, unknown> = {};
    try { fieldData = JSON.parse(project.fieldData || "{}"); } catch {}

    const photosWithUrls = buildPhotoUrls(project.photos);
    const featured = project.featuredPhotoId
      ? photosWithUrls.find(p => p.id === project.featuredPhotoId) || photosWithUrls[0] || null
      : photosWithUrls[0] || null;

    // C-1: kontak + proposal + fieldData hanya untuk admin (pemilik proyek pun tak dapat kontak penuh di endpoint publik)
    const isOwner = session?.userId && project.userId === session.userId;
    const showSensitive = isAdmin || isOwner;

    // Untuk publik: hapus field berpotensi PII dari fieldData
    const publicFieldData: Record<string, unknown> = {};
    if (showSensitive) {
      Object.assign(publicFieldData, fieldData);
    } else {
      for (const [k, v] of Object.entries(fieldData)) {
        if (k.startsWith("A_")) continue; // A_nama, A_wa, A_email
        publicFieldData[k] = v;
      }
    }

    const normalized = {
      id: project.id,
      title: project.title,
      summary: project.summary,
      region: project.region,
      typeId: project.typeId,
      status: project.status,
      goalAmount: project.goalAmount,
      raisedAmount: project.raisedAmount,
      likes: project.likes,
      createdAt: project.createdAt,
      contactName: showSensitive ? project.contactName : null,
      contactEmail: showSensitive ? project.contactEmail : null,
      contactPhone: showSensitive ? project.contactPhone : null,
      proposalFile: showSensitive ? (project.proposalFile || (fieldData.proposalFile as string) || null) : null,
      featuredPhoto: featured ? { id: featured.id, url: featured.url } : null,
      photos: photosWithUrls,
      fieldData: publicFieldData,
      user: project.user ? { username: project.user.username } : null,
      _count: { donations: project._count.donations, comments: project._count.commentList },
    };
    return NextResponse.json({ project: normalized });
  } catch (err) {
    console.error("[Project GET by ID]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
