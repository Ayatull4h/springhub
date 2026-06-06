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
| `admin@test.com` | `admin123` | admin |
| `volunteer@test.com` | `vol12345` | volunteer |

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

## 📊 Status Proyek (per 6 Juni 2026)

| Layer | Status |
|---|---|
| Landing page UI | 100% ✅ |
| Form UI (5 forms + dynamic) | 100% ✅ |
| Map UI (Leaflet + filter) | 100% ✅ |
| Backend API (52 routes) | 100% ✅ |
| Database (19 tables + seed) | 100% ✅ |
| Auth (login, register, session) | 100% ✅ |
| Donasi (Xendit) | 100% ✅ (placeholder key) |
| Admin Panel (10 tabs) | 100% ✅ |
| Points Engine | 100% ✅ |
| Offline Survey Mode | 100% ✅ |
| PWA / SEO | 100% ✅ |
| Anti-Spam | 100% ✅ |
| Testing | 80% ⏳ |
| **Total** | **~90%** |

---

## 🐛 Bug History

| # | Bug | Status | Fixed |
|---|---|---|---|
| 1 | Offline photo upload gagal Chrome Android | ✅ | 6 Juni 2026 |
| 2 | Admin form delete kembali setelah refresh | ✅ | 6 Juni 2026 |
| 3 | Comments tidak persisten | ✅ | 6 Juni 2026 |
| 4 | Database migration pending | ✅ | 6 Juni 2026 |
| 5 | Seed data kosong | ✅ | 6 Juni 2026 |

---

## 📋 Yang Belum

1. **Xendit key real** — masih placeholder
2. **Sentry DSN** — error monitoring
3. **Supabase RLS policies** — perlu di-apply
4. **Comments UI** — frontend belum integrasi
5. **Testing** — E2E + unit test
6. **Migrasi ke VPS** — masih Vercel + Supabase free tier

---

## 📜 License

© 2026 Jaga Semesta — Uji coba (proof of concept)
