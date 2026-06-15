# Manual Test — User Acceptance Test

> **URL:** https://springhub.vercel.app/
>
> **Akun Test:**
> - Guest: (gak usah login)
> - Volunteer: `ucup@springhub.id` / `ucup123` (role: volunteer, 25.000 pts)
> - Volunteer: `volunteer@springhub.id` / `vol123` (role: volunteer, 10.050 pts)
> - Admin: `admin@springhub.id` / `admin123` (role: admin)
>
> **Cara:**
> - Centang ✅ kalau lolos, ❌ kalau gagal, tulis catatan
> - **HP** = handphone, **PC** = komputer/laptop, **Both** = keduanya

---

## 1. 🧑‍💻 Guest Flow (Tanpa Login)

| # | Device | Aksi | Harapan | ✅/❌ | Catatan |
|---|--------|------|---------|------|---------|
| 1 | Both | Buka `/` tanpa login | Landing page render, map, dashboard, media, recent activities muncul | | |
| 2 | Both | Klik "Lapor" atau buka `/report/spring-monitoring` | Form terbisa, semua field muncul termasuk **provinsi** (tidak hilang) | | Bug field hilang-timbul SUDAH FIX |
| 3 | HP | Klik field foto `capture="environment"` | **Kamera langsung terbuka**, bukan galeri | | |
| 4 | Both | Upload foto <3 | Submit **ditolak** — "Minimal 3 foto" | | Fitur baru min 3 |
| 5 | Both | Upload 3-5 foto | Submit berhasil. Indikator `X/5` dengan label `(minimal 3 foto)` jika <3 | | Fitur baru min 3 / max 5 |
| 6 | Both | Upload >5 foto | Hanya 5 foto terakhir yang diterima. Ada notif "Maksimal 5 foto" | | |
| 7 | Both | Lihat preview foto sebelum submit | Thumbnail foto muncul, bisa dihapus (X) sebelum submit | | |
| 8 | Both | Submit form dengan foto | Sukses, foto tersimpan di Supabase Storage | | |
| 9 | Both | Coba submit >5x dalam sehari | Guest: error "Batas laporan harian (5)" | | |
| 10 | Both | Cek cookie `guest_session_id` di browser | Ada cookie dengan random ID | | |

---

## 2. 🌱 Volunteer / User Flow (Login)

| # | Device | Aksi | Harapan | ✅/❌ | Catatan |
|---|--------|------|---------|------|---------|
| 11 | Both | Login dengan `volunteer@springhub.id` / `vol123` | Berhasil login, redirect ke halaman sebelumnya | | |
| 12 | Both | Buka `/report/spring-monitoring` | Form render, field **provinsi** muncul (tidak hilang) | | Bug FIX: gabung field DB + statis |
| 13 | HP | Klik field foto | Kamera langsung terbuka (bukan galeri) | | |
| 14 | Both | Upload foto <3 | Submit **ditolak** — "Minimal 3 foto" | | Fitur baru min 3 |
| 15 | Both | Upload 3-5 foto, submit form lengkap | Sukses, indikator counter `X/5`, muncul toast "Laporan terkirim" | | |
| 16 | Both | Submit form >5x sehari | Volunteer: **tetap bisa** (unlimited) | | |
| 17 | Both | Cek poin di profile `/profile` | Poin bertambah setelah laporan di-approve admin | | |
| 18 | Both | Cek **Recent Activities** di landing page | Activity real dari user muncul (bukan cuma dummy) | | Sudah connect ke API `/api/reports` |
| 19 | Both | Scroll ke **Dashboard** | Angka real dari database (bukan hardcoded) | | Sudah connect ke `/api/dashboard` |

---

## 3. 🔧 Admin Flow

