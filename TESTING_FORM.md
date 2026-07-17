# FORM TEST MANUAL — SpringHub

Isi kolom **HP / PC** dengan:
- **Y** = berfungsi dengan baik
- **T** = tidak berfungsi / error
- **-** = tidak bisa di-test / skip

Kolom **Catatan**: tulis detail spesifik biar langsung bisa saya fix (contoh: "tombol tidak muncul di HP", "error 500 pas submit", "layout pecah di 375px").

---

## A. Landing Page (`/`)

| # | Item | HP | PC | Catatan |
|---|------|:--:|:--:|---------|
| A1 | Header: logo kiri + 6 nav link + globe EN/ID + dark mode + Join button | ya | ya | |
| A2 | Hamburger menu ═ di HP — klik buka/tutup | ya | ya | |
| A3 | Nav link lewat hamburger: Map, Dashboard, Community, Learn, Media, Donate | ya | ya | |
| A4 | Jika login: profile, admin (jika admin), logout muncul di hamburger | ya | ya | |
| A5 | Jika guest: sign-in muncul di hamburger | ya | ya | tapi aku tidak paham intinya guest masi bisa mengkases hambuger |
| A6 | Klik logo SpringHub → kembali ke `/` | ya | ya | |
| A7 | Hero: title "Pantau & Pulihkan Mata Air Indonesia" muncul | ya | ya | | tapi aku tidak sepenuhnya paham
| A8 | Hero: subtitle paragraph muncul | ya | ya | |
| A9 | Hero: 2 CTA — biru "Mulai Pantau" + putih "Kembali ke Jaga Semesta" | ya | ya | |
| A10 | CTA "Mulai Pantau" → scroll ke `#map` | ya | ya | |
| A11 | YouTube video iframe loading (thumbnail + play) | ya | ya | |
| A12 | Di HP: link "▶️ Tonton di YouTube" muncul di bawah video | ya | ya | |
| A13 | Impact Dashboard: title "Dampak Nyata" muncul | ya | ya | |
| A14 | 4 stat cards: icon + angka + label — 2 kolom HP, 4 kolom PC | ya | ya | |
| A15 | Monthly progress bar: 3 bar (Mata Air, Pohon, Relawan) warna biru + angka | ya | ya | |
| A16 | Top Regions: ranking 1-5 dengan nama + detail | ya | ya | |
| A17 | Top Volunteers: ranking + nama + region + points | ya | ya | |

---

## B. Map Section (`/#map`)

| # | Item | HP | PC | Catatan |
|---|------|:--:|:--:|---------|
| B1 | Protection banner kuning "Lokasi diamankan dalam radius 5km" | ya | ya | |
| B2 | Leaflet map render (tidak infinite loading) | ya | ya | |
| B3 | Map tile loading — OpenStreetMap muncul | ya | ya | |
| B4 | 4 filter checkbox: Monitoring, Tree, Seedling, Restoration | ya | ya | |
| B5 | Centang/hilang centang filter → marker bertambah/berkurang | ya | ya | |
| B6 | Marker warna: hijau (sehat), merah (terdegradasi), kuning (restorasi) | ya | ya | |
| B7 | Lingkaran putus-putus 5km di setiap marker | ya | ya | |
| B8 | Klik marker → tooltip muncul: status + form type + username | ya | ya | |
| B9 | Scroll zoom map berfungsi (bisa zoom in/out) | ya | ya | |
| B10 | Report list di bawah map: icon + form title + status chip + region + date + username | ya | ya | |
| B11 | Report list grid — 2 kolom di PC, 1 kolom di HP | ☐ | ☐ |aku kurang paham ini |
| B12 | Pagination ← → report list bekerja | ya | ya | |
| B13 | "Report Your Contribution" card — 5 form link + poin per form | ya | ya |tapi ini ada kesalahan admin tidak bisa mengedit, baik menambah atau mengurangi form field, dan lain lain |
| B14 | Klik form link → buka `/report/[slug]` | ya | ya | |
| B15 | Tombol ⭐ "Earn Points" → modal terbuka | ya | ya | |
| B16 | Discovery prompt banner "Temukan mata air baru" | tidak | tidak |aku tidak menemukannya |

---

## C. Volunteer (`/#community`)

