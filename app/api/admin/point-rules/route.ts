import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
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
    console.error("Failed to fetch point rules:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
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

    return NextResponse.json({ rule }, { status: 201 });
  } catch (error) {
    console.error("Failed to create point rule:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