| # | Device | Aksi | Harapan | ✅/❌ | Catatan |
|---|--------|------|---------|------|---------|
| 20 | Both | Login dengan `admin@springhub.id` / `admin123` | Berhasil login, link Admin muncul di header | | |
| 21 | Both | Buka `/admin/users` | Lihat daftar user. Role dropdown cuma: User, Volunteer, Admin | | Field Lead SUDAH DIHAPUS |
| 22 | Both | Buka `/admin/reports` | Lihat semua laporan + **submitter name benar** (bukan "Guest" semua) | | Bug FIX: mapping `submitter` diperbaiki |
| 23 | Both | Buka `/admin/review` | Approve/reject laporan, **tidak error** | | Bug FIX: reject 500 sudah diperbaiki |
| 24 | Both | Approve laporan volunteer | ✅ Poin otomatis nambah (+25 sd +100), ✅ Trust score +10, ✅ Notif terkirim | | |
| 25 | Both | Reject laporan volunteer | ✅ Notif terkirim. Trust score -10 **hanya jika reject >3x** (tidak langsung -50) | | Bug FIX: logic trust score |
| 26 | Both | Approve → laporan hilang dari queue | Setelah approve, laporan tidak muncul lagi di review queue | | |
| 27 | Both | Buka Admin → **Trust Score Management** | Bisa lihat & atur trust score user | | Fitur baru |
| 28 | Both | Toggle Active/Inactive form di `/admin/forms` | Form inactive hilang dari halaman publik | | |

---

## 4. 🗺️ Spring Detail Page (Fitur Baru)

| # | Device | Aksi | Harapan | ✅/❌ | Catatan |
|---|--------|------|---------|------|---------|
| 29 | Both | Buka landing page → map | Marker spring **tidak numpuk** — 1 marker per spring (bukan per laporan) | | |
| 30 | Both | Klik marker spring di map | Navigasi ke `/springs/[id]` | | |
| 31 | Both | Buka `/springs/[id]` | Halaman detail spring: nama, lokasi, stats (pemantauan, restorasi, pohon, rorak, bibit, foto) | | |
| 32 | Both | Scroll ke **Timeline** | Semua laporan diurutkan dari terbaru, lengkap dengan foto thumbnail | | |
| 33 | Both | Scroll ke **Gallery** | Semua foto dari semua laporan, bisa di-filter per tipe form | | |
| 34 | Both | Klik foto di timeline/gallery | Foto tampil besar (modal), lihat info tanggal & pelapor | | |
| 35 | Both | Cek **Mini Map** di halaman detail | Peta kecil menunjukkan posisi spring | | |

---

## 5. 📱 Offline Mode (PWA)

| # | Device | Aksi | Harapan | ✅/❌ | Catatan |
|---|--------|------|---------|------|---------|
| 36 | HP | Install PWA dari Chrome | Bisa diakses offline | | |
| 37 | HP | Login dulu (online), lalu matikan internet | Buka `/offline` → **langsung masuk mode form** (session di-cache di IndexedDB) | | Fitur baru: offline-first session cache |
| 38 | HP | Buka `/offline` saat online pertama kali | Setup: pilih form → cache → siap | | |
| 39 | HP | Setelah setup, matikan internet | Form list muncul (no map — mode sederhana) | | |
| 40 | HP | Klik form, isi semua | GPS tetap dapet lokasi (satelit) | | |
| 41 | HP | Ambil foto dari kamera | Kamera langsung terbuka, counter `X/5`, submit ditolak jika <3 | | Min 3 / max 5 |
| 42 | HP | Simpan form (offline) | Data masuk IndexedDB | | |
| 43 | HP | Hidupkan internet | QueueWorker upload otomatis, **notif toast sukses** muncul | | Bug FIX: QueueWorker notif sudah diperbaiki |
| 44 | HP | Cek IndexedDB setelah sukses upload | Data offline **terhapus otomatis** (gak numpuk) | | Bug FIX: cleanup IndexedDB |
| 45 | Both | Buka PWA langsung ke `/offline` | PWA bisa akses offline tanpa internet, session tetap terpakai | | Catatan: GPS & login state ikut |
| 46 | Both | Matikan internet → buka `/offline` (belum pernah login) | Error: "Gak ada koneksi & belum pernah setup" | | Fitur baru |

---

## 6. 📸 Aturan Foto (Min 3 / Max 5)