| # | Item | HP | PC | Catatan |
|---|------|:--:|:--:|---------|
| C1 | Title "Komunitas SpringHub" muncul | ya | ya | |
| C2 | Activity feed list: icon + form badge + timestamp + like/comment button | ya | ya |tapi tidak bisa diklik atau dilihat |
| C3 | Pagination ← → activity feed | ya | ya | |
| C4 | Points gate card biru: progress bar + poin / 20.000 | ya | ya | |
| C5 | Label "Terkunci" (jika <20k) atau "Eligible" (jika >=20k) | ya | ya | |
| C6 | Link "Cara Dapat Poin" → modal terbuka | ya | ya | |
| C7 | Jika eligible: tombol "Daftarkan Projek" → `/projects/new` | ya | ya | |
| C8 | Jika tidak eligible: tombol abu-abu "Kumpulkan N poin lagi" (disabled) | ya | ya | |

---

## D. Donasi (`/#donate`)

| # | Item | HP | PC | Catatan |
|---|------|:--:|:--:|---------|
| D1 | Title "Dukung Restorasi" + subtitle | ya | ya | |
| D2 | Dropdown tier: Seedling Rp20K, Trench Rp50K, Sediment Rp100K, Monitoring Rp1jt, Custom | ya | ya | |
| D3 | Pilih tier → banner hijau "Kamu mendukung [impact]" muncul | ya | ya | |
| D4 | Pilih Custom → input nominal muncul (min Rp1.000) | ya | ya | |
| D5 | Field Nama (required) + Email (optional) — grid 2 kolom | ya | ya | |
| D6 | Error: submit tanpa nama atau nominal <1000 → red box | ya | ya |tapi sejujurnya aku belum coba |
| D7 | Submit → loading spinner + redirect ke Xendit (jika key terisi) | tidak | tidak |belum aku uji karena untuk donasi paling aku taruh di ahkir |
| D8 | Teks "OVO, GoPay, DANA, QRIS, Kartu, Virtual Account" di footer form | ya | ya | |

---

## E. Partner & Featured Projects

| # | Item | HP | PC | Catatan |
|---|------|:--:|:--:|---------|
| E1 | Partner card biru gradient: "Jadi Mitra" + 4 tipe project + CTA email + Download Deck | ya | ya | |
| E2 | Featured Projects card: judul + tipe badge + status + progress bar + backer + "Dukung Project" | ya | ya | |
| E3 | Pagination ← → featured projects | ya| ya | |

---

## F. Learning Hub (`/#learn`)

| # | Item | HP | PC | Catatan |
|---|------|:--:|:--:|---------|
| F1 | Title "Pusat Belajar" + subtitle | ya | ya | |
| F2 | Course cards: icon gradient + level badge + title + description + duration + modules count | ya | ya | |
| F3 | Grid: 3 kolom PC, 2 tablet, 1 HP | ya | ya | |
| F4 | Button "Mulai Belajar" → `/learn/[slug]` | ya | ya | |
| F5 | Jika ada progress: progress bar + "Lanjutkan" button | ☐ | ☐ |belum aku coba |
| F6 | Loading state: spinner + "Loading courses..." | ☐ | ☐ |belum aku coba|
| F7 | Empty state (jika no courses): icon + "No courses available yet" | ya | ya | |

---

## G. Media (`/#media`)

| # | Item | HP | PC | Catatan |
|---|------|:--:|:--:|---------|
| G1 | Title + subtitle + "Kunjungi YouTube" button (buka tab baru) | ya | ya | |
| G2 | Media cards grid: 4 kolom PC, 2 tablet, 1 HP | ya | ya | |
| G3 | Card: thumbnail + type badge (Video/Event/Publication/Press) + title + subtitle + description | ya | ya | |
| G4 | Link di card → buka tab baru (jika external) | ya | ya | |
| G5 | Loading state: 4 skeleton card animasi pulse | ☐ | ☐ | aku tidak melihatnya |
| G6 | Image error fallback: icon sesuai tipe (video/event/publication/press) | ☐ | ☐ | |

---

## H. Sign In (`/sign-in`)

| # | Item | HP | PC | Catatan |
|---|------|:--:|:--:|---------|
| H1 | Form render: logo + email + password + "Lupa password?" + "Daftar" + test accounts | ya | ya | |
| H2 | Back link "← Kembali" → ke `/` | ya | ya | |
| H3 | Show/hide password 👁 — toggle visible/invisible | ya | ya | |
| H4 | Login gagal → red error box | ya | ya |email atau password salah |
| H5 | "Lupa password?" → `/forgot-password` | ya | ya |aku coba lupa password dan kirim untuk mereset password tapi email tidak masuk|
| H6 | "Daftar sekarang" → `/join` | ya | ya | |
| H7 | Login sukses → redirect ke `/` (atau `?redirect=...`) | ya | ya |tapi harus refresh dulu |

