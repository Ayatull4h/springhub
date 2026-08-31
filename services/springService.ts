import { prisma } from "@/lib/prisma";

export async function listActiveSprings() {
  const springs = await prisma.spring.findMany({
    where: { status: "active" },
    select: {
      id: true,
      name: true,
      snappedLat: true,
      snappedLng: true,
      province: true,
      regency: true,
      healthScore: true,
      healthStatus: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { reports: { where: { status: "approved" } } } },
    },
    orderBy: { name: "asc" },
  });

  const groupsMap = new Map<string, typeof springs>();
  for (const s of springs) {
    if (s.snappedLat === null || s.snappedLng === null) continue;
    const key = `${s.snappedLat.toFixed(3)}_${s.snappedLng.toFixed(3)}`;
    if (!groupsMap.has(key)) groupsMap.set(key, []);
    groupsMap.get(key)!.push(s);
  }

  const groups = Array.from(groupsMap.entries())
    .map(([key, items]) => {
      const [lat, lng] = key.split("_").map(Number);
      const totalReports = items.reduce((sum, s) => sum + (s._count?.reports || 0), 0);
      const latest = items.reduce((a, s) => (!a || (s.updatedAt && s.updatedAt > a.updatedAt) ? s : a), items[0]);
      return {
        snappedLat: lat,
        snappedLng: lng,
        totalSprings: items.length,
        totalReports,
        springs: items.map((s) => ({
          id: s.id,
          name: s.name,
          snappedLat: s.snappedLat,
          snappedLng: s.snappedLng,
          province: s.province,
          regency: s.regency,
          healthScore: s.healthScore,
          healthStatus: s.healthStatus,
          reportCount: s._count?.reports || 0,
          updatedAt: s.updatedAt,
        })),
        latestName: items.length === 1 ? items[0].name : `${items.length} mata air`,
        latestRegion: latest?.province ? [latest.province, latest.regency].filter(Boolean).join(", ") : "",
        latestUpdate: latest?.updatedAt,
      };
    })
    .sort((a, b) => {
      if (b.totalReports !== a.totalReports) return b.totalReports - a.totalReports;
      return (b.latestUpdate?.getTime() || 0) - (a.latestUpdate?.getTime() || 0);
    });

  return { groups };
}

export async function getSpringDetail(id: string) {
  const spring = await prisma.spring.findUnique({
    where: { id },
    include: {
      reports: {
        where: { isActive: true, status: "approved" },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          formSlug: true,
          status: true,
          fieldData: true,
          snappedLat: true,
          snappedLng: true,
          featuredPhotoId: true,
          createdAt: true,
          user: { select: { username: true, region: true } },
          photos: {
            orderBy: { createdAt: "asc" },
            select: { id: true, fieldId: true, storagePath: true, mimeType: true, width: true, height: true, createdAt: true },
          },
        },
      },
    },
  });
  return spring;
}
