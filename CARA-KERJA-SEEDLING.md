# 🌱 Cara Kerja Seedlings (Bibit) di SpringHub

> Dijelaskan dengan bahasa sederhana, tanpa kode.

---

## 1. Hubungan Seedlings dengan springhub.id

Seedlings (halaman bibit) adalah **salah satu fitur** dari web SpringHub, seperti **halaman Donasi** atau **halaman Laporan Monitoring**. Bedanya, halaman ini dibuat sebagai HTML statis yang berdiri sendiri — belum nyambung penuh ke database.

**Bagan alur sekarang:**

```
┌─────────────────────────────────────────────────────┐
│                    springhub.id                      │
│                                                      │
│  Beranda → Donasi → Laporan → Proyek → BELAJAR → ...│
│                                                      │
│  (saat ini seedlings.html adalah file terpisah,     │
│   belum terintegrasi sebagai menu di navbar)        │
└─────────────────────────────────────────────────────┘
                          ↕ (belum nyambung)
┌─────────────────────────────────────────────────────┐
│              public/seedlings.html                   │
│                                                      │
│  • Data masih dummy (10 jenis bibit)                 │
│  • Tombol "Minta" belum kirim ke database            │
│  • Tombol "Laporkan" masih placeholder               │
└─────────────────────────────────────────────────────┘
```

### Cara nyambungin ke springhub.id:

```
                   SPRINGHUB.ID
  ┌────────────────────────────────────────────┐
  │  Navbar → tambah menu "Bibit"              │
  │  Arahkan ke → /bibit                        │
  └────────────────────┬───────────────────────┘
                       │
                       ▼
              ┌──────────────────┐
              │  app/bibit/page  │
              │  (Next.js route) │
              └────────┬─────────┘
                       │
                       ▼
        ┌──────────────────────────────┐
        │  Ambil data bibit dari DB    │
        │  pake Prisma query           │
        └────────────┬─────────────────┘
                     │
                     ▼
        ┌──────────────────────────────┐
        │  Tampilin di halaman ────────│──→ Kamu lihat kartu bibit
        │  + filter + search           │
        └──────────────────────────────┘
```

**Caranya:**
1. File `seedlings.html` diubah jadi halaman resmi Next.js (`app/bibit/page.tsx`)
2. Data dummy (10 bibit) diganti pake **database beneran**
3. Ditambah menu "Bibit" di navbar website
4. Begitu masuk springhub.id → klik "Bibit" → muncul semua bibit yang terdaftar

---

## 2. Cara Kerja Tombol "Minta"

Sekarang ini tombol "Minta" cuma animasi doang — nggak ngirim apa-apa. Begini cara kerjanya **nanti**.

### Alur lengkap "Minta Bibit":

```
Kamu lihat kartu bibit
        │
        ▼
Klik "Minta"
        │
        ▼
Muncul form isian:
  • Jumlah bibit (contoh: 10)
  • Pesan (contoh: "Mau tanam di kebun")
        │
        ▼
Kamu klik "Kirim Permintaan"
        │
        ▼
┌──────────────────────────────────────────┐
│   Sistem ngecek:                         │
│   • Stok bibit cukup? (sisa ≥ jumlah)   │
│   • Kamu login sebagai volunteer?        │
│   • Kamu belum minta bibit ini           │
│     sebelumnya? (anti spam)              │
└────────────────┬─────────────────────────┘
                 │
      ┌──────────┴──────────┐
      ▼                     ▼
  MEMENUHI               TIDAK MEMENUHI
      │                     │
      ▼                     ▼
  Permintaan            Muncul pesan
  tersimpan              error (stok
  di database            kurang / belum
      │                  login / dll)
      ▼
  Pemilik bibit
  dapat notifikasi:
  "Ada yang minta
  bibit Jati kamu!"
      │
      ▼
┌─────────────────────────────────────────┐
│   Pemilik bisa:                         │
│   • SETUJUI → kartu "Disetujui" +      │
│               tampil nomor HP           │
│   • TOLAK   → kartu "Ditolak"          │
└────────────────┬────────────────────────┘
                 │
         ┌───────┴───────┐
         ▼               ▼
     DISETUJUI        DITOLAK
         │               │
         ▼               ▼
  Kamu lihat nomor    Kamu cari
  HP pemilik →        bibit lain
  hubungi →
  ambil bibit →
  tandai "Selesai"
```

### Siapa yang terlibat:

