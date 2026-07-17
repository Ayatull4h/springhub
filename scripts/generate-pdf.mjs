import { chromium } from "playwright";
import { readFileSync, writeFileSync } from "fs";
import { marked } from "marked";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, "..");

async function main() {
  const md = readFileSync(resolve(rootDir, "CLIENT-REPORT.md"), "utf-8");

  // Convert markdown to HTML
  const bodyHtml = marked.parse(md);

  const fullHtml = `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<style>
  @page { margin: 20mm 25mm; }
  body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 11pt; line-height: 1.6; color: #1e293b; max-width: 800px; margin: 0 auto; padding: 20px; }
  h1 { font-size: 22pt; color: #0f172a; border-bottom: 3px solid #0891b2; padding-bottom: 8px; margin-top: 30px; }
  h2 { font-size: 16pt; color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-top: 24px; }
  h3 { font-size: 13pt; color: #334155; margin-top: 18px; }
  h4 { font-size: 11pt; color: #475569; }
  table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 9.5pt; }
  th, td { border: 1px solid #cbd5e1; padding: 6px 10px; text-align: left; }
  th { background: #f1f5f9; font-weight: 600; }
  tr:nth-child(even) { background: #f8fafc; }
  code { background: #f1f5f9; padding: 1px 4px; border-radius: 3px; font-size: 9.5pt; }
  pre { background: #f1f5f9; padding: 10px; border-radius: 5px; overflow-x: auto; font-size: 9pt; }
  blockquote { border-left: 3px solid #0891b2; margin: 12px 0; padding: 8px 16px; background: #f0fdfa; }
  strong { color: #0f172a; }
  hr { border: none; border-top: 1px solid #e2e8f0; margin: 20px 0; }
  .header { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #0891b2; }
  .header h1 { font-size: 26pt; border: none; margin-bottom: 4px; }
  .header p { color: #64748b; margin: 2px 0; }
  .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 9pt; color: #94a3b8; }
  ul { padding-left: 20px; }
  li { margin: 3px 0; }
</style>
</head>
<body>
<div class="header">
  <h1>SpringHub v1.0</h1>
  <p>Laporan Kemajuan — 1 Juli 2026, 18:32 WIB</p>
  <p>Kepada: Klien / Stakeholder</p>
</div>
${bodyHtml}
<div class="footer">
  <p>Laporan dibuat oleh SpringHub Build Agent — 1 Juli 2026, 18:32 WIB</p>
  <p>Domain: https://www.springhub.id</p>
</div>
</body>
</html>`;

  writeFileSync("/tmp/report.html", fullHtml);

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto("file:///tmp/report.html", { waitUntil: "networkidle" });
  await page.pdf({
    path: resolve(rootDir, "CLIENT-REPORT.pdf"),
    format: "A4",
    printBackground: true,
    margin: { top: "15mm", bottom: "15mm", left: "20mm", right: "20mm" },
  });
  await browser.close();
  console.log("✅ PDF berhasil dibuat: CLIENT-REPORT.pdf");
}

main().catch(err => { console.error("❌ Error:", err); process.exit(1); });
