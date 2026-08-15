# Manual Testing — Sesi 17 (Audit + Fix Foto + Hardening)

**Tanggal:** 15 Agustus 2026
**Target:** Staging (`http://localhost:8080` via SSH tunnel)
**Basic Auth staging:** user `181ff4f6c436d9a69f9dd12e` / pass `1a20e619d2d431d66ac60b17`
**Akun aplikasi:** admin `admin@springhub.id`/`demo12345` · volunteer `volunteer@springhub.id`/`vol12345` · ucup `ucup@springhub.id`/`ucup12345`
**Commit yang diuji:** `382623e`

---

## A. Persiapan

1. Aktifkan tunnel SSH dari PC (PowerShell):
   ```
   ssh -L 8080:127.0.0.1:8080 root@IP-VPS
   ```
2. Buka `http://localhost:8080` → masukkan basic auth → login admin.
3. Siapkan **file gambar JPG/PNG** kecil di PC (minimal 3) untuk tes upload.

---

## B. Tes Alur Foto Laporan (fokus utama sesi 17)

### B1. Upload online dengan foto
| # | Langkah | Hasil yang Diharapkan | Status |
|---|---|---|---|
| 1 | Login sebagai **volunteer** | Masuk dashboard | ☐ |
| 2 | Buka form **Stok Bibit** (`/report/seedling-stock`) | Form tampil | ☐ |
| 3 | Isi field wajib + upload **3 foto** | 3 foto terlihat di preview | ☐ |
| 4 | Submit laporan | **Sukses + 0 peringatan foto** (sebelumnya sering ⚠️) | ☐ |
| 5 | Login sebagai **admin** → `/admin/review` | Laporan tampil **dengan 3 foto** (thumbnail) | ☐ |

### B2. Upload >5 foto harus ditolak di client
| # | Langkah | Hasil yang Diharapkan | Status |
|---|---|---|---|
| 1 | Volunteer buka form stok bibit lagi | Form tampil | ☐ |
| 2 | Upload **6 foto** | **Ditolak**: "Maksimal 5 foto per laporan" | ☐ |

### B3. Foto HEIC (iPhone) — pesan ramah
| # | Langkah | Hasil yang Diharapkan | Status |
|---|---|---|---|
| 1 | Buka form stok bibit, upload file **.heic** (kalau tidak punya, rename foto jadi `.heic`) | Muncul pesan ramah: *"Format HEIC/HEIF (iPhone) belum didukung. Ubah ke JPG dulu..."* — **bukan error mentah** | ☐ |

### B4. Badge "0 foto" di admin/review
| # | Langkah | Hasil yang Diharapkan | Status |
|---|---|---|---|
| 1 | Login admin → `/admin/review` | Ada laporan bertanda **"⚠️ Tidak ada foto terlampir"** (untuk laporan tanpa foto) | ☐ |
| 2 | Laporan dengan foto menampilkan ⭐ pilih thumbnail | Bisa pilih foto sebagai thumbnail | ☐ |

---

## C. Tes CSRF (keamanan)

| # | Endpoint | Cara Test | Hasil Diharapkan | Status |
|---|---|---|---|---|
| 1 | Upload foto tanpa token | (otomatis via UI) Upload foto — browser selalu kirim token | Sukses | ☐ |
| 2 | `POST /api/projects` tanpa CSRF | DevTools → fetch tanpa header | **403** | ☐ |
| 3 | `PUT /api/user/profile` tanpa CSRF | DevTools → fetch tanpa header | **403** | ☐ |
| 4 | `POST /api/projects/{id}/comments` tanpa CSRF | DevTools → fetch tanpa header | **403** | ☐ |
| 5 | `POST /api/projects/{id}/like` tanpa CSRF | DevTools → fetch tanpa header | **403** | ☐ |
| 6 | `DELETE /api/reports/{id}` tanpa CSRF | DevTools → fetch tanpa header | **403** | ☐ |
| 7 | `POST /api/courses/progress` tanpa CSRF | DevTools → fetch tanpa header | **403** | ☐ |
| 8 | `PUT /api/user/profile` dengan CSRF (ganti username) | Profil berubah | 200 | ☐ |

**Cara tes cepat via DevTools:**
```js
await fetch("/api/user/profile", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username: "xyz" }) }).then(r => r.status)
// Harus: 403
```

---

## D. Tes Privasi PII (bocor ke publik)

| # | Endpoint | Cara Test | Hasil Diharapkan | Status |
|---|---|---|---|---|
| 1 | Detail bibit tanpa login | Buka `/seedlings/{id}` di **incognito** | Nomor WA pemilik **TIDAK tampil** | ☐ |
| 2 | `GET /api/seedlings/{id}` tanpa login | DevTools incognito → fetch | Response **tanpa field `phone`** | ☐ |
| 3 | Detail proyek tanpa login | Buka `/projects/{id}` approved di incognito | `contactPhone`/`contactEmail`/proposal **null** | ☐ |
| 4 | `GET /api/map-points/{id}` | fetch di incognito | `fieldData` **tidak berisi nama/WA/koordinat presisi** | ☐ |
| 5 | Search spring | `/springs?search=...` | Hanya spring **approved** yang muncul | ☐ |

