# Manual Test Plan — SpringHub

> **URL:** https://springhub.vercel.app/
>
> **Akun Test:**
> - Volunteer: `volunteer@springhub.id` / `vol123`
> - Admin: `admin@springhub.id` / `admin123`
>
> **Cara pakai:**
> - Isi kolom **✅/❌** setelah test
> - **HP** = handphone (Chrome/Safari), **PC** = komputer/laptop, **Both** = keduanya
> - Test setelah semua perbaikan di-`git push master` dan auto-deploy Vercel selesai

---

## 🟡 PRIORITAS 1 — Core Flow

### 1.1 Submit Form + Upload Foto

| # | Device | Aksi | Harapan | ✅/❌ | Catatan |
|---|--------|------|---------|------|---------|
| 1 | Both | Buka `/report/spring-monitoring` | Form render lengkap, semua field muncul | | |
| 2 | Both | Isi Nama mata air, Desa, Kecamatan, Provinsi, Kota/Kab, Tanggal | Semua input terisi | | |
| 3 | Both | Pilih dropdown: Kondisi debit, Kualitas air, Kebersihan | Masing-masing punya ≥3 options, bisa dipilih | | |
| 4 | HP | Klik field Foto — pilih "Kamera" | Kamera HP terbuka | | |
| 5 | HP | Klik field Foto — pilih "Galeri" | Galeri HP terbuka, bisa pilih foto | | |
| 6 | PC | Klik field Foto — pilih file gambar | File dialog terbuka, thumbnail muncul | | |
| 7 | Both | Klik "📍 Get Current Location" | GPS mendeteksi, lat/lng terisi otomatis | | |
| 8 | PC | Klik "🖱️ Pick from Map" | Map picker terbuka (modal 300px), klik map → koordinat terisi | | |
| 9 | Both | Isi Catatan pengamatan (opsional) | Text terisi | | |
| 10 | Both | Klik **Submit Report** | Loading → sukses | | |
| 11 | Both | Verifikasi akhir | Halaman hijau "Laporan terkirim!" | | |

### 1.2 Admin Approve Report

| # | Device | Aksi | Harapan | ✅/❌ | Catatan |
|---|--------|------|---------|------|---------|
| 1 | Both | Login admin: `admin@springhub.id` / `admin123` | Redirect ke `/admin` dashboard | | |
| 2 | Both | Klik sidebar **Review Queue** | Daftar pending report muncul | | |
| 3 | Both | Cek foto thumbnail | Muncul, bisa klik jadi featured (border biru) | | |
| 4 | Both | Klik **Approve** (centang hijau) | Loading, report hilang dari queue | | |
| 5 | Both | Buka tab **Reports** | Status berubah jadi "approved" | | |

### 1.3 Verifikasi Poin + Notifikasi (Volunteer)

| # | Device | Aksi | Harapan | ✅/❌ | Catatan |
|---|--------|------|---------|------|---------|
| 1 | Both | Logout admin, login volunteer: `volunteer@springhub.id` / `vol123` | Masuk landing | | |
| 2 | Both | Klik bell icon 🔔 di header | Notif baru muncul: ✅ "Laporan ... disetujui!" | | |
| 3 | Both | Klik **Profile** di menu user | Halaman profile terbuka | | |
| 4 | Both | Cek angka **Points** di header profile | Bertambah **+25** | | |
| 5 | Both | Scroll ke **Points History** | Ada baris "Approved spring-monitoring" +25 pts | | |

### 1.4 Admin Reject + Catatan

| # | Device | Aksi | Harapan | ✅/❌ | Catatan |
|---|--------|------|---------|------|---------|
| 1 | Both | Submit form baru sebagai volunteer | Report pending baru siap | | |
| 2 | Both | Login admin, buka **Review Queue** | Report baru muncul | | |
| 3 | Both | Isi note: "Foto tidak jelas, mohon upload ulang" | Text muncul di field | | |
| 4 | Both | Klik **Reject** (X merah) | Report hilang dari queue | | |
| 5 | Both | Login volunteer, cek notifikasi 🔔 | ❌ "Laporan ... ditolak" + catatan terbaca | | |

---

## 🟡 PRIORITAS 2 — UI & Fitur

### 2.1 Mobile Responsive Admin

