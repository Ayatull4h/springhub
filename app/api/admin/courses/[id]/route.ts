import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";
import { getSession } from "@/lib/auth";

function isAdmin(session: { userId: string; role: string } | null) {
  return session?.role === "admin";
}

// GET /api/admin/courses/[id] — detail course untuk edit
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const course = await prisma.course.findUnique({
      where: { id: params.id },
      include: { modules: { orderBy: { sortOrder: "asc" } } },
    });
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }
    return NextResponse.json({ course });
  } catch (error) {
    console.error("Admin course fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT /api/admin/courses/[id] — update course + modules
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await request.json();
    const { slug, title, description, level, duration, icon, isActive, sortOrder, modules } = body;

    // Check slug uniqueness if changed
    if (slug) {
      const existing = await prisma.course.findFirst({
        where: { slug, NOT: { id: params.id } },
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
      where: { id: params.id },
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
        where: { courseId: params.id },
      });

      // Create new modules
      if (modules.length > 0) {
        await prisma.courseModule.createMany({
          data: modules.map(
            (m: { title: string; content?: string }, i: number) => ({
              courseId: params.id,
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
      where: { id: params.id },
      include: { modules: { orderBy: { sortOrder: "asc" } } },
    });

    return NextResponse.json({ course: updated });
  } catch (error) {
    console.error("Admin course update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/admin/courses/[id] — hapus course
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    await prisma.course.delete({
      where: { id: params.id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin course delete error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
