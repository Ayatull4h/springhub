import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";

// GET /api/courses/[slug] — detail course termasuk semua modul
export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const course = await prisma.course.findUnique({
      where: { slug: params.slug, isActive: true },
      include: { modules: { orderBy: { sortOrder: "asc" } } },
    });
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }
    return NextResponse.json({ course });
  } catch (error) {
    console.error("Course fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
