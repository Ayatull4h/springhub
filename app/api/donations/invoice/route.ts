import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DONATION_TIERS } from "@/lib/xendit";

const invoiceSchema = z.object({
  amountIdr: z.number().min(1000, "Minimum donasi Rp 1.000"),
  donorName: z.string().min(1, "Nama wajib diisi"),
  donorEmail: z.string().email("Email tidak valid"),
  tierId: z.string().optional(),
  projectId: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const session = await getSession();

    const body = await request.json();
    const parsed = invoiceSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { amountIdr, donorName, donorEmail, tierId, projectId } = parsed.data;

    // Generate dummy invoice
    const invoiceId = `INV-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const externalId = `springhub-${invoiceId}`;

    // Store donation record
    const donation = await prisma.donation.create({
      data: {
        userId: session?.userId ?? null,
        projectId: projectId ?? null,
        invoiceId,
        externalId,
        amountIdr,
        tierId: tierId ?? "custom",
        donorName,
        donorEmail,
        status: "pending",
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      },
    });

    // Dummy checkout URL
    const invoiceUrl = `/donate/checkout?invoice=${invoiceId}`;

    return NextResponse.json({
      success: true,
      invoice: {
        id: donation.id,
        invoiceId,
        invoiceUrl,
        amountIdr,
        status: "pending",
        expiresAt: donation.expiresAt,
      },
    });
  } catch (error) {
    console.error("Invoice creation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