---

## I. Join / Register (`/join`)

| # | Item | HP | PC | Catatan |
|---|------|:--:|:--:|---------|
| I1 | Form render: email + password + username | ya | ya | |
| I2 | Back link "← Kembali" → `/` | ya | ya | |
| I3 | Show/hide password 👁 | ya | ya | |
| I4 | Error (email sudah terdaftar / password <6) → red box | ya | ya | |
| I5 | "Sudah punya akun? Masuk" → `/sign-in` | ya | ya | |
| I6 | Register sukses → redirect `/` | ya | ya | |

---

## J. Profile (`/profile`)

| # | Item | HP | PC | Catatan |
|---|------|:--:|:--:|---------|
| J1 | Belum login → redirect `/sign-in?redirect=/profile` | ☐ | ☐ |masih belum paham |
| J2 | Header: avatar inisial + username + email + region + role badge + Edit + Logout | ya | ya | |
| J3 | 3 stat cards: Total Points + Trust Score + Reports Submitted | ya | ya | |
| J4 | Klik Edit → form muncul: username + region + current password + new password | ☐ | ☐ | |
| J5 | Edit username/region → Save → tersimpan + banner hijau | ya | ya | |
| J6 | Ganti password (current + new) → Save → berhasil / error | ya | ya | |
| J7 | Klik Batal → form nutup, tidak ada perubahan | ya | ya | |
| J8 | Logout → kembali ke `/` + header guest mode | ya | ya | |
| J9 | "Laporan Saya" list: form type + date + status chip | ☐ | ☐ | |
| J10 | Empty reports: "Belum ada laporan" | ☐ | ☐ | |
| J11 | "Riwayat Poin": reason + date + +amount | ☐ | ☐ | |
| J12 | Empty points: "Belum ada riwayat poin" | ☐ | ☐ | |
| J13 | "Aktivitas Terbaru": timeline points + report status | ☐ | ☐ | |
| J14 | Claim guest banner: "✅ N laporan berhasil diklaim" | ☐ | ☐ | |

---

## K. Report Form (`/report/[slug]`)

| # | Item | HP | PC | Catatan |
|---|------|:--:|:--:|---------|
| K1 | Monitoring form: 11 field render | YA | ya | |
| K2 | Restoration form: 11 field render | ya | ya | |
| K3 | Trench form: 7 field render | ya | ya | |
| K4 | Tree Planting form: 8 field render | ya | ya | |
| K5 | Seedling form: 9 field render | ya | ya | |
| K6 | Back link "← Kembali ke Beranda" → `/` | ya | ya | |
| K7 | Title + deskripsi + chip poin ⭐ + chip snapped 🛡️ | ya | ya | |
| K8 | Field text — isi teks | ya | ya | |
| K9 | Field phone — validasi pattern 08xx / +62xx | ya | ya | |
| K10 | Field longtext — textarea 4 baris | ya | ya | |
| K11 | Field number — input angka min=0 | ya | ya | |
| K12 | Field date — date picker | ya | ya | |
| K13 | Field select — dropdown pilihan | ya | ya | |
| K14 | Field province — dropdown 38 provinsi |  |  | aku belum melihat provinsi |
| K15 | Field multiselect — checkbox, bisa centang >1 | ☐ | ☐ | belum coba|
| K16 | Field photo — upload file / buka kamera (HP) | ya | ya | |
| K17 | Location GPS detect — klik "Deteksi Lokasi" → minta izin → isi otomatis | ya | ya | |
| K18 | Location manual input — isi Latitude + Longitude | ya | ya | |
| K19 | Location map mode — klik "Pilih dari Peta" → pilih titik | ya | ya | |
| K20 | Cancel "Batal" → `/#map` | ya | ya | |
| K21 | Submit → loading spinner di tombol | ☐ | ☐ |aku belum paham ini |
| K22 | Error → red box di atas form | ☐ | ☐ |masih belum aku coba|
| K23 | Success → centang hijau + "Laporan Terkirim" + "Kirim Lagi" | ya | ya | |
| K24 | "Kirim Laporan Lain" → form reset | ☐ | ☐ |belum aku coba |
| K25 | Invalid slug `/report/tidak-ada` → "Formulir tidak ditemukan" | ya | ya | |

---

## L. Projects (`/projects/new`)

