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
| A1 | Header: logo kiri + 6 nav link + globe EN/ID + dark mode + Join button | ☐ | ☐ | |
| A2 | Hamburger menu ═ di HP — klik buka/tutup | ☐ | ☐ | |
| A3 | Nav link lewat hamburger: Map, Dashboard, Community, Learn, Media, Donate | ☐ | ☐ | |
| A4 | Jika login: profile, admin (jika admin), logout muncul di hamburger | ☐ | ☐ | |
| A5 | Jika guest: sign-in muncul di hamburger | ☐ | ☐ | |
| A6 | Klik logo SpringHub → kembali ke `/` | ☐ | ☐ | |
| A7 | Hero: title "Pantau & Pulihkan Mata Air Indonesia" muncul | ☐ | ☐ | |
| A8 | Hero: subtitle paragraph muncul | ☐ | ☐ | |
| A9 | Hero: 2 CTA — biru "Mulai Pantau" + putih "Kembali ke Jaga Semesta" | ☐ | ☐ | |
| A10 | CTA "Mulai Pantau" → scroll ke `#map` | ☐ | ☐ | |
| A11 | YouTube video iframe loading (thumbnail + play) | ☐ | ☐ | |
| A12 | Di HP: link "▶️ Tonton di YouTube" muncul di bawah video | ☐ | ☐ | |
| A13 | Impact Dashboard: title "Dampak Nyata" muncul | ☐ | ☐ | |
| A14 | 4 stat cards: icon + angka + label — 2 kolom HP, 4 kolom PC | ☐ | ☐ | |
| A15 | Monthly progress bar: 3 bar (Mata Air, Pohon, Relawan) warna biru + angka | ☐ | ☐ | |
| A16 | Top Regions: ranking 1-5 dengan nama + detail | ☐ | ☐ | |
| A17 | Top Volunteers: ranking + nama + region + points | ☐ | ☐ | |

---

## B. Map Section (`/#map`)

| # | Item | HP | PC | Catatan |
|---|------|:--:|:--:|---------|
| B1 | Protection banner kuning "Lokasi diamankan dalam radius 5km" | ☐ | ☐ | |
| B2 | Leaflet map render (tidak infinite loading) | ☐ | ☐ | |
| B3 | Map tile loading — OpenStreetMap muncul | ☐ | ☐ | |
| B4 | 4 filter checkbox: Monitoring, Tree, Seedling, Restoration | ☐ | ☐ | |
| B5 | Centang/hilang centang filter → marker bertambah/berkurang | ☐ | ☐ | |
| B6 | Marker warna: hijau (sehat), merah (terdegradasi), kuning (restorasi) | ☐ | ☐ | |
| B7 | Lingkaran putus-putus 5km di setiap marker | ☐ | ☐ | |
| B8 | Klik marker → tooltip muncul: status + form type + username | ☐ | ☐ | |
| B9 | Scroll zoom map berfungsi (bisa zoom in/out) | ☐ | ☐ | |
| B10 | Report list di bawah map: icon + form title + status chip + region + date + username | ☐ | ☐ | |
| B11 | Report list grid — 2 kolom di PC, 1 kolom di HP | ☐ | ☐ | |
| B12 | Pagination ← → report list bekerja | ☐ | ☐ | |
| B13 | "Report Your Contribution" card — 5 form link + poin per form | ☐ | ☐ | |
| B14 | Klik form link → buka `/report/[slug]` | ☐ | ☐ | |
| B15 | Tombol ⭐ "Earn Points" → modal terbuka | ☐ | ☐ | |
| B16 | Discovery prompt banner "Temukan mata air baru" | ☐ | ☐ | |

---

## C. Volunteer (`/#community`)

| # | Item | HP | PC | Catatan |
|---|------|:--:|:--:|---------|
| C1 | Title "Komunitas SpringHub" muncul | ☐ | ☐ | |
| C2 | Activity feed list: icon + form badge + timestamp + like/comment button | ☐ | ☐ | |
| C3 | Pagination ← → activity feed | ☐ | ☐ | |
| C4 | Points gate card biru: progress bar + poin / 20.000 | ☐ | ☐ | |
| C5 | Label "Terkunci" (jika <20k) atau "Eligible" (jika >=20k) | ☐ | ☐ | |
| C6 | Link "Cara Dapat Poin" → modal terbuka | ☐ | ☐ | |
| C7 | Jika eligible: tombol "Daftarkan Projek" → `/projects/new` | ☐ | ☐ | |
| C8 | Jika tidak eligible: tombol abu-abu "Kumpulkan N poin lagi" (disabled) | ☐ | ☐ | |

