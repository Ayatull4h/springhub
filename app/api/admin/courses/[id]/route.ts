import { NextResponse } from "next/server";
import { prisma, getErrorMessage, isDatabaseError } from "@/lib/prisma";
export const dynamic = "force-dynamic";
import { getSession } from "@/lib/auth";
import { verifyCsrfToken } from "@/lib/csrf";
import { auditLog } from "@/lib/audit";

function isAdmin(session: { userId: string; role: string } | null) {
  return session?.role === "admin";
}

// GET /api/admin/courses/[id] — detail course untuk edit
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getSession();
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  try {
    const course = await prisma.course.findUnique({
      where: { id: id },
      include: { modules: { orderBy: { sortOrder: "asc" } } },
    });
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }
    auditLog("put course", "course " + course.id);
    return NextResponse.json({ course });
  } catch (error) {
    console.error("Admin course fetch error::", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: getErrorMessage(error, "Gagal memuat data.") },
      { status: isDatabaseError(error) ? 503 : 500 }
    );
  }
}

// PUT /api/admin/courses/[id] — update course + modules
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  // CSRF protection
  const csrfToken = request.headers.get("x-csrf-token");
  if (!csrfToken || !(await verifyCsrfToken(csrfToken))) {
    return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
  }
  const session = await getSession();
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  try {
    const body = await request.json();
    const { slug, title, description, level, duration, icon, isActive, sortOrder, modules } = body;

    // Check slug uniqueness if changed
    if (slug) {
      const existing = await prisma.course.findFirst({
        where: { slug, NOT: { id: id } },
      });
      if (existing) {
        return NextResponse.json(
          { error: "A course with this slug already exists" },
          { status: 409 }
        );
      }
    }

    // Update course
    const course = await prisma.course.update({
      where: { id: id },
      data: {
        ...(slug !== undefined && { slug }),
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(level !== undefined && { level }),
        ...(duration !== undefined && { duration }),
        ...(icon !== undefined && { icon }),
        ...(isActive !== undefined && { isActive }),
        ...(sortOrder !== undefined && { sortOrder }),
      },
    });

    // Update modules if provided
    if (modules && Array.isArray(modules)) {
      // Delete existing modules
      await prisma.courseModule.deleteMany({
        where: { courseId: id },
      });

      // Create new modules
      if (modules.length > 0) {
        await prisma.courseModule.createMany({
          data: modules.map(
            (m: { title: string; content?: string }, i: number) => ({
              courseId: id,
              title: m.title,
              content: m.content || "",
              sortOrder: i,
            })
          ),
        });
      }
    }

    // Return updated course with modules
    const updated = await prisma.course.findUnique({
      where: { id: id },
      include: { modules: { orderBy: { sortOrder: "asc" } } },
    });

    return NextResponse.json({ course: updated });
  } catch (error) {
    console.error("Admin course update error::", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: getErrorMessage(error, "Gagal mengupdate data.") },
      { status: isDatabaseError(error) ? 503 : 500 }
    );
  }
}

// DELETE /api/admin/courses/[id] — hapus course
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  // CSRF protection
  const csrfToken = request.headers.get("x-csrf-token");
  if (!csrfToken || !(await verifyCsrfToken(csrfToken))) {
    return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
  }
  const session = await getSession();
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  try {
    await prisma.course.delete({
      where: { id: id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin course delete error::", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: getErrorMessage(error, "Gagal menghapus data.") },
      { status: isDatabaseError(error) ? 503 : 500 }
    );
  }
}
