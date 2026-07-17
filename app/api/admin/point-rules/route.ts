import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma, getErrorMessage, isDatabaseError } from "@/lib/prisma";
import { verifyCsrfToken } from "@/lib/csrf";
import { auditLog } from "@/lib/audit";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const rules = await prisma.pointRule.findMany({
      orderBy: { sortOrder: "asc" },
    });
    return NextResponse.json({ rules });
  } catch (error) {
    console.error("Failed to fetch point rules::", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: getErrorMessage(error, "Gagal memuat data.") },
      { status: isDatabaseError(error) ? 503 : 500 }
    );
  }
}

export async function POST(request: Request) {
  // CSRF protection
  const csrfToken = request.headers.get("x-csrf-token");
  if (!csrfToken || !(await verifyCsrfToken(csrfToken))) {
    return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
  }


  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { name, description, points, category, icon, isActive, sortOrder } = body;

    if (!name || points === undefined || !category) {
      return NextResponse.json(
        { error: "name, points, and category are required" },
        { status: 400 }
      );
    }

    const rule = await prisma.pointRule.create({
      data: {
        name,
        description: description ?? "",
        points: Number(points),
        category,
        icon: icon ?? "Star",
        isActive: isActive ?? true,
        sortOrder: sortOrder ?? 0,
      },
    });

    auditLog("post point-rule", "created point-rule " + rule.id);
    return NextResponse.json({ rule }, { status: 201 });
  } catch (error) {
    console.error("Failed to create point rule::", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: getErrorMessage(error, "Gagal menambah data.") },
      { status: isDatabaseError(error) ? 503 : 500 }
    );
  }
}
