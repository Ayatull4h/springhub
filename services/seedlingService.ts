import { prisma } from "@/lib/prisma";

export async function listSeedlings(params: { mine?: string; species?: string; province?: string; userId?: string | null }) {
  const where: Record<string, unknown> = { status: "active" };
  if (params.mine === "1" && params.userId) {
    (where as any).userId = params.userId;
    delete (where as any).status;
  }
  if (params.species) where.species = { contains: params.species, mode: "insensitive" };
  if (params.province) where.province = params.province;

  const includeBase: Record<string, unknown> = {
    user: { select: { id: true, username: true, region: true } },
    photos: { select: { id: true, storagePath: true }, orderBy: { createdAt: "asc" } },
    _count: { select: { requests: true } },
  };

  const seedlings = await prisma.seedling.findMany({
    where,
    include: includeBase as any,
    orderBy: { createdAt: "desc" },
  });
  return { seedlings };
}
