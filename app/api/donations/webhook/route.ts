import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Dummy webhook handler for Xendit payment callbacks.
 * In production: verify Xendit callback token, handle all statuses.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { invoice_id, status, external_id } = body;

    console.log("[Webhook] Received:", { invoice_id, status, external_id });

    if (!invoice_id) {
      return NextResponse.json({ error: "Missing invoice_id" }, { status: 400 });
    }

    // Map Xendit statuses to our enum
    let donationStatus: string;
    switch (status) {
      case "PAID":
      case "SETTLED":
        donationStatus = "paid";
        break;
      case "EXPIRED":
        donationStatus = "expired";
        break;
      case "FAILED":
        donationStatus = "failed";
        break;
      default:
        donationStatus = "pending";
    }

    await prisma.donation.updateMany({
      where: { invoiceId: invoice_id },
      data: {
        status: donationStatus as any,
        ...(donationStatus === "paid" ? { paidAt: new Date() } : {}),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
