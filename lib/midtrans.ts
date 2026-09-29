// Midtrans integration — Snap (redirect) implementation.
//
// Midtrans is the Indonesian payment gateway SpringHub uses to collect
// donations (cards, virtual accounts, e-wallets, QRIS). This module is the
// thin wrapper our donation API calls once MIDTRANS_SERVER_KEY is set.
//
// Security notes:
// - Server-only — never import from client components (keys stay server-side).
// - Webhook authenticity is verified via `signature_key` (SHA-512 of
//   order_id + status_code + gross_amount + serverKey) AND by cross-checking
//   gross_amount against the stored donation row. Never trust client amounts.
//
// Docs: https://docs.midtrans.com/
import { createHash, timingSafeEqual } from "crypto";

const SNAP_PROD_URL = "https://app.midtrans.com/snap/v1/transactions";
const SNAP_SANDBOX_URL = "https://app.sandbox.midtrans.com/snap/v1/transactions";
const REQUEST_TIMEOUT_MS = 15_000;

export type DonationTier = {
  id: string;
  amountIdr: number;
  /** Short label shown on the preset card (e.g. "Rp 50K"). */
  label: string;
  /** What the donation pays for, in plain language. */
  impact: string;
};

export const DONATION_TIERS: DonationTier[] = [
  { id: "trench",     amountIdr:    50_000, label: "Rp 50K",   impact: "1 infiltration pit (rorak)" },
  { id: "sediment",   amountIdr:   100_000, label: "Rp 100K",  impact: "1 m³ sediment removed from a spring" },
  { id: "monitoring", amountIdr: 1_000_000, label: "Rp 1 juta", impact: "50 springs monitored" },
];

/** Returns true when Midtrans is configured (server key present). */
export function isMidtransConfigured(): boolean {
  return Boolean(process.env.MIDTRANS_SERVER_KEY);
}

function snapBaseUrl(): string {
  return process.env.MIDTRANS_IS_PRODUCTION === "true" ? SNAP_PROD_URL : SNAP_SANDBOX_URL;
}

export type CreateSnapInput = {
  orderId: string;
  amount: number;
  payerEmail?: string;
  payerName?: string;
  description?: string;
};

export type CreateSnapResult = {
  token: string;
  redirectUrl: string;
  orderId: string;
  amount: number;
};

/**
 * Create a Midtrans Snap transaction (redirect flow — no card data touches us).
 * Server-only — never call from the client.
 *
 * @throws Error if MIDTRANS_SERVER_KEY is missing or the API call fails.
 */
export async function createSnapTransaction(
  input: CreateSnapInput
): Promise<CreateSnapResult> {
  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  if (!serverKey) {
    throw new Error("MIDTRANS_SERVER_KEY is not set. Cannot create transaction.");
  }

  const encoded = Buffer.from(serverKey + ":").toString("base64");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const body: Record<string, unknown> = {
    transaction_details: {
      order_id: input.orderId,
      gross_amount: input.amount,
    },
    item_details: [
      {
        id: "donasi",
        price: input.amount,
        quantity: 1,
        name: (input.description || "Donasi SpringHub").slice(0, 50),
      },
    ],
    customer_details: {
      first_name: (input.payerName || "Donatur").slice(0, 20),
      email: input.payerEmail || undefined,
    },
    callbacks: {
      finish: `${appUrl}/donate/success?order_id=${encodeURIComponent(input.orderId)}`,
      unfinish: `${appUrl}/donate/failed?order_id=${encodeURIComponent(input.orderId)}`,
      error: `${appUrl}/donate/failed?order_id=${encodeURIComponent(input.orderId)}`,
    },
    expiry: {
      unit: "day",
      duration: 1,
    },
  };

  const res = await fetch(snapBaseUrl(), {
    method: "POST",
    headers: {
      Authorization: `Basic ${encoded}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!res.ok) {
    const errText = await res.text();
    // Jangan bocorkan secret — server key tidak pernah masuk log/respons.
    throw new Error(`Midtrans API error (${res.status}): ${errText.slice(0, 200)}`);
  }

  const data = await res.json();

  if (!data?.token || !data?.redirect_url) {
    throw new Error("Midtrans API response missing token/redirect_url.");
  }

  return {
    token: data.token,
    redirectUrl: data.redirect_url,
    orderId: input.orderId,
    amount: input.amount,
  };
}

export type MidtransNotification = {
  order_id?: string;
  status_code?: string;
  gross_amount?: string;
  signature_key?: string;
  transaction_status?: string;
  fraud_status?: string;
  payment_type?: string;
  transaction_time?: string;
};

/**
 * Verify Midtrans webhook signature:
 *   SHA512(order_id + status_code + gross_amount + serverKey)
 * Uses constant-time comparison. Returns false when key missing/mismatch.
 */
export function verifyMidtransSignature(n: MidtransNotification): boolean {
  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  if (!serverKey || !n.order_id || !n.status_code || !n.gross_amount || !n.signature_key) {
    return false;
  }
  const expected = createHash("sha512")
    .update(`${n.order_id}${n.status_code}${n.gross_amount}${serverKey}`)
    .digest("hex");
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(n.signature_key, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