| # | Item | HP | PC | Catatan |
|---|------|:--:|:--:|---------|
| L1 | Belum login → redirect `/sign-in?redirect=/projects/new` | ☐ | ☐ |kalau belum login ke kunci|
| L2 | Points <20.000 → halaman "Kumpulkan N poin lagi" + progress bar | ya | ya | |
| L3 | Points >=20.000 → form multi-step: type → lokasi → budget → kontak → submit | ya | ya | |

---

## M. Course Detail (`/learn/[slug]`)

| # | Item | HP | PC | Catatan |
|---|------|:--:|:--:|---------|
| M1 | Course page: title + description + level + duration + icon | ya | ya | |
| M2 | Module list: title + status (terkunci/tersedia/selesai) + "Mulai" button | ☐ | ☐ |belum bisa akses karena kosong |
| M3 | Klik module → `/learn/[slug]/[moduleId]` → konten markdown | ☐ | ☐ |belum bisa akses karena kosong |
| M4 | "Tandai Selesai" → spinner → module berubah selesai + progress naik | ☐ | ☐ |belum bisa akses karena kosong |
| M5 | Dark mode OK di course page (tidak ada bg putih) | ya | ya |tapi ini untuk bagian luar ya. dalamnya aku gak tau belum bisa akses karena kosong |

---

## N. Static Pages

| # | Halaman | HP | PC | Catatan |
|---|---------|:--:|:--:|---------|
| N1 | `/faq` — FAQ muncul + heading terbaca | ya | ya | |
| N2 | `/help` — Help Center muncul | YA | ya | |
| N3 | `/privacy` — Privacy Policy muncul | ya | ya | |
| N4 | `/terms` — Terms of Service muncul | ya | ya | |
| N5 | `/report-issue` — form bug report + submit | ya | ya | |
| N6 | `/forgot-password` — isi email + submit | ya | ya | |
| N7 | `/reset-password` — isi password baru + submit | ya | ya | |
| N8 | Dark mode OK di semua static pages | ya | ya | |

---

## O. 404 & Error Pages

| # | Item | HP | PC | Catatan |
|---|------|:--:|:--:|---------|
| O1 | `/xyz123` → 404 page kustom dengan link home | ya | ya | |
| O2 | Global error page (app/error.tsx) — "Terjadi kesalahan" + "Coba lagi" | ☐ | ☐ |gak tau ini |

---

## P. Admin Panel (`/admin`)

### P1 — Admin Layout

| # | Item | HP | PC | Catatan |
|---|------|:--:|:--:|---------|
| P1a | Sidebar desktop: 11 menu (Dashboard, Users, Reports, Forms, Donations, Points, Courses, Feedback, Review Queue, Projects, Content) | ya | ya | |
| P1b | Sidebar aktif: menu yang sedang dibuka highlight biru | ya | ya | |
| P1c | User info + logout di footer sidebar | ya | ya | ada tapi di hp terlalu jauh |
| P1d | Header: hamburger (HP) + title halaman | ya | ya | |
| P1e | Header: "SpringHub / Local" dropdown (desktop) | ☐ | ☐ |aku tidak paham |
| P1f | Mobile: klik hamburger → overlay sidebar muncul | ☐ | ☐ |sidebar sih ada. cuma aku gapapaham yang dimaksud yang mana |
| P1g | Mobile sidebar: user info + logout ada | ada | ada |ada cuma ya itu terlalu jauh dan putihnya malah ikut turun terus|
| P1h | Mobile sidebar: Escape nutup | ya | ya | |
| P1i | Dark mode OK di sidebar + header | ya | ya | |

### P2 — Admin Dashboard

| # | Item | HP | PC | Catatan |
|---|------|:--:|:--:|---------|
| P2a | 4 stat cards: Users, Reports, Donations, Projects — dengan icon + angka | ya | ya | |
| P2b | Grid: 1 kolom HP, 2 tablet, 4 PC | ya | ya | |
| P2c | Export CSV buttons (4): Users, Reports, Donations, Projects — download | ya | ya | |
| P2d | Recent Registrations: 3 kolom — Username, Role, Joined | ya | ya |cuma untuk dark mode plihan role masih putih |
| P2e | Recent Registrations: scroll horizontal HP | ya | ya | |
| P2f | Recent Reports: 5 kolom — ID, Form, User, Status (chip warna), Date | ya | ya | |
| P2g | Recent Reports: scroll horizontal HP | ya | ya | |

### P3 — Admin Users

