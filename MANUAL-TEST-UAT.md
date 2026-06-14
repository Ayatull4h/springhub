# Manual Test — User Acceptance Test

> **URL:** https://springhub.vercel.app/
>
> **Akun Test:**
> - Guest: (gak usah login)
> - volunteer: `ucup@springhub.id` / `ucup123` (role: volunteer, 25.000 pts)
> - Volunteer: `volunteer@springhub.id` / `vol123` (role: volunteer, 10.050 pts)
> - Admin: `admin@springhub.id` / `admin123` (role: admin)
> user = admin, guest, volunteer. 


> **Cara:**
> - Centang ✅ kalau lolos, ❌ kalau gagal, tulis catatan
> - **HP** = handphone, **PC** = komputer/laptop, **Both** = keduanya

---

## 1. 🧑‍💻 Guest Flow (Tanpa Login)

| # | Device | Aksi | Harapan | ✅/❌ | Catatan |
|---|--------|------|---------|------|---------|
| 1 | Both | Buka `/` tanpa login | Landing page render, map, dashboard, media muncul |ya | |
| 2 | Both | Klik "Lapor" atau buka `/report/spring-monitoring` | Form terbisa, bisa diisi tanpa login |ya | |
| 3 | HP | Klik field foto `capture="environment"` | **Kamera langsung terbuka**, bukan galeri |ya | |
| 4 | Both | Upload >3 foto | Maksimal 3, ada notif "Maksimal 3 foto sudah terpenuhi" |ya | |
| 5 | Both | Coba submit form lebih dari 5 kali dalam sehari | Guest: error "Batas laporan harian (5)" | ya| |
| 6 | Both | Cek cookie `guest_session_id` di browser | Ada cookie dengan random ID | ya| |

foto harusnya bisa dilihat dulu atau didelete sebelum submit agar bisa memastikan hasil yang terbaik yang terupload

## 2. 🌱 Volunteer / User Flow (Login)

| # | Device | Aksi | Harapan | ✅/❌ | Catatan |
|---|--------|------|---------|------|---------|
| 7 | Both | Login dengan `volunteer@springhub.id` / `vol123` | Berhasil login, redirect ke halaman sebelumnya |ya | |
| 8 | Both | Buka `/report/spring-monitoring` | Form render, semua field muncul | ya| |
| 9 | HP | Klik field foto | Kamera langsung terbuka (bukan galeri) |ya | |
| 10 | Both | Upload >3 foto | Maksimal 3, ada indikator `0/3`, `1/3`, dll | ya| |
| 11 | Both | Submit form lengkap (isi semua + foto) | Sukses, muncul toast/notif "Laporan terkirim" | ya| |
| 12 | Both | Submit form lebih dari 5x sehari | Volunteer: **tetap bisa** (unlimited) | ya| |
| 13 | Both | Cek poin di profile `/profile` | Poin bertambah setelah laporan di-approve admin |ya | |

---

## 3. 🔧 Admin Flow