| # | Device | Aksi | Harapan | ✅/❌ | Catatan |
|---|--------|------|---------|------|---------|
| 1 | HP | Buka `/admin` (login admin dulu) | Sidebar collapse, hamburger ☰ muncul | | |
| 2 | HP | Tap ☰ | Sidebar overlay terbuka dari kiri | | |
| 3 | HP | Tap **Users** | Tabel → **card view** | | |
| 4 | HP | Tap **Reports** | Card view: form, status badge, active toggle | | |
| 5 | HP | Tap **Donations** | Card view: donor name, amount Rp, status | | |
| 6 | HP | Tap **Projects** | Card view: title, region, progress | | |
| 7 | HP | Tap **Feedback** | Card view: type badge, preview text, status | | |
| 8 | PC | Resize ke <768px | Semua jadi card view | | |
| 9 | Both | Klik overlay gelap samping sidebar | Sidebar tertutup | | |

### 2.2 Donasi Flow

| # | Device | Aksi | Harapan | ✅/❌ | Catatan |
|---|--------|------|---------|------|---------|
| 1 | Both | Scroll ke section **Donate** di landing | Card donasi muncul dengan dropdown tier | | |
| 2 | Both | Pilih tier (Rp50.000) | Summary: icon + impact + amount | | |
| 3 | Both | Pilih **Custom** | Input nominal muncul | | |
| 4 | Both | Isi nominal 75000 | Terisi | | |
| 5 | Both | Isi Nama Lengkap | Terisi | | |
| 6 | Both | Isi Email | Terisi | | |
| 7 | Both | Klik **Checkout / Donate Now** | Redirect ke Xendit invoice | |⚠️ Butuh XENDIT_SECRET_KEY diisi |

### 2.3 Offline Mode (HP Only)

| # | Device | Aksi | Harapan | ✅/❌ | Catatan |
|---|--------|------|---------|------|---------|
| 1 | HP | Buka `/offline` | Halaman setup muncul | | |
| 2 | HP | Step 1: centang agreement → Next | Lanjut step 2 | | |
| 3 | HP | Step 2: pilih forms → Next | Form terpilih | | |
| 4 | HP | Step 3: radius 3km + kualitas "Ringan" → Next | Konfigurasi tersimpan | | |
| 5 | HP | Step 4: atur area di map → Next | Area tersimpan | | |
| 6 | HP | Step 5: Download Tile | Progress bar berjalan | | |
| 7 | HP | Step 6: **Mulai Survey** | Map offline + GPS overlay muncul | | |
| 8 | HP | **Airplane mode ON** | Map tetap muncul (dari tile IndexedDB) | | |
| 9 | HP | Klik **Aktifkan GPS** | GPS tetap jalan meski offline | | |
| 10 | HP | Tap marker 💧 (mata air) | Marker tersimpan | | |
| 11 | HP | Tap marker 🌱 (pohon) | Marker tersimpan | | |
| 12 | HP | Tap marker 🕳️ (rorak) | Marker tersimpan | | |
| 13 | HP | Tap marker 🌰 (seedling) | Marker tersimpan | | |
| 14 | HP | Tap tombol form → isi → submit | "Tersimpan!" (IndexedDB) | | |
| 15 | HP | Ambil foto dari **kamera** | Kamera HP terbuka | | |
| 16 | HP | Ambil foto dari **galeri** | Galeri terbuka | | |
| 17 | HP | Tap **Exit** | Masuk exit sync flow | | |
| 18 | HP | Review summary | 2 tombol download: TXT + PNG | | |
| 19 | HP | Klik **📄 Track Saja** | Download .txt | | |
| 20 | HP | Klik **🗺️ Track + Map** | Download .png (map screenshot) | | |
| 21 | HP | Klik **Upload & Selesai** | upload report → foto → cleanup → done | | |
| 22 | HP | **Internet ON** → buka halaman | Data sudah terkirim, tidak ada duplikasi | | |

### 2.4 Dark Mode

