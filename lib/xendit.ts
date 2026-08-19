// Xendit integration — real implementation.
//
// Xendit is the Indonesian payment gateway SpringHub uses to collect
// donations (cards, virtual accounts, e-wallets, QRIS). This module is the
// thin wrapper our donation API calls once XENDIT_SECRET_KEY is set.
//
// Docs: https://developers.xendit.co/

const XENDIT_API_BASE = "https://api.xendit.co";
const REQUEST_TIMEOUT_MS = 15_000;

export type DonationTier = {
  id: string;
  amountIdr: number;
  /** Short label shown on the preset card (e.g. "Rp 20K"). */
  label: string;
  /** What the donation pays for, in plain language. */
  impact: string;
};

export const DONATION_TIERS: DonationTier[] = [
  { id: "trench",     amountIdr:    50_000, label: "Rp 50K",   impact: "1 trench (rorak)" },
  { id: "sediment",   amountIdr:   100_000, label: "Rp 100K",  impact: "1 m³ sediment removed from a spring" },
  { id: "monitoring", amountIdr: 1_000_000, label: "Rp 1 juta", impact: "50 springs monitored" },
];

/** Payment methods Xendit exposes to donors at checkout. */
export const PAYMENT_METHODS = [
  { id: "ovo",      label: "OVO",      group: "e-money" },
  { id: "gopay",    label: "GoPay",    group: "e-money" },
  { id: "dana",     label: "DANA",     group: "e-money" },
  { id: "shopeepay",label: "ShopeePay",group: "e-money" },
  { id: "qris",     label: "QRIS",     group: "qris" },
  { id: "card",     label: "Debit / Credit Card", group: "card" },
  { id: "va",       label: "Virtual Account",     group: "va" },
] as const;

/**
 * Payment methods passed to Xendit v2 invoice `payment_methods`.
 * Channel codes — including BANK_TRANSFER (VA), the most widely used
 * method in Indonesia, plus e-wallets and QRIS.
 */
export const DEFAULT_PAYMENT_METHODS = [
  "BANK_TRANSFER",
  "CREDIT_CARD",
  "OVO",
  "GOPAY",
  "DANA",
  "SHOPEEPAY",
  "QRIS",
] as const;

/** Returns true when Xendit is configured (secret key + webhook token present). */
export function isXenditConfigured(): boolean {
  return Boolean(process.env.XENDIT_SECRET_KEY && process.env.XENDIT_WEBHOOK_TOKEN);
}

export type CreateInvoiceInput = {
  externalId: string;
  amount: number;
  payerEmail?: string;
  description?: string;
  paymentMethods?: string[];
};

export type CreateInvoiceResult = {
  id: string;
  invoiceUrl: string;
  externalId: string;
  amount: number;
  status: string;
  expiryDate: string | null;
};

/**
 * Create a Xendit v2 invoice.
 * Server-only — never call from the client.
 *
 * @throws Error if XENDIT_SECRET_KEY is missing or the API call fails.
 */
export async function createInvoice(
  input: CreateInvoiceInput
): Promise<CreateInvoiceResult> {
  const secretKey = process.env.XENDIT_SECRET_KEY;
  if (!secretKey) {
    throw new Error("XENDIT_SECRET_KEY is not set. Cannot create invoice.");
  }

  const encoded = Buffer.from(secretKey + ":").toString("base64");

  const body: Record<string, unknown> = {
    external_id: input.externalId,
    amount: input.amount,
    payer_email: input.payerEmail,
    description: input.description || "Donasi SpringHub",
    currency: "IDR",
    invoice_duration: 86400, // 24 hours
    reminder: true,
    success_redirect_url: `${
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    }/donate/success?invoice={invoice_id}`,
    failure_redirect_url: `${
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    }/donate/failed`,
  };

  const paymentMethods = input.paymentMethods?.length
    ? input.paymentMethods
    : (DEFAULT_PAYMENT_METHODS as readonly string[]);
  body.payment_methods = paymentMethods;

  const res = await fetch(`${XENDIT_API_BASE}/v2/invoices`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${encoded}`,
      "Content-Type": "application/json",
      "X-IDEMPOTENCY-KEY": input.externalId,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Xendit API error (${res.status}): ${errText}`);
  }

  const data = await res.json();

  return {
    id: data.id,
    invoiceUrl: data.invoice_url,
    externalId: data.external_id,
    amount: data.amount,
    status: data.status,
    expiryDate: data.expiry_date ?? null,
  };
}
