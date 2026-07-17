const PptxGenJS = require("pptxgenjs");
const fs = require("fs");
const path = require("path");

const pptx = new PptxGenJS();
pptx.defineLayout({ name: "WIDE", width: 13.33, height: 7.5 });
pptx.layout = "WIDE";

const S = "/root/springhub/SPRINGHUB-PITCH/screenshots";
const BRAND = "0284c7";
const DARK = "0b0f15";
const WHITE = "ffffff";
const MUTED = "94a3b8";

function addFooter(slide, num) {
  slide.addText(`SpringHub Portfolio · Ayatullah Reza Chalid · ${num}/14`, {
    x: 0.5, y: 7.0, w: 12.33, h: 0.4,
    fontSize: 9, color: MUTED, align: "center",
  });
}

// ─── SLIDE 1: COVER ───
let s = pptx.addSlide();
s.background = { color: DARK };
s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 13.33, h: 7.5, fill: { color: "0a1628" } });
s.addText("SPRINGHUB", { x: 1, y: 2.0, w: 11.33, h: 1.2, fontSize: 54, bold: true, color: WHITE });
s.addText("Community-Driven Spring Restoration Platform", {
  x: 1, y: 3.1, w: 11.33, h: 0.8, fontSize: 22, color: BRAND,
});
s.addText("Full-Stack Portfolio · Ayatullah Reza Chalid", {
  x: 1, y: 4.2, w: 11.33, h: 0.6, fontSize: 16, color: MUTED,
});
s.addText("Next.js · PostgreSQL · Redis · Docker · Xendit", {
  x: 1, y: 4.8, w: 11.33, h: 0.5, fontSize: 13, color: MUTED,
});
addFooter(s, 1);

// ─── SLIDE 2: THE BIG PICTURE ───
s = pptx.addSlide();
s.background = { color: WHITE };
s.addText("THE BIG PICTURE", { x: 0.8, y: 0.5, w: 11.73, h: 0.7, fontSize: 28, bold: true, color: DARK });
s.addShape(pptx.ShapeType.rect, { x: 0.8, y: 1.15, w: 2, h: 0.06, fill: { color: BRAND } });

s.addText("Masalah", { x: 0.8, y: 1.5, w: 5.5, h: 0.5, fontSize: 18, bold: true, color: DARK });
s.addText("70% mata air Indonesia terancam kritis. Erosi, alih fungsi lahan, dan tidak ada data terpusat membuat upaya restorasi sulit dilakukan secara terukur.", {
  x: 0.8, y: 2.0, w: 5.5, h: 1.2, fontSize: 13, color: "475569", lineSpacing: 22,
});

s.addText("Solusi", { x: 7.0, y: 1.5, w: 5.5, h: 0.5, fontSize: 18, bold: true, color: DARK });
s.addText("Platform berbasis komunitas yang memungkinkan siapa pun melaporkan kondisi mata air, mendapatkan poin, mendanai proyek restorasi, dan memantau dampak secara transparan.", {
  x: 7.0, y: 2.0, w: 5.5, h: 1.2, fontSize: 13, color: "475569", lineSpacing: 22,
});

s.addText("Dampak", { x: 0.8, y: 3.6, w: 11.73, h: 0.5, fontSize: 18, bold: true, color: DARK });
const items = [
  "✅ Warga bisa melaporkan kondisi mata air dalam 5 menit",
  "✅ Setiap laporan diverifikasi +24 jam oleh admin",
  "✅ Donasi tersalurkan langsung ke proyek spesifik",
  "✅ Poin & reward system untuk volunteer aktif",
  "✅ Peta interaktif real-time untuk monitoring publik",
].map((t, i) => ({ text: t, options: { fontSize: 12, color: "475569", bullet: true, lineSpacing: 20 } }));
s.addText(items, { x: 0.8, y: 4.2, w: 11.73, h: 2.5 });
addFooter(s, 2);

