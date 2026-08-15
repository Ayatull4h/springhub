import { NextResponse } from "next/server";
import { prisma, getErrorMessage, isDatabaseError } from "@/lib/prisma";
export const dynamic = "force-dynamic";
import { getSession } from "@/lib/auth";
import { verifyCsrfToken } from "@/lib/csrf";
import { apiLimiter } from "@/lib/rate-limit";

// GET /api/courses/progress — progress user yang login
export async function GET() {
  const session = await getSession();
  if (!session?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const progress = await prisma.coursesProgress.findMany({
      where: { userId: session.userId },
      include: { course: { select: { title: true, slug: true } } },
    });
    return NextResponse.json({ progress });
  } catch (error) {
    console.error("Progress fetch error:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: getErrorMessage(error, "Terjadi kesalahan.") },
      { status: isDatabaseError(error) ? 503 : 500 }
    );
  }
}

// PUT /api/courses/progress — update progress modul
export async function PUT(request: Request) {
  try {
    // CSRF
    const csrfToken = request.headers.get("x-csrf-token");
    if (!csrfToken || !(await verifyCsrfToken(csrfToken))) {
      return NextResponse.json({ error: "Invalid CSRF" }, { status: 403 });
    }

    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limit — cegah klaim poin massal
    const limitResult = await apiLimiter.check(`course-progress:${session.userId}`);
    if (!limitResult.allowed) {
      return NextResponse.json(
        { error: "Terlalu banyak permintaan. Silakan coba lagi nanti." },
        { status: 429 }
      );
    }

    const { courseId, courseSlug, completedModules, totalModules } =
      await request.json();

    // H-5: verifikasi course benar-benar ada + slug cocok (cegah klaim poin kursus fiktif)
    const course = await prisma.course.findFirst({
      where: { OR: [{ id: courseId || "" }, { slug: courseSlug || "" }] },
      select: { id: true, slug: true },
    });
    if (!course) {
      return NextResponse.json({ error: "Course tidak ditemukan" }, { status: 404 });
    }
    const actualSlug = course.slug;
    const actualCourseId = course.id;
    const total = Math.min(Math.max(Number(totalModules) || 1, 1), 100);
    const completedCount = Math.min(Math.max(Number(completedModules) || 0, 0), total);
    const completed = completedCount >= total;

    const progress = await prisma.coursesProgress.upsert({
      where: {
        userId_courseSlug: {
          userId: session.userId,
          courseSlug: actualSlug,
        },
      },
      update: { completedModules: completedCount, totalModules: total, completed, courseId: actualCourseId },
      create: {
        userId: session.userId,
        courseId: actualCourseId,
        courseSlug: actualSlug,
        completedModules: completedCount,
        totalModules: total,
        completed,
      },
    });

    // Award points if newly completed
    let pointsAwarded = 0;
    if (completed) {
      const existing = await prisma.pointsLog.findFirst({
        where: {
          userId: session.userId,
          reason: { contains: `Course ${actualSlug}` },
        },
      });
      if (!existing) {
        // Baca poin dari PointRule, fallback 25
        const rule = await prisma.pointRule.findFirst({
          where: { name: { contains: "Course", mode: "insensitive" } },
        });
        const coursePoints = rule?.points || 25;
        await prisma.pointsLog.create({
          data: {
            userId: session.userId,
            amount: coursePoints,
            reason: `Course ${actualSlug} completed`,
            metadata: JSON.stringify({ courseSlug: actualSlug }),
          },
        });
        await prisma.profile.update({
          where: { id: session.userId },
          data: { points: { increment: coursePoints } },
        });
        pointsAwarded = coursePoints;
      }
    }

    return NextResponse.json({ progress, pointsAwarded });
  } catch (error) {
    console.error("Progress update error:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: getErrorMessage(error, "Terjadi kesalahan.") },
      { status: isDatabaseError(error) ? 503 : 500 }
    );
  }
}
