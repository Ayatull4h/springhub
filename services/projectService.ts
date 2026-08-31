import { prisma } from "@/lib/prisma";
import { buildPhotoUrls } from "@/lib/photo-url";

export async function listProjects(params: { limit: number; page: number }) {
  const where = { status: "approved" as const };
  const [projects, total] = await Promise.all([
    prisma.project.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: params.limit,
      skip: (params.page - 1) * params.limit,
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
        photos: { select: { id: true, storagePath: true }, take: 5 },
        _count: { select: { donations: true, commentList: true, photos: true } },
      },
    }),
    prisma.project.count({ where }),
  ]);
  const normalized = projects.map((p) => {
    const photosWithUrls = buildPhotoUrls(p.photos);
    return {
      ...p,
      _count: { donations: p._count.donations, comments: p._count.commentList },
      featuredPhoto: p.featuredPhotoId ? photosWithUrls.find((ph) => ph.id === p.featuredPhotoId) || photosWithUrls[0] || null : photosWithUrls[0] || null,
      photos: photosWithUrls,
    };
  });
  return { projects: normalized, pagination: { page: params.page, limit: params.limit, total, totalPages: Math.ceil(total / params.limit) } };
}
