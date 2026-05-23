# 📋 MANUAL TEST FORM — SpringHub

Gunakan form ini untuk test semua fitur. Centang (✅) setelah berhasil, (❌) jika gagal, (⚠️) jika ada issue.

---

## A. LANDING PAGE — `/`

| # | Test | HP | Desktop | Catatan |
|---|------|----|---------|---------|
| A1 | Header muncul dengan logo + nav + language toggle | ☐ | ☐ | |
| A2 | Hamburger menu muncul di HP, tombol ═ ↔ ✕ | ☐ | ☐ | |
| A3 | Navigasi mobile: tap Map/Dashboard/Learn/Media/Donate | ☐ | ☐ | scroll ke section? |
| A4 | Hero section: title, subtitle, 2 CTA buttons | ☐ | ☐ | |
| A5 | YouTube video loading (iframe) | ☐ | ☐ | |
| A6 | Impact Dashboard: 4 stat cards (Monitored, Restored, Trees, Trenches) | ☐ | ☐ | |
| A7 | Monthly progress bar charts | ☐ | ☐ | |
| A8 | Top Regions list | ☐ | ☐ | |
| A9 | Top Volunteers leaderboard | ☐ | ☐ | |

---

## B. MAP SECTION — `/#map`

| # | Test | HP | Desktop | Catatan |
|---|------|----|---------|---------|
| B1 | Leaflet map muncul (tidak loading terus) | ☐ | ☐ | |
| B2 | Filter checkbox muncul (Monitoring/Tree/Restoration/Seedling) | ☐ | ☐ | |
| B3 | Filter checkbox bekerja (muncul/sembunyi marker) | ☐ | ☐ | |
| B4 | Marker dengan warna berbeda (hijau/merah/kuning) | ☐ | ☐ | |
| B5 | Protection circle 5km di setiap marker | ☐ | ☐ | |
| B6 | Scroll zoom map berfungsi | ☐ | ☐ | |
| B7 | Report list di bawah map (pagination) | ☐ | ☐ | |
| B8 | "Report Your Contribution" form links | ☐ | ☐ | |
| B9 | Tombol "Earn Points" buka modal | ☐ | ☐ | |

---

## C. VOLUNTEER — `/#community`

| # | Test | HP | Desktop | Catatan |
|---|------|----|---------|---------|
| C1 | Activities feed dengan pagination | ☐ | ☐ | |
| C2 | Points gate card (progress bar) | ☐ | ☐ | |
| C3 | Tombol "Cara Dapat Poin" buka modal | ☐ | ☐ | |
| C4 | Link "Ajukan Project" (jika eligible) | ☐ | ☐ | |

---

## D. DONASI — `/#donate`

| # | Test | HP | Desktop | Catatan |
|---|------|----|---------|---------|
| D1 | Donation tier selector muncul | ☐ | ☐ | |
| D2 | Pilih tier → summary muncul | ☐ | ☐ | |
| D3 | Custom amount input | ☐ | ☐ | |
| D4 | Name + email fields | ☐ | ☐ | |
| D5 | Submit → loading spinner | ☐ | ☐ | butuh XENDIT_SECRET_KEY |
| D6 | Error message jika gagal | ☐ | ☐ | |
| D7 | Partner section (Become Partner card) | ☐ | ☐ | |
| D8 | Featured Projects card | ☐ | ☐ | |

---

## E. LEARNING HUB — `/#learn`

| # | Test | HP | Desktop | Catatan |
|---|------|----|---------|---------|
| E1 | Course cards muncul (min 1) | ☐ | ☐ | |
| E2 | Card punya level badge, duration, modules count | ☐ | ☐ | |
| E3 | "Start Course" link → `/learn/[slug]` | ☐ | ☐ | |
| E4 | Loading state (spinner) | ☐ | ☐ | |

---

## F. MEDIA — `/#media`

| # | Test | HP | Desktop | Catatan |
|---|------|----|---------|---------|
| F1 | Media cards muncul (grid 4 kolom) | ☐ | ☐ | |
| F2 | Card berisi thumbnail + type badge + title | ☐ | ☐ | |
| F3 | YouTube link di header berfungsi | ☐ | ☐ | |
| F4 | Loading skeleton muncul | ☐ | ☐ | |

---

## G. AUTH — `/sign-in` & `/join`

| # | Test | HP | Desktop | Catatan |
|---|------|----|---------|---------|
| G1 | `/sign-in` → form login muncul | ☐ | ☐ | |
| G2 | Back link ke home berfungsi | ☐ | ☐ | |
| G3 | Email + password input | ☐ | ☐ | |
| G4 | Show/hide password toggle | ☐ | ☐ | |
| G5 | Error message jika wrong credentials | ☐ | ☐ | |
| G6 | Link "Lupa password?" | ☐ | ☐ | |
| G7 | Link "Daftar sekarang" → `/join` | ☐ | ☐ | |
| G8 | `/join` → form register muncul | ☐ | ☐ | |
| G9 | Register dengan email baru | ☐ | ☐ | |
| G10 | Redirect ke `/` setelah login/register | ☐ | ☐ | |
| G11 | Header berubah (muncul username) setelah login | ☐ | ☐ | |

