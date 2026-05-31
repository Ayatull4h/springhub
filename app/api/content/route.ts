import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrSet } from "@/lib/cache";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const section = searchParams.get("section");

  if (!section) {
    return NextResponse.json({ error: "section parameter required" }, { status: 400 });
  }

  const items = await getOrSet("content", section, () =>
    prisma.contentBlock.findMany({
      where: { section, isActive: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    }),
    600
  );

  return NextResponse.json({ items });
}
