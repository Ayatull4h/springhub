import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logError } from "@/lib/error-logger";
export const dynamic = "force-dynamic";
import { PROJECT_PROPOSAL_THRESHOLD } from "@/lib/data";

const projectSchema = z.object({
  title: z.string().min(3, "Judul minimal 3 karakter"),
  summary: z.string().min(10, "Ringkasan minimal 10 karakter"),
  region: z.string().min(1, "Region wajib diisi"),
  typeId: z.string().min(1, "Tipe proyek wajib dipilih"),
  goalAmount: z.number().min(100000, "Minimal target Rp 100.000"),
  contactName: z.string().min(1, "Nama kontak wajib diisi"),
  contactEmail: z.string().email("Email tidak valid"),
  contactPhone: z.string().regex(/^(0[1-9]\d{8,11}|\+62\d{8,13})$/, "Format nomor WA tidak valid"),
  proposalFile: z.string().optional(),
});

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const limitParam = url.searchParams.get("limit") || url.searchParams.get("per_page") || "50";
    const pageParam = url.searchParams.get("page") || "1";
    const limit = Math.min(Math.max(parseInt(limitParam, 10) || 50, 1), 200);
    const page = Math.max(parseInt(pageParam, 10) || 1, 1);
    const skip = (page - 1) * limit;

    const where = { status: { in: ["approved" as const, "under_review" as const] } };

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip,
        select: {
          id: true,
          title: true,
          summary: true,
          region: true,
          status: true,
          goalAmount: true,
          raisedAmount: true,
          typeId: true,
          likes: true,
          comments: true,
          createdAt: true,
          user: { select: { username: true } },
          _count: { select: { donations: true, commentList: true } },
        },
      }),
      prisma.project.count({ where }),
    ]);

    const normalized = projects.map((p) => ({
      ...p,
      _count: { donations: p._count.donations, comments: p._count.commentList },
    }));
    return NextResponse.json({ projects: normalized, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (err) {
    console.error("[Projects GET]", err);
    await logError({ message: "Projects GET error", level: "error", source: "api", stack: err instanceof Error ? err.stack : "" }).catch(() => {});
    return NextResponse.json({ projects: [] }, { status: 200 });
  }
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check eligibility: >= 20K points (admin selalu diizinkan)
  const profile = await prisma.profile.findUnique({
    where: { id: session.userId },
    select: { points: true, username: true, email: true, role: true },
  });

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const canSubmit = profile.role === "admin" || profile.role === "field_lead";
  if (!canSubmit) {
    return NextResponse.json(
      {
        error: `Hanya Field Lead dan Admin yang bisa submit proyek. Kumpulkan 20.000 poin untuk jadi Field Lead.`,
      },
      { status: 403 }
    );
  }

  // Accept both multipart/form-data and JSON
  const contentType = request.headers.get("content-type") || "";
  let body: Record<string, unknown> = {};

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    for (const [key, value] of formData.entries()) {
      if (key === "proposalFile" && value instanceof File) {
        const buffer = Buffer.from(await value.arrayBuffer());
        body.proposalFile = `data:${value.type};base64,${buffer.toString("base64")}`;
      } else {
        body[key] = value as string;
      }
    }
    if (body.goalAmount) body.goalAmount = parseInt(body.goalAmount as string, 10);
  } else {
    body = await request.json();
  }

  // Isi default dari session jika tidak disediakan
  if (!body.contactName) body.contactName = profile.username;
  if (!body.contactEmail) body.contactEmail = profile.email;

  const parsed = projectSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const project = await prisma.project.create({
    data: {
      ...parsed.data,
      userId: session.userId,
      status: "pending",
    },
  });

  return NextResponse.json({ success: true, project }, { status: 201 });
}
