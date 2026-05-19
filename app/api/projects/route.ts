import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
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

export async function GET() {
  const projects = await prisma.project.findMany({
    where: { status: { in: ["approved", "under_review"] } },
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { username: true } },
      _count: { select: { donations: true } },
    },
  });

  return NextResponse.json({ projects });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check eligibility: >= 20K points
  const profile = await prisma.profile.findUnique({
    where: { id: session.userId },
    select: { points: true, username: true, email: true },
  });

  if (!profile || profile.points < PROJECT_PROPOSAL_THRESHOLD) {
    return NextResponse.json(
      {
        error: `Minimal ${PROJECT_PROPOSAL_THRESHOLD.toLocaleString("id-ID")} poin untuk submit proyek`,
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
        // Baca file dan encode sebagai base64 (sementara sampai ada file storage)
        const buffer = Buffer.from(await value.arrayBuffer());
        body.proposalFile = `data:${value.type};base64,${buffer.toString("base64")}`;
      } else {
        body[key] = value as string;
      }
    }
    // Parse numbers
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