| # | Device | Aksi | Harapan | ✅/❌ | Catatan |
|---|--------|------|---------|------|---------|
| 1 | Both | Klik toggle 🌙 di header | Semua gelap | | |
| 2 | Both | Landing: Hero, stats, map, footer | Semua gelap | | |
| 3 | Both | About page | Value cards, CTA gelap | | |
| 4 | Both | Report Issue | Textarea, button gelap | | |
| 5 | Both | Profile | Avatar, edit form, history gelap | | |
| 6 | Both | Admin | Sidebar, tabel, card gelap | | |
| 7 | Both | Map container | Background peta TETAP putih (Leaflet) | | |
| 8 | Both | Klik toggle ☀️ | Kembali terang | | |

### 2.5 i18n EN/ID

| # | Device | Aksi | Harapan | ✅/❌ | Catatan |
|---|--------|------|---------|------|---------|
| 1 | Both | Klik toggle ID → EN | Semua label berubah Inggris | | |
| 2 | Both | Landing: "Map", "Dashboard", "Community", "Learn", "Media", "Donate" | Nav berubah | | |
| 3 | Both | About: "About SpringHub", "Vision & Mission" | Konten berubah | | |
| 4 | Both | Notifikasi page | Title & button berubah | | |
| 5 | Both | Report Issue | Label & placeholder berubah | | |
| 6 | Both | Footer: "Stay Updated", "Subscribe" | Berubah | | |
| 7 | Both | Klik balik EN → ID | Semua kembali Indonesia | | |

### 2.6 Notifikasi

| # | Device | Aksi | Harapan | ✅/❌ | Catatan |
|---|--------|------|---------|------|---------|
| 1 | Both | Login volunteer, cek 🔔 | Angka merah (unread) muncul | | |
| 2 | Both | Klik 🔔 | Buka `/notifications` | | |
| 3 | Both | Cek daftar notif | Ada ✅ disetujui / ❌ ditolak | | |
| 4 | Both | Klik **Tandai Dibaca** pada satu notif | Blue dot hilang | | |
| 5 | Both | Klik **Tandai Semua Dibaca** | Semua notif read | | |

---

## 🟢 PRIORITAS 3 — Polish

### 3.1 Map Filter

| # | Device | Aksi | Harapan | ✅/❌ | Catatan |
|---|--------|------|---------|------|---------|
| 1 | Both | Landing → scroll ke map | Report list muncul di bawah map | | |
| 2 | Both | Uncentang "Springs" | Marker + list item springs hilang | | |
| 3 | Both | Uncentang "Tree Planting" | Marker + list item tree hilang | | |
| 4 | Both | Centang kembali | Marker muncul lagi | | |
| 5 | Both | Cek warna marker | Biru (baik), Kuning (sedang), Merah (terdegradasi) | | |
| 6 | Both | Klik "Apa arti warna ini?" | Icon sejajar dengan teks | | |

### 3.2 Pagination

| # | Device | Aksi | Harapan | ✅/❌ | Catatan |
|---|--------|------|---------|------|---------|
| 1 | Both | Volunteer feed (Community) | Pagination nomor halaman muncul | | |
| 2 | Both | Klik halaman 2 | Konten berganti | | |
| 3 | Both | Map report list (jika >6 item) | ← Previous / Next → berfungsi | | |

### 3.3 Report Issue

| # | Device | Aksi | Harapan | ✅/❌ | Catatan |
|---|--------|------|---------|------|---------|
| 1 | Both | Buka `/report-issue` | 2 section: Bug + Kritik & Saran | | |
| 2 | Both | Isi Bug + screenshot | File terpilih, nama file muncul | | |
| 3 | Both | Isi Kritik & Saran | Text terisi | | |
| 4 | Both | Klik **Kirim** | Success "Terima kasih!" | | |
| 5 | Both | Admin → tab **Feedback** | Feedback baru muncul | | |

### 3.4 Profile

| # | Device | Aksi | Harapan | ✅/❌ | Catatan |
|---|--------|------|---------|------|---------|
| 1 | Both | Buka `/profile` | Avatar, username, email, region, points, trust score | | |
| 2 | Both | Klik **Edit Profile** | Form edit: username, region, password | | |
| 3 | Both | Ganti region → **Save** | Banner sukses hijau | | |
| 4 | Both | Scroll ke Points History | Riwayat poin: Approved +25, Streak, dll | | |

### 3.5 Learning Hub