---

## H. PROFILE — `/profile`

| # | Test | HP | Desktop | Catatan |
|---|------|----|---------|---------|
| H1 | Redirect ke sign-in jika tidak login | ☐ | ☐ | |
| H2 | Profile header: avatar, username, email, region, role | ☐ | ☐ | |
| H3 | Stat cards: Points, Trust Score, Reports | ☐ | ☐ | |
| H4 | Edit profile button → form muncul | ☐ | ☐ | |
| H5 | Edit username/region + save | ☐ | ☐ | |
| H6 | Ganti password + save | ☐ | ☐ | |
| H7 | Logout button berfungsi | ☐ | ☐ | |
| H8 | Reports list | ☐ | ☐ | |
| H9 | Points history | ☐ | ☐ | |
| H10 | Recent activity feed | ☐ | ☐ | |
| H11 | Claim guest reports banner (jika ada) | ☐ | ☐ | |

---

## I. REPORT FORM — `/report/[slug]`

| # | Test | HP | Desktop | Catatan |
|---|------|----|---------|---------|
| I1 | Buka `/report/spring-monitoring` → form muncul | ☐ | ☐ | |
| I2 | Semua field render sesuai tipe (text, date, select, photo, location) | ☐ | ☐ | |
| I3 | Location picker (manual atau map) | ☐ | ☐ | |
| I4 | Location detect GPS button | ☐ | ☐ | butuh HTTPS |
| I5 | Validasi field required (error message) | ☐ | ☐ | |
| I6 | Submit → loading spinner | ☐ | ☐ | |
| I7 | Success → "Laporan terkirim" page | ☐ | ☐ | |
| I8 | "Submit Another" button berfungsi | ☐ | ☐ | |
| I9 | Honeypot field (hidden) | ☐ | ☐ | invisible |
| I10 | Form not found → 404 page untuk slug invalid | ☐ | ☐ | |

---

## J. ADMIN PANEL — `/admin`

### J1. Dashboard
| # | Test | HP | Desktop | Catatan |
|---|------|----|---------|---------|
| J1a | Admin sidebar muncul di desktop | ☐ | ☐ | |
| J1b | Hamburger menu di HP → sidebar muncul | ☐ | ☐ | |
| J1c | User info + logout di sidebar (desktop & mobile) | ☐ | ☐ | |
| J1d | 4 stat cards (Users, Reports, Donations, Projects) | ☐ | ☐ | |
| J1e | Export CSV buttons (4) | ☐ | ☐ | |
| J1f | Recent Registrations table | ☐ | ☐ | |
| J1g | Recent Reports table | ☐ | ☐ | |
| J1h | Scroll horizontal di tabel (HP) | ☐ | ☐ | |

### J2. Users
| # | Test | HP | Desktop | Catatan |
|---|------|----|---------|---------|
| J2a | Users table muncul | ☐ | ☐ | |
| J2b | 8 kolom: Username, Email, Phone, Role, Region, Points, Trust, Joined | ☐ | ☐ | |
| J2c | Scroll horizontal di HP | ☐ | ☐ | |
| J2d | Klik role chip → dropdown edit | ☐ | ☐ | |
| J2e | Ganti role → tersimpan | ☐ | ☐ | |
| J2f | Export CSV button | ☐ | ☐ | |

### J3. Reports
| # | Test | HP | Desktop | Catatan |
|---|------|----|---------|---------|
| J3a | Reports table muncul (8 kolom) | ☐ | ☐ | |
| J3b | Scroll horizontal di HP | ☐ | ☐ | |
| J3c | Date filter (from/to) | ☐ | ☐ | |
| J3d | Reset filter button | ☐ | ☐ | |
| J3e | Toggle precise coordinates (show/hide) | ☐ | ☐ | |
| J3f | Export CSV button | ☐ | ☐ | |

### J4. Review Queue
| # | Test | HP | Desktop | Catatan |
|---|------|----|---------|---------|
| J4a | Pending reports list (card style) | ☐ | ☐ | |
| J4b | Field data preview | ☐ | ☐ | |
| J4c | Precise + Snapped location | ☐ | ☐ | |
| J4d | Note input per card (tidak shared) | ☐ | ☐ | |
| J4e | Approve button + spinner | ☐ | ☐ | |
| J4f | Reject button + spinner | ☐ | ☐ | |
| J4g | Action message setelah approve/reject | ☐ | ☐ | |
| J4h | Empty state "All reviewed" | ☐ | ☐ | |