---

## D. Donasi (`/#donate`)

| # | Item | HP | PC | Catatan |
|---|------|:--:|:--:|---------|
| D1 | Title "Dukung Restorasi" + subtitle | ☐ | ☐ | |
| D2 | Dropdown tier: Seedling Rp20K, Trench Rp50K, Sediment Rp100K, Monitoring Rp1jt, Custom | ☐ | ☐ | |
| D3 | Pilih tier → banner hijau "Kamu mendukung [impact]" muncul | ☐ | ☐ | |
| D4 | Pilih Custom → input nominal muncul (min Rp1.000) | ☐ | ☐ | |
| D5 | Field Nama (required) + Email (optional) — grid 2 kolom | ☐ | ☐ | |
| D6 | Error: submit tanpa nama atau nominal <1000 → red box | ☐ | ☐ | |
| D7 | Submit → loading spinner + redirect ke Xendit (jika key terisi) | ☐ | ☐ | |
| D8 | Teks "OVO, GoPay, DANA, QRIS, Kartu, Virtual Account" di footer form | ☐ | ☐ | |

---

## E. Partner & Featured Projects

| # | Item | HP | PC | Catatan |
|---|------|:--:|:--:|---------|
| E1 | Partner card biru gradient: "Jadi Mitra" + 4 tipe project + CTA email + Download Deck | ☐ | ☐ | |
| E2 | Featured Projects card: judul + tipe badge + status + progress bar + backer + "Dukung Project" | ☐ | ☐ | |
| E3 | Pagination ← → featured projects | ☐ | ☐ | |

---

## F. Learning Hub (`/#learn`)

| # | Item | HP | PC | Catatan |
|---|------|:--:|:--:|---------|
| F1 | Title "Pusat Belajar" + subtitle | ☐ | ☐ | |
| F2 | Course cards: icon gradient + level badge + title + description + duration + modules count | ☐ | ☐ | |
| F3 | Grid: 3 kolom PC, 2 tablet, 1 HP | ☐ | ☐ | |
| F4 | Button "Mulai Belajar" → `/learn/[slug]` | ☐ | ☐ | |
| F5 | Jika ada progress: progress bar + "Lanjutkan" button | ☐ | ☐ | |
| F6 | Loading state: spinner + "Loading courses..." | ☐ | ☐ | |
| F7 | Empty state (jika no courses): icon + "No courses available yet" | ☐ | ☐ | |

---

## G. Media (`/#media`)

| # | Item | HP | PC | Catatan |
|---|------|:--:|:--:|---------|
| G1 | Title + subtitle + "Kunjungi YouTube" button (buka tab baru) | ☐ | ☐ | |
| G2 | Media cards grid: 4 kolom PC, 2 tablet, 1 HP | ☐ | ☐ | |
| G3 | Card: thumbnail + type badge (Video/Event/Publication/Press) + title + subtitle + description | ☐ | ☐ | |
| G4 | Link di card → buka tab baru (jika external) | ☐ | ☐ | |
| G5 | Loading state: 4 skeleton card animasi pulse | ☐ | ☐ | |
| G6 | Image error fallback: icon sesuai tipe (video/event/publication/press) | ☐ | ☐ | |

---

## H. Sign In (`/sign-in`)

| # | Item | HP | PC | Catatan |
|---|------|:--:|:--:|---------|
| H1 | Form render: logo + email + password + "Lupa password?" + "Daftar" + test accounts | ☐ | ☐ | |
| H2 | Back link "← Kembali" → ke `/` | ☐ | ☐ | |
| H3 | Show/hide password 👁 — toggle visible/invisible | ☐ | ☐ | |
| H4 | Login gagal → red error box | ☐ | ☐ | |
| H5 | "Lupa password?" → `/forgot-password` | ☐ | ☐ | |
| H6 | "Daftar sekarang" → `/join` | ☐ | ☐ | |
| H7 | Login sukses → redirect ke `/` (atau `?redirect=...`) | ☐ | ☐ | |