| Peran | Tugas |
|---|---|
| **Volunteer A (Pemilik)** | Lapor bibit → Setujui/Tolak permintaan masuk → Kasih bibit → Klik "Selesai" |
| **Volunteer B (Peminta)** | Cari bibit → Minta → Ambil bibit → Klik "Terima" |
| **Admin** | Setujui/Tolak laporan bibit baru + Setujui/Tolak permintaan bibit |
| **Sistem** | Catat transaksi, update stok, kirim notifikasi, kasih poin |

### Status permintaan:

```
VOLUNTEER A (pemilik) lapor bibit
  │
  ▼
ADMIN verifikasi → SETUJU / TOLAK
  │
  ├── ✅ SETUJU → bibit masuk Marketplace
  └── ❌ TOLAK  → laporan ditolak, gak muncul


VOLUNTEER B (peminta) lihat Marketplace
  │
  ├── Klik "Minta" → isi jumlah + pesan
  │
  ▼
ADMIN verifikasi → SETUJU / TOLAK
  │  (cek: stok cukup? peminta beneran butuh?)
  │
  ├── ✅ SETUJU → notif ke A: "B minta bibit kamu"
  └── ❌ TOLAK  → B dapet notif "permintaan ditolak"


A (pemilik) lihat permintaan dari B
  │
  ├── ✅ SETUJUI → kasih nomor HP, B bisa hubungi
  └── ❌ TOLAK  → B dapet notif "ditolak pemilik"


B hubungi A → ambil bibit
  │
  ▼
2 LANGKAH KONFIRMASI:
  │
  ├── ❶ A klik "Selesai"  →  "Bibit sudah saya berikan"
  │     (stok sementara terkunci, belum berkurang)
  │
  └── ❷ B klik "Terima"   →  "Bibit sudah saya terima"
        (stok beneran berkurang di database)
        │
        ▼
  TRANSAKSI SELESAI ✅
  │
  ├── A dapet poin (+15)
  ├── B dapet riwayat permintaan
  └── Stok A berkurang otomatis
```

---

## 3. Cara Melaporkan Bibit

Fitur "Laporkan Bibit" sekarang masih tombol mati (cuma muncul notifikasi "segera hadir"). Nanti cara kerjanya gini:

### Alur melaporkan:

```
Kamu punya bibit (pohon) di rumah/kebun
        │
        ▼
Klik "Laporkan Bibit"
        │
        ▼
Isi form:
  • Jenis bibit (pilih dari daftar / tulis manual)
  • Jumlah bibit yang tersedia
  • Lokasi (otomatis dari GPS, atau ketik manual)
  • Provinsi, Kota
  • Upload foto (min 1, maks 3)
  • Catatan (tinggi, umur, kondisi)
        │
        ▼
Kamu klik "Kirim"
        │
        ▼
┌─────────────────────────────────────────────┐
│  Sistem ngecek:                             │
│  • Semua field diisi?                       │
│  • Kamu sudah login?                        │
│  • Foto valid (format JPEG/PNG)?           │
│  • Lokasi masuk wilayah Indonesia?          │
│  • Belum ada laporan duplikat?              │
└──────────────────┬──────────────────────────┘
                   │
           ┌───────┴───────┐
           ▼               ▼
       BERHASIL         GAGAL
           │               │
           ▼               ▼
  • Laporan masuk      Muncul pesan
    ke database         error + field
  • Status:             yang perlu
    "MENUNGGU"          diperbaiki
    (perlu dicek
    admin dulu)
           │
           ▼
  Admin review:
  • Laporan jujur? → DISETUJUI
  • Laporan curang? → DITOLAK
           │
           ▼
  DISETUJUI:
  • Bibit muncul di Marketplace
  • Kamu dapet poin (+15 poin)
  • Kamu bisa lihat di "Bibitku"
```

### Bedanya laporan bibit sama form lain:

| Form | Poin | Butuh Foto | Butuh Admin |
|---|---|---|---|
| Monitoring Mata Air | +25 | ✅ | ✅ |
| Restorasi Mata Air | +100 | ✅ | ✅ |
| Tanam Pohon | +50 | ✅ | ✅ |
| **Laporan Bibit** | **+15** | **✅** | **✅** |
| Stok Bibit | +15 | ❌ | ✅ |

### Syarat minimal:

| Syarat | Penjelasan |
|---|---|
| **Login** | Harus punya akun (daftar dulu) |
| **Verifikasi** | Akun harus diverifikasi jadi "Volunteer" |
| **Jujur** | Data harus asli — kalau bohong, kena sanksi poin |
| **Foto asli** | Foto bibit beneran, bukan dari Google |
| **Lokasi jelas** | Minimal tahu kota/desa asal bibit |

---

## 4. Hubungan dengan Poin

