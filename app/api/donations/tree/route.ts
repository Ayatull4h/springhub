import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getGuestId } from "@/lib/guest";
import { z } from "zod";

const treeSchema = z.object({
  donorName: z.string().min(1, "Nama wajib diisi"),
  donorEmail: z.string().email("Email tidak valid").optional().or(z.literal("")),
  donorPhone: z.string().optional(),
  treeCount: z.coerce.number().min(1, "Minimal 1 bibit"),
  treeSpecies: z.string().optional(),
});

export async function POST(request: Request) {
  const session = await getSession();
  try {
    const body = await request.json();
    const parsed = treeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const donation = await prisma.treeDonation.create({
      data: {
        ...parsed.data,
        userId: session?.userId ?? "",
        status: "pending",
      },
    });

    return NextResponse.json({ success: true, donation });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const donations = await prisma.treeDonation.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ donations });
}
