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

Routing itu kayak resepsionis di kantor. Waktu kamu datang ke kantor, resepsionis bakal nanya "ada perlu apa?". Terus dia ngarahin kamu ke ruangan yang bener. Kalau kamu mau ngurus KTP, kamu gak mungkin diarahin ke ruangan dapur. Begitu juga di web. Waktu kamu klik sesuatu, sistem punya resepsionis sendiri yang tugasin ngarahin perintah kamu ke tempat yang tepat. Resepsionis ini kerjanya cuma cocokin "kamu mau apa" sama "daftar tugas yang udah ditentuin".

Misalnya kamu buka Marketplace. Klik menu bibit. Saat itu juga browser kamu kirim sinyal ke server. Resepsionis di server ngecek "oh, orang ini mau lihat daftar bibit". Resepsionis langsung ambil data dari database. Semua bibit yang stoknya masih ada dikirim balik ke browser kamu. Kamu tinggal lihat. Gak ada data yang diubah, cuma dibaca doang.

Sekarang kamu klik "Lapor Bibit". Kamu isi form, upload foto, masukin jumlah. Begitu kamu klik kirim, browser kirim sinyal lagi. Sekarang resepsionis ngecek "oh, orang ini mau nyimpen data baru, bukan cuma baca". Resepsionis juga ngecek: "kamu udah login belum? kalau belum, gabisa". Abis itu data kamu disimpen ke database dengan status "MENUNGGU". Nanti admin yang ngecek.

Terus kamu klik "Minta Bibit". Kamu lihat bibit Jati punya si Asep, kamu mau 10 batang. Browser kirim sinyal lagi. Sekarang resepsionis nyimpen permintaan kamu. Terus resepsionis ngirim notifikasi ke si Asep. Kadang resepsionis juga ngecek "stoknya masih cukup?" sebelum nyimpen. Kalau cukup, permintaan masuk. Kalau gak cukup, kamu dikasih tahu "stok kurang".

Nah, resepsionis ini bisa bedain mana perintah yang boleh dikerjain sama siapa. Kalau kamu mau setujui atau tolak sesuatu, kamu harus jadi admin dulu. Resepsionis bakal nolak kalau kamu bukan admin. Kalau kamu cuma lihat-lihat doang, resepsionis izinin aja. Tapi kalau kamu mau nyimpen data atau ngubah data, resepsionis minta kamu login dulu.

Ada satu hal penting. Waktu si Asep klik "Selesai" karena udah ngasih bibit ke kamu, sistem nyatetnya sebagai langkah pertama, bukan langkah terakhir. Stok bibit di database belum dikurangin. Nunggu kamu juga klik "Terima" sebagai tanda kamu udah beneran nerima bibitnya. Baru setelah itu stok dikurangin. Kenapa? Biar adil. Asep gak bisa bohong "udah dikasih" padahal belum, dan kamu juga gak bisa bohong "udah diterima" padahal belum.

Intinya, API itu cuma perantara. Tugasnya nerima perintah, ngecek siapa yang ngasih perintah, ngecek perintahnya masuk akal atau gak, terus jalanin. Kalau perintahnya "ambilin data", dia ambil. Kalau "simpen data", dia simpen. Kalau "ubah data", dia ubah. Gak lebih. Gak kurang. Selebihnya urusan database.

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