Setiap laporan yang disetujui bakal dapet poin. Poin ini penting karena:

```
Poin kamu ↑
    │
    ▼
• Makin tinggi poin → makin dipercaya komunitas
• Minimal 20.000 poin → bisa buat proyek restorasi sendiri
• Top poin → muncul di papan peringkat
• Kalau laporan palsu → poin dikurangin (-50)
```

---

## 5. Gambaran Besar

```
┌─────────────────────────────────────────────────────────────┐
│                    SPRINGHUB.ID                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   BERANDA  │  MAP  │  LAPORAN  │  BIBIT ←── baru  │  DONASI │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   ┌──────────┐     ┌──────────┐     ┌──────────────────┐    │
│   │MARKETPLACE│     │ BIBITKU  │     │  PERMINTAANKU    │    │
│   │(cari bibit)│     │(laporanku)│     │(yang aku minta)  │    │
│   └─────┬────┘     └────┬─────┘     └────────┬─────────┘    │
│         │               │                     │              │
│         ▼               ▼                     ▼              │
│   ┌──────────┐     ┌──────────┐     ┌──────────────────┐    │
│   │Data dari  │     │Punya poin │     │Status:           │    │
│   │database   │     │+15 per    │     │Menunggu/Setuju/  │    │
│   │Real time  │     │laporan    │     │Selesai/Ditolak   │    │
│   └──────────┘     └──────────┘     └──────────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 6. Cara Kerja API (Routing)

API itu kayak **pelayan restoran**. Kamu (frontend) duduk di meja, pengen minta sesuatu, pelayan (API) yang ambil ke dapur (database) dan bawain balik.

### Cara komunikasinya:

```
KAMU (Browser/HP)
  │  ┌─ GET  → "ambilin data"
  │  ├─ POST → "simpen data baru"
  │  ├─ PUT  → "ubah data"
  │  └─ DELETE → "hapus data"
  │
  ▼
API (pelayan)
  │
  ▼
DATABASE (dapur)
```

### API yang perlu dibuat untuk Seedlings:

```
┌──────────────────────────────────────────────────────────┐
│                    API SEEDLINGS                           │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  GET    /api/seedlings                                    │
│         → Ambil semua bibit yang tersedia (Marketplace)   │
│         → Filter: provinsi, jenis, stok > 0               │
│                                                           │
│  GET    /api/seedlings?mine=1                             │
│         → Ambil bibit milikku sendiri (Bibitku)           │
│                                                           │
│  GET    /api/seedlings/:id                                │
│         → Ambil detail satu bibit (untuk overlay)         │
│                                                           │
│  POST   /api/seedlings                                    │
│         → Lapor bibit baru (isi: jenis, jumlah, foto,     │
│           lokasi)                                         │
│         → Wajib login                                     │
│         → Status langsung: "MENUNGGU" (review admin)      │
│                                                           │
│  POST   /api/seedlings/:id/request                        │
│         → Minta bibit (isi: jumlah, pesan)                │
│         → Wajib login                                     │
│                                                           │
│  POST   /api/admin/seedlings/:id/approve                  │
│         → Admin setujui laporan bibit                     │
│         → Bibit muncul di Marketplace                     │
│                                                           │
│  POST   /api/admin/seedlings/:id/reject                   │
│         → Admin tolak laporan bibit                       │
│                                                           │
│  POST   /api/admin/seedlings/:id/approve-request          │
│         → Admin setujui permintaan bibit                  │
│         → Notif ke pemilik                                 │
│                                                           │
│  POST   /api/seedlings/:id/confirm-give                   │
│         → Pemilik (A) klik "Selesai"                      │
│         → "Bibit sudah saya berikan"                      │
│         → Stok belum berkurang (nunggu B konfirmasi)      │
│                                                           │
│  POST   /api/seedlings/:id/confirm-receive                │
│         → Peminta (B) klik "Terima"                       │
│         → "Bibit sudah saya terima"                       │
│         → Stok beneran berkurang ✅                       │
│                                                           │
│  GET    /api/seedlings/:id/requests                       │
│         → Lihat siapa aja yang minta bibitku               │
│         → Hanya pemilik yang bisa lihat                   │
│                                                           │
│  GET    /api/seedlings/my-requests                        │
│         → Lihat semua bibit yang pernah aku minta         │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

### Analogi sederhana:

| Yang Kamu Lakukan | API yang Dipanggil | Yang Terjadi di DB |
|---|---|---|
| Buka Marketplace | `GET /api/seedlings` | Ambil semua bibit yang stok > 0 |
| Klik "Laporkan Bibit" | `POST /api/seedlings` | Simpan bibit baru, status MENUNGGU |
| Admin setujui laporan | `POST /api/admin/seedlings/1/approve` | Status jadi AKTIF, muncul di Marketplace |
| Kamu klik "Minta" | `POST /api/seedlings/1/request` | Simpan permintaan, notif ke pemilik |
| Admin setujui permintaan | `POST /api/admin/seedlings/1/approve-request` | Status jadi DISETUJUI |
| Pemilik klik "Selesai" | `POST /api/seedlings/1/confirm-give` | Step 1 dari 2 selesai |
| Kamu klik "Terima" | `POST /api/seedlings/1/confirm-receive` | Step 2 selesai, stok berkurang |

### Siapa yang boleh akses API mana:

| API | Publik | Volunteer | Admin |
|---|---|---|---|
| GET /api/seedlings | ✅ lihat aja | ✅ | ✅ |
| POST /api/seedlings (lapor) | ❌ | ✅ | ✅ |
| POST /api/seedlings/:id/request (minta) | ❌ | ✅ | ✅ |
| POST confirmation (Selesai/Terima) | ❌ | ✅ (yg terkait) | ✅ |
| POST /api/admin/* | ❌ | ❌ | ✅ |

### Alur data dari ujung ke ujung:

```
Kamu isi form "Lapor Bibit"
  │
  ▼
Frontend (seedlings.html / halaman Next.js)
  │
  ├── Kirim POST /api/seedlings
  │   { jenis: "Jati", jumlah: 50, foto: ..., lokasi: "Bandung" }
  │
  ▼
API (app/api/seedlings/route.ts)
  │
  ├── Cek: login? CSRF token valid? Data lengkap?
  ├── Simpan ke database (tabel Seedling)
  │   { id: 1, jenis: "Jati", jumlah: 50, stok: 50, status: "pending" }
  │
  ▼
Database (PostgreSQL)
  │
  ├── Data tersimpan, status "MENUNGGU"
  │
  ▼
Admin buka panel review
  │
  ├── Lihat laporan baru
  ├── Klik "Setuju" → POST /api/admin/seedlings/1/approve
  │
  ▼
Database update: status jadi "AKTIF"
  │
  ▼
Marketplace — semua orang bisa lihat bibit Jati (stok 50)
```

### Cara bacanya:

```
POST   /api/seedlings/123/request
^^^^   ^^^^^^^^^^^^^^^^^^^^^^^^^^^
│      └── alamat endpoint (siapa + apa yang dilakuin)
│
└── method HTTP:
    POST   = buat data baru
    GET    = ambil data
    PUT    = ubah data
    DELETE = hapus data
```

---

## 7. Yang Perlu Dibuat Biar Seedlings Jadi Fitur Resmi

| No | Yang Harus Dibuat | Status |
|---|---|---|
| 1 | Tabel database untuk seedling (bibit) | ❌ belum |
| 2 | API untuk ambil data bibit (GET) | ❌ belum |
| 3 | API untuk lapor bibit (POST) | ❌ belum |
| 4 | API untuk minta bibit (POST) | ❌ belum |
| 5 | Halaman `/bibit` di Next.js | ❌ belum |
| 6 | Menu "Bibit" di navbar | ❌ belum |
| 7 | Notifikasi ke pemilik saat ada yang minta | ❌ belum |
| 8 | Review queue untuk admin | ❌ belum |
| 9 | Poin otomatis saat disetujui (+15) | ❌ belum |
| 10 | Upload foto bibit | ❌ belum |

### Status sekarang (seedlings.html):

```
✅ Halaman UI (Marketplace, Bibitku, Permintaanku) — SELESAI
✅ Filter provinsi + pencarian — SELESAI
✅ Kartu bibit dengan nama, lokasi, pemilik — SELESAI
✅ Overlay detail + form minta — SELESAI
✅ Dark mode — SELESAI

❌ Data dari database — MASIH DUMMY
❌ Tombol Minta beneran — MASIH PALSU
❌ Tombol Laporkan — MASIH PALSU
❌ Login/Guest check — BELUM
❌ Poin & riwayat — BELUM
❌ Upload foto — BELUM
❌ Review admin — BELUM
```

---

> **Kesimpulan:** `seedlings.html` sekarang adalah **tampilan (mockup)** yang sudah jadi. Biar jadi fitur beneran, perlu disambungin ke backend SpringHub — database, API, login, poin, dan notifikasi. Semua infrastruktur backend (database, auth, API routing) sudah tersedia di SpringHub, tinggal bikin model baru untuk bibit dan endpoint-endpoint-nya.
