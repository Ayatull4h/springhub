import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma, getErrorMessage, isDatabaseError } from "@/lib/prisma";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const url = new URL(request.url);
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(10, parseInt(url.searchParams.get("limit") || "50", 10)));
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      prisma.profile.findMany({
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          username: true,
          role: true,
          phone: true,
          region: true,
          points: true,
          trustScore: true,
          createdAt: true,
        },
      }),
      prisma.profile.count(),
    ]);

    return NextResponse.json({ users, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error, "Gagal memuat data users") },
      { status: isDatabaseError(error) ? 503 : 500 }
    );
  }
}