### J5. Donations / Projects / Points / Courses / Forms / Feedback / Content
| # | Test | HP | Desktop | Catatan |
|---|------|----|---------|---------|
| J5a | Halaman list muncul dengan data | ☐ | ☐ | |
| J5b | Scroll horizontal di tabel (HP) | ☐ | ☐ | |
| J5c | Create/Edit/Delete actions | ☐ | ☐ | |
| J5d | Dark mode OK | ☐ | ☐ | |
| J5e | Export (jika ada) | ☐ | ☐ | |

---

## K. LEARNING — `/learn/[slug]`

| # | Test | HP | Desktop | Catatan |
|---|------|----|---------|---------|
| K1 | Course detail page muncul | ☐ | ☐ | |
| K2 | Modules list (terkunci/tersedia) | ☐ | ☐ | |
| K3 | Klik module → `/learn/[slug]/[moduleId]` | ☐ | ☐ | |
| K4 | Module content (markdown) | ☐ | ☐ | |
| K5 | "Mark Complete" button | ☐ | ☐ | |
| K6 | Progress bar ter-update | ☐ | ☐ | |
| K7 | Dark mode OK | ☐ | ☐ | |

---

## L. STATIC PAGES

| # | Test | HP | Desktop | Catatan |
|---|------|----|---------|---------|
| L1 | `/faq` — FAQ page | ☐ | ☐ | |
| L2 | `/help` — Help Center | ☐ | ☐ | |
| L3 | `/privacy` — Privacy Policy | ☐ | ☐ | |
| L4 | `/terms` — Terms of Service | ☐ | ☐ | |
| L5 | `/report-issue` — Bug report form | ☐ | ☐ | |
| L6 | `/forgot-password` — Lupa password | ☐ | ☐ | |
| L7 | `/reset-password` — Reset password | ☐ | ☐ | |
| L8 | Dark mode OK di semua static pages | ☐ | ☐ | |

---

## M. FOOTER

| # | Test | HP | Desktop | Catatan |
|---|------|----|---------|---------|
| M1 | Footer muncul di semua halaman | ☐ | ☐ | |
| M2 | 4 link columns (Platform, Support, About, Legal) | ☐ | ☐ | |
| M3 | Social icons (Instagram, YouTube, TikTok, Facebook) | ☐ | ☐ | |
| M4 | Newsletter form → submit | ☐ | ☐ | |
| M5 | Contact info (WhatsApp, Phone, Email, Address) | ☐ | ☐ | |
| M6 | Link Help/Faq/Privacy/Terms | ☐ | ☐ | |

---

## N. CROSS-CUTTING

| # | Test | HP | Desktop | Catatan |
|---|------|----|---------|---------|
| N1 | Dark mode toggle → semua halaman gelap | ☐ | ☐ | |
| N2 | Language toggle EN ↔ ID | ☐ | ☐ | |
| N3 | 404 page untuk route tidak dikenal | ☐ | ☐ | coba `/xyz` |
| N4 | Error page (app/error.tsx) | ☐ | ☐ | |
| N5 | Loading page (app/loading.tsx) | ☐ | ☐ | |
| N6 | Floating points button (Sparkles) → buka modal | ☐ | ☐ | |
| N7 | Notification bell (jika login) | ☐ | ☐ | |
| N8 | Logo → link ke home | ☐ | ☐ | |
| N9 | Semua link eksternal terbuka di tab baru | ☐ | ☐ | |

---

## O. MOBILE-SPECIFIC

| # | Test | HP | Catatan |
|---|------|----|---------|
| O1 | Header: hamburger menu muncul | ☐ | |
| O2 | Header: nav link berfungsi via hamburger | ☐ | |
| O3 | Header: admin link muncul di hamburger (jika admin) | ☐ | |
| O4 | Header: sign-in link di hamburger (jika guest) | ☐ | |
| O5 | Admin sidebar: overlay + user info + logout | ☐ | |
| O6 | Admin sidebar: Escape nutup | ☐ | |
| O7 | Semua tabel admin bisa scroll horizontal | ☐ | |
| O8 | iOS zoom tidak terjadi saat isi form (font-size 16px) | ☐ | |
| O9 | Tap response cepat (touch-action) | ☐ | |
| O10 | No horizontal page overflow (tidak bisa scroll ke kanan) | ☐ | |

---

## 📊 LEGENDA

| Simbol | Arti |
|--------|------|
| ✅ | Berfungsi dengan baik |
| ⚠️ | Ada issue minor / functional tapi tidak ideal |
| ❌ | Rusak / 404 / tidak muncul |
| ☐ | Belum di-test |

---

*Generated: 2026-05-23 21:06 WIB*
*Audit by opencode*
