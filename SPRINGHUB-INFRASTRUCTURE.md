# SpringHub — Infrastructure & Hosting Analysis

> **Tanggal:** 20 Mei 2026
> **Domain:** springhub.com
> **Stack:** Next.js 14 App Router + Supabase Postgres + Cloudflare R2

---

## 📊 Skenario Beban

| Metrik | Angka |
|---|---|
| Total user | 3.000 |
| User aktif harian (DAU) | 400 |
| Form submission/hari | ~600 (400 user × 1-2 form) |
| Donasi/hari | 250 transaksi |
| Project/bulan | 30 proposal |
| Email/bulan | 3.000 (1 event bulanan) |
| Foto/hari | ~400 upload |
| Domain | springhub.com |

---

## 💰 Tiga Rekomendasi

### 🥇 1. PALING MURAH — $28/bulan (≈ Rp 434.000)

| Item | Biaya | Keterangan |
|---|---|---|
| Vercel Hobby | $0 | 100GB bandwidth, custom domain, 600 build/minggu |
| Supabase Pro | $25 | 8GB Postgres — **WAJIB** untuk 3.000 user |
| Cloudflare R2 | $2 | 10GB storage foto — 0 egress fee |
| Resend | $0 | 100 email/hari = 3.000/bulan ✅ pas buat event |
| Domain springhub.com | $1 | ≈ Rp 150.000/tahun |
| **TOTAL** | **$28/bulan** | **≈ Rp 434.000** ✅ |
| **Sisa budget** | | **Rp 566.000** — cadangan / iklan / upgrade |

**✅ Paling direkomendasikan. Semua fitur jalan, budget hemat.**
```
User ─→ Vercel Hobby (Next.js + API)
         ├── Supabase Pro (Postgres 8GB)
         ├── Cloudflare R2 (foto)
         └── Resend (email event)
```

---

### 🥈 2. PALING POWERFULL — $58/bulan (≈ Rp 900.000)

| Item | Biaya | Keterangan |
|---|---|---|
| Vercel Pro | $20 | 1TB bandwidth + analytics + preview deploy |
| Supabase Pro | $25 | 8GB Postgres + 100GB bandwidth |
| Cloudflare R2 | $2 | Storage foto |
| Resend Pro | $10 | 50.000 email/bulan |
| Domain springhub.com | $1 | |
| **TOTAL** | **$58/bulan** | **≈ Rp 900.000** |
| **Sisa budget** | | **Rp 100.000** |

**🔥 Performa maksimal, analytics, notifikasi massal.**

---

### 🥉 3. PALING MURAH (RISKAN) — $3/bulan (≈ Rp 46.000)

| Item | Biaya | Keterangan |
|---|---|---|
| Vercel Hobby | $0 | |
| Supabase Free | $0 | ⚠️ **500MB — TIDAK CUKUP** untuk 3.000 user |
| Cloudflare R2 | $2 | |
| Domain | $1 | |
| **TOTAL** | **$3/bulan** | **⚠️ RISIKO TINGGI** |

**❌ Tidak disarankan.** Database 500MB penuh dalam 1-2 bulan dengan 400 form/hari.

---

## 🏆 REKOMENDASI UTAMA: **$28/bulan (≈ Rp 434.000)**

### Kenapa?

| Argumen | Penjelasan |
|---|---|
| **Vercel Hobby cukup** | 100GB bandwidth untuk 400 DAU hanya perlu ~30GB |
| **Supabase Pro WAJIB** | 8GB Postgres — 3.000 user dengan 600 form/hari butuh ~3-5GB |
| **R2 murah** | $2 untuk 10GB — gak ada biaya transfer (beda sama S3) |
| **Resend gratis** | 100/hari pas untuk 1 event/bulan ke 3.000 user |
| **Sisa budget Rp 566rb** | Bisa buat domain, iklan, atau upgrade kapan aja |

### Skenario Biaya Detail:

```
📅 Bulanan:
  Vercel Hobby     Rp 0
  Supabase Pro     Rp 387.000
  Cloudflare R2    Rp 31.000
  Resend           Rp 0
  ─────────────────────────
  Total            Rp 418.000

📅 Tahunan:
  Domain springhub.com  Rp 150.000/tahun ≈ Rp 12.500/bulan

📅 Grand Total:
  Rp 418.000 + Rp 12.500 = Rp 430.500/bulan
```

### Catatan Penting:

| Komponen | Penjelasan |
|---|---|
| **Domain** | Beli di Hostinger / Niagahoster |
| **Vercel** | Hubungkan domain di Settings → Domains |
| **Supabase Pro** | Upgrade dari free — 1 klik, turun 8GB |
| **R2** | Minimal $2 — bayar sesuai pemakaian |
| **Hostinger** | ❌ Tidak cocok untuk Next.js App Router (shared hosting) |

---

## 📌 Kesimpulan

Dengan budget **≤ Rp 500.000/bulan**, kamu bisa menjalankan SpringHub dengan:

- ✅ 3.000 user terdaftar
- ✅ 400 user aktif harian
- ✅ 600 form submission/hari
- ✅ 250 donasi/hari
- ✅ 30 project/bulan
- ✅ Event email ke 3.000 user
- ✅ Domain springhub.com
- ✅ Sisa budget Rp 60.000-70.000

**Arsitektur:** Vercel Hobby → Supabase Pro → Cloudflare R2 → Resend

Siap deploy kapan aja. 🚀