// ─── SLIDE 3: SYSTEM ARCHITECTURE ───
s = pptx.addSlide();
s.background = { color: WHITE };
s.addText("SYSTEM ARCHITECTURE", { x: 0.8, y: 0.5, w: 11.73, h: 0.7, fontSize: 28, bold: true, color: DARK });
s.addShape(pptx.ShapeType.rect, { x: 0.8, y: 1.15, w: 2, h: 0.06, fill: { color: BRAND } });

// Architecture boxes
const archData = [
  { label: "Cloudflare", sub: "DNS · Proxy · WAF", x: 0.5, y: 1.6, color: "f97316" },
  { label: "Nginx", sub: "Reverse Proxy · SSL · Rate Limit", x: 3.2, y: 1.6, color: "22c55e" },
  { label: "Next.js 14", sub: "App Router · SSR · 54 API Routes", x: 6.5, y: 1.6, color: BRAND },
  { label: "PostgreSQL 16", sub: "Prisma ORM · 16 Models · RLS", x: 9.5, y: 1.6, color: "6366f1" },
  { label: "Redis 7", sub: "Cache · Queue · Rate Limit", x: 0.5, y: 3.5, color: "ef4444" },
  { label: "BullMQ Worker", sub: "Email · Sync · Points Engine", x: 3.2, y: 3.5, color: "8b5cf6" },
  { label: "Docker", sub: "5 Containers · Healthcheck · Compose", x: 6.5, y: 3.5, color: "0ea5e9" },
  { label: "Xendit", sub: "Invoice · Webhook · HMAC", x: 9.5, y: 3.5, color: "ec4899" },
];
for (const a of archData) {
  s.addShape(pptx.ShapeType.roundRect, {
    x: a.x, y: a.y, w: 2.5, h: 1.4,
    fill: { color: a.color },
    rectRadius: 8,
  });
  s.addText(a.label, { x: a.x, y: a.y + 0.15, w: 2.5, h: 0.6, fontSize: 15, bold: true, color: WHITE, align: "center" });
  s.addText(a.sub, { x: a.x + 0.15, y: a.y + 0.75, w: 2.2, h: 0.55, fontSize: 9, color: WHITE, align: "center" });
}

// Flow arrows
const flows = ["Browser → Cloudflare", "→ Nginx (443)", "→ Next.js SSR", "→ PostgreSQL/Redis"];
s.addText(flows.join("  →  "), {
  x: 0.5, y: 5.3, w: 12.33, h: 0.5, fontSize: 12, color: DARK, align: "center",
});
addFooter(s, 3);

// ─── SLIDE 4: BACKEND STACK ───
s = pptx.addSlide();
s.background = { color: WHITE };
s.addText("BACKEND STACK", { x: 0.8, y: 0.5, w: 11.73, h: 0.7, fontSize: 28, bold: true, color: DARK });
s.addShape(pptx.ShapeType.rect, { x: 0.8, y: 1.15, w: 2, h: 0.06, fill: { color: BRAND } });

const backItems = [
  ["Next.js 14 App Router", "54+ route.ts — Auth, Reports, Projects, Donations, Courses, Admin CRUD"],
  ["PostgreSQL 16 + Prisma", "Schema-first, 16 models, SQL migrations, RLS policies untuk data privacy"],
  ["Redis 7", "Session cache, rate limiting, queue backend (BullMQ)"],
  ["JWT Auth", "Key rotation (current + previous secret), bcryptjs, 7-day sessions, login lockout"],
  ["Xendit Payment", "Invoice API, HMAC-webhook verification, atomic transaction with points award"],
  ["3-Layer Role", "Public (read-only) → Volunteer (20K pts gate) → Admin (full access + RLS bypass)"],
].map(([t, d]) => ({ text: [{ text: t, options: { bold: true, fontSize: 13, color: DARK } }, { text: "\n" + d, options: { fontSize: 11, color: "475569" } }] }));

s.addText(backItems, { x: 0.8, y: 1.5, w: 11.73, h: 5.5, lineSpacing: 22, valign: "top", paraSpaceAfter: 8 });
addFooter(s, 4);

