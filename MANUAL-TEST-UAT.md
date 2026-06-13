# Manual Test — User Acceptance Test

> **URL:** https://springhub.vercel.app/
>
> **Akun Test:**
> - Guest: (gak usah login)
> - User: `ucup@springhub.id` / `ucup123` (role: user)
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
| 1 | Both | Buka `/` tanpa login | Landing page render, map, dashboard, media muncul | | |
| 2 | Both | Klik "Lapor" atau buka `/report/spring-monitoring` | Form terbisa, bisa diisi tanpa login | | |
| 3 | HP | Klik field foto `capture="environment"` | **Kamera langsung terbuka**, bukan galeri | | |
| 4 | Both | Upload >3 foto | Maksimal 3, ada notif "Maksimal 3 foto sudah terpenuhi" | | |
| 5 | Both | Coba submit form lebih dari 5 kali dalam sehari | Guest: error "Batas laporan harian (5)" | | |
| 6 | Both | Cek cookie `guest_session_id` di browser | Ada cookie dengan random ID | | |

---

## 2. 🌱 Volunteer / User Flow (Login)

| # | Device | Aksi | Harapan | ✅/❌ | Catatan |
|---|--------|------|---------|------|---------|
| 7 | Both | Login dengan `volunteer@springhub.id` / `vol123` | Berhasil login, redirect ke halaman sebelumnya | | |
| 8 | Both | Buka `/report/spring-monitoring` | Form render, semua field muncul | | |
| 9 | HP | Klik field foto | Kamera langsung terbuka (bukan galeri) | | |
| 10 | Both | Upload >3 foto | Maksimal 3, ada indikator `0/3`, `1/3`, dll | | |
| 11 | Both | Submit form lengkap (isi semua + foto) | Sukses, muncul toast/notif "Laporan terkirim" | | |
| 12 | Both | Submit form lebih dari 5x sehari | Volunteer: **tetap bisa** (unlimited) | | |
| 13 | Both | Cek poin di profile `/profile` | Poin bertambah setelah laporan di-approve admin | | |

---

## 3. 🔧 Admin Flow

| # | Device | Aksi | Harapan | ✅/❌ | Catatan |
|---|--------|------|---------|------|---------|
| 14 | Both | Login dengan `admin@springhub.id` / `admin123` | Berhasil login, link Admin muncul di header | | |
| 15 | Both | Buka `/admin/users` | Lihat daftar user. Role dropdown cuma 3: User, Volunteer, Admin | | |
| 16 | Both | Buka `/admin/reports` | Lihat semua laporan termasuk guest reports | | |
| 17 | Both | Buka `/admin/review` | Approve/reject laporan | | |
| 18 | Both | Approve laporan volunteer | Poin otomatis nambah (+25 sd +100) | | |
| 19 | Both | Toggle Active/Inactive form di `/admin/forms` | Form yang inactive hilang dari halaman publik | | |

---

## 4. 📱 Offline Mode (PWA)

| # | Device | Aksi | Harapan | ✅/❌ | Catatan |
|---|--------|------|---------|------|---------|
| 20 | HP | Buka PWA (install dulu dari Chrome) | Bisa diakses offline | | |
| 21 | HP | Buka `/offline` (online dulu untuk setup) | Setup: pilih form → cache → siap | | |
| 22 | HP | Setelah setup, matikan internet | Form list muncul (no map) | | |
| 23 | HP | Klik form, isi semua | GPS tetap dapet lokasi (satelit) | | |
| 24 | HP | Ambil foto dari kamera | Kamera langsung terbuka | | |
| 25 | HP | Simpan form (offline) | Data masuk IndexedDB | | |
| 26 | HP | Hidupkan internet | QueueWorker upload otomatis, notif sukses | | |

---

## 5. 📸 Aturan Foto (Semua Form)

| # | Device | Aksi | Harapan | ✅/❌ | Catatan |
|---|--------|------|---------|------|---------|
| 27 | HP | Report Issue `/report-issue` → upload screenshot | Kamera langsung, max 3 foto | | |
| 28 | HP | Volunteer Activity → foto | Kamera langsung, max 3 | | |
| 29 | PC | Klik input foto di form mana pun | Tidak ada opsi "Pilih dari galeri" — hanya kamera | | |
| 30 | Both | Submit form dengan foto | Foto terupload, thumbnail muncul di admin | | |

---

## 6. ⏱️ Timestamp

| # | Device | Aksi | Harapan | ✅/❌ | Catatan |
|---|--------|------|---------|------|---------|
| 31 | Both | Buka form `/report/spring-monitoring` | Field tanggal otomatis terisi waktu buka, **read-only** | | |
| 32 | Both | Coba edit field tanggal | Tidak bisa diubah (read-only/disabled) | | |

---

## 7. 🗑️ Field Lead — Pastikan Hilang

| # | Device | Aksi | Harapan | ✅/❌ | Catatan |
|---|--------|------|---------|------|---------|
| 33 | Both | Admin → `/admin/users` | Dropdown role cuma: User / Volunteer / Admin | | |
| 34 | Both | Login biasa, cek role | Tidak ada menu/akses khusus "Field Lead" | | |

---

## 8. 🔗 Media Links

| # | Device | Aksi | Harapan | ✅/❌ | Catatan |
|---|--------|------|---------|------|---------|
| 35 | Both | Scroll ke section Media di landing | 4 item: Video, Event, Publication, Press | | |
| 36 | Both | Klik Event | Buka article Disway Mojokerto tentang restorasi mata air | | |
| 37 | Both | Klik Press | Buka artikel Kompas.id tentang karst Kebumen | | |
| 38 | Both | Klik Video | Buka YouTube | | |

---

## 9. ♿ Aksesibilitas

| # | Device | Aksi | Harapan | ✅/❌ | Catatan |
|---|--------|------|---------|------|---------|
| 39 | Both | Tab dari atas halaman | Skip link "Lompat ke konten utama" muncul pertama | | |
| 40 | Both | Admin panel → cek tombol Logout | Punya `aria-label="Logout"` | | |
| 41 | Both | Modal Points Guide | Judul modal terbaca screen reader (`aria-labelledby` connected) | | |

---

## Ringkasan

| Area | Total Test | ✅ Lolos | ❌ Gagal |
|------|-----------|----------|----------|
| Guest Flow | 6 | | |
| Volunteer/User | 7 | | |
| Admin | 6 | | |
| Offline Mode | 7 | | |
| Aturan Foto | 4 | | |
| Timestamp | 2 | | |
| Field Lead | 2 | | |
| Media Links | 4 | | |
| Aksesibilitas | 3 | | |
| **Total** | **41** | | |