---

## I. Join / Register (`/join`)

| # | Item | HP | PC | Catatan |
|---|------|:--:|:--:|---------|
| I1 | Form render: email + password + username | ☐ | ☐ | |
| I2 | Back link "← Kembali" → `/` | ☐ | ☐ | |
| I3 | Show/hide password 👁 | ☐ | ☐ | |
| I4 | Error (email sudah terdaftar / password <6) → red box | ☐ | ☐ | |
| I5 | "Sudah punya akun? Masuk" → `/sign-in` | ☐ | ☐ | |
| I6 | Register sukses → redirect `/` | ☐ | ☐ | |

---

## J. Profile (`/profile`)

| # | Item | HP | PC | Catatan |
|---|------|:--:|:--:|---------|
| J1 | Belum login → redirect `/sign-in?redirect=/profile` | ☐ | ☐ | |
| J2 | Header: avatar inisial + username + email + region + role badge + Edit + Logout | ☐ | ☐ | |
| J3 | 3 stat cards: Total Points + Trust Score + Reports Submitted | ☐ | ☐ | |
| J4 | Klik Edit → form muncul: username + region + current password + new password | ☐ | ☐ | |
| J5 | Edit username/region → Save → tersimpan + banner hijau | ☐ | ☐ | |
| J6 | Ganti password (current + new) → Save → berhasil / error | ☐ | ☐ | |
| J7 | Klik Batal → form nutup, tidak ada perubahan | ☐ | ☐ | |
| J8 | Logout → kembali ke `/` + header guest mode | ☐ | ☐ | |
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
| K1 | Monitoring form: 11 field render | ☐ | ☐ | |
| K2 | Restoration form: 11 field render | ☐ | ☐ | |
| K3 | Trench form: 7 field render | ☐ | ☐ | |
| K4 | Tree Planting form: 8 field render | ☐ | ☐ | |
| K5 | Seedling form: 9 field render | ☐ | ☐ | |
| K6 | Back link "← Kembali ke Beranda" → `/` | ☐ | ☐ | |
| K7 | Title + deskripsi + chip poin ⭐ + chip snapped 🛡️ | ☐ | ☐ | |
| K8 | Field text — isi teks | ☐ | ☐ | |
| K9 | Field phone — validasi pattern 08xx / +62xx | ☐ | ☐ | |
| K10 | Field longtext — textarea 4 baris | ☐ | ☐ | |
| K11 | Field number — input angka min=0 | ☐ | ☐ | |
| K12 | Field date — date picker | ☐ | ☐ | |
| K13 | Field select — dropdown pilihan | ☐ | ☐ | |
| K14 | Field province — dropdown 38 provinsi | ☐ | ☐ | |
| K15 | Field multiselect — checkbox, bisa centang >1 | ☐ | ☐ | |
| K16 | Field photo — upload file / buka kamera (HP) | ☐ | ☐ | |
| K17 | Location GPS detect — klik "Deteksi Lokasi" → minta izin → isi otomatis | ☐ | ☐ | |
| K18 | Location manual input — isi Latitude + Longitude | ☐ | ☐ | |
| K19 | Location map mode — klik "Pilih dari Peta" → pilih titik | ☐ | ☐ | |
| K20 | Cancel "Batal" → `/#map` | ☐ | ☐ | |
| K21 | Submit → loading spinner di tombol | ☐ | ☐ | |
| K22 | Error → red box di atas form | ☐ | ☐ | |
| K23 | Success → centang hijau + "Laporan Terkirim" + "Kirim Lagi" | ☐ | ☐ | |
| K24 | "Kirim Laporan Lain" → form reset | ☐ | ☐ | |
| K25 | Invalid slug `/report/tidak-ada` → "Formulir tidak ditemukan" | ☐ | ☐ | |

---

## L. Projects (`/projects/new`)

