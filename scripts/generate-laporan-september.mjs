import { chromium } from "playwright";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { marked } from "marked";
import { fileURLToPath } from "url";
import { dirname, resolve, extname } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, "..");

const MIME = { ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg" };

async function main() {
  let md = readFileSync(resolve(rootDir, "LAPORAN-BULAN-SEPTEMBER-DAN-BILLING.md"), "utf-8");

  // Embed gambar lokal sebagai base64 agar tampil di PDF
  md = md.replace(/!\[(.*?)\]\((.*?)\)/g, (m, alt, src) => {
    const p = resolve(rootDir, src);
    if (!existsSync(p)) return m;
    const b64 = readFileSync(p).toString("base64");
    return `![${alt}](data:${MIME[extname(p)] || "image/png"};base64,${b64})`;
  });

  const bodyHtml = marked.parse(md);

  const fullHtml = `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<style>
  @page { margin: 18mm 20mm; }
  body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 11pt; line-height: 1.6; color: #1e293b; max-width: 800px; margin: 0 auto; padding: 20px; }
  h1 { font-size: 22pt; color: #0f172a; border-bottom: 3px solid #0891b2; padding-bottom: 8px; margin-top: 30px; }
  h2 { font-size: 16pt; color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-top: 24px; }
  h3 { font-size: 13pt; color: #334155; margin-top: 18px; }
  table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 9.5pt; }
  th, td { border: 1px solid #cbd5e1; padding: 6px 10px; text-align: left; }
  th { background: #f1f5f9; font-weight: 600; }
  tr:nth-child(even) { background: #f8fafc; }
  blockquote { border-left: 3px solid #f59e0b; margin: 12px 0; padding: 8px 16px; background: #fffbeb; }
  strong { color: #0f172a; }
  hr { border: none; border-top: 1px solid #e2e8f0; margin: 20px 0; }
  img { max-width: 100%; border: 1px solid #e2e8f0; border-radius: 8px; margin: 8px 0; }
  ul { padding-left: 20px; }
  li { margin: 3px 0; }
</style>
</head>
<body>
<div style="text-align:center;margin-bottom:30px;padding-bottom:20px;border-bottom:2px solid #0891b2;">
  <h1 style="font-size:26pt;border:none;margin-bottom:4px;">SpringHub — Jaga Semesta</h1>
  <p style="color:#64748b;">Laporan Bulan September & Billing — 22 September 2026</p>
</div>
${bodyHtml}
<div style="text-align:center;margin-top:40px;padding-top:20px;border-top:1px solid #e2e8f0;font-size:9pt;color:#94a3b8;">
  <p>Laporan dibuat 22 September 2026 — SpringHub — www.springhub.id</p>
</div>
</body>
</html>`;

  writeFileSync("/tmp/laporan-sept.html", fullHtml);

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto("file:///tmp/laporan-sept.html", { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  await page.pdf({
    path: resolve(rootDir, "LAPORAN-BULAN-SEPTEMBER-DAN-BILLING.pdf"),
    format: "A4",
    printBackground: true,
    margin: { top: "15mm", bottom: "15mm", left: "18mm", right: "18mm" },
  });
  await browser.close();
  console.log("PDF OK: LAPORAN-BULAN-SEPTEMBER-DAN-BILLING.pdf");
}

main().catch(err => { console.error("Error:", err); process.exit(1); });