| # | Item | HP | PC | Catatan |
|---|------|:--:|:--:|---------|
| P3a | Title + count + Export CSV button | ya | ya | |
| P3b | Table 8 kolom: Username, Email, Phone, Role, Region, Points, Trust, Joined | ya | ya | |
| P3c | Scroll horizontal HP | ya | ya | |
| P3d | Klik chip role → dropdown ganti role | ya | ya | untuk dark mode masih berwarna putih |
| P3e | Ganti role → tersimpan | ya | ya | cuma ini gak ada notifikasi tersimpan  |

### P4 — Admin Reports

| # | Item | HP | PC | Catatan |
|---|------|:--:|:--:|---------|
| P4a | Title + count + Export + Toggle Coordinates | ya | ya | |
| P4b | Date filter from/to + Reset | ya | ya | tapi di dark masih putih|
| P4c | Table 8 kolom: Form, User, Status, Precise Lat, Precise Lng, Snapped, Reviewed, Date | ya | ya | |
| P4d | Scroll horizontal HP | ya | ya | |
| P4e | Toggle coordinates → precise lat/lng show/hide | ya | ya  | |

### P5 — Admin Review Queue

| # | Item | HP | PC | Catatan |
|---|------|:--:|:--:|---------|
| P5a | Title + pending count | ya | ya | |
| P5b | Card list: form type + user + date + field data preview | ya | ya | |
| P5c | Location: precise + snapped coordinates | ya | ya | |
| P5d | Note input per card (tidak shared) | ya | ya | |
| P5e | Approve button → spinner → card hilang | ya | ya | |
| P5f | Reject button → spinner → card hilang | ya | ya | |
| P5g | Action message notification (3 detik) | tidak | tidak | notifikasi tidak muncul apapun |
| P5h | Empty state "Semua laporan sudah direview" + icon ✅ | ya | ya | |

### P6 — Admin Donations

| # | Item | HP | PC | Catatan |
|---|------|:--:|:--:|---------|
| P6a | Title + total collected + Export CSV | ya | ya | |
| P6b | Table 8 kolom: Invoice, Donor, Email, Amount, Status, Tier, Project, Date | ya | ya | |
| P6c | Scroll horizontal HP | ya | ya | |

### P7 — Admin Projects

| # | Item | HP | PC | Catatan |
|---|------|:--:|:--:|---------|
| P7a | Title + count + Export + filter status + search | ya | ya | |
| P7b | Summary cards (total/approved/review/completed) | ya | ya | |
| P7c | Table 8 kolom: Title, Type, Status, Region, Goal, Raised, Contact, Date | ya | ya | |
| P7d | Scroll horizontal HP | ya | ya | |
| P7e | Klik project → detail modal | ya | ya | |
| P7f | Approve/Reject action dari modal | ya | ya | |

### P8 — Admin Points

| # | Item | HP | PC | Catatan |
|---|------|:--:|:--:|---------|
| P8a | Title "Point Rules" + count active | ya | ya | |
| P8b | Add Rule button → modal form muncul | ya |ya | |
| P8c | Table: No, Nama, Deskripsi, Kategori, Poin, Status, Aksi | ya | ya | |
| P8d | Edit → modal terisi data lama | ya | ya | |
| P8e | Toggle active/nonaktif | ya | ya | |
| P8f | Delete → konfirmasi + hapus | ya | ya | |

### P9 — Admin Courses

| # | Item | HP | PC | Catatan |
|---|------|:--:|:--:|---------|
| P9a | Title + count + New Course button | ya | ya | |
| P9b | Filter All/Active/Inactive | ya | ya | |
| P9c | Card grid: title + slug + modules count + active badge + Edit/Delete | ya | ya | |
| P9d | New Course → form: title, slug, level, duration, icon, modules | ya | ya | |
| P9e | Edit course → form terisi + tambah/hapus module | ya | ya | |
| P9f | Delete → konfirmasi | ya | ya | |

### P10 — Admin Forms

| # | Item | HP | PC | Catatan |
|---|------|:--:|:--:|---------|
| P10a | Title + count + Create New Form button | ya | ya | |
| P10b | Filter All/Active/Inactive | ya | ya | |
| P10c | Card grid: title + slug + fields count + active badge + Edit/Delete | ya | ya | |
| P10d | New Form → form: title, slug, points, type, fields builder | ya | ya | |
| P10e | Edit → Tab Metadata + Tab Field Builder | ya | ya | |
| P10f | Field Builder: add field (type, label, required, options) | ya | ya | |
| P10g | Field Builder: reorder up/down | ya | ya | |
| P10h | Field Builder: delete field | ya | ya | |

