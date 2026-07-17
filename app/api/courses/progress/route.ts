import { NextResponse } from "next/server";
import { prisma, getErrorMessage, isDatabaseError } from "@/lib/prisma";
export const dynamic = "force-dynamic";
import { getSession } from "@/lib/auth";

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
  const session = await getSession();
  if (!session?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { courseId, courseSlug, completedModules, totalModules } =
      await request.json();
    const completed = completedModules >= totalModules;

    const progress = await prisma.coursesProgress.upsert({
      where: {
        userId_courseSlug: {
          userId: session.userId,
          courseSlug: courseSlug || "",
        },
      },
      update: { completedModules, totalModules, completed, courseId },
      create: {
        userId: session.userId,
        courseId: courseId || "",
        courseSlug: courseSlug || "",
        completedModules,
        totalModules,
        completed,
      },
    });

    // Award points if newly completed
    let pointsAwarded = 0;
    if (completed) {
      const existing = await prisma.pointsLog.findFirst({
        where: {
          userId: session.userId,
          reason: { contains: `Course ${courseSlug}` },
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
            reason: `Course ${courseSlug} completed`,
            metadata: JSON.stringify({ courseSlug }),
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