// ─── SLIDE 5: FRONTEND STACK ───
s = pptx.addSlide();
s.background = { color: WHITE };
s.addText("FRONTEND STACK", { x: 0.8, y: 0.5, w: 11.73, h: 0.7, fontSize: 28, bold: true, color: DARK });
s.addShape(pptx.ShapeType.rect, { x: 0.8, y: 1.15, w: 2, h: 0.06, fill: { color: BRAND } });

const frontItems = [
  ["Next.js 14 App Router", "SSR + Client Components, dynamic imports, middleware auth"],
  ["Tailwind CSS", "Custom brand palette, dark mode, responsive 1/2/3 col grid"],
  ["Leaflet / react-leaflet", "Peta interaktif, dynamic import SSR=false, location picker"],
  ["PWA", "manifest.json, service worker, offline-first IndexedDB sync, photo compression"],
  ["i18n", "EN/ID ready — next-intl (planned)"],
  ["Security", "CSRF tokens, honey pot, time gate, geolocation match, EXIF stripping"],
].map(([t, d]) => ({ text: [{ text: t, options: { bold: true, fontSize: 13, color: DARK } }, { text: "\n" + d, options: { fontSize: 11, color: "475569" } }] }));

s.addText(frontItems, { x: 0.8, y: 1.5, w: 5.5, h: 5.5, lineSpacing: 22, paraSpaceAfter: 8 });

// Screenshot placeholder
try {
  if (fs.existsSync(S + "/landing-hero.png")) {
    s.addImage({ path: S + "/landing-hero.png", x: 7.0, y: 1.5, w: 5.5, h: 3.8 });
  }
} catch(e) {}
addFooter(s, 5);

// ─── SLIDE 6: FEATURES ───
s = pptx.addSlide();
s.background = { color: WHITE };
s.addText("FITUR UTAMA", { x: 0.8, y: 0.5, w: 11.73, h: 0.7, fontSize: 28, bold: true, color: DARK });
s.addShape(pptx.ShapeType.rect, { x: 0.8, y: 1.15, w: 2, h: 0.06, fill: { color: BRAND } });

const featItems = [
  ["Anti-Spam Berlapis", "Zod validation + rate limit 5/hari + honey pot + time gate 3 detik + trust score"],
  ["Gamification", "Points engine: 25-100 pts per form, streaks, milestones, leaderboard real-time"],
  ["Offline PWA", "Full offline survey: IndexedDB, photo compress 720p, queue sync, session cache"],
  ["Donasi Transparan", "Xendit invoice + webhook HMAC + atomic points award + admin notification"],
  ["Map Interaktif", "Leaflet dengan filter tipe, location snap 5km, EXIF geolocation match"],
  ["Admin Panel", "10 tab: Users, Reports, Donations, Projects, Forms, Courses, Content, Feedback, Points, Review"],
].map(([t, d]) => ({ text: [{ text: t, options: { bold: true, fontSize: 13, color: DARK } }, { text: "\n" + d, options: { fontSize: 11, color: "475569" } }] }));

s.addText(featItems, { x: 0.8, y: 1.5, w: 11.73, h: 5.5, lineSpacing: 22, paraSpaceAfter: 8 });
addFooter(s, 6);

// ─── SLIDE 7: SECURITY ───
s = pptx.addSlide();
s.background = { color: WHITE };
s.addText("KEAMANAN", { x: 0.8, y: 0.5, w: 11.73, h: 0.7, fontSize: 28, bold: true, color: DARK });
s.addShape(pptx.ShapeType.rect, { x: 0.8, y: 1.15, w: 2, h: 0.06, fill: { color: BRAND } });

const secItems = [
  ["CSRF Protection", "Setiap endpoint POST/PUT/PATCH/DELETE admin wajib token dari /api/csrf"],
  ["JWT Key Rotation", "verifyJwtWithRotation() — coba current key, fallback ke previous key"],
  ["Login Lockout", "5 gagal login → lock 15 menit via Redis rate limiter"],
  ["Rate Limiting", "Per endpoint: auth (5r/s), donate (3r/s), report (1r/s), global (30r/s)"],
  ["Password Policy", "Min 8 karakter, wajib uppercase + lowercase + angka"],
  ["Data Privacy", "RLS per role: snapped location untuk publik, precise hanya admin, email/phone admin-only"],
  ["Security Headers", "CSP strict, HSTS, X-Frame-Options DENY, XSS Protection, Permissions Policy"],
  ["Infrastructure", "Cloudflare WAF, fail2ban, nginx rate limit, Docker container isolation"],
].map(([t, d]) => ({ text: [{ text: t, options: { bold: true, fontSize: 12, color: DARK } }, { text: "\n" + d, options: { fontSize: 10.5, color: "475569" } }] }));

