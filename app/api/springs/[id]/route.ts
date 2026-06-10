import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const spring = await prisma.spring.findUnique({
      where: { id: params.id },
      include: {
        reports: {
          where: { status: "approved" },
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            formSlug: true,
            status: true,
            fieldData: true,
            snappedLat: true,
            snappedLng: true,
            createdAt: true,
            user: { select: { username: true } },
            photos: {
              select: { id: true, fieldId: true, storagePath: true },
              take: 3,
            },
          },
        },
      },
    });

    if (!spring) {
      return NextResponse.json({ error: "Spring not found" }, { status: 404 });
    }

    return NextResponse.json({ spring });
  } catch (error) {
    console.error("Spring detail error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
