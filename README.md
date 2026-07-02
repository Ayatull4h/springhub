# 🌊 SpringHub

A community-driven web platform under **Jaga Semesta** to coordinate field work, funding, capacity building, and gamified volunteer activity around restoring Indonesia's artesian springs.

**Stack:** Next.js 14 App Router · TypeScript strict · Tailwind CSS · Leaflet · Supabase PostgreSQL · Prisma ORM

---

## 🚀 Quick Start (PC Baru)

```bash
npm install
cp .env.example .env   # lalu isi env vars (minta ke tim atau lihat CONTEXT.md)
npx prisma generate
npx prisma db push
npx prisma db seed
npm run dev
# → http://localhost:3000
```

### Akun Test

| Email | Password | Role |
|---|---|---|
| `admin@springhub.id` | `demo12345` | admin |
| `volunteer@springhub.id` | `vol12345` | volunteer |

---

## 📁 Dokumen Penting

| File | Isi |
|---|---|
| `CONTEXT.md` | Setup lengkap, env vars, database state, bug history, arsitektur |
| `AGENTS.md` | Panduan agent opencode, role & access, privacy, backlog, sesi diskusi |
| `RAB.MD` | Rencana Anggaran Biaya (3 skenario hosting) |
| `TESTING-GUIDE.md` | Panduan testing manual |
| `DATA-STORAGE.md` | Dokumentasi storage (DB, IndexedDB, S3) |
| `prisma/schema.prisma` | Database schema (19 models) |

---

## 🧠 Agent System

Proyek ini menggunakan **opencode** dengan agents:

| Agent | Fungsi |
|---|---|
| `springhub-plan` | Arsitektur & perencanaan |
| `springhub-build` | Implementasi kode |
| `springhub-db` | Database & migration |
| `springhub-form` | Form & validasi |
| `springhub-donate` | Xendit payment |
| `springhub-admin` | Admin panel |

---

## 📊 Status Proyek (per 2 Juli 2026)

| Layer | Status |
|---|---|
| Landing page UI | 100% ✅ |
| Form UI (5 forms + dynamic) | 100% ✅ |
| Map UI (Leaflet + filter) | 100% ✅ |
| Backend API (103 endpoints) | 100% ✅ |
| Database (19 models + seed) | 100% ✅ |
| Auth (login, register, session) | 100% ✅ |
| Donasi (Xendit) | 100% ✅ (placeholder key) |
| Admin Panel (10 tabs) | 100% ✅ |
| Points Engine | 100% ✅ |
| Offline Survey Mode | 100% ✅ |
| PWA / SEO | 100% ✅ |
| Anti-Spam | 100% ✅ |
| Testing (E2E 110 pass + unit) | 85% ⏳ |
| Skeleton Loading | 100% ✅ |
| Data Saver Mode | 100% ✅ |
| Dark Mode | 100% ✅ |
| **Total** | **~94%** |

---

## 🐛 Bug History

| # | Bug | Status | Fixed |
|---|---|---|---|
| 1 | Offline photo upload gagal Chrome Android | ✅ | 6 Juni 2026 |
| 2 | Admin form delete kembali setelah refresh | ✅ | 6 Juni 2026 |
| 3 | Comments tidak persisten | ✅ | 6 Juni 2026 |
| 4 | Database migration pending | ✅ | 6 Juni 2026 |
| 5 | Seed data kosong | ✅ | 6 Juni 2026 |
| 6 | OG Image 404 | ✅ | 1 Juli 2026 |
| 7 | Offline sync end session bug | ✅ | 1 Juli 2026 |
| 8 | Tracking field mismatch | ✅ | 1 Juli 2026 |
| 9 | CSRF cookie Secure flag di HTTP | ✅ | 2 Juli 2026 |
| 10 | E2E password mismatch (admin123 ≠ demo12345) | ✅ | 2 Juli 2026 |
| 11 | CSP duplikasi nginx + next.config | ✅ | 2 Juli 2026 |
| 12 | Docker certbot_data volume nganggur | ✅ | 2 Juli 2026 |
| 13 | Worker missing depends_on postgres | ✅ | 2 Juli 2026 |
| 14 | MCP packages di runtime dependencies | ✅ | 2 Juli 2026 |

---

## 📋 Yang Belum

1. **Xendit key real** — masih placeholder (menunggu client)
2. **Sentry DSN** — error monitoring (masih kosong)
3. **Comments UI** — frontend belum integrasi API comments
4. **GPS tracking points sync** — data di IndexedDB belum dikirim ke server
5. **Secret management** — env vars masih hardcoded, perlu secret manager
6. **E2E Firefox/WebKit tests** — masih ada fail di browser non-Chromium

---

## 📜 License

© 2026 Jaga Semesta — Uji coba (proof of concept)