| # | Device | Aksi | Harapan | ✅/❌ | Catatan |
|---|--------|------|---------|------|---------|
| 1 | Both | Landing → scroll ke Learning Hub | Course cards (title + deskripsi) | | |
| 2 | Both | Klik course | Detail: title, module list, progress | | |
| 3 | Both | Klik module (unlocked) | Halaman module: konten, video embed | | |
| 4 | Both | Coba akses module **Locked** | Tidak bisa — cursor not-allowed | | |
| 5 | Both | Klik **Tandai Selesai** | Progress bar terisi, poin +25 | | |
| 6 | HP | Coba akses module tanpa login | Muncul sign-in prompt | | |

### 3.6 About Page

| # | Device | Aksi | Harapan | ✅/❌ | Catatan |
|---|--------|------|---------|------|---------|
| 1 | Both | Buka `/about` | Hero: "Tentang SpringHub" / "About SpringHub" (tergantung i18n) | | |
| 2 | Both | Scroll ke Visi & Misi | Paragraf visi | | |
| 3 | Both | Cek 6 value cards | Icon + judul + desc | | |
| 4 | Both | Scroll ke CTA | Tombol "Gabung Sekarang" / "Join Now" | | |
| 5 | Both | Klik "Lihat Peta" | Scroll ke map di landing | | |
| 6 | Both | Ganti i18n ke EN | Semua konten berubah Inggris | | |

### 3.7 Admin Forms Builder

| # | Device | Aksi | Harapan | ✅/❌ | Catatan |
|---|--------|------|---------|------|---------|
| 1 | PC | Admin → `/admin/forms` | Daftar form dalam card grid | | |
| 2 | PC | Klik form | Field list: id, label, type, required, options | | |
| 3 | PC | Klik **+ Add Field** | Modal tambah field | | |
| 4 | PC | Pilih type "Select", isi label, options | Field tersimpan | | |
| 5 | PC | Klik toggle Active/Inactive | Form disembunyikan/ditampilkan | | |

### 3.8 Admin Lainnya

| # | Device | Aksi | Harapan | ✅/❌ | Catatan |
|---|--------|------|---------|------|---------|
| 1 | PC | Export CSV di Users/Reports/Donations | File CSV terdownload | | |
| 2 | PC | `/admin/points` | Tabel rules, bisa CRUD | | |
| 3 | PC | `/admin/courses` | Card grid courses, bisa CRUD | | |
| 4 | PC | `/admin/content` | Content blocks, bisa Add/Edit/Hapus | | |
| 5 | PC | **Users** — klik role badge → pilih role baru | Role berubah | | |

### 3.9 Links & Footer

| # | Device | Aksi | Harapan | ✅/❌ | Catatan |
|---|--------|------|---------|------|---------|
| 1 | Both | Footer → **Privacy Policy** | `/privacy` | | |
| 2 | Both | Footer → **Terms of Service** | `/terms` | | |
| 3 | Both | Footer → **FAQ** | `/faq` | | |
| 4 | Both | Footer → **Help Center** | `/help` | | |
| 5 | Both | Footer → **Report Issue** | `/report-issue` | | |
| 6 | Both | Footer → **Instagram** | IG @jagasemesta | | |
| 7 | Both | Footer → **YouTube** | YouTube @jagasemesta | | |
| 8 | Both | Footer → **TikTok** | TikTok @jagasemesta | | |
| 9 | Both | Footer → **Facebook** | FB Jaga Semesta | | |
| 10 | Both | Footer → isi email → **Subscribe** | Alert "Terima kasih!" | | |

### 3.10 Spring Timeline

| # | Device | Aksi | Harapan | ✅/❌ | Catatan |
|---|--------|------|---------|------|---------|
| 1 | Both | Buka `/springs` | Daftar semua mata air (card: nama, provinsi, laporan, tahun) | | |
| 2 | Both | Jika kosong | "Belum ada mata air terdaftar" | | |
| 3 | Both | Klik salah satu spring | Halaman `/springs/[id]` | | |
| 4 | Both | Header: nama, provinsi, tahun, jumlah laporan | Semua muncul | | |
| 5 | Both | 3 stat cards | "Terakhir diperbarui", "Total laporan", "Tahun pemantauan" | | |
| 6 | Both | Timeline laporan per tahun | Urut descending (terbaru di atas) | | |
| 7 | Both | 1 item timeline | Bulatan tahun, badge form, tanggal, username | | |
| 8 | Both | Field data preview | 8 fields dengan descriptive labels | | |
| 9 | Both | Foto (jika ada) | Thumbnail foto | | |
| 10 | Both | **Comment section** | Form komentar: isi nama (opsional) + komentar + kirim | | |
| 11 | Both | Ketik komentar → Enter/klik Kirim | Komentar muncul di list, tersimpan di localStorage | | |
| 12 | Both | Klik "Semua Mata Air" | Kembali ke `/springs` | | |