s.addText(secItems, { x: 0.8, y: 1.5, w: 11.73, h: 5.5, lineSpacing: 20, paraSpaceAfter: 5 });
addFooter(s, 7);

// ─── SLIDE 8: INFRASTRUCTURE ───
s = pptx.addSlide();
s.background = { color: WHITE };
s.addText("INFRASTRUKTUR & DEVOPS", { x: 0.8, y: 0.5, w: 11.73, h: 0.7, fontSize: 28, bold: true, color: DARK });
s.addShape(pptx.ShapeType.rect, { x: 0.8, y: 1.15, w: 2, h: 0.06, fill: { color: BRAND } });

const infra = [
  "Hostinger VPS → Docker Compose → 5 container",
  "Cloudflare: DNS, proxy, WAF, SSL termination",
  "Nginx: reverse proxy, rate limiting, caching, security headers",
  "PostgreSQL: connection pooling (PgBouncer), daily pg_dump backup",
  "Redis: requirepass, session cache, BullMQ queue",
  "fail2ban: DOCKER-NGINX jail untuk blocking IP abuse",
  "Healthcheck: Docker HEALTHCHECK tiap container + heartbeat monitoring",
  "Backup: cron daily 3am pg_dump, rotated 7 hari",
].map(t => ({ text: t, options: { fontSize: 12, color: "475569", bullet: true, lineSpacing: 22 } }));

s.addText(infra, { x: 0.8, y: 1.5, w: 11.73, h: 5.0 });
s.addShape(pptx.ShapeType.roundRect, {
  x: 0.8, y: 5.8, w: 11.73, h: 0.8,
  fill: { color: "f0f9ff" }, line: { color: BRAND, width: 1 },
});
s.addText("CI/CD: push ke GitHub → docker compose build → compose up -d", {
  x: 1.0, y: 5.9, w: 11.33, h: 0.6, fontSize: 13, color: BRAND, bold: true,
});
addFooter(s, 8);

// ─── SLIDE 9: SCREENSHOTS ───
s = pptx.addSlide();
s.background = { color: WHITE };
s.addText("SCREENSHOTS", { x: 0.8, y: 0.5, w: 11.73, h: 0.7, fontSize: 28, bold: true, color: DARK });
s.addShape(pptx.ShapeType.rect, { x: 0.8, y: 1.15, w: 2, h: 0.06, fill: { color: BRAND } });

const shotLayouts = [
  { file: "admin-dashboard.png", label: "Admin Dashboard", x: 0.5, y: 1.5, w: 3.8, h: 2.5 },
  { file: "admin-projects.png", label: "Admin — Projects", x: 4.6, y: 1.5, w: 3.8, h: 2.5 },
  { file: "route-map.png", label: "API Route Map", x: 8.7, y: 1.5, w: 4.0, h: 2.5 },
  { file: "projects-list.png", label: "Projects List", x: 0.5, y: 4.3, w: 3.8, h: 2.5 },
  { file: "project-detail.png", label: "Project Detail", x: 4.6, y: 4.3, w: 3.8, h: 2.5 },
  { file: "landing-aksi-nyata.png", label: "Featured + Donate", x: 8.7, y: 4.3, w: 4.0, h: 2.5 },
];

for (const sl of shotLayouts) {
  const fp = S + "/" + sl.file;
  if (fs.existsSync(fp)) {
    try {
      s.addImage({ path: fp, x: sl.x, y: sl.y, w: sl.w, h: sl.h });
    } catch(e) {}
  }
  s.addText(sl.label, { x: sl.x, y: sl.y + sl.h - 0.3, w: sl.w, h: 0.3, fontSize: 8, color: MUTED, align: "center" });
}
addFooter(s, 9);