| # | Item | HP | PC | Catatan |
|---|------|:--:|:--:|---------|
| L1 | Belum login → redirect `/sign-in?redirect=/projects/new` | ☐ | ☐ | |
| L2 | Points <20.000 → halaman "Kumpulkan N poin lagi" + progress bar | ☐ | ☐ | |
| L3 | Points >=20.000 → form multi-step: type → lokasi → budget → kontak → submit | ☐ | ☐ | |

---

## M. Course Detail (`/learn/[slug]`)

| # | Item | HP | PC | Catatan |
|---|------|:--:|:--:|---------|
| M1 | Course page: title + description + level + duration + icon | ☐ | ☐ | |
| M2 | Module list: title + status (terkunci/tersedia/selesai) + "Mulai" button | ☐ | ☐ | |
| M3 | Klik module → `/learn/[slug]/[moduleId]` → konten markdown | ☐ | ☐ | |
| M4 | "Tandai Selesai" → spinner → module berubah selesai + progress naik | ☐ | ☐ | |
| M5 | Dark mode OK di course page (tidak ada bg putih) | ☐ | ☐ | |

---

## N. Static Pages

| # | Halaman | HP | PC | Catatan |
|---|---------|:--:|:--:|---------|
| N1 | `/faq` — FAQ muncul + heading terbaca | ☐ | ☐ | |
| N2 | `/help` — Help Center muncul | ☐ | ☐ | |
| N3 | `/privacy` — Privacy Policy muncul | ☐ | ☐ | |
| N4 | `/terms` — Terms of Service muncul | ☐ | ☐ | |
| N5 | `/report-issue` — form bug report + submit | ☐ | ☐ | |
| N6 | `/forgot-password` — isi email + submit | ☐ | ☐ | |
| N7 | `/reset-password` — isi password baru + submit | ☐ | ☐ | |
| N8 | Dark mode OK di semua static pages | ☐ | ☐ | |

---

## O. 404 & Error Pages

| # | Item | HP | PC | Catatan |
|---|------|:--:|:--:|---------|
| O1 | `/xyz123` → 404 page kustom dengan link home | ☐ | ☐ | |
| O2 | Global error page (app/error.tsx) — "Terjadi kesalahan" + "Coba lagi" | ☐ | ☐ | |

---

## P. Admin Panel (`/admin`)

### P1 — Admin Layout

| # | Item | HP | PC | Catatan |
|---|------|:--:|:--:|---------|
| P1a | Sidebar desktop: 11 menu (Dashboard, Users, Reports, Forms, Donations, Points, Courses, Feedback, Review Queue, Projects, Content) | ☐ | ☐ | |
| P1b | Sidebar aktif: menu yang sedang dibuka highlight biru | ☐ | ☐ | |
| P1c | User info + logout di footer sidebar | ☐ | ☐ | |
| P1d | Header: hamburger (HP) + title halaman | ☐ | ☐ | |
| P1e | Header: "SpringHub / Local" dropdown (desktop) | ☐ | ☐ | |
| P1f | Mobile: klik hamburger → overlay sidebar muncul | ☐ | ☐ | |
| P1g | Mobile sidebar: user info + logout ada | ☐ | ☐ | |
| P1h | Mobile sidebar: Escape nutup | ☐ | ☐ | |
| P1i | Dark mode OK di sidebar + header | ☐ | ☐ | |

### P2 — Admin Dashboard

| # | Item | HP | PC | Catatan |
|---|------|:--:|:--:|---------|
| P2a | 4 stat cards: Users, Reports, Donations, Projects — dengan icon + angka | ☐ | ☐ | |
| P2b | Grid: 1 kolom HP, 2 tablet, 4 PC | ☐ | ☐ | |
| P2c | Export CSV buttons (4): Users, Reports, Donations, Projects — download | ☐ | ☐ | |
| P2d | Recent Registrations: 3 kolom — Username, Role, Joined | ☐ | ☐ | |
| P2e | Recent Registrations: scroll horizontal HP | ☐ | ☐ | |
| P2f | Recent Reports: 5 kolom — ID, Form, User, Status (chip warna), Date | ☐ | ☐ | |
| P2g | Recent Reports: scroll horizontal HP | ☐ | ☐ | |

### P3 — Admin Users