### 3.11 Floating Points Guide

| # | Device | Aksi | Harapan | ✅/❌ | Catatan |
|---|--------|------|---------|------|---------|
| 1 | Both | Cari floating button ⭐ di kanan bawah | Tombol muncul, selalu visible | | |
| 2 | Both | Klik ⭐ | Modal "Panduan Poin" terbuka | | |
| 3 | Both | Scroll modal | Aturan poin (base + bonus + milestone) | | |
| 4 | Both | Klik X / klik luar modal | Modal tertutup | | |
| 5 | Both | Cek z-index | Modal di atas tombol ⭐ | | |

---

## 📊 RINGKASAN HASIL TEST

| Prioritas | Total Test | ✅ Pass | ❌ Fail | Skip |
|-----------|:----------:|:-------:|:-------:|:----:|
| P1 — Core Flow | 26 | | | |
| P2 — UI & Fitur | 38 | | | |
| P3 — Polish | 51 | | | |
| **TOTAL** | **115** | | | |

### Catatan Bug

| No | Halaman | Issue | Screenshot |
|----|---------|-------|------------|
| | | | |
| | | | |

---

> **Estimasi:** 60-90 menit untuk PC + 45 menit untuk HP
>
> **Tips:** Prioritaskan P1 dulu. Kalau P1 semua ✅, web siap production.

## ✅ Perbaikan yang Sudah Dilakukan Sebelum Test Ini

| # | Issue | File |
|---|-------|------|
| 1 | **Atomic submission** — foto gagal → report dihapus | `app/report/[slug]/page.tsx` + `app/api/reports/[id]/route.ts` |
| 2 | **Galeri foto** — hapus `capture="environment"` agar muncul kamera & galeri | `app/report/[slug]/page.tsx` |
| 3 | **Map picker PC** — tambah height 300px | `components/map/picker-map.tsx` |
| 4 | **Offline error** — pesan error lebih deskriptif | `app/offline/page.tsx` |
| 5 | **Tandai Selesai** — barrier login + locked module | `app/learn/[slug]/[moduleId]/page.tsx` |
| 6 | **Platform link** — pakai env var `NEXT_PUBLIC_APP_URL` | `app/sitemap.ts`, `app/layout.tsx`, `public/robots.txt` |
| 7 | **Warna marker** — Biru (baik), Kuning (sedang), Merah (terdegradasi) | `components/map/leaflet-map.tsx` |
| 8 | **Icon alignment** — `inline-flex items-center gap-1` | `components/sections/status-info.tsx` |
| 9 | **Profile claimnone** — banner hanya utk user baru | `app/profile/page.tsx` |
| 10 | **Comments UI** — form komentar di halaman spring | `app/springs/[id]/page.tsx` |
| 11 | **i18n** — notifikasi, report issue, media | `app/notifications/page.tsx`, `app/report-issue/page.tsx`, `components/sections/media.tsx` |
| 12 | **Seedling filter** — exact match slug | `components/sections/spring-map.tsx` |
| 13 | **Redis** — skip jika REDIS_URL kosong | `lib/redis.ts` |
| 14 | **Prisma pool** — max 3 + global pool | `lib/prisma.ts` |
| 15 | **FB link** — URL benar | `lib/contacts.ts` |
| 16 | **About page i18n** — client component + translation | `app/about/page.tsx` |
| 17 | **Dark mode textarea** — `dark:bg-slate-800` | `app/report-issue/page.tsx` |
| 18 | **Course locked** — `cursor-not-allowed + barrier` | `app/learn/[slug]/page.tsx` |
| 19 | **Floating Points Guide** — FAB button | `components/floating-points-button.tsx` |
| 20 | **Spring Timeline** — 8 fields + descriptive labels | `app/springs/[id]/page.tsx` |
