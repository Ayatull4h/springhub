# LAPORAN PROYEK — SPRINGHUB
## 2 Juni 2026

## 1. Status Build

- **Next.js**: 14.2.5 — App Router, TypeScript strict mode
- **Database**: Prisma ORM + Supabase PostgreSQL
- **Build**: `npm run build` — ✅ Compiled successfully, 36/36 pages
- **TypeScript**: `npx tsc --noEmit` — ✅ Zero TypeScript errors
- **Test**: `npm test` — ❌ Tidak ada test files sama sekali (L1 dari audit 15 Mei — masih belum diperbaiki)
- **Hosting**: Vercel (frontend) + Supabase (backend/db/auth/storage)

## 2. Fitur Selesai (100%)

| Fitur | Status | Catatan |
|---|---|---|
| Landing page (hero, nav, footer) | 100% | i18n EN/ID, dark mode, responsive |
| Dashboard impact stats | 100% | 4 cards statistik + monthly progress chart + leaderboard real-time |
| Map interaktif (Leaflet) | 100% | Marker cluster, filter form type, 5km grid snapping, protection banner |
| Form Report (5 form) | 100% | Zod validation, location picker, foto capture, dynamic fields |
| Auth (login, register, forgot/reset) | 100% | Session-based, CSRF protected, redirect logic |
| Donasi (Xendit) | 100% | Invoice creation, webhook handler, HMAC verifikasi |
| Admin Panel (10 tabs) | 100% | Users, Reports, Donations, Forms, Projects, Courses, Content, Feedback, Points, Review |
| Points Engine | 100% | Server-side — base point + bonus + milestone + streak + trust score |
| Anti-Spam (5 layer) | 100% | CSRF token + honeypot field + time gate + rate limit IP + daily limit user |
| PWA (manifest + SW) | 100% | 4 cache strategies (StaleWhileRevalidate, NetworkFirst, CacheFirst, NetworkOnly) + offline fallback page |
| Dark Mode | ~98% | 16+ file diperbaiki 2 Juni, mungkin ada tekstur minor tersisa |
| i18n EN/ID | 100% | ±480 translation keys per bahasa, semua halaman |

## 3. Fitur Baru (2 Juni 2026)

- **Offline Survey Mode**: 10 file baru, 3 API routes — survey tetap jalan tanpa internet, data disimpan di IndexedDB, otomatis sync saat online
- **Network Watcher**: Heartbeat 30 detik cek koneksi, graceful banner notifikasi saat offline/online
- **OfflineEntryButton**: Tombol di dashboard untuk akses mode offline
- **Dark Mode Fix**: 16 file disentuh, ±80 titik perbaikan warna di semua komponen
- **Prisma Models Baru**: `OfflineSession` + `TrackingPoint` untuk menyimpan data survey offline dan GPS tracking

## 4. Hal Baik (Sisi Baik)

- **Codebase besar dan terstruktur**: 50+ API route handlers, 36 halaman Next.js, 15+ Prisma models, schemas Zod terpusat
- **Keamanan berlapis**: CSRF token tiap form, RLS policy siap di Supabase, rate limiting per IP (10 req/menit), anti-spam 5 layer, trust score auto-block
- **Dark mode hampir全覆盖**: Setelah fix 2 Juni, hampir tidak ada komponen yang keliru warna di mode gelap
- **i18n lengkap EN/ID**: Semua label, tombol, error message, meta tags — dua bahasa penuh
- **Offline mode matang**: Desain arsitektur offline-first untuk survey, GPS tracking dengan IndexedDB storage, upload foto ditunda sampai online
- **Build zero TypeScript error**: `tsc --noEmit` lulus tanpa error — semua tipe didefinisikan dengan benar
- **Responsive**: Semua halaman berfungsi di mobile, tablet, dan desktop — navbar collapsible, grid menyesuaikan
- **PWA production-ready**: Manifest.json lengkap (name, icons, theme_color, display standalone), service worker dengan 4 strategi cache berbeda
- **CSS variables untuk theming**: Warna primer, sekunder, mode gelap/terang semua pakai CSS custom properties — mudah di-maintain

