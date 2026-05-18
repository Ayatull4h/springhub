import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

function isAdmin(session: { userId: string; role: string } | null) {
  return session?.role === "admin";
}

// GET /api/admin/courses — semua course (termasuk tidak aktif)
export async function GET() {
  const session = await getSession();
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const courses = await prisma.course.findMany({
      orderBy: { sortOrder: "asc" },
      include: {
        modules: { orderBy: { sortOrder: "asc" } },
        _count: { select: { progress: true } },
      },
    });
    return NextResponse.json({ courses });
  } catch (error) {
    console.error("Admin courses fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/admin/courses — buat course baru + modul
export async function POST(request: Request) {
  const session = await getSession();
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await request.json();
    const { slug, title, description, level, duration, icon, modules } = body;

    // Validate required fields
    if (!slug || !title) {
      return NextResponse.json(
        { error: "Slug and title are required" },
        { status: 400 }
      );
    }

    // Check slug uniqueness
    const existing = await prisma.course.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json(
        { error: "A course with this slug already exists" },
        { status: 409 }
      );
    }

    const course = await prisma.course.create({
      data: {
        slug,
        title,
        description: description || "",
        level: level || "Beginner",
        duration: duration || "30 min",
        icon: icon || "BookOpen",
        modules: modules?.length
          ? {
              create: modules.map(
                (m: { title: string; content?: string }, i: number) => ({
                  title: m.title,
                  content: m.content || "",
                  sortOrder: i,
                })
              ),
            }
          : undefined,
      },
      include: { modules: { orderBy: { sortOrder: "asc" } } },
    });
    return NextResponse.json({ course }, { status: 201 });
  } catch (error) {
    console.error("Admin course create error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