### P11 — Admin Feedback

| # | Item | HP | PC | Catatan |
|---|------|:--:|:--:|---------|
| P11a | Title + count | ya | ya | |
| P11b | Table 5 kolom: Type, Content, Status, Date, Actions (👁 / Mark Read / Resolve) | ya | ya | |
| P11c | Scroll horizontal HP | ya | ya | |
| P11d | Klik 👁 → detail modal | ya | ya | |
| P11e | Mark Read / Resolve → status berubah | ya | ya | |

### P12 — Admin Content

| # | Item | HP | PC | Catatan |
|---|------|:--:|:--:|---------|
| P12a | Title + Add Content button | ya | ya | |
| P12b | Tab: Media / Projects / Stats | ya | ya | |
| P12c | Card grid: thumbnail + title + type + sort order + Edit/Delete | ya | ya | |
| P12d | Add Content → modal: type, title, subtitle, description, image, link, sort order | ya | ya | |
| P12e | Edit → modal terisi data lama | ya | ya | |
| P12f | Delete → konfirmasi | ya | ya | |

### P13 — Admin Error Boundary

| # | Item | HP | PC | Catatan |
|---|------|:--:|:--:|---------|
| P13a | Error di admin → halaman "Terjadi kesalahan" + "Coba lagi" + "Dashboard" | ya | ya | |

---

## Q. Footer

| # | Item | HP | PC | Catatan |
|---|------|:--:|:--:|---------|
| Q1 | Footer muncul di semua halaman | ya | ya | |
| Q2 | 4 kolom: Platform, Support, About, Legal — 1 kolom HP, 4 kolom PC | ya | ya | |
| Q3 | Link Help → `/help`, FAQ → `/faq`, Privacy → `/privacy`, Terms → `/terms` | ya | ya | |
| Q4 | Sosial icon: Instagram, YouTube, TikTok, Facebook → buka tab baru | ya | ya | |
| Q5 | Newsletter form — isi email → submit | ya | ya | |
| Q6 | Contact: WhatsApp + Phone + Email + Address — semua dengan icon | ya | ya | |
| Q7 | Copyright bar + social icon kecil | ya | ya | tapi kamu bisa menambahkan copyright transparan yang akan ada terus di sisi kiri Bawah apapun itu dengan tulisan "jaga semesta" |

---

## R. Cross-Cutting

| # | Item | HP | PC | Catatan |
|---|------|:--:|:--:|---------|
| R1 | Dark mode 🌙 → semua halaman gelap konsisten | ya | ya |ada beberapa sih yang masih putih |
| R2 | Language toggle EN ↔ ID → semua teks berubah | ya | ya | cuma memang susah ya jika nanti ada update aktifitas dan muncul di dashboard langsung jadi Bahasa inggris |
| R3 | Floating points button ⭐ (kanan bawah) → modal cara dapat poin | ya | ya | |
| R4 | Notification bell 🔔 (jika login) — ada | tidak | tidaak  | tidak |

---

## S. Mobile Specific

| # | Item | HP | Catatan |
|---|------|:--:|---------|
| S1 | Viewport pas — tidak zoom-out di HP | ya | |
| S2 | Klik input form → iOS tidak auto-zoom | ☐ |belum coba |
| S3 | Tap response cepat (tidak delay 300ms) | ya | |
| S4 | Tidak ada horizontal page overflow (kecuali tabel admin) | ya | |
| S5 | Touch target cukup besar — button bisa ditap jempol | ya | |

---

## Cara Pengisian

Isi dengan **Y / T / -** di kolom HP dan PC.

- **Y** = berfungsi
- **T** = error / tidak muncul / rusak
- **-** = skip / tidak bisa test

Kolom **Catatan**: tulis detail biar saya langsung fix tanpa perlu tanya lagi.

Contoh catatan bagus:
- ✅ "Tombol muncul tapi tidak bisa diklik di HP"
- ✅ "Error 500 saat submit — console: Failed to fetch /api/reports"
- ✅ "Layout pecah di 375px — card keluar dari layar"
- ✅ "Dark mode tidak berubah — background tetap putih"

---

*Format: SpringHub Manual Test Form — Generated 23 Mei 2026*
*Isi Y/T/- dan catatan, lalu kirim kembali ke saya untuk di-fix.*


