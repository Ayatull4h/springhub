# Manual Test Plan — SpringHub

> **URL:** https://springhub.vercel.app/
> 
> **Akun Test:**
> - Volunteer: `volunteer@springhub.id` / `vol123`
> - Admin: `admin@springhub.id` / `admin123`
> 
> **Cara pakai:**
> - Isi kolom **✅/❌** setelah test (✅ = berhasil, ❌ = gagal)
> - Isi kolom **Catatan** jika ada yang tidak sesuai harapan
> - **HP** = test pakai handphone (Chrome/Safari)
> - **PC** = test pakai komputer/laptop
> - **Both** = test di kedua perangkat

---

## 🟡 PRIORITAS 1 — Core Flow (Wajib)

### 1.1 Submit Form + Upload Foto

| # | Device | Aksi | Harapan | ✅/❌ | Catatan |
|---|--------|------|---------|------|---------|
| 1 | Both | Buka `/report/spring-monitoring` | Form render lengkap, semua field muncul | | |
| 2 | Both | Isi Nama mata air, Desa, Kecamatan, Provinsi, Kota/Kab, Tanggal | Semua input terisi | | |
| 3 | Both | Pilih dropdown: Kondisi debit, Kualitas air, Kebersihan | Masing-masing punya ≥3 options, bisa dipilih | | |
| 4 | HP | Klik field Foto → pilih "Kamera" | Kamera HP terbuka | | |
| 5 | PC | Klik field Foto → pilih file gambar | File dialog terbuka, thumbnail muncul setelah pilih | | |
| 6 | HP | Klik "📍 Get Current Location" | GPS mendeteksi, lat/lng terisi otomatis | | |
| 7 | PC | Klik "🖱️ Pick from Map" | Map picker terbuka, klik map → koordinat terisi | | |
| 8 | Both | Isi Catatan pengamatan (opsional) | Text terisi | | |
| 9 | Both | Klik **Submit Report** | Loading muncul, lalu halaman success ✅ | | |
| 10 | Both | **Verifikasi akhir** | Halaman hijau "Laporan terkirim!" + icon CheckCircle | | |

### 1.2 Admin Approve Report

| # | Device | Aksi | Harapan | ✅/❌ | Catatan |
|---|--------|------|---------|------|---------|
| 1 | Both | Login admin: `admin@springhub.id` / `admin123` | Redirect ke `/admin` dashboard | | |
| 2 | Both | Klik sidebar **Review Queue** | Daftar pending report muncul | | |
| 3 | Both | Cek foto yang diupload sebelumnya (jika ada) | Foto thumbnail muncul, bisa diklik jadi featured (border biru) | | |
| 4 | Both | Klik tombol **Approve** (centang hijau) | Loading, report hilang dari queue | | |
| 5 | Both | Buka tab **Reports** | Status report berubah jadi "approved" | | |

### 1.3 Verifikasi Poin + Notifikasi (sebagai Volunteer)

| # | Device | Aksi | Harapan | ✅/❌ | Catatan |
|---|--------|------|---------|------|---------|
| 1 | Both | Logout admin, login volunteer: `volunteer@springhub.id` / `vol123` | Masuk landing | | |
| 2 | Both | Klik bell icon 🔔 di header (atas kanan) | Notif baru muncul: ✅ "Laporan spring-monitoring disetujui!" | | |
| 3 | Both | Klik **Profile** di menu user (pojok kanan) | Halaman profile terbuka | | |
| 4 | Both | Cek angka **Points** di header profile | Poin bertambah **+25** dari sebelumnya | | |
| 5 | Both | Scroll ke **Points History** | Ada baris "Approved spring-monitoring" +25 pts | | |

### 1.4 Admin Reject + Catatan

