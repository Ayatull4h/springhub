import { NextResponse } from "next/server";
import { prisma, getErrorMessage, isDatabaseError } from "@/lib/prisma";
export const dynamic = "force-dynamic";
import { randomUUID } from "crypto";
import { createInvoice, DONATION_TIERS } from "@/lib/xendit";
import { getSession } from "@/lib/auth";
import { verifyCsrfToken } from "@/lib/csrf";
import { donationLimiter } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    // CSRF check
    const csrfToken = request.headers.get("x-csrf-token");
    if (!csrfToken || !(await verifyCsrfToken(csrfToken))) {
      return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
    }

    const session = await getSession();
    const rateKey = session?.userId ?? (request.headers.get("x-forwarded-for") || "unknown");
    const limiter = await donationLimiter.check(`donation:${rateKey}`);
    if (!limiter.allowed) {
      return NextResponse.json(
        { error: "Terlalu banyak permintaan donasi. Silakan coba lagi nanti." },
        { status: 429 }
      );
    }

    const cl = request.headers.get("content-length");
    if (cl && parseInt(cl, 10) > 100_000) {
      return NextResponse.json({ error: "Payload terlalu besar" }, { status: 413 });
    }
    const body = await request.json();
    const { amountIdr, donorName, donorEmail, tierId, projectId } = body;

    // ── Server-side amount validation ──
    // NEVER trust the amount from client — validate here on the server.
    const amount = parseInt(amountIdr, 10);
    if (isNaN(amount) || amount < 1000 || amount > 100_000_000) {
      return NextResponse.json(
        { error: "Jumlah donasi tidak valid (min Rp1.000, maks Rp100.000.000)" },
        { status: 400 }
      );
    }

    // Cross-check amount vs tier — cegah abuse tier "Rp 25K" tapi bayar Rp 1jt
    if (tierId && tierId !== "custom") {
      const matchedTier = DONATION_TIERS.find(t => t.id === tierId);
      if (matchedTier && matchedTier.amountIdr !== amount) {
        return NextResponse.json(
          { error: `Jumlah donasi tidak sesuai dengan tier "${tierId}". Diharapkan Rp ${matchedTier.amountIdr.toLocaleString("id-ID")}.` },
          { status: 400 }
        );
      }
    }

    if (!donorName || typeof donorName !== "string" || donorName.trim().length === 0) {
      return NextResponse.json(
        { error: "Nama donatur wajib diisi" },
        { status: 400 }
      );
    }

    // Validate projectId if specified
    if (projectId) {
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { id: true, status: true },
      });
      if (!project || project.status !== "approved") {
        return NextResponse.json(
          { error: "Proyek tidak ditemukan atau belum disetujui" },
          { status: 400 }
        );
      }
    }

    // Generate unique external ID
    const externalId = `DON-${randomUUID()}`;

    // ── Persist donation record ──
    const created = await prisma.donation.create({
      data: {
        userId: session?.userId ?? null,
        projectId: projectId || null,
        externalId,
        amountIdr: amount,
        tierId: tierId || "",
        donorName: donorName.trim(),
        donorEmail: donorEmail || "",
        status: "pending",
      },
    });

    // ── Create real Xendit invoice ──
    let invoice: Awaited<ReturnType<typeof createInvoice>>;
    try {
      invoice = await createInvoice({
        externalId,
        amount,
        payerEmail: donorEmail || undefined,
        description: projectId
          ? `Donasi untuk proyek — SpringHub`
          : tierId
            ? `Donasi ${tierId} — SpringHub`
            : "Donasi SpringHub",
        paymentMethods: ["OVO", "GOPAY", "DANA", "SHOPEEPAY", "QRIS"],
      });
    } catch (error) {
      try {
        await prisma.donation.update({
          where: { id: created.id },
          data: { status: "failed" },
        });
      } catch (updateError) {
        console.error(
          "Failed to mark donation failed:",
          updateError instanceof Error ? updateError.message : updateError
        );
      }
      throw error;
    }

    let savedInvoiceId = "";
    try {
      const updated = await prisma.donation.update({
        where: { id: created.id },
        data: {
          invoiceId: invoice.id,
          expiresAt: invoice.expiryDate
            ? new Date(invoice.expiryDate)
            : new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });
      savedInvoiceId = updated.invoiceId;
    } catch (updateError) {
      console.error(
        "Failed to attach Xendit invoice id:",
        updateError instanceof Error ? updateError.message : updateError
      );
    }

    return NextResponse.json({
      success: true,
      donation: {
        id: created.id,
        invoiceId: savedInvoiceId,
      },
      invoiceUrl: invoice.invoiceUrl,
    });
  } catch (error: unknown) {
    console.error("Invoice creation error:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: getErrorMessage(error, "Terjadi kesalahan.") },
      { status: isDatabaseError(error) ? 503 : 500 }
    );
  }
}