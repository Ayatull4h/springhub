/**
 * Health scoring engine for springs.
 * Computes a 0-100 score from spring-survey fieldData.
 */

export type HealthResult = {
  score: number;
  status: "sehat" | "ringan" | "berat" | "kritis";
};

/**
 * Compute health from spring-survey fieldData.
 * Returns { score, status }.
 */
export function computeSpringHealth(fieldData: Record<string, unknown>): HealthResult {
  const params: Record<string, number> = {};

  // C1_warna: Bening=100, Agak Keruh=60, Keruh=30, Kekuningan/Kehijauan=20
  const warna = (fieldData.C1_warna as string) || "";
  if (warna === "Bening") params.warna = 100;
  else if (warna === "Agak Keruh") params.warna = 60;
  else if (warna === "Keruh") params.warna = 30;
  else if (warna === "Kekuningan" || warna === "Kehijauan") params.warna = 20;

  // B6_aliran
  const aliran = (fieldData.B6_aliran as string) || "";
  if (aliran === "Stabil Sepanjang Tahun") params.aliran = 100;
  else if (aliran === "Berkurang saat Kemarau") params.aliran = 60;
  else if (aliran === "Naik Turun") params.aliran = 40;
  else if (aliran === "Kering Total") params.aliran = 0;
  else if (aliran === "Tidak Tahu") params.aliran = 50;

  // B7_debit_5th
  const debit5 = (fieldData.B7_debit_5th as string) || "";
  if (debit5 === "Bertambah") params.debit5 = 100;
  else if (debit5 === "Sama") params.debit5 = 80;
  else if (debit5 === "Berkurang") params.debit5 = 30;

  // D1_ph
  const ph = parseFloat((fieldData.D1_ph as string) || "");
  if (!isNaN(ph)) {
    if (ph >= 6.5 && ph <= 8.5) params.ph = 100;
    else if (ph >= 6 || ph <= 9) params.ph = 60;
    else params.ph = 30;
  }

  // D2_suhu
  const suhu = parseFloat((fieldData.D2_suhu as string) || "");
  if (!isNaN(suhu)) {
    if (suhu >= 20 && suhu <= 30) params.suhu = 100;
    else if (suhu >= 15 && suhu <= 35) params.suhu = 60;
    else params.suhu = 30;
  }

  // D3_tds
  const tds = parseFloat((fieldData.D3_tds as string) || "");
  if (!isNaN(tds)) {
    if (tds <= 300) params.tds = 100;
    else if (tds <= 600) params.tds = 60;
    else params.tds = 30;
  }

  // D5_debit_liter
  const debit = parseFloat((fieldData.D5_debit_liter as string) || "");
  if (!isNaN(debit)) {
    if (debit >= 5) params.debit = 100;
    else if (debit >= 1) params.debit = 60;
    else params.debit = 30;
  }

  // C6_ancaman
  const ancaman = (fieldData.C6_ancaman as string) || "";
  if (ancaman === "Tidak Ada") params.ancaman = 100;
  else if (ancaman === "Ya") {
    const jenis = fieldData.C7_jenis_ancaman;
    const count = Array.isArray(jenis) ? jenis.length : 0;
    params.ancaman = Math.max(20, 80 - count * 10);
  }

  // Calculate weighted score
  const weights: Record<string, number> = {
    warna: 20,
    aliran: 20,
    debit5: 15,
    ph: 10,
    suhu: 5,
    tds: 5,
    debit: 10,
    ancaman: 15,
  };

  let totalWeight = 0;
  let weightedSum = 0;

  for (const [key, weight] of Object.entries(weights)) {
    if (params[key] !== undefined) {
      weightedSum += params[key] * weight;
      totalWeight += weight;
    }
  }

  // Jika aliran "Kering Total", langsung kritis
  if (aliran === "Kering Total") {
    return { score: 10, status: "kritis" };
  }

  if (totalWeight === 0) {
    return { score: 0, status: "kritis" };
  }

  const score = Math.round(weightedSum / totalWeight);

  let status: HealthResult["status"] = "berat";
  if (score >= 80) status = "sehat";
  else if (score >= 60) status = "ringan";
  else if (score >= 30) status = "berat";
  else status = "kritis";

  return { score, status };
}