// ─── SLIDE 10: DATABASE ───
s = pptx.addSlide();
s.background = { color: WHITE };
s.addText("DATABASE SCHEMA", { x: 0.8, y: 0.5, w: 11.73, h: 0.7, fontSize: 28, bold: true, color: DARK });
s.addShape(pptx.ShapeType.rect, { x: 0.8, y: 1.15, w: 2, h: 0.06, fill: { color: BRAND } });

const dbTables = [
  "Profile (22) — User, roles, points, trust score, 2FA secret",
  "Report (11) — Field data, snapped+precise location, status, photos",
  "Project (16) — Title, goal, raised, likes, status, contact info",
  "Donation (12) — Amount, tier, status, Xendit invoice, project FK",
  "PointsLog (6) — Amount, reason, metadata, user FK + report FK",
  "Comment (4) — Text, user FK, project FK",
  "Like (4) — User FK, project FK (unique constraint)",
  "Notification (7) — Type, message, isRead, user FK",
  "Course + Module (8) — Slug, title, modules, progress tracking",
  "Form + Field — Dynamic forms, field types, map type FK",
  "ContentBlock — CMS sections: media, projects, stats",
  "AppError — Error logging, level, source, stack, read status",
].map(t => ({ text: t, options: { fontSize: 11, color: "475569", bullet: true, lineSpacing: 18 } }));

s.addText(dbTables, { x: 0.8, y: 1.5, w: 11.73, h: 5.5 });
addFooter(s, 10);

// ─── SLIDE 11: API SURFACE ───
s = pptx.addSlide();
s.background = { color: "0b0f15" };
s.addText("API SURFACE", { x: 0.8, y: 0.5, w: 11.73, h: 0.7, fontSize: 28, bold: true, color: WHITE });
s.addShape(pptx.ShapeType.rect, { x: 0.8, y: 1.15, w: 2, h: 0.06, fill: { color: BRAND } });

const apiGroups = [
  { label: "Auth (7)", routes: "login, register, logout, me, forgot/reset, claim-guest" },
  { label: "Projects (4)", routes: "GET list, GET detail, POST create, POST like, comments" },
  { label: "Donations (2)", routes: "POST invoice (CSRF), POST webhook (HMAC)" },
  { label: "Reports (6)", routes: "GET/POST reports, upload/delete photos, forms" },
  { label: "Courses (3)", routes: "GET courses, GET detail, PUT progress + points" },
  { label: "Public (14)", routes: "map, spring, gallery, leaderboard, dashboard, newsletter, feedback" },
  { label: "Admin (25)", routes: "CRUD users, reports, forms, courses, content, points, map, export" },
].map((g, i) => {
  const yPos = 1.5 + i * 0.75;
  s.addShape(pptx.ShapeType.roundRect, {
    x: 0.8, y: yPos, w: 3.2, h: 0.55,
    fill: { color: BRAND }, rectRadius: 4,
  });
  s.addText(g.label, { x: 0.8, y: yPos + 0.08, w: 3.2, h: 0.4, fontSize: 12, bold: true, color: WHITE, align: "center" });
  s.addText(g.routes, { x: 4.3, y: yPos + 0.08, w: 8.23, h: 0.4, fontSize: 11, color: "cbd5e1" });
  return null;
});
addFooter(s, 11);

// ─── SLIDE 12: CHALLENGES ───
s = pptx.addSlide();
s.background = { color: WHITE };
s.addText("CHALLENGES & SOLUTIONS", { x: 0.8, y: 0.5, w: 11.73, h: 0.7, fontSize: 28, bold: true, color: DARK });
s.addShape(pptx.ShapeType.rect, { x: 0.8, y: 1.15, w: 2, h: 0.06, fill: { color: BRAND } });

