import { NextResponse } from "next/server";
import { prisma, getErrorMessage, isDatabaseError } from "@/lib/prisma";
import { sanitizeHtml } from "@/lib/sanitize";
export const dynamic = "force-dynamic";

// GET /api/courses/[slug] — detail course termasuk semua modul
// Konten modul di-sanitize di server (DOMPurify) sebelum dikirim ke client.
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const course = await prisma.course.findUnique({
      where: { slug: (await params).slug, isActive: true },
      include: { modules: { orderBy: { sortOrder: "asc" } } },
    });
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }
    const sanitized = {
      ...course,
      description: course.description ? await sanitizeHtml(course.description) : "",
      modules: await Promise.all(
        course.modules.map(async (m) => ({
          ...m,
          content: m.content ? await sanitizeHtml(m.content) : "",
        }))
      ),
    };
    return NextResponse.json({ course: sanitized });
  } catch (error) {
    console.error("Course fetch error:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: getErrorMessage(error, "Terjadi kesalahan.") },
      { status: isDatabaseError(error) ? 503 : 500 }
    );
  }
}