| # | Item | HP | PC | Catatan |
|---|------|:--:|:--:|---------|
| P3a | Title + count + Export CSV button | ☐ | ☐ | |
| P3b | Table 8 kolom: Username, Email, Phone, Role, Region, Points, Trust, Joined | ☐ | ☐ | |
| P3c | Scroll horizontal HP | ☐ | ☐ | |
| P3d | Klik chip role → dropdown ganti role | ☐ | ☐ | |
| P3e | Ganti role → tersimpan | ☐ | ☐ | |

### P4 — Admin Reports

| # | Item | HP | PC | Catatan |
|---|------|:--:|:--:|---------|
| P4a | Title + count + Export + Toggle Coordinates | ☐ | ☐ | |
| P4b | Date filter from/to + Reset | ☐ | ☐ | |
| P4c | Table 8 kolom: Form, User, Status, Precise Lat, Precise Lng, Snapped, Reviewed, Date | ☐ | ☐ | |
| P4d | Scroll horizontal HP | ☐ | ☐ | |
| P4e | Toggle coordinates → precise lat/lng show/hide | ☐ | ☐ | |

### P5 — Admin Review Queue

| # | Item | HP | PC | Catatan |
|---|------|:--:|:--:|---------|
| P5a | Title + pending count | ☐ | ☐ | |
| P5b | Card list: form type + user + date + field data preview | ☐ | ☐ | |
| P5c | Location: precise + snapped coordinates | ☐ | ☐ | |
| P5d | Note input per card (tidak shared) | ☐ | ☐ | |
| P5e | Approve button → spinner → card hilang | ☐ | ☐ | |
| P5f | Reject button → spinner → card hilang | ☐ | ☐ | |
| P5g | Action message notification (3 detik) | ☐ | ☐ | |
| P5h | Empty state "Semua laporan sudah direview" + icon ✅ | ☐ | ☐ | |

### P6 — Admin Donations

| # | Item | HP | PC | Catatan |
|---|------|:--:|:--:|---------|
| P6a | Title + total collected + Export CSV | ☐ | ☐ | |
| P6b | Table 8 kolom: Invoice, Donor, Email, Amount, Status, Tier, Project, Date | ☐ | ☐ | |
| P6c | Scroll horizontal HP | ☐ | ☐ | |

### P7 — Admin Projects

| # | Item | HP | PC | Catatan |
|---|------|:--:|:--:|---------|
| P7a | Title + count + Export + filter status + search | ☐ | ☐ | |
| P7b | Summary cards (total/approved/review/completed) | ☐ | ☐ | |
| P7c | Table 8 kolom: Title, Type, Status, Region, Goal, Raised, Contact, Date | ☐ | ☐ | |
| P7d | Scroll horizontal HP | ☐ | ☐ | |
| P7e | Klik project → detail modal | ☐ | ☐ | |
| P7f | Approve/Reject action dari modal | ☐ | ☐ | |

### P8 — Admin Points

| # | Item | HP | PC | Catatan |
|---|------|:--:|:--:|---------|
| P8a | Title "Point Rules" + count active | ☐ | ☐ | |
| P8b | Add Rule button → modal form muncul | ☐ | ☐ | |
| P8c | Table: No, Nama, Deskripsi, Kategori, Poin, Status, Aksi | ☐ | ☐ | |
| P8d | Edit → modal terisi data lama | ☐ | ☐ | |
| P8e | Toggle active/nonaktif | ☐ | ☐ | |
| P8f | Delete → konfirmasi + hapus | ☐ | ☐ | |

### P9 — Admin Courses

| # | Item | HP | PC | Catatan |
|---|------|:--:|:--:|---------|
| P9a | Title + count + New Course button | ☐ | ☐ | |
| P9b | Filter All/Active/Inactive | ☐ | ☐ | |
| P9c | Card grid: title + slug + modules count + active badge + Edit/Delete | ☐ | ☐ | |
| P9d | New Course → form: title, slug, level, duration, icon, modules | ☐ | ☐ | |
| P9e | Edit course → form terisi + tambah/hapus module | ☐ | ☐ | |
| P9f | Delete → konfirmasi | ☐ | ☐ | |

### P10 — Admin Forms