const challenges = [
  ["Foto offline gagal di Chrome Android", "Canvas → Blob → deteksi MIME via magic bytes → re-create blob"],
  ["CSRF token stale saat ganti tab", "Just-in-time fetch token pas mau submit, bukan saat mount"],
  ["Nginx 502 dari bot flood", "fail2ban DOCKER-NGINX jail + Cloudflare WAF + rate limit per IP"],
  ["Shadow database migration error", "prisma db push sebagai alternatif — schema sync langsung"],
  ["Dark mode inkonsisten di 15+ file", "Audit manual + override CSS selector .card.shadow-* → [class*=shadow-]"],
  ["Offline-sync session cookie gak terkirim", "SameSite strict → lax untuk PWA standalone compatibility"],
].map(([t, d]) => ({ text: [{ text: t, options: { bold: true, fontSize: 12, color: DARK } }, { text: "\n" + d, options: { fontSize: 10.5, color: "475569" } }] }));

s.addText(challenges, { x: 0.8, y: 1.5, w: 11.73, h: 5.5, lineSpacing: 20, paraSpaceAfter: 6 });
addFooter(s, 12);

// ─── SLIDE 13: TESTING ───
s = pptx.addSlide();
s.background = { color: WHITE };
s.addText("TESTING & QUALITY", { x: 0.8, y: 0.5, w: 11.73, h: 0.7, fontSize: 28, bold: true, color: DARK });
s.addShape(pptx.ShapeType.rect, { x: 0.8, y: 1.15, w: 2, h: 0.06, fill: { color: BRAND } });

const testItems = [
  ["155 Manual Test Cases", "19 kategori — Website, Admin, Form, Peta, Poin, Donasi, Keamanan, Dark Mode, Course, API, Project & Like, Routing"],
  ["17 E2E Playwright Specs", "Guest flow, volunteer flow, admin flow, offline mode, UI consistency"],
  ["5 k6 Load Test Scenarios", "API throughput, auth burst, report submission, donation, concurrent users"],
  ["3 Unit Tests", "Zod schema validation, form title mapping, auth token parsing"],
  ["TypeScript strict", "tsc —noEmit: 0 error · next lint: 0 error"],
  ["UAT Verification", "99 test case terverifikasi di production (Vercel)"],
].map(([t, d]) => ({ text: [{ text: t, options: { bold: true, fontSize: 13, color: DARK } }, { text: "\n" + d, options: { fontSize: 11, color: "475569" } }] }));

s.addText(testItems, { x: 0.8, y: 1.5, w: 11.73, h: 5.0, lineSpacing: 22, paraSpaceAfter: 8 });

s.addShape(pptx.ShapeType.roundRect, {
  x: 0.8, y: 5.5, w: 11.73, h: 0.7,
  fill: { color: "f0fdf4" }, line: { color: "22c55e", width: 1 },
});
s.addText("CI: GitHub push → Docker build → typecheck → lint → deploy", {
  x: 1.0, y: 5.6, w: 11.33, h: 0.5, fontSize: 12, color: "16a34a", bold: true,
});
addFooter(s, 13);

// ─── SLIDE 14: CTA ───
s = pptx.addSlide();
s.background = { color: DARK };
s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 13.33, h: 7.5, fill: { color: "0a1628" } });
s.addText("TERIMA KASIH", { x: 1, y: 1.5, w: 11.33, h: 1.0, fontSize: 44, bold: true, color: WHITE });
s.addText("Built with passion for Indonesia's water security", {
  x: 1, y: 2.5, w: 11.33, h: 0.6, fontSize: 20, color: BRAND,
});
s.addText("Ayatullah Reza Chalid", { x: 1, y: 3.8, w: 11.33, h: 0.5, fontSize: 18, bold: true, color: WHITE });
s.addText("Full-Stack Engineer", { x: 1, y: 4.3, w: 11.33, h: 0.4, fontSize: 13, color: MUTED });
s.addText("Live: springhub.id  ·  GitHub: github.com/Ayatull4h/springhub", {
  x: 1, y: 5.0, w: 11.33, h: 0.5, fontSize: 13, color: MUTED,
});
addFooter(s, 14);

// ─── SAVE ───
const outPath = "/root/springhub/SPRINGHUB-PITCH/presentation.pptx";
pptx.writeFile({ fileName: outPath })
  .then(() => console.log("✅ PPTX saved:", outPath))
  .catch(err => console.error("❌ Error:", err));
