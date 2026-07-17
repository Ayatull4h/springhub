import { prisma } from "./prisma";
import logger from "./logger";

/**
 * Hapus report guest yang lebih dari 30 hari dan belum di-claim.
 * Juga hapus foto dari storage yang terkait.
 * Dipanggil via cron job setiap 24 jam.
 */
export async function cleanupGuestReports(): Promise<number> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const expiredReports = await prisma.report.findMany({
    where: {
      guestId: { not: null },
      userId: null,
      createdAt: { lt: thirtyDaysAgo },
    },
    include: {
      photos: { select: { storagePath: true } },
    },
  });

  if (expiredReports.length === 0) return 0;

  const photoPaths = expiredReports.flatMap((r) =>
    r.photos.map((p) => p.storagePath)
  );

  // Hapus cascade via Prisma (ReportPhoto punya onDelete: Cascade)
  await prisma.report.deleteMany({
    where: { id: { in: expiredReports.map((r) => r.id) } },
  });

  logger.info({ count: expiredReports.length, photos: photoPaths.length }, "Cleaned up unclaimed guest reports");

  return expiredReports.length;
}

/**
 * Hapus session yang sudah expired.
 */
export async function cleanupExpiredSessions(): Promise<number> {
  const result = await prisma.session.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });

  if (result.count > 0) {
    logger.info({ count: result.count }, "Cleaned up expired sessions");
  }

  return result.count;
}

/**
 * Hapus file export CSV yang sudah lebih dari 7 hari.
 * (hanya path di DB — file di R2 perlu dihapus terpisah)
 */
export async function cleanupExpiredExports(): Promise<number> {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  // Exports disimpan di PointsLog dengan reason "export"
  const expiredExports = await prisma.pointsLog.findMany({
    where: {
      reason: "export",
      createdAt: { lt: sevenDaysAgo },
    },
    select: { id: true },
  });

  if (expiredExports.length > 0) {
    await prisma.pointsLog.deleteMany({
      where: { id: { in: expiredExports.map((e) => e.id) } },
    });
  }

  return expiredExports.length;
}
