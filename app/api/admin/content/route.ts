import { NextResponse } from "next/server";
import { prisma, getErrorMessage, isDatabaseError } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { z } from "zod";
import { verifyCsrfToken } from "@/lib/csrf";
import { auditLog } from "@/lib/audit";

const contentSchema = z.object({
  section: z.string().min(1),
  type: z.string().optional(),
  title: z.string().min(1),
  subtitle: z.string().optional(),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  linkUrl: z.string().optional(),
  linkLabel: z.string().optional(),
  data: z.string().optional(),
  sortOrder: z.number().optional(),
  isActive: z.boolean().optional(),
});

export async function GET(request: Request) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const section = searchParams.get("section");

  const where = section ? { section } : {};
  const items = await prisma.contentBlock.findMany({
    where,
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });

  return NextResponse.json({ items });
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
    const parsed = contentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data", details: parsed.error.flatten() }, { status: 400 });
    }

    const item = await prisma.contentBlock.create({ data: parsed.data });    auditLog("post item", "post item");

    return NextResponse.json({ success: true, item });
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error, "Failed to create") },
      { status: isDatabaseError(error) ? 503 : 500 }
    );
  }
}