| # | Device | Aksi | Harapan | ✅/❌ | Catatan |
|---|--------|------|---------|------|---------|
| 1 | Both | Submit form baru sebagai volunteer (ulangi langkah 1.1 nomor 1-9) | Report pending baru siap | | |
| 2 | Both | Login admin, buka **Review Queue** | Report baru muncul di queue | | |
| 3 | Both | Isi **note** di field catatan, contoh: "Foto tidak jelas, mohon upload ulang" | Text muncul di field | | |
| 4 | Both | Klik tombol **Reject** (X merah) | Report hilang dari queue | | |
| 5 | Both | Login volunteer, cek notifikasi 🔔 | Notif baru: ❌ "Laporan ... ditolak" + catatan admin terbaca | | |

---

## 🟡 PRIORITAS 2 — UI & Fitur

### 2.1 Mobile Responsive Admin

| # | Device | Aksi | Harapan | ✅/❌ | Catatan |
|---|--------|------|---------|------|---------|
| 1 | HP | Buka `/admin` (login admin dulu) | Sidebar collapse/hilang, hamburger menu (☰) muncul | | |
| 2 | HP | Tap hamburger menu (☰) | Sidebar overlay terbuka dari kiri | | |
| 3 | HP | Tap **Users** | Tabel desktop berubah jadi **card view** (bukan kolom-kolom) | | |
| 4 | HP | Tap **Reports** | Card view: form, status badge, active toggle | | |
| 5 | HP | Tap **Donations** | Card view: donor name, amount Rp, status badge | | |
| 6 | HP | Tap **Projects** | Card view: title, region, progress | | |
| 7 | HP | Tap **Feedback** | Card view: type badge, preview text, status | | |
| 8 | PC | Resize browser ke <768px | Semua admin halaman jadi card view | | |
| 9 | Both | Klik overlay gelap di samping sidebar | Sidebar tertutup | | |

### 2.2 Donasi Flow

| # | Device | Aksi | Harapan | ✅/❌ | Catatan |
|---|--------|------|---------|------|---------|
| 1 | Both | Scroll ke section **Donate** di landing | Card donasi muncul dengan dropdown tier | | |
| 2 | Both | Pilih tier (contoh: Rp50.000) | Summary muncul: icon + impact + amount | | |
| 3 | Both | Pilih **Custom** dari dropdown | Input nominal muncul | | |
| 4 | Both | Isi nominal 75000 | Angka terisi | | |
| 5 | Both | Isi Nama Lengkap (required) | Terisi | | |
| 6 | Both | Isi Email | Terisi | | |
| 7 | Both | Klik **Checkout / Donate Now** | Redirect ke halaman Xendit invoice | | |

### 2.3 Offline Mode (PWA) — HP Only

| # | Device | Aksi | Harapan | ✅/❌ | Catatan |
|---|--------|------|---------|------|---------|
| 1 | HP | Buka `/offline` | Halaman setup muncul (6 step wizard) | | |
| 2 | HP | Step 1: Tutorial → centang agreement → Next | Lanjut step 2 | | |
| 3 | HP | Step 2: Pilih forms (centang spring-monitoring) → Next | Form terpilih | | |
| 4 | HP | Step 3: Pilih radius 3km + kualitas "Ringan" → Next | Konfigurasi tersimpan | | |
| 5 | HP | Step 4: Atur area di map (drag marker) → Next | Area tersimpan | | |
| 6 | HP | Step 5: Klik **Download Tile** | Progress bar berjalan, selesai | | |
| 7 | HP | Step 6: Klik **Mulai Survey** | Map offline terbuka, GPS overlay muncul | | |
| 8 | HP | Klik **Aktifkan GPS & Mulai Survey** | Izin lokasi, GPS mulai tracking | | |
| 9 | HP | Tap marker 💧 (mata air) | Marker tersimpan di map | | |
| 10 | HP | Tap marker 🌱 (pohon) | Marker tersimpan | | |
| 11 | HP | Tap marker 🕳️ (rorak) | Marker tersimpan | | |
| 12 | HP | Tap marker 🌰 (seedling) | Marker tersimpan | | |
| 13 | HP | Tap tombol form (kanan bawah) → pilih form → isi → submit | "Tersimpan!" | | |
| 14 | HP | Tap **Exit** | Masuk exit sync flow | | |
| 15 | HP | Review summary (jarak, marker, laporan, foto) → **Upload & Selesai** | 4 phase: upload → foto → cleanup → done | | |
| 16 | HP | Klik **Download Summary** | File PNG atau .txt terdownload | | |

