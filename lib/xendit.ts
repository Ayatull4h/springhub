// Xendit integration stub.
//
// Xendit is the Indonesian payment gateway SpringHub uses to collect
// donations (cards, virtual accounts, e-wallets, QRIS). This module is the
// thin wrapper our donation API will call once XENDIT_SECRET_KEY is set.
//
// Docs: https://developers.xendit.co/

export type DonationTier = {
  id: string;
  amountIdr: number;
  /** Short label shown on the preset card (e.g. "Rp 20K"). */
  label: string;
  /** What the donation pays for, in plain language. */
  impact: string;
};

export const DONATION_TIERS: DonationTier[] = [
  { id: "seedling",   amountIdr:    20_000, label: "Rp 20K",   impact: "1 tree seedling" },
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

export type CreateInvoiceInput = {
  amountIdr: number;
  donorName: string;
  donorEmail: string;
  /** Optional — if the donation is earmarked for a specific verified project. */
  projectId?: string;
  /** Resolves to the same id used in DONATION_TIERS, or "custom". */
  tierId: string | "custom";
};

export type CreateInvoiceResult = {
  invoiceId: string;
  invoiceUrl: string; // Xendit-hosted checkout URL
  expiresAt: string;
};

/**
 * Stub. The real implementation calls POST /v2/invoices with Basic auth and
 * returns the hosted checkout URL. Server-only — never call from the client.
 */
export async function createInvoice(
  _input: CreateInvoiceInput
): Promise<CreateInvoiceResult> {
  throw new Error(
    "createInvoice is not implemented yet. Set XENDIT_SECRET_KEY and wire the /v2/invoices call."
  );
}