| # | Device | Aksi | Harapan | ✅/❌ | Catatan |
|---|--------|------|---------|------|---------|
| 47 | HP | Report Issue `/report-issue` → upload screenshot | **Dari galeri** (bukan kamera), maks 3 foto | | Exception: report issue |
| 48 | Both | Form monitoring/restorasi/tanaman/rorak/bibit → foto | Kamera langsung (`capture="environment"`), counter `X/5` | | |
| 49 | Both | Upload <3 foto di form mana pun (online) | Submit **ditolak**, error "Minimal 3 foto" | | Fitur baru min 3 |
| 50 | Both | Upload 3-5 foto → submit | Sukses, foto terupload | | |
| 51 | Both | Upload >5 foto | Input hanya terima 5 foto terakhir | | |
| 52 | Both | Submit form offline dengan <3 foto | Di dalam IndexedDB tetap tersimpan, di-notif waktu sync | | |
| 53 | PC | Klik input foto di form mana pun | Hanya kamera (`capture="environment"`), bukan galeri | | |
| 54 | Both | Submit form dengan foto | Foto terupload, **thumbnail muncul di admin** (bukan blank putih) | | Bug FIX: URL foto pakai Supabase bukan S3 |
| 55 | Both | Admin review: lihat foto laporan | Foto tampil, bisa diklik untuk enlarged view | | |

---

## 7. ⏱️ Timestamp

| # | Device | Aksi | Harapan | ✅/❌ | Catatan |
|---|--------|------|---------|------|---------|
| 56 | Both | Buka form `/report/spring-monitoring` | Field tanggal otomatis terisi waktu buka, **read-only** | | |
| 57 | Both | Coba edit field tanggal | Tidak bisa diubah (read-only/disabled) | | |

---

## 8. 🗑️ Field Lead — Pastikan Hilang

| # | Device | Aksi | Harapan | ✅/❌ | Catatan |
|---|--------|------|---------|------|---------|
| 58 | Both | Admin → `/admin/users` | Dropdown role cuma: User / Volunteer / Admin | | Field Lead SUDAH DIHAPUS |
| 59 | Both | Login biasa, cek role | Tidak ada menu/akses khusus "Field Lead" | | |

---

## 9. 🔗 Media Links

| # | Device | Aksi | Harapan | ✅/❌ | Catatan |
|---|--------|------|---------|------|---------|
| 60 | Both | Scroll ke section Media di landing | 4 item: Video, Event, Publication, Press | | |
| 61 | Both | Klik Video | Buka YouTube | | ✅ |
| 62 | Both | Klik Event | Buka article Disway Mojokerto (bukan `/help`) | | ✅ Seed terbaru |
| 63 | Both | Klik Publication | Buka YouTube Jaga Semesta (bukan `/help`) | | ✅ Seed terbaru |
| 64 | Both | Klik Press | Buka Kompas.id interaktif (bukan `/help`) | | ✅ Seed terbaru |
| 65 | Both | Cek thumbnail media | Video & Publication: thumbnail YouTube muncul. Event & Press: gradient fallback | | ✅ |

---

## 10. ♿ Aksesibilitas

| # | Device | Aksi | Harapan | ✅/❌ | Catatan |
|---|--------|------|---------|------|---------|
| 66 | Both | Tab dari atas halaman | Skip link "Lompat ke konten utama" muncul pertama | | ✅ |
| 67 | Both | Admin panel → cek tombol Logout | Punya `aria-label="Logout"` | | ✅ |
| 68 | Both | Modal Points Guide | Judul modal terbaca screen reader (`aria-labelledby` connected) | | ✅ |
| 69 | Both | Tombol close/back di modal/admin | Punya `aria-label` | | ✅ |

---

## 11. 🔄 Dashboard & Data Real-time

| # | Device | Aksi | Harapan | ✅/❌ | Catatan |
|---|--------|------|---------|------|---------|
| 70 | Both | Buka landing page → Dashboard | Angka **real dari database** (total springs, restorasi, pohon, rorak) | | Sudah connect ke `/api/dashboard` |
| 71 | Both | Top Regions | Muncul region dari data real reports | | |
| 72 | Both | Top Volunteers | Muncul volunteer dengan poin terbanyak (real) | | |
| 73 | Both | Monthly Progress | Progress bar real per kategori | | |