### 2.4 Dark Mode

| # | Device | Aksi | Harapan | ✅/❌ | Catatan |
|---|--------|------|---------|------|---------|
| 1 | Both | Klik toggle dark mode (🌙) di header | Semua background jadi gelap | | |
| 2 | Both | Cek halaman **Landing** | Hero, stats, map, volunteer, donasi, footer semua gelap | | |
| 3 | Both | Cek halaman **About** | Value cards, CTA, header gelap | | |
| 4 | Both | Cek halaman **Report Issue** | Form, textarea, button gelap | | |
| 5 | Both | Cek halaman **Profile** | Avatar, edit form, points history gelap | | |
| 6 | Both | Cek halaman **Admin** | Sidebar, tabel, card semua gelap | | |
| 7 | Both | Cek **Map container** | Background map TETAP putih (Leaflet) — jangan ikut gelap | | |
| 8 | Both | Klik toggle lagi (☀️) | Kembali ke mode terang semua halaman | | |

### 2.5 i18n EN/ID

| # | Device | Aksi | Harapan | ✅/❌ | Catatan |
|---|--------|------|---------|------|---------|
| 1 | Both | Klik toggle bahasa (ID → EN) | Semua label berubah Inggris | | |
| 2 | Both | Cek Landing: "Map", "Dashboard", "Community", "Learn", "Media", "Donate" | Nav berubah Inggris | | |
| 3 | Both | Cek About: "About SpringHub", "Vision & Mission" | Konten berubah | | |
| 4 | Both | Cek Form: field labels English | Berubah | | |
| 5 | Both | Cek Footer: "Stay Updated", "Subscribe", "Platform" | Berubah | | |
| 6 | Both | Klik toggle balik (EN → ID) | Semua kembali Indonesia | | |

### 2.6 Notifikasi

| # | Device | Aksi | Harapan | ✅/❌ | Catatan |
|---|--------|------|---------|------|---------|
| 1 | Both | Login volunteer, cek bell icon 🔔 | Angka merah (unread count) muncul | | |
| 2 | Both | Klik bell icon | Buka halaman `/notifications` | | |
| 3 | Both | Cek daftar notifikasi | Ada ✅ "Laporan ... disetujui" dan/atau ❌ "ditolak" | | |
| 4 | Both | Klik **Tandai Dibaca** pada satu notif | Blue dot di kiri hilang | | |
| 5 | Both | Klik **Tandai Semua Dibaca** | Semua notif jadi read (tanpa blue dot) | | |

---

## 🟢 PRIORITAS 3 — Polish

### 3.1 Map Filter

| # | Device | Aksi | Harapan | ✅/❌ | Catatan |
|---|--------|------|---------|------|---------|
| 1 | Both | Buka landing, scroll ke map | Report list muncul di bawah map | | |
| 2 | Both | Uncentang "Monitoring" | Marker + list item monitoring hilang | | |
| 3 | Both | Uncentang "Tree Planting" | Marker + list item tree hilang | | |
| 4 | Both | Centang kembali | Marker + list item muncul lagi | | |

### 3.2 Pagination

| # | Device | Aksi | Harapan | ✅/❌ | Catatan |
|---|--------|------|---------|------|---------|
| 1 | Both | Cek volunteer feed (Community section) | Pagination nomor halaman muncul | | |
| 2 | Both | Klik nomor halaman 2 | Konten activity feed berganti | | |
| 3 | Both | Cek map report list (jika >6 item) | Tombol ← Previous / Next → berfungsi | | |

### 3.3 Report Issue

