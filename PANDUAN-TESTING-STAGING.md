# 🧪 Panduan Uji Coba Lengkap SpringHub — STAGING

**Versi:** 19 Agustus 2026 · **Target:** Staging (kode sesi 17 + impor data Epicollect5)
**Status uji coba:** gunakan checklist di bawah — centang ☑ saat berhasil.

---

## Daftar Isi
1. [Cara Masuk dari PC](#1-cara-masuk-dari-pc)
2. [Akun Uji](#2-akun-uji)
3. [Data yang Tersedia di Staging](#3-data-yang-tersedia-di-staging)
4. [Data Baru Impor Epicollect5 (199 laporan!)](#4-data-baru-impor-epicollect5)
5. [A. Alur Utama Laporan (fokus: foto)](#a-alur-utama-laporan)
6. [B. Foto — 3 Kasus yang Diperbaiki](#b-foto--3-kasus-yang-diperbaiki)
7. [C. Marketplace Bibit (Seedling)](#c-marketplace-bibit-seedling)
8. [D. Kursus & Poin](#d-kursus--poin)
9. [E. Proyek](#e-proyek)
10. [F. Donasi](#f-donasi)
11. [G. Offline / PWA](#g-offline--pwa)
12. [H. Keamanan (CSRF / PII)](#h-keamanan-csrf--pii)
13. [I. Halaman Publik & Info](#i-halaman-publik--info)
14. [J. Admin Panel — Semua Tab](#j-admin-panel--semua-tab)
15. [K. Data Langsung dari Database](#k-data-langsung-dari-database)
16. [Log Hasil](#16-log-hasil)

---

## 1. Cara Masuk dari PC

> Staging berjalan di VPS. Ada **2 cara** mengaksesnya dari PC Windows kamu.

### Cara A — Tunnel SSH (disarankan, paling aman)

**Langkah 1 — Jalankan tunnel** (dari PowerShell/CMD, tanpa install apa pun — OpenSSH sudah bawaan Windows 10/11):
```
ssh -L 8080:127.0.0.1:8080 root@IP-VPS
```
> Ganti `IP-VPS` dengan alamat IP VPS. Jendela ini **harus tetap terbuka** selama sesi.

**Langkah 2 — Buka di browser:**
```
http://localhost:8080
```

### Cara B — Akses langsung tanpa SSH (opsional, setelah diminta)

Bisa dibuka langsung dari browser PC tanpa PowerShell, mis. `http://IP-VPS:8080`.
> Status: **belum diaktifkan** (nginx staging masih bind `127.0.0.1`). Hubungi assistant untuk mengubah bind menjadi `0.0.0.0` bila kamu mau cara ini.

### Untuk kedua cara — Basic Auth (pop-up di browser):

| | |
|---|---|
| User | `181ff4f6c436d9a69f9dd12e` |
| Pass | `1a20e619d2d431d66ac60b17` |

**Langkah terakhir — Login aplikasi** dengan akun sesuai tabel di bawah.

---

## 2. Akun Uji

| Peran | Email | Password | Kegunaan |
|---|---|---|---|
| Admin | `admin@springhub.id` | `demo12345` | Akses semua `/admin/*`, approve/reject, setujui bibit |
| Field Lead | `ucup@springhub.id` | `ucup12345` | Bisa buat proyek + bibit |
| Volunteer | `volunteer@springhub.id` | `vol12345` | Isi form, minta bibit |
| **Data Epicollect5** | `epicollect@springhub.id` | `epicollect12345` | Pemilik 199 laporan impor |

> 💡 Tips: pakai 2 browser berbeda (mis. Chrome untuk admin, Firefox/incognito untuk volunteer) supaya bisa test dua peran sekaligus tanpa login bolak-balik.

---

## 3. Data yang Tersedia di Staging

| Data | Jumlah | Catatan |
|---|---|---|
| Laporan pending | **203** | 4 lama + **199 impor baru** — siap untuk approve/reject |
| Laporan approved | 249 | sudah tampil publik |
| Mata air aktif | 73 | tampil di `/springs` |
| Spring pending baru | 187 | dari impor — tunggu approve di `/admin/map/springs` |
| Foto laporan | ~1.200 | 551 foto baru hasil impor (proses ulang 720p) |
| Bibit (seedling) | 6 | tersedia di marketplace |
| Permintaan bibit pending | 1 | dari "Admin Demo" untuk bibit "Jarise" |
| Kursus | 3 | di `/learn` |
| Proyek | 12 | di `/projects` |
| Donasi | 6 | riwayat (pembayaran asli nonaktif) |
| User | 12 | termasuk akun demo |

---

## 4. Data Baru Impor Epicollect5 (199 laporan!)

Data survei mata air dari Epicollect5 (form `pemantauan-mata-air` + `jaga-semesta-spring-tracker-4`) sudah diimpor ke staging — **19 Agustus 2026**, script `scripts/import-epicollect.ts`.

**Yang diimpor:**
- **199 laporan** `spring-monitoring` — status **pending** (siap di-review) — atas nama akun `epicollect@springhub.id`
- **551 foto asli** didownload dari Epicollect5 → diproses ulang (resize 720p + watermark) → tampil di `/uploads/reports/...`
- **187 Spring baru** status pending (per nama mata air, di-dedupe)

**Cakupan wilayah:** Kebumen, Klaten, Magelang, Pamekasan, Sleman, Kediri, dan lainnya.

**Cara terbaik memakainya untuk uji coba:**

| # | Langkah | Akun | Hasil | Status |
|---|---|---|---|---|
| D0-1 | Buka `/admin/review` | admin | Ribuan laporan impor + foto tampil | ☐ |
| D0-2 | Filter/kategori laporan → pilih beberapa → **Approve** | admin | Status → approved + poin + muncul di peta | ☐ |
| D0-3 | Buka `/admin/map/springs` | admin | **187 Spring pending** — approve beberapa | ☐ |
| D0-4 | Cek `/springs` publik | publik | Spring yang di-approve tampil dengan foto | ☐ |
| D0-5 | Buka profile `epicollect@springhub.id` | admin | 199 laporan atas nama akun ini | ☐ |

> 💡 **Poin tidak otomatis** diberikan saat impor — poin hanya bertambah saat admin **Approve** laporan (sesuai desain aplikasi). Jadi impor ini sekaligus jadi "bahan latihan" alur review: dari 203 pending, approve beberapa saja untuk uji coba.

> ℹ️ Impor **tidak menyentuh produksi** — hanya DB `springhub_staging` di VPS.

---

## 5. A. Alur Utama Laporan

**Tujuan:** memastikan laporan + foto masuk benar sampai di admin dan tampil publik.

| # | Langkah | Akun | Hasil yang Diharapkan | Status |
|---|---|---|---|---|
| A1 | Buka `/report/spring-monitoring` | volunteer | Form tampil lengkap | ☐ |
| A2 | Isi semua field + upload **3 foto** | volunteer | Preview 3 foto muncul | ☐ |
| A3 | Submit | volunteer | Sukses, **tidak ada peringatan foto** | ☐ |
| A4 | Buka `/admin/review` | admin | Laporan baru muncul **dengan 3 foto** (thumbnail) | ☐ |
| A5 | Klik foto → lightbox besar | admin | Foto tampil besar | ☐ |
| A6 | Klik ⭐ pada satu foto → **Approve** | admin | Status → approved, poin bertambah | ☐ |
| A7 | Cek halaman publik `/springs` atau `/report/...` | publik | Laporan tampil dengan foto | ☐ |
| A8 | Pilih laporan lain → **Reject** dengan catatan | admin | Status rejected + catatan tersimpan | ☐ |

---

## 6. B. Foto — 3 Kasus yang Diperbaiki

| # | Langkah | Hasil yang Diharapkan | Status |
|---|---|---|---|
| B1 | Submit form dengan **6 foto** | **Ditolak client**: "Maksimal 5 foto per laporan" | ☐ |
| B2 | Upload file **.heic** (rename foto jadi .heic) | **Pesan ramah**: "Format HEIC/HEIF (iPhone) belum didukung..." — bukan error mentah | ☐ |
| B3 | Buka laporan lama hasil restore di `/admin/review` | **Foto tampil normal** (file sudah disalin dari produksi) | ☐ |
| B4 | Buka laporan tanpa foto di `/admin/review` | Muncul badge **"⚠️ Tidak ada foto terlampir"** | ☐ |

---

## 7. C. Marketplace Bibit (Seedling)

**Tujuan:** alur 2 arah (lapor bibit → minta bibit → setujui → terima).

| # | Langkah | Akun | Hasil yang Diharapkan | Status |
|---|---|---|---|---|
| C1 | Buka `/seedlings` | publik | Grid bibit + filter provinsi + search | ☐ |
| C2 | Buka detail satu bibit | publik | Detail + foto + tombol Minta | ☐ |
| C3 | Klik Minta (isi jumlah + pesan) | volunteer | Permintaan terkirim (status Menunggu) | ☐ |
| C4 | Buka `/admin/seedlings/requests` | admin | Permintaan muncul | ☐ |
| C5 | Klik **Setujui** | admin | **Sukses** (sebelumnya 404), status → Selesai, stok berkurang | ☐ |
| C6 | Buka `/seedlings/my-listings` | volunteer (yang punya bibit) | Status permintaan tampil benar (Menunggu/Selesai/Ditolak/Dibatalkan) — **tidak ada tombol demo** | ☐ |
| C7 | Minta bibit kedua → `/seedlings/my-requests` | volunteer | Klik **Konfirmasi Terima** → status Selesai, stok berkurang | ☐ |
| C8 | Cek notifikasi | volunteer/admin | Ada notif transaksi bibit | ☐ |

---

## 8. D. Kursus & Poin

| # | Langkah | Hasil yang Diharapkan | Status |
|---|---|---|---|
| D1 | Buka `/learn` | 3 kursus tampil | ☐ |
| D2 | Buka satu kursus → selesaikan modul → klik selesai | Poin +25 (atau sesuai aturan poin) | ☐ |
| D3 | Submit progress kursus yang **tidak ada** (via DevTools) | **404 "Course tidak ditemukan"** (anti point-farming) | ☐ |
| D4 | Submit ulang progress kursus yang sudah selesai | **Tidak dapat poin dobel** | ☐ |

---

## 9. E. Proyek

| # | Langkah | Akun | Hasil yang Diharapkan | Status |
|---|---|---|---|---|
| E1 | Buka `/projects` | publik | Daftar proyek approved | ☐ |
| E2 | Buka `/projects/new` | **volunteer** | **Ditolak**: hanya Field Lead/Admin | ☐ |
| E3 | Buka `/projects/new` | **ucup** | Form tampil | ☐ |
| E4 | Isi + upload 3 foto + file proposal (PDF <5MB) → submit | ucup | Proyek terkirim (pending) | ☐ |
| E5 | Upload proposal **>5MB** | ucup | Ditolak "File proposal maksimal 5MB" | ☐ |
| E6 | `/admin/projects` → setujui/tolak | admin | Status berubah + email ke pemilik | ☐ |
| E7 | Buka detail proyek approved | publik | Tampil tanpa kontak/proposal (privasi) | ☐ |

---

## 10. F. Donasi

| # | Langkah | Hasil yang Diharapkan | Status |
|---|---|---|---|
| F1 | Buka section donasi (landing `/` atau `/donate`) | Tampil (banner atau info) | ☐ |
| F2 | Klik donasi | **TIDAK muncul pesan internal** (sebelumnya bocor "XENDIT_SECRET_KEY is not set") — pakai pesan aman | ☐ |
| F3 | `/admin/donations` | Riwayat 6 donasi + tombol Export CSV | ☐ |

> ⚠️ Pembayaran asli **tidak bisa diuji** di staging (butuh Xendit key real). Yang diuji hanya perilaku aman saat key kosong.

---

## 11. G. Offline / PWA

| # | Langkah | Hasil yang Diharapkan | Status |
|---|---|---|---|
| G1 | Buka `/offline` | Setup sesi offline | ☐ |
| G2 | Atur mode offline (DevTools → Network → Offline) | Aplikasi masih bisa diisi | ☐ |
| G3 | Isi satu form lengkap + foto → tersimpan lokal | Muncul "Tersimpan" (antrean) | ☐ |
| G4 | Kembalikan online → tunggu 10 detik (QueueWorker) | **Sync otomatis** | ☐ |
| G5 | Cek `/admin/review` | Laporan offline muncul **+ foto** (tidak hilang lagi) | ☐ |

---

## 12. H. Keamanan (CSRF / PII)

Uji lewat **DevTools (F12) → Console** di browser. Jalankan potongan ini:

```js
// H1: API admin tanpa login → harus 403
fetch("/api/admin/reports").then(r => console.log("H1 admin API:", r.status));
```
```js
// H2: ubah profil tanpa CSRF → harus 403
fetch("/api/user/profile", {
  method: "PUT",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ username: "hacker" })
}).then(r => console.log("H2 profile PUT:", r.status));
```
```js
// H3: progress kursus tanpa CSRF → harus 403
fetch("/api/courses/progress", {
  method: "PUT",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({})
}).then(r => console.log("H3 course progress:", r.status));
```
```js
// H4: detail bibit → TIDAK boleh ada field phone (publik)
fetch("/api/seedlings").then(r=>r.json()).then(d => {
  const id = d.seedlings?.[0]?.id;
  if (id) fetch(`/api/seedlings/${id}`).then(r=>r.json()).then(x =>
    console.log("H4 phone di user:", "phone" in (x.seedling?.user||{}))); // harus false
});
```
```js
// H5: cek header keamanan di respons
fetch("/api/health").then(r => {
  console.log("H5 Cache-Control:", r.headers.get("cache-control"));
});
```

| # | Hasil yang Diharapkan | Status |
|---|---|---|
| H1 | `403` | ☐ |
| H2 | `403` | ☐ |
| H3 | `403` | ☐ |
| H4 | `false` (phone tidak bocor) | ☐ |
| H5 | `no-cache, no-store, must-revalidate` | ☐ |

---

## 13. I. Halaman Publik & Info

| Route | Isi | Status |
|---|---|---|
| `/` | Landing (hero, map, dashboard, volunteer, learning, donate) | ☐ |
| `/springs` | Daftar mata air + laporan + foto | ☐ |
| `/map` (jika ada) | Peta interaktif | ☐ |
| `/learn` | Kursus | ☐ |
| `/projects` | Proyek | ☐ |
| `/seedlings` | Marketplace bibit | ☐ |
| `/about` `/faq` `/help` `/privacy` `/terms` | Halaman statis | ☐ |
| `/senior` | Halaman khusus | ☐ |

---

## 14. J. Admin Panel — Semua Tab

Login **admin** → buka `/admin`:

| Tab | Cara Test | Status |
|---|---|---|
| Dashboard | Lihat statistik | ☐ |
| Review | Approve/reject + pilih thumbnail | ☐ |
| Reports | Filter status/tanggal, Export CSV | ☐ |
| Orphans | Cek laporan tanpa spring | ☐ |
| Users | Lihat daftar user + poin | ☐ |
| Trust Score | Ubah skor satu user | ☐ |
| Forms | Buka builder form (5 jenis), lihat field | ☐ |
| Donations | Lihat riwayat + Export CSV | ☐ |
| Points | Lihat rules poin + ubah nilai | ☐ |
| Courses | CRUD kursus + modul | ☐ |
| Seedlings | Approve/reject bibit | ☐ |
| Seedlings → Permintaan | Setujui permintaan | ☐ |
| Feedback | Lihat feedback | ☐ |
| Errors | Tandai baca / hapus error | ☐ |
| Projects | Setuju/tolak proyek | ☐ |
| Content | Edit blok konten landing | ☐ |

---

## 15. K. Data Langsung dari Database

Dari **VPS** (SSH), cek data staging langsung:

```bash
# Masuk psql staging
docker exec staging-postgres psql -U springhub -d springhub_staging
```

Query yang berguna:
```sql
-- Laporan pending (203 — termasuk 199 hasil impor)
SELECT id, "formSlug", "createdAt"::date FROM "Report" WHERE status='pending';

-- Laporan hasil impor Epicollect5
SELECT count(*) FROM "Report" WHERE "clientCorrelationId" IS NOT NULL;

-- Foto satu laporan
SELECT "storagePath" FROM "ReportPhoto" WHERE "reportId"='<report-id>';

-- Semua bibit
SELECT species, quantity, stock, status FROM "Seedling";

-- Permintaan bibit
SELECT * FROM "SeedlingRequest";

-- Spring pending (187 hasil impor) — approve di /admin/map/springs
SELECT name, "snappedLat", "snappedLng" FROM "Spring" WHERE status='pending';

-- Buat user jadi admin (hati-hati, hanya staging!)
-- UPDATE "Profile" SET role='admin' WHERE email='email-kamu@contoh.com';
```

---

## 16. Log Hasil

Isi saat selesai:

```
Tanggal uji: __________
Penguji: __________

Ringkasan:
- Total langkah diuji: ____ / ____
- Pass: ____ · Fail: ____ · Skip: ____

Daftar FAIL (copy pesan error / screenshot):
1. ______________________________________
2. ______________________________________

Catatan tambahan:
__________________________________________
```

---

## ⚠️ Peringatan Penting

1. **Semua data staging TERPISAH dari produksi** — mengubah apa pun di staging aman, tidak menyentuh `www.springhub.id`.
2. **Jangan menjalankan `fix-orphan-reports --apply` ke produksi** (hanya staging, kalau diuji).
3. **Jangan menjalankan `import-epicollect.ts --apply` ke produksi** — script ini dibuat khusus DB staging.
4. Jika menemukan bug: catat langkah + pesan error + screenshot, lalu laporkan.