---

## 12. 🧪 Trust Score Management

| # | Device | Aksi | Harapan | ✅/❌ | Catatan |
|---|--------|------|---------|------|---------|
| 74 | Both | Admin → Trust Score page | Bisa lihat trust score semua user | | Fitur baru |
| 75 | Both | Admin bisa set manual trust score | Tersedia input/edit | | |
| 76 | Both | Approve laporan → trust score naik +10 | Otomatis | | ✅ |
| 77 | Both | Reject >3x → trust score turun -10 | Otomatis (bukan -50 setiap reject) | | Bug FIX |

---

## 13. ⚙️ Button & Navigasi

| # | Device | Aksi | Harapan | ✅/❌ | Catatan |
|---|--------|------|---------|------|---------|
| 78 | Both | "Start Monitoring" di hero | Ganti jadi "Start Volunteering" (juga translate ID) | | Sesuai catatan |
| 79 | Both | Klik "Start Volunteering" | Langsung scroll ke **"Report Your Contribution"** section | | |
| 80 | Both | Klik "Lapor" di form | Submit → sukses page/toast | | ✅ |

---

## Ringkasan

| Area | Total Test | ✅ Lolos | ❌ Gagal |
|------|-----------|----------|----------|
| Guest Flow | 10 | | |
| Volunteer/User | 9 | | |
| Admin Flow | 9 | | |
| Spring Detail Page | 7 | | |
| Offline Mode | 11 | | |
| Aturan Foto | 9 | | |
| Timestamp | 2 | | |
| Field Lead | 2 | | |
| Media Links | 6 | | |
| Aksesibilitas | 4 | | |
| Dashboard Real-time | 4 | | |
| Trust Score | 4 | | |
| Button & Navigasi | 3 | | |
| **Total** | **80** | | |

---

## Riwayat Perbaikan

| Tanggal | Perbaikan | Status |
|---------|-----------|--------|
| 15 Jun | **Photo limits min 3 / max 5** — semua form foto minimal 3, maks 5. Submit ditolak jika <3 | ✅ Baru |
| 15 Jun | **Offline-first session cache** — session user di-cache di IndexedDB, offline langsung masuk tanpa login ulang | ✅ Baru |
| 15 Jun | **Report Issue gallery mode** — dari galeri (bukan kamera), max 3 foto | ✅ Baru |
| 14 Jun | **Field provinsi hilang-timbul** — gabung field DB + statis, jangan replace total | ✅ Fixed |
| 14 Jun | **Foto blank putih** — URL pakai Supabase Storage, bukan S3 | ✅ Fixed |
| 14 Jun | **Dashboard masih hardcoded** — API `/api/dashboard` ambil data real dari DB | ✅ Fixed |
| 14 Jun | **IndexedDB cache numpuk** — cleanup stale data + hapus setelah sukses upload | ✅ Fixed |
| 14 Jun | **Spring Detail Page** — halaman baru: timeline, gallery, stats, mini map | ✅ Baru |
| 14 Jun | **Map marker per spring** — group by springId, 1 marker per spring, klik navigasi | ✅ Baru |
| 14 Jun | **Recent Activities live** — fetch dari API, dummy sebagai fallback | ✅ Fixed |
| 14 Jun | **Featured Projects live** — fetch dari API, dummy sebagai fallback | ✅ Fixed |
| 8 Jun | Field Lead dihapus dari semua role | ✅ Fixed |
| 8 Jun | QueueWorker toast notif sukses | ✅ Fixed |
| 8 Jun | Admin Reports submitter name (Guest semua) | ✅ Fixed |
| 8 Jun | Admin Review reject 500 error | ✅ Fixed |
| 8 Jun | Trust score: reject >3x → -10 (bukan -50) | ✅ Fixed |
| 8 Jun | Media links & thumbnail diperbaiki | ✅ Seed diupdate |
| 6 Jun | Aksesibilitas: aria-label, skip-link, modal | ✅ Fixed |
