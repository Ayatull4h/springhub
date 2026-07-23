import { prisma } from "@/lib/prisma";
import { POINTS_MAP, getForm } from "@/lib/forms";

/**
 * Points Engine — server-side points calculation per AGENTS.md.
 * Semua poin dihitung di server, tidak bisa dimanipulasi dari client.
 */

export type AwardResult = {
  pointsAwarded: number;
  reason: string;
  bonus: string[];
};

/**
 * Award points saat report di-approve.
 * - Points dasar dari POINTS_MAP
 * - Bonus laporan lengkap (semua field required terisi + notes)
 * - Bonus foto before/after (min 2 foto)
 */
export async function awardReportPoints(
  userId: string,
  reportId: string,
  formSlug: string,
  fieldData: Record<string, unknown>,
): Promise<AwardResult> {
  const bonus: string[] = [];
  let totalPoints = 0;

  // Admin tidak dapat poin — poin admin selalu 0
  const user = await prisma.profile.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (user?.role === "admin") {
    return { pointsAwarded: 0, reason: "Admin tidak mendapat poin", bonus: [] };
  }

  // Coba ambil base points: PointRule → DB form → POINTS_MAP
  let basePoints = 0;
  try {
    // 1. PointRule (admin atur di /admin/points)
    const rule = await prisma.pointRule.findFirst({
      where: { name: { contains: formSlug.replace(/-/g, " "), mode: "insensitive" } },
    });
    if (rule?.points && rule.points > 0) {
      basePoints = rule.points;
    } else {
      // 2. DB form pointsOnSubmit
      const dbForm = await prisma.form.findUnique({ where: { slug: formSlug }, select: { pointsOnSubmit: true } });
      if (dbForm?.pointsOnSubmit && dbForm.pointsOnSubmit > 0) {
        basePoints = dbForm.pointsOnSubmit;
      }
    }
  } catch {
    // ignore
  }
  if (basePoints === 0) {
    basePoints = POINTS_MAP[formSlug] ?? 0;
  }
  totalPoints += basePoints;

  const form = getForm(formSlug);
  if (form) {
    const requiredFields = form.fields.filter((f) => f.required);
    const allFilled = requiredFields.every((f) => {
      const val = fieldData[f.id];
      return val !== undefined && val !== null && val !== "";
    });
    if (allFilled && fieldData.notes) {
      totalPoints += 10;
      bonus.push("laporan_lengkap");
    }
  }

  if (fieldData.photo_before && fieldData.photo_after) {
    totalPoints += 15;
    bonus.push("foto_before_after");
  }

  if (totalPoints > 0) {
    await prisma.pointsLog.create({
      data: {
        userId,
        reportId,
        amount: totalPoints,
        reason: `Approved ${formSlug}`,
        metadata: JSON.stringify({ formSlug, bonus, basePoints }),
      },
    });

    await prisma.profile.update({
      where: { id: userId },
      data: { points: { increment: totalPoints } },
    });

    await checkMilestones(userId);

    // Auto-upgrade: volunteer → field_lead (≥20.000 poin)
    if (user?.role === "volunteer" || user?.role === "field_lead") {
      const profile = await prisma.profile.findUnique({
        where: { id: userId },
        select: { points: true, role: true },
      });
      if (profile) {
        if (profile.points >= 999999 && profile.role !== "admin") {
          await prisma.profile.update({
            where: { id: userId },
            data: { role: "admin" },
          });
        } else if (profile.points >= 20000 && profile.role === "volunteer") {
          await prisma.profile.update({
            where: { id: userId },
            data: { role: "field_lead" },
          });
        }
      }
    }
  }

  return { pointsAwarded: totalPoints, reason: `Approved ${formSlug}`, bonus };
}

/**
 * Check dan award milestone points.
 * Milestone: 10 → 50pts, 50 → 250pts, 100 → 500pts.
 */
async function checkMilestones(userId: string) {
  const totalApproved = await prisma.report.count({
    where: { userId, status: "approved" },
  });

  const milestones = [
    { count: 10, points: 50, key: "milestone_10" },
    { count: 50, points: 250, key: "milestone_50" },
    { count: 100, points: 500, key: "milestone_100" },
  ];

  for (const m of milestones) {
    if (totalApproved >= m.count) {
      const existing = await prisma.pointsLog.findFirst({
        where: { userId, reason: { contains: `Milestone ${m.count}` } },
      });
      if (!existing) {
        await prisma.pointsLog.create({
          data: {
            userId,
            amount: m.points,
            reason: `Milestone ${m.count} laporan`,
            metadata: JSON.stringify({ milestone: m.key, totalApproved }),
          },
        });
        await prisma.profile.update({
          where: { id: userId },
          data: { points: { increment: m.points } },
        });
      }
    }
  }
}

/**
 * Check streak harian dan mingguan.
 * - 3 hari berturut-turut → +5 pts
 * - 7 hari berturut-turut → +50 pts
 */
export async function checkDailyStreak(userId: string) {
  // Admin tidak dapat streak points
  const user = await prisma.profile.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (user?.role === "admin") return;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayReports = await prisma.report.count({
    where: {
      userId,
      status: "approved",
      createdAt: { gte: today },
    },
  });

  if (todayReports === 0) return;

  let streakDays = 1;
  for (let i = 1; i <= 6; i++) {
    const day = new Date(today);
    day.setDate(day.getDate() - i);
    const nextDay = new Date(day);
    nextDay.setDate(nextDay.getDate() + 1);

    const count = await prisma.report.count({
      where: {
        userId,
        status: "approved",
        createdAt: { gte: day, lt: nextDay },
      },
    });

    if (count > 0) {
      streakDays++;
    } else {
      break;
    }
  }

  if (streakDays >= 3) {
    const existing = await prisma.pointsLog.findFirst({
      where: {
        userId,
        reason: "Streak harian",
        createdAt: { gte: today },
      },
    });
    if (!existing) {
      await prisma.pointsLog.create({
        data: {
          userId,
          amount: 5,
          reason: "Streak harian",
          metadata: JSON.stringify({ streakDays }),
        },
      });
      await prisma.profile.update({
        where: { id: userId },
        data: { points: { increment: 5 } },
      });
    }
  }

  if (streakDays >= 7) {
    const existing = await prisma.pointsLog.findFirst({
      where: {
        userId,
        reason: "Streak mingguan",
        createdAt: { gte: today },
      },
    });
    if (!existing) {
      await prisma.pointsLog.create({
        data: {
          userId,
          amount: 50,
          reason: "Streak mingguan",
          metadata: JSON.stringify({ streakDays }),
        },
      });
      await prisma.profile.update({
        where: { id: userId },
        data: { points: { increment: 50 } },
      });
    }
  }
}

/**
 * Update trust score user.
 * - Accepted → +10
 * - Rejected → -10 (setelah ≥3 rejections, lihat route reject)
 * Range: 0-100. Score 0 triggers warning.
 */
export async function updateTrustScore(userId: string, accepted: boolean) {
  // Admin trust score tidak berubah
  const userRole = await prisma.profile.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (userRole?.role === "admin") return;

  const profile = await prisma.profile.findUnique({
    where: { id: userId },
    select: { trustScore: true },
  });
  if (!profile) return;

  const delta = accepted ? 10 : -10;
  const newScore = Math.max(0, Math.min(100, (profile.trustScore ?? 50) + delta));

  await prisma.profile.update({
    where: { id: userId },
    data: { trustScore: newScore },
  });

  if (newScore <= 0) {
    console.warn(`User ${userId} has trust score 0 — consider blocking`);
  }
}