| # | Device | Aksi | Harapan | ✅/❌ | Catatan |
|---|--------|------|---------|------|---------|
| 1 | Both | Buka `/report-issue` | 2 section: Laporkan Bug + Kritik & Saran | | |
| 2 | Both | Isi Bug Description + pilih screenshot | File terpilih, nama file muncul | | |
| 3 | Both | Isi Kritik + Saran | Text terisi | | |
| 4 | Both | Klik **Kirim** | Success "Terima kasih!" | | |
| 5 | Both | Login admin, buka tab **Feedback** | Feedback baru muncul dengan type "bug" + deskripsi | | |

### 3.4 Profile

| # | Device | Aksi | Harapan | ✅/❌ | Catatan |
|---|--------|------|---------|------|---------|
| 1 | Both | Buka `/profile` | Avatar (inisial), username, email, region, points, trust score | | |
| 2 | Both | Klik **Edit Profile** | Form edit muncul: username, region, password | | |
| 3 | Both | Ganti region → klik **Save** | Banner sukses hijau muncul | | |
| 4 | Both | Scroll ke Points History | Riwayat poin: Approved +25, Streak, dll | | |

### 3.5 Learning Hub

| # | Device | Aksi | Harapan | ✅/❌ | Catatan |
|---|--------|------|---------|------|---------|
| 1 | Both | Buka landing, scroll ke Learning Hub | Course cards (dengan image + title + deskripsi) | | |
| 2 | Both | Klik salah satu course | Detail course: title, module list, progress | | |
| 3 | Both | Klik nama module | Halaman module: konten, video embed | | |
| 4 | Both | Klik **Tandai Selesai** | Progress bar terisi, poin +25 | | |

### 3.6 About Page

| # | Device | Aksi | Harapan | ✅/❌ | Catatan |
|---|--------|------|---------|------|---------|
| 1 | Both | Buka `/about` | Hero: "Tentang SpringHub", paragraf deskripsi | | |
| 2 | Both | Scroll ke Visi & Misi | Paragraf visi terbaca | | |
| 3 | Both | Cek grid 6 value cards | Masing-masing icon (Droplets, Users, TreePine, Shield, Heart, MapPin) + judul + desc | | |
| 4 | Both | Scroll ke CTA | Tombol "Gabung Sekarang" → `/join` | | |
| 5 | Both | Klik "Lihat Peta" | Scroll ke section map di landing | | |

### 3.7 Admin Forms Builder

| # | Device | Aksi | Harapan | ✅/❌ | Catatan |
|---|--------|------|---------|------|---------|
| 1 | PC | Login admin, buka `/admin/forms` | Daftar form (spring-monitoring, dll) dalam card grid | | |
| 2 | PC | Klik salah satu form | Field list: id, label, type, required, options | | |
| 3 | PC | Klik **+ Add Field** | Modal tambah field terbuka | | |
| 4 | PC | Pilih type "Select", isi label, options (1 per baris) | Field tersimpan | | |
| 5 | PC | Klik toggle Active/Inactive | Form disembunyikan/ditampilkan | | |

### 3.8 Admin Lainnya

| # | Device | Aksi | Harapan | ✅/❌ | Catatan |
|---|--------|------|---------|------|---------|
| 1 | PC | **Export CSV** — Klik Export di Users/Reports/Donations | File CSV terdownload | | |
| 2 | PC | **Points Rules** — Buka `/admin/points` | Tabel rules, bisa Create/Edit/Delete | | |
| 3 | PC | **Courses** — Buka `/admin/courses` | Card grid courses, bisa Create/Edit/Delete | | |
| 4 | PC | **Content CMS** — Buka `/admin/content` | Content blocks, bisa Add/Edit/Hapus | | |
| 5 | PC | **Users** — Klik role badge user → pilih role baru | Role berubah setelah reload | | |

### 3.9 Links & Footer