| # | Item | HP | PC | Catatan |
|---|------|:--:|:--:|---------|
| P10a | Title + count + Create New Form button | ☐ | ☐ | |
| P10b | Filter All/Active/Inactive | ☐ | ☐ | |
| P10c | Card grid: title + slug + fields count + active badge + Edit/Delete | ☐ | ☐ | |
| P10d | New Form → form: title, slug, points, type, fields builder | ☐ | ☐ | |
| P10e | Edit → Tab Metadata + Tab Field Builder | ☐ | ☐ | |
| P10f | Field Builder: add field (type, label, required, options) | ☐ | ☐ | |
| P10g | Field Builder: reorder up/down | ☐ | ☐ | |
| P10h | Field Builder: delete field | ☐ | ☐ | |

### P11 — Admin Feedback

| # | Item | HP | PC | Catatan |
|---|------|:--:|:--:|---------|
| P11a | Title + count | ☐ | ☐ | |
| P11b | Table 5 kolom: Type, Content, Status, Date, Actions (👁 / Mark Read / Resolve) | ☐ | ☐ | |
| P11c | Scroll horizontal HP | ☐ | ☐ | |
| P11d | Klik 👁 → detail modal | ☐ | ☐ | |
| P11e | Mark Read / Resolve → status berubah | ☐ | ☐ | |

### P12 — Admin Content

| # | Item | HP | PC | Catatan |
|---|------|:--:|:--:|---------|
| P12a | Title + Add Content button | ☐ | ☐ | |
| P12b | Tab: Media / Projects / Stats | ☐ | ☐ | |
| P12c | Card grid: thumbnail + title + type + sort order + Edit/Delete | ☐ | ☐ | |
| P12d | Add Content → modal: type, title, subtitle, description, image, link, sort order | ☐ | ☐ | |
| P12e | Edit → modal terisi data lama | ☐ | ☐ | |
| P12f | Delete → konfirmasi | ☐ | ☐ | |

### P13 — Admin Error Boundary

| # | Item | HP | PC | Catatan |
|---|------|:--:|:--:|---------|
| P13a | Error di admin → halaman "Terjadi kesalahan" + "Coba lagi" + "Dashboard" | ☐ | ☐ | |

---

## Q. Footer

| # | Item | HP | PC | Catatan |
|---|------|:--:|:--:|---------|
| Q1 | Footer muncul di semua halaman | ☐ | ☐ | |
| Q2 | 4 kolom: Platform, Support, About, Legal — 1 kolom HP, 4 kolom PC | ☐ | ☐ | |
| Q3 | Link Help → `/help`, FAQ → `/faq`, Privacy → `/privacy`, Terms → `/terms` | ☐ | ☐ | |
| Q4 | Sosial icon: Instagram, YouTube, TikTok, Facebook → buka tab baru | ☐ | ☐ | |
| Q5 | Newsletter form — isi email → submit | ☐ | ☐ | |
| Q6 | Contact: WhatsApp + Phone + Email + Address — semua dengan icon | ☐ | ☐ | |
| Q7 | Copyright bar + social icon kecil | ☐ | ☐ | |

---

## R. Cross-Cutting

| # | Item | HP | PC | Catatan |
|---|------|:--:|:--:|---------|
| R1 | Dark mode 🌙 → semua halaman gelap konsisten | ☐ | ☐ | |
| R2 | Language toggle EN ↔ ID → semua teks berubah | ☐ | ☐ | |
| R3 | Floating points button ⭐ (kanan bawah) → modal cara dapat poin | ☐ | ☐ | |
| R4 | Notification bell 🔔 (jika login) — ada | ☐ | ☐ | |

---

## S. Mobile Specific

| # | Item | HP | Catatan |
|---|------|:--:|---------|
| S1 | Viewport pas — tidak zoom-out di HP | ☐ | |
| S2 | Klik input form → iOS tidak auto-zoom | ☐ | |
| S3 | Tap response cepat (tidak delay 300ms) | ☐ | |
| S4 | Tidak ada horizontal page overflow (kecuali tabel admin) | ☐ | |
| S5 | Touch target cukup besar — button bisa ditap jempol | ☐ | |

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