---

## E. Tes Middleware Admin IP + Role

| # | Langkah | Hasil yang Diharapkan | Status |
|---|---|---|---|
| 1 | Login admin → buka `/api/admin/reports` di browser | 200 (data laporan) | ☐ |
| 2 | DevTools incognito (tanpa login) → fetch `/api/admin/reports` | **403** | ☐ |
| 3 | Login **volunteer** → fetch `/api/admin/reports` | **403** | ☐ |

---

## F. Tes Alur Seedling (fix route 404 + vocab)

### F1. Admin setujui permintaan bibit (sebelumnya 404)
| # | Langkah | Hasil yang Diharapkan | Status |
|---|---|---|---|
| 1 | Login **ucup** → minta bibit di marketplace `/seedlings/{id}` | Permintaan terkirim (status Menunggu) | ☐ |
| 2 | Login **admin** → `/admin/seedlings/requests` | Permintaan ucup muncul | ☐ |
| 3 | Klik **Setujui** | Sukses (sebelumnya 404 diam-diam), status → Selesai | ☐ |
| 4 | Cek stok bibit di `/seedlings` | Stok berkurang sesuai jumlah diminta | ☐ |

### F2. Vocab status benar
| # | Langkah | Hasil yang Diharapkan | Status |
|---|---|---|---|
| 1 | `my-requests` (permintaan yang dikirim) | Status tampil: Menunggu / Selesai / Ditolak / Dibatalkan — **bukan** "approved/fulfilled" | ☐ |
| 2 | `my-listings` (bibitku) | Status request sesuai enum; **tidak ada tombol "demo"** | ☐ |

### F3. Konfirmasi Terima (real)
| # | Langkah | Hasil yang Diharapkan | Status |
|---|---|---|---|
| 1 | Volunteer minta bibit ke listing ucup | Permintaan pending | ☐ |
| 2 | Volunteer buka `my-requests` → klik **Konfirmasi Terima** | Status → Selesai, stok berkurang | ☐ |

---

## G. Tes Cache & Header

| # | Langkah | Hasil yang Diharapkan | Status |
|---|---|---|---|
| 1 | `curl -I /api/health` (atau DevTools Response Headers) | `Cache-Control: no-cache, no-store, must-revalidate` | ☐ |
| 2 | Buka halaman apa pun → DevTools → Response Headers CSP | `script-src` **tanpa** `'unsafe-eval'` | ☐ |

---

## H. Tes Regresi (fitur lama tetap jalan)

| # | Fitur | Cara Test | Hasil | Status |
|---|---|---|---|---|
| 1 | Login/Logout | Admin + volunteer | Sukses | ☐ |
| 2 | Submit laporan monitoring | `/report/spring-monitoring` lengkap | Sukses | ☐ |
| 3 | Admin approve single | `/admin/review` → Approve | Poin +100, status approved | ☐ |
| 4 | Admin approve-all | `/admin/reports` → tombol approve all | Semua pending → approved, poin benar | ☐ |
| 5 | Donasi | Klik donasi (key kosong di staging) | **Banner/error aman** — bukan pesan internal Xendit | ☐ |
| 6 | Kursus | `/learn` → buka kursus → progress | Poin kursus 1× per user | ☐ |
| 7 | Halaman /learn kosong | (kalau DB kosong) | **Empty state** — bukan kursus palsu | ☐ |
| 8 | Proyek unggulan landing | `/` | **Empty state jujur** jika tak ada proyek approved | ☐ |
| 9 | Offline mode | `/offline` → setup sesi → sync | Session/sync berhasil (CSRF header otomatis) | ☐ |
| 10 | Proyek baru | `/projects/new` (ucup field_lead) | Sukses + proposalFile diterima | ☐ |
| 11 | Proposal >5MB | Upload file >5MB | **Ditolak** "File proposal maksimal 5MB" | ☐ |

---

## I. Checklist Akhir

- [ ] Semua tes B1–B4 (foto) PASS — **tidak ada lagi laporan tanpa foto**
- [ ] Semua tes C (CSRF) → 403 tanpa token
- [ ] Semua tes D (PII) → data sensitif tidak bocor
- [ ] Semua tes F (seedling) → tidak ada 404/alert demo
- [ ] Tidak ada error baru di Console/Network tab

**Jika ada yang GAGAL:** catat langkah + screenshot + pesan error, lalu laporkan. Simpan hasil di file ini (tandai ☑).