| # | Device | Aksi | Harapan | ✅/❌ | Catatan |
|---|--------|------|---------|------|---------|
| 1 | Both | Footer: klik **Privacy Policy** | Buka `/privacy` | | |
| 2 | Both | Footer: klik **Terms of Service** | Buka `/terms` | | |
| 3 | Both | Footer: klik **FAQ** | Buka `/faq` | | |
| 4 | Both | Footer: klik **Help Center** | Buka `/help` | | |
| 5 | Both | Footer: klik **Report Issue** | Buka `/report-issue` | | |
| 6 | Both | Footer: klik icon **Instagram** | Buka IG @jagasemesta (tab baru) | | |
| 7 | Both | Footer: klik icon **YouTube** | Buka YouTube @jagasemesta (tab baru) | | |
| 8 | Both | Footer: klik icon **TikTok** | Buka TikTok @jagasemesta (tab baru) | | |
| 9 | Both | Footer: klik icon **Facebook** | Buka FB @jagasemesta (tab baru) | | |
| 10 | Both | Footer: isi email + klik **Subscribe** | Alert "Terima kasih!" (jangan 403) | | |

### 3.10 Spring Timeline (Fitur Baru 🆕)

| # | Device | Aksi | Harapan | ✅/❌ | Catatan |
|---|--------|------|---------|------|---------|
| 1 | Both | Buka `/springs` | Daftar semua mata air, masing-masing card: nama, provinsi, jumlah laporan, tahun | | |
| 2 | Both | Jika daftar kosong | Tampilkan "Belum ada mata air terdaftar" | | |
| 3 | Both | Klik salah satu spring | Buka halaman `/springs/[id]` | | |
| 4 | Both | Cek header halaman | Nama spring, provinsi, tahun pertama dipantau, jumlah laporan | | |
| 5 | Both | Cek 3 stat cards | "Terakhir diperbarui", "Total laporan", "Tahun pemantauan" | | |
| 6 | Both | Scroll ke timeline | Laporan per tahun, urut descending (terbaru di atas) | | |
| 7 | Both | Cek 1 item timeline | Bulatan tahun di kiri, badge tipe form, tanggal, username | | |
| 8 | Both | Cek field data preview | Field terisi dari report (flow_condition, water_quality, dll) | | |
| 9 | Both | Cek foto (jika ada) | Thumbnail foto di timeline | | |
| 10 | Both | Klik link "Semua Mata Air" | Kembali ke daftar `/springs` | | |
| 11 | **HP** | Submit form spring-monitoring dengan nama spring yang SUDAH ADA | Report otomatis ter-link ke spring yang sama | | |
| 12 | **HP** | Submit form spring-monitoring dengan nama spring BARU | Spring baru terbuat | | |
| 13 | **PC** | Buka `/springs` → cek spring yang diupdate | Laporan terbaru muncul di timeline spring | | |

### 3.11 Floating Points Guide

| # | Device | Aksi | Harapan | ✅/❌ | Catatan |
|---|--------|------|---------|------|---------|
| 1 | Both | Cari floating button ⭐ di kanan bawah halaman | Tombol muncul, selalu visible walau di-scroll | | |
| 2 | Both | Klik tombol ⭐ | Modal "Panduan Poin" terbuka | | |
| 3 | Both | Scroll isi modal | Semua aturan poin (base + bonus + milestone) terbaca | | |
| 4 | Both | Klik tombol X / klik luar modal | Modal tertutup | | |
| 5 | Both | Cek z-index — saat modal terbuka, tombol ⭐ tidak boleh di atasnya | Modal selalu di atas tombol | | |

---

## 📊 RINGKASAN HASIL TEST

| Prioritas | Total Test | ✅ Pass | ❌ Fail | Skip |
|-----------|:----------:|:-------:|:-------:|:----:|
| P1 — Core Flow | 25 | | | |
| P2 — UI & Fitur | 39 | | | |
| P3 — Polish | 35 | | | |
| **TOTAL** | **99** | | | |

### Catatan Bug Ditemukan

| No | Halaman | Issue | Screenshot |
|----|---------|-------|------------|
| | | | |
| | | | |

---

> **Estimasi:** 45-60 menit untuk PC + 30 menit untuk HP
> 
> **Tips:** Prioritaskan P1 dulu. Kalau P1 semua ✅, web siap production.