## 5. Hal Buruk (Sisi Buruk) — JUJUR

- **Zero unit test / E2E test**: Audit 15 Mei sudah catat L1. Sampai 2 Juni masih belum ada satu file test pun. Tidak bisa automated regression testing. Error regression hanya ketahuan kalau manual build.
- **Dev server lambat di Windows**: `npm run build` bisa 2-3 menit karena Next.js koleksi trace dan Prisma generate. Cold start development juga lambat.
- **Redis dependency**: Rate limiter (`lib/rate-limit.ts`) dan queue job (bullmq) depend pada Redis. Jika Redis tidak running, rate limiter throw error. Tidak ada graceful fallback.
- **Sentry setup kosong**: `sentry.client.config.ts`, `sentry.edge.config.ts`, `sentry.server.config.ts` sudah ada tapi DSN masih empty string dari `.env`. Error tracking tidak aktif sama sekali — error di production tidak terdeteksi.
- **Email (nodemailer) SMTP placeholder**: Di `lib/email.ts`, konfigurasi SMTP masih placeholder. Forgot password flow yang kirim email kemungkinan tidak jalan di environment dev.
- **@aws-sdk/types error di LSP**: Beberapa package `@aws-sdk/*` tidak punya `@types` terinstall, menyebabkan error di editor (red squiggly). Build lolos karena TypeScript strict hanya berlaku untuk source code, bukan node_modules.
- **Xendit sandbox**: `XENDIT_API_KEY` dan `XENDIT_WEBHOOK_TOKEN` di `.env` mungkin masih placeholder. Donasi di dev environment tidak benar-benar terproses — hanya return mock response.
- **Proxy Prisma (sudah difix)**: Sebelum 2 Juni, ada `PrismaClient` yang dibungkus Proxy untuk caching — ini bikin LSP error di semua file yang import Prisma. Sudah diperbaiki dengan direct instantiation.
- **Tidak ada `.env.example`**: Developer baru tidak tahu environment variables apa yang diperlukan. Harus baca kode satu per satu.
- **Seed data tidak production-ready**: `prisma/seed.ts` ada tapi mungkin outdated vs schema terbaru. Jalanin seed bisa error atau produce data tidak konsisten.
- **Offline map tile caching bergantung area selection**: User harus pilih area dulu saat online. Tidak bisa download tiles di tengah survey — harus direncanakan sebelumnya.
- **Background Sync hanya Chromium**: API Background Sync (Service Worker) hanya didukung Chrome/Chromium. Firefox dan Safari fallback ke online event listener — tidak ada jaminan data terkirim jika browser ditutup sebelum koneksi kembali.
- **GPS boros baterai**: `watchPosition` dengan `enableHighAccuracy: true` menguras baterai dalam hitungan jam di perangkat mobile. Tidak ada opsi "hemat baterai" atau interval GPS yang bisa dikonfigurasi user.
- **PWA install tidak universal**: Safari iOS tidak mendukung `beforeinstallprompt` event. User iPhone harus add-to-home-screen manual. Tidak ada prompt install untuk iOS.
- **Form slug hardcoded**: `lib/forms.ts` punya 5 form dengan slug statis (`spring-monitoring`, `spring-restoration`, `trench-development`, `tree-planting`, `seedling-stock`). Admin bisa buat form baru via panel, tapi beberapa logic di frontend masih referensi slug hardcoded ini.

## 6. Progress Timeline

- **15 Mei 2026**: Audit lengkap — temuan 10 critical + 10 high + 7 medium + 7 low issues. Semua terdokumentasi di AGENTS.md.
- **19 Mei 2026**: SpringHub dinyatakan "completed" v1 — landing page, 5 form, auth, donasi, admin panel, points engine selesai.
- **1 Juni 2026**: Diskusi RAB (3 skenario hosting). Bug fix: report visibility toggle (isActive). Dark mode scan manual — 16+ file diperbaiki. Commit `a6a4dcf`.
- **2 Juni 2026**: Zero TypeScript errors tercapai. Offline Survey Mode (10 file baru + 3 API routes). Dark mode fix 16 file. TESTING-GUIDE.md dibuat. Tapi masih belum ada test files.