| # | Device | Aksi | Harapan | ✅/❌ | Catatan |
|---|--------|------|---------|------|---------|
| 14 | Both | Login dengan `admin@springhub.id` / `admin123` | Berhasil login, link Admin muncul di header | ya| |
| 15 | Both | Buka `/admin/users` | Lihat daftar user. Role dropdown cuma 3: User, Volunteer, Admin |ya | |
| 16 | Both | Buka `/admin/reports` | Lihat semua laporan termasuk guest reports |ya | |tapi sering error (kaya tiba tiba kosong, terus user namanya masih guest semua. padahal ada volunteer ada admin. 
| 17 | Both | Buka `/admin/review` | Approve/reject laporan | | |approve bisa tapi laporan gak ilang. reject gak bisa karena internal server error
| 18 | Both | Approve laporan volunteer | Poin otomatis nambah (+25 sd +100) | | | kalau bisa tambahkan trust. dan kalau rejct lebih dari 3 kali baru skor trus dikurangi 10
| 19 | Both | Toggle Active/Inactive form di `/admin/forms` | Form yang inactive hilang dari halaman publik |ya | |

tambahkan 1 fitur untut mengatur trust point

## 4. 📱 Offline Mode (PWA)

| # | Device | Aksi | Harapan | ✅/❌ | Catatan |
|---|--------|------|---------|------|---------|
| 20 | HP | Buka PWA (install dulu dari Chrome) | Bisa diakses offline |ya | |
| 21 | HP | Buka `/offline` (online dulu untuk setup) | Setup: pilih form → cache → siap |ya | |
| 22 | HP | Setelah setup, matikan internet | Form list muncul (no map) | ya| |
| 23 | HP | Klik form, isi semua | GPS tetap dapet lokasi (satelit) |ya | |
| 24 | HP | Ambil foto dari kamera | Kamera langsung terbuka |ya | |
| 25 | HP | Simpan form (offline) | Data masuk IndexedDB | ya| |
| 26 | HP | Hidupkan internet | QueueWorker upload otomatis, notif sukses | | tidak|\

terus gini maksudku itu pwanya langsung ke halaman offline mode. jadi mau kondisi apapun bisa tanpa harus ada internet. fungsi internet hanya untuk upload. gps dan id login itu harusnya tersimpan atau mengikuti pwa offline mode

---

## 5. 📸 Aturan Foto (Semua Form)

| # | Device | Aksi | Harapan | ✅/❌ | Catatan |
|---|--------|------|---------|------|---------|
| 27 | HP | Report Issue `/report-issue` → upload screenshot | Kamera langsung, max 3 foto |ya  | | khusus ini boleh lihat dari galeri 
| 28 | HP | Volunteer Activity → foto | Kamera langsung, max 3 | ya| | mungkin bisa buat max 5 minimal 3  
| 29 | PC | Klik input foto di form mana pun | Tidak ada opsi "Pilih dari galeri" — hanya kamera |ya | |
| 30 | Both | Submit form dengan foto | Foto terupload, thumbnail muncul di admin |ya | | tapi tidak bisa dilihat alias cuma blank putih

---

## 6. ⏱️ Timestamp

| # | Device | Aksi | Harapan | ✅/❌ | Catatan |
|---|--------|------|---------|------|---------|
| 31 | Both | Buka form `/report/spring-monitoring` | Field tanggal otomatis terisi waktu buka, **read-only** |ya | |
| 32 | Both | Coba edit field tanggal | Tidak bisa diubah (read-only/disabled) |ya | |

---

## 7. 🗑️ Field Lead — Pastikan Hilang

| # | Device | Aksi | Harapan | ✅/❌ | Catatan |
|---|--------|------|---------|------|---------|
| 33 | Both | Admin → `/admin/users` | Dropdown role cuma: User / Volunteer / Admin | ya| |
| 34 | Both | Login biasa, cek role | Tidak ada menu/akses khusus "Field Lead" |ya | |

---

## 8. 🔗 Media Links

| # | Device | Aksi | Harapan | ✅/❌ | Catatan |
|---|--------|------|---------|------|---------|
| 35 | Both | Scroll ke section Media di landing | 4 item: Video, Event, Publication, Press | | |
| 36 | Both | Klik Event | Buka article Disway Mojokerto tentang restorasi mata air | | |
| 37 | Both | Klik Press | Buka artikel Kompas.id tentang karst Kebumen | | |
| 38 | Both | Klik Video | Buka YouTube | | |

selain yt masih ke help center semua. thumbnail tidak muncul 

## 9. ♿ Aksesibilitas

| # | Device | Aksi | Harapan | ✅/❌ | Catatan |
|---|--------|------|---------|------|---------|
| 39 | Both | Tab dari atas halaman | Skip link "Lompat ke konten utama" muncul pertama | | |
| 40 | Both | Admin panel → cek tombol Logout | Punya `aria-label="Logout"` | | |
| 41 | Both | Modal Points Guide | Judul modal terbaca screen reader (`aria-labelledby` connected) | | |

unttuk start monitoring ganti aja jadi start volunteering (translate juga ke indo) dan langsung arahkan ke "Report Your Contribution" 

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


>kenapa kaya cache dari sebelumnya gak hilang ya? kaya sering tumpuk tumpuk gitu dari sesi sebelumya
>terus recent aktivity juga belum sinkron dengan form yang udah masuk 
>kemudian ini form yang punya 3 foto tidak bisa aku lihat maksudnya gak muncul ( kalau gak liat aku gak bisa liat semua gabar yang masuk form atau diupload)
>kadang kadang ada field dalam form yang muncul dan hilang gitu misalkan tadi provinsi di form spring monitoring