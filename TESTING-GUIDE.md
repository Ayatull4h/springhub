# SpringHub — Manual Testing Guide
**Versi:** Build 2 Juni 2026  
**Stack:** Next.js 14.2.5 + TypeScript + Prisma + Supabase (Postgres)  
**Testing environment:** Browser (Chrome/Firefox/Edge), Vercel preview atau localhost:3000

---

## Daftar Isi

1. [Setup Testing](#1-setup-testing)
2. [Test Case: Landing Page](#2-landing-page)
3. [Test Case: Auth Flow](#3-auth-flow)
4. [Test Case: Form Report](#4-form-report)
5. [Test Case: Dashboard & Statistik](#5-dashboard--statistik)
6. [Test Case: Peta Interaktif](#6-peta-interaktif)
7. [Test Case: Donasi](#7-donasi)
8. [Test Case: Admin Panel](#8-admin-panel)
9. [Test Case: Points Engine](#9-points-engine)
10. [Test Case: Offline Survey Mode (NEW)](#10-offline-survey-mode)
11. [Test Case: Dark Mode](#11-dark-mode)
12. [Test Case: PWA & Service Worker](#12-pwa--service-worker)
13. [Test Case: Anti-Spam](#13-anti-spam)
14. [Rute API Lengkap](#14-rute-api)
15. [Akun Test](#15-akun-test)
16. [Visual Design Checklist](#16-visual-design-checklist)
17. [Known Issues & Limitations](#17-known-issues--limitations)

---

## 1. Setup Testing

### 1.1 Prasyarat
- Node.js >= 18
- Browser modern (Chrome 120+, Firefox 115+, Edge 120+)
- Koneksi internet (untuk setup awal offline mode)
- GPS device (untuk testing offline survey)

### 1.2 Menjalankan Dev Server
```bash
cd "C:\jaga semesta"
npm run dev
```
Buka `http://localhost:3000`

### 1.3 Build Production
```bash
npm run build
npm start
```

### 1.4 Akun Test
| Role | Email | Password | Points |
|---|---|---|---|
| Admin | admin@springhub.id | demo12345 | - |
| Volunteer | volunteer@springhub.id | vol12345 | 24.168 |
| Volunteer (eligible) | ucup@springhub.id | ucup123 | 25.000 |

---

## 2. Landing Page

### 2.1 Hero Section
| Item | Expected | Check |
|---|---|---|
| Logo SpringHub muncul | ✅ / | ☐ |
| Judul "Community-Driven Spring Restoration" | ✅ EN / "Restorasi Mata Air Berbasis Komunitas" ID | ☐ |
| Tombol "Start Monitoring" / "Mulai Memantau" | ✅ Scroll ke #map | ☐ |
| Tombol "Kembali ke Jaga Semesta" | ✅ Link ke jagasemesta.id | ☐ |
| Background image/pattern | ✅ | ☐ |
| Responsive (mobile/tablet/desktop) | ✅ Breakpoint md, lg | ☐ |

### 2.2 Navbar (site-header.tsx)
| Item | Expected | Check |
|---|---|---|
| Logo → home | ✅ / | ☐ |
| Link: Map, Dashboard, Community, Learn, Media, Donate | ✅ /#map, /#dashboard, dll | ☐ |
| Tombol bahasa EN/ID toggle | ✅ Cookie locale expire 1 thn | ☐ |
| Dark mode toggle (Sun/Moon) | ✅ class "dark" di html | ☐ |
| User menu (Bell, Admin link, Profile, Logout) | ✅ fetch /api/auth/me | ☐ |
| Guest menu (Sign In, Join) | ✅ /sign-in, /join | ☐ |
| Mobile hamburger menu | ✅ md:hidden | ☐ |

### 2.3 Icon & Asset Check
| Icon | Komponen | Source |
|---|---|---|
| Logo | `components/logo.tsx` | SVG inline |
| Droplets, Sprout, Sparkles, Layers | `impact-dashboard.tsx` | lucide-react |
| TrendingUp, CheckCircle2, AlertCircle | Various | lucide-react |
| WifiOff, Navigation, MapPin, Flag | Offline components | lucide-react |
| Favicon | `/favicon.png` | Public |
| Apple touch icon | `/favicon.png` | app/layout.tsx |
| OG Image | `/api/og` atau opengraph-image.tsx | - |
| Leaflet markers | leaflet/dist/images/ | Default Leaflet |

### 2.4 Footer (site-footer.tsx)
| Item | Expected | Check |
|---|---|---|
| Newsletter form | ✅ POST /api/newsletter | ☐ |
| Subscribe button | ✅ | ☐ |
| Platform links (Map, Dashboard, dll) | ✅ | ☐ |
| Support links (Help Center, FAQ, Contact) | ✅ | ☐ |
| Legal links (Privacy, Terms, Cookie) | ✅ | ☐ |
| Social/Contact (Phone, Email, Address) | ✅ | ☐ |
| Copyright 2026 | ✅ | ☐ |

### 2.5 Mobile Hamburger Menu
| Item | Expected | Check |
|---|---|---|
| Hamburger icon visible on mobile (`md:hidden`) | ✅ `<Menu className="h-5 w-5" />` | ☐ |
| Click toggles `mobileMenuOpen` state | ✅ useState boolean | ☐ |
| Open state shows `<X>` icon | ✅ | ☐ |
| All 6 nav links rendered (Map, Dashboard, Community, Learn, Media, Donate) | ✅ | ☐ |
| Admin link shown if user.role === "admin" | ✅ `LayoutDashboard` icon + `t("nav.admin")` | ☐ |
| User menu (Profile + username) shown if logged in | ✅ | ☐ |
| Guest link "Sign In" shown if not logged in | ✅ | ☐ |
| Click nav link → closes menu (`setMobileMenuOpen(false)`) | ✅ | ☐ |
| Dark mode: bg-slate-900, hover:bg-slate-800 | ✅ | ☐ |
| Notification bell with unread count badge | ✅ | ☐ |

### 2.6 Inter Font Rendering
| Item | Expected | Check |
|---|---|---|
| `app/layout.tsx:12` — Inter({ subsets: ["latin"], variable: "--font-inter" }) | ✅ | ☐ |
| CSS variable `--font-inter` applied to `<body>` | ✅ | ☐ |
| All text elements use Inter via Tailwind `font-sans` | ✅ | ☐ |
| Renders correctly in both EN and ID locales | ✅ Latin subset covers both | ☐ |
| No FOUT/FOIT on slow connections | ✅ Google Fonts self-hosted via next/font | ☐ |

### 2.7 Back to Top Button
| Item | Expected | Check |
|---|---|---|
| Back to top button exists? | ❌ Tidak ada implementasi | ☐ |
| Scroll-to-top behavior | ❌ Belum diimplementasikan | ☐ |

### 2.8 Language Switching (EN/ID)
| Item | Expected | Check |
|---|---|---|
| Toggle button in header | ✅ `onClick={() => setLocale(locale === "en" ? "id" : "en")}` | ☐ |
| Show "ID" when EN active, "EN" when ID active | ✅ | ☐ |
| Nav links change (Map ↔ Peta, Dashboard, Community, Learn, Media, Donate) | ✅ useI18n() + t("nav.*") | ☐ |
| Hero title changes | ✅ "Community-Driven..." / "Restorasi..." | ☐ |
| Dashboard labels change | ✅ t("dashboard.*") | ☐ |
| Map filter labels change | ✅ t("map.*") | ☐ |
| Volunteer section changes | ✅ | ☐ |
| Donate section changes | ✅ | ☐ |
| Footer links change | ✅ | ☐ |
| Persists in cookie for 1 year | ✅ Cookie `locale` expire 365 hari | ☐ |
| Survives page refresh | ✅ Cookie read on init | ☐ |
| Toggle both directions (EN → ID → EN) | ✅ All text swaps correctly | ☐ |

---

## 3. Auth Flow

### 3.1 Sign In (/sign-in)
| Item | Expected | Check |
|---|---|---|
| Form: email + password | ✅ | ☐ |
| Show/hide password toggle | ✅ | ☐ |
| Error banner bg-red-50 → dark:bg-red-900/30 | ✅ Dark mode fix | ☐ |
| Test accounts info box | ✅ | ☐ |
| Link "Join Now" | ✅ → /join | ☐ |
| Dark mode: input bg-slate-800 text-white | ✅ | ☐ |
| Submit → POST /api/auth/login | ✅ | ☐ |
| Redirect to / setelah login | ✅ | ☐ |

### 3.2 Join (/join)
| Item | Expected | Check |
|---|---|---|
| Form: username + email + password | ✅ | ☐ |
| Error banner | ✅ | ☐ |
| Link "Sign In" | ✅ | ☐ |
| Password min 6 karakter | ✅ | ☐ |
| Submit → POST /api/auth/register | ✅ | ☐ |
| Dark mode: input bg-slate-800 | ✅ | ☐ |

### 3.3 Forgot/Reset Password
| Item | Expected | Check |
|---|---|---|
| /forgot-password: email input | ✅ | ☐ |
| Success banner bg-emerald-50 | ✅ | ☐ |
| Dev URL banner (development only) | ✅ | ☐ |
| /reset-password: password + confirm | ✅ | ☐ |
| Error banner | ✅ | ☐ |

---

## 4. Form Report

### 4.1 Halaman Form (/report/[slug])
Base path: `/report/spring-monitoring`, `/report/spring-restoration`, dll

| Form | Slug | Points |
|---|---|---|
| Spring Monitoring | spring-monitoring | +25 |
| Spring Restoration | spring-restoration | +100 |
| Trench Development | trench-development | +50 |
| Tree Planting | tree-planting | +50 |
| Seedling Stock | seedling-stock | +15 |

### 4.2 Field Types
| Tipe | Render | Status |
|---|---|---|
| text | `<input type="text">` | ✅ |
| phone | `<input type="tel">` + regex pattern | ✅ |
| longtext | `<textarea>` | ✅ |
| number | `<input type="number">` | ✅ |
| date | `<input type="date">` | ✅ |
| select | `<select>` | ✅ |
| province | `<select>` with 38 provinsi | ✅ |
| multiselect | Checkbox group | ✅ |
| photo | `<input type="file" capture="environment">` | ✅ |
| location | `<LocationPicker>` (geolocation + map picker) | ✅ |

### 4.3 Location Picker
| Item | Expected | Check |
|---|---|---|
| Tombol "Detect Location" | ✅ navigator.geolocation | ☐ |
| Manual input lat/lng | ✅ | ☐ |
| Toggle ke map picker | ✅ Dynamic import picker-map | ☐ |
| Map picker click to select | ✅ react-leaflet | ☐ |
| Info: "di-snap ke grid 5 km" | ✅ | ☐ |
| Dark mode: input bg-slate-800 | ✅ | ☐ |

### 4.4 Anti-Spam Protection
| Layer | Implementasi | Check |
|---|---|---|
| CSRF token | fetch /api/csrf → header x-csrf-token | ☐ |
| Honeypot | Hidden field `_website` | ☐ |
| Time gate | `< 3 detik = rejected` | ☐ |
| Rate limit | 10 req/menit/IP via Redis | ☐ |
| Daily limit | 5 form/hari/user | ☐ |

### 4.5 Submit Flow
| Langkah | Expected | Check |
|---|---|---|
| Validasi Zod client-side | ✅ parsing formSchemaMap | ☐ |
| POST /api/reports | ✅ Create report + status pending | ☐ |
| Upload foto | ✅ POST /api/reports/[id]/photos | ☐ |
| Success state | ✅ CheckCircle2 + "Laporan Terkirim!" | ☐ |
| Error state | ✅ AlertCircle + error message | ☐ |
| Loading state | ✅ Loader2 animate-spin | ☐ |

### 4.6 Field Type Rendering
| Tipe | Render | Expected | Check |
|---|---|---|---|
| text | `<input type="text">` | ✅ Keyboard input, placeholder shown | ☐ |
| phone | `<input type="tel">` + regex pattern | ✅ Numeric keyboard mobile, 08xx / +62 validation | ☐ |
| longtext | `<textarea>` | ✅ Multi-line input, 3 rows default | ☐ |
| number | `<input type="number">` | ✅ Numeric keyboard, stepper arrows | ☐ |
| date | `<input type="date">` | ✅ Date picker native browser | ☐ |
| select | `<select>` | ✅ Dropdown with options | ☐ |
| province | `<select>` with 38 provinsi | ✅ All 38 provinces of Indonesia listed | ☐ |
| multiselect | Checkbox group | ✅ Multiple selectable, chips shown | ☐ |
| photo | `<input type="file" capture="environment">` | ✅ Camera opens on mobile, file picker on desktop | ☐ |
| location | `<LocationPicker>` | ✅ Geolocation + map picker toggle | ☐ |

### 4.7 Required Field Validation
| Item | Expected | Check |
|---|---|---|
| Red asterisk `*` next to required field labels | ✅ `<span className="ml-1 text-red-500">*</span>` | ☐ |
| Browser native required validation on submit | ✅ `required` attribute on inputs | ☐ |
| Custom Zod validation error messages | ✅ `lib/forms.ts` + formSchemaMap | ☐ |

### 4.8 Location Picker Detail
| Item | Expected | Check |
|---|---|---|
| "Detect Location" button uses `navigator.geolocation.getCurrentPosition` | ✅ | ☐ |
| Browser permission prompt (Allow/Block) | ✅ | ☐ |
| Manual lat/lng input fields | ✅ Two `<input type="number">` fields | ☐ |
| Toggle to map picker (Dynamic import, no SSR) | ✅ `dynamic(() => import("./picker-map"))` | ☐ |
| Map picker: click on Leaflet map sets pin | ✅ `react-leaflet` MapEvents | ☐ |
| Snapped info bar: "Lokasi akan di-snap ke grid 5 km" | ✅ | ☐ |
| Dark mode for all input fields | ✅ `bg-slate-800` | ☐ |

### 4.9 Responsive Form
| Viewport | Expected | Check |
|---|---|---|
| Mobile 320px | ✅ Single column, inputs full width | ☐ |
| Tablet 768px | ✅ Wider inputs, 2-col for select + number | ☐ |
| Desktop 1280px | ✅ Max-width container, spacious layout | ☐ |

---

### 5.1 Impact Dashboard (/#dashboard)
| Item | Expected | Check |
|---|---|---|
| 4 stat cards (Monitored, Restored, Trees, Trenches) | ✅ | ☐ |
| Icon setiap card | ✅ lucide-react icons | ☐ |
| Delta badge (persentase) | ✅ | ☐ |
| Monthly Progress (3 bars) | ✅ | ☐ |
| Top Regions (3 regions) | ✅ | ☐ |
| Top Volunteers (3 volunteers) | ✅ | ☐ |
| Skeleton/loading state | ✅ | ☐ |

### 5.2 Offline Entry Button (NEW)
| Item | Expected | Check |
|---|---|---|
| Tombol "Aktifkan Mode Offline" di kanan bawah dashboard | ✅ | ☐ |
| Cek login status (icon hijau/merah) | ✅ CheckCircle2 / AlertTriangle | ☐ |
| Cek PWA installed status | ✅ Download / CheckCircle2 | ☐ |
| Belum login → redirect /sign-in?redirect=/offline | ✅ | ☐ |
| Belum install → trigger beforeinstallprompt | ✅ | ☐ |
| OK semua → redirect /offline | ✅ | ☐ |

### 5.3 Network Watcher (NEW — global)
| Item | Expected | Check |
|---|---|---|
| Heartbeat ke /api/health setiap 30 detik | ✅ | ☐ |
| 2x heartbeat gagal → banner "Sinyal hilang!" | ✅ | ☐ |
| Banner: Mode Survei Lengkap / Simpan Saja / Nanti | ✅ | ☐ |
| Klik "Mode Survei Lengkap" → /offline?mode=full | ✅ | ☐ |
| Klik "Simpan Saja" → /offline?mode=save-only | ✅ | ☐ |
| Online balik → auto-sync pending queue | ✅ | ☐ |
| Banner auto-sync progress | ✅ Loader2 animasi | ☐ |

### 5.4 Impact Stat Cards
| Item | Expected | Check |
|---|---|---|
| Card container: `className="card"` | ✅ rounded-lg + shadow + border + padding | ☐ |
| Icon container: `h-9 w-9 rounded-lg bg-brand-50` | ✅ | ☐ |
| Icon: lucide-react icon (Droplets, Sprout, Sparkles, Layers) | ✅ `h-5 w-5` | ☐ |
| Delta badge: `chip bg-brand-50 text-brand-700` | ✅ `TrendingUp` icon + percentage string | ☐ |
| Value: `text-3xl font-bold tracking-tight` | ✅ `formatNumber(s.value)` | ☐ |
| Label: `text-sm text-ink-muted` | ✅ Translated via `t(IconToStatKey[s.icon])` | ☐ |

### 5.5 Monthly Progress Bars
| Item | Expected | Check |
|---|---|---|
| 3 progress items (Springs, Trees, Volunteers) | ✅ | ☐ |
| Label + value on same line, flex justify-between | ✅ | ☐ |
| Progress bar: `h-1.5 rounded-full bg-slate-100` | ✅ | ☐ |
| Fill bar: `h-full rounded-full bg-brand-500` | ✅ width = `Math.min(100, pct)`% | ☐ |
| Percentage updates dynamically | ✅ | ☐ |

### 5.6 Top Regions List
| Item | Expected | Check |
|---|---|---|
| Numbered list (rank 1-3) | ✅ `<ol>` with `<li>` | ☐ |
| Rank circle: `h-6 w-6 rounded-full bg-brand-50` | ✅ Number centered | ☐ |
| Region name: `text-sm font-semibold text-ink` | ✅ | ☐ |
| Region detail: `text-xs text-ink-muted` | ✅ | ☐ |
| Container: `rounded-lg border border-ink-line/60 px-3 py-2.5` | ✅ | ☐ |

### 5.7 Top Volunteers
| Item | Expected | Check |
|---|---|---|
| Rank number in circle | ✅ Same pattern as regions | ☐ |
| Volunteer name + region display | ✅ name + region in two lines | ☐ |
| Points display: `text-sm font-bold text-brand-700` | ✅ `formatNumber(v.points)` + "pts" | ☐ |
| Dark mode border: `dark:border-slate-700` | ✅ | ☐ |

### 5.8 OfflineEntryButton Status Indicators
| Item | Expected | Check |
|---|---|---|
| 3 status lines below button | ✅ Login check + PWA check + ready | ☐ |
| Login: hijau `CheckCircle2 + "Login sebagai ..."` | ✅ `/api/auth/me` returns user | ☐ |
| Login: merah `AlertTriangle + "Belum login"` | ✅ No user → redirect `/sign-in?redirect=/offline` | ☐ |
| PWA: hijau `CheckCircle2 + "Aplikasi terinstall"` | ✅ `display-mode: standalone` matched | ☐ |
| PWA: amber `Download + "Install aplikasi dulu"` | ✅ Triggers `beforeinstallprompt` | ☐ |
| Click blocked → follows status flow | ✅ Not logged in → sign-in; not installed → prompt; OK → /offline | ☐ |
| Loading state: null (not rendered) | ✅ `if (loading) return null` | ☐ |

### 5.9 Dashboard Dark Mode
| Item | Expected | Check |
|---|---|---|
| Card icon container: `dark:bg-brand-900/30 dark:text-brand-300` | ✅ | ☐ |
| Delta badge: `dark:bg-brand-900/30 dark:text-brand-300` | ✅ | ☐ |
| Progress bar bg: `dark:bg-slate-700` | ✅ | ☐ |
| Rank circle: `dark:bg-brand-900/30 dark:text-brand-300` | ✅ | ☐ |
| Region/volunteer border: `dark:border-slate-700` | ✅ | ☐ |
| OfflineEntryButton: `dark:border-brand-800 dark:bg-brand-900/20` | ✅ | ☐ |
| Status text: `dark:text-emerald-400` / `dark:text-amber-400` | ✅ | ☐ |

---

## 6. Peta Interaktif

### 6.1 Leaflet Map (/#map)
| Item | Expected | Check |
|---|---|---|
| MapContainer center [-7.5, 110] | ✅ | ☐ |
| TileLayer: OSM tiles | ✅ | ☐ |
| CircleMarker untuk setiap spring | ✅ | ☐ |
| Warna: healthy=#10b981, degraded=#ef4444, restoration=#f59e0b | ✅ | ☐ |
| Protection grid info banner | ✅ | ☐ |
| Filter: All / Healthy / Degraded / Restoration | ✅ | ☐ |
| FitBounds auto ke data | ✅ | ☐ |
| scrollWheelZoom = true | ✅ (fix dari temuan audit) | ☐ |
| Dynamic import (SSR=false) | ✅ | ☐ |

### 6.2 CircleMarker Colors per Status
| Status | CircleMarker Color | CSS Equivalent | Check |
|---|---|---|---|
| healthy | `#10b981` | emerald-500 | ☐ |
| degraded | `#ef4444` | red-500 | ☐ |
| restoration | `#f59e0b` | amber-500 | ☐ |
| **Status chip colors** | | | |
| healthy chip | `bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300` | ☐ |
| degraded chip | `bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300` | ☐ |
| restoration chip | `bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300` | ☐ |

### 6.3 Tooltip on Hover
| Item | Expected | Check |
|---|---|---|
| Spring name shown on hover | ✅ Leaflet tooltip | ☐ |
| Status label shown | ✅ status.toString() | ☐ |
| Tooltip follows mouse | ✅ default Leaflet behavior | ☐ |

### 6.4 Filter Buttons
| Item | Expected | Check |
|---|---|---|
| 4 filter options: All, Healthy, Degraded, Restoration | ✅ `useState<SpringStatus | "all">("all")` | ☐ |
| Click filter → only matching springs shown | ✅ `.filter()` on spring list | ☐ |
| Active filter highlighted | ✅ `bg-brand-600 text-white` | ☐ |
| Inactive filters: `bg-slate-100 text-ink-muted` | ✅ | ☐ |

### 6.5 Tile Loading Error
| Item | Expected | Check |
|---|---|---|
| TileLayer `event="tileerror"` handler | ✅ Catches failed tile loads | ☐ |
| Fallback message displayed | ✅ "Peta tidak dapat dimuat. Periksa koneksi." | ☐ |
| Loading placeholder shown during tile load | ✅ "Loading OpenStreetMap…" | ☐ |

### 6.6 Protection Grid Info Banner
| Item | Expected | Check |
|---|---|---|
| Grid radius display: `PROTECTION_RADIUS_KM` | ✅ 5 km from `lib/geo.ts` | ☐ |
| Banner text: "Semua lokasi di-snap ke grid 5km" | ✅ `<ShieldCheck>` icon | ☐ |
| Points Guide modal link | ✅ `<PointsGuideModal>` | ☐ |

---

### 7.1 Donate Section (/#donate)
| Item | Expected | Check |
|---|---|---|
| Select impact area (dropdown) | ✅ | ☐ |
| Donation tiers (IDR amounts) | ✅ | ☐ |
| Custom amount input | ✅ | ☐ |
| Name + Email fields | ✅ | ☐ |
| Xendit checkout button | ✅ | ☐ |
| Featured Projects sidebar | ✅ | ☐ |
| Partner section | ✅ | ☐ |

### 7.2 Xendit Flow
| Item | Expected | Check |
|---|---|---|
| POST /api/donations/invoice | ✅ Create Xendit invoice | ☐ |
| Xendit webhook (POST /api/donations/webhook) | ✅ HMAC verification | ☐ |
| Invoice status: pending / paid / expired / failed | ✅ | ☐ |
| Dark mode: all inputs | ✅ | ☐ |

---

## 8. Admin Panel

### 8.1 Admin Dashboard (/admin)
| Item | Expected | Check |
|---|---|---|
| Stat cards: Users, Reports, Donations, Projects | ✅ Real-time from DB | ☐ |
| Recent reports table | ✅ | ☐ |
| Pending reviews count | ✅ | ☐ |
| Quick actions | ✅ | ☐ |

### 8.2 Admin Users (/admin/users)
| Item | Expected | Check |
|---|---|---|
| Table: username, email, role, phone, points, trust score | ✅ | ☐ |
| Role chip dark mode | ✅ | ☐ |
| Pagination | ✅ | ☐ |
| Email/phone admin-only | ✅ RLS policy | ☐ |

### 8.3 Admin Reports (/admin/reports)
| Item | Expected | Check |
|---|---|---|
| Table: form, status, snapped coords, date | ✅ | ☐ |
| Toggle precise coords | ✅ | ☐ |
| Toggle active/inactive | ✅ | ☐ |
| Export reports | ✅ | ☐ |

### 8.4 Admin Review (/admin/review)
| Item | Expected | Check |
|---|---|---|
| Pending reports queue | ✅ | ☐ |
| Approve/Reject buttons | ✅ | ☐ |
| Review note (optional) | ✅ | ☐ |

### 8.5 Admin Forms (/admin/forms)
| Item | Expected | Check |
|---|---|---|
| Form list with active/inactive filter | ✅ | ☐ |
| Create new form | ✅ | ☐ |
| Edit form fields | ✅ | ☐ |
| Toggle active/inactive | ✅ | ☐ |
| Points configuration | ✅ | ☐ |

### 8.6 Admin Lainnya
| Halaman | Fungsi | Status |
|---|---|---|
| /admin/donations | Lihat donasi | ✅ |
| /admin/projects | Verifikasi project | ✅ |
| /admin/points | Aturan poin | ✅ |
| /admin/courses | Course management | ✅ |
| /admin/content | CMS konten | ✅ |
| /admin/feedback | Bug reports inbox | ✅ |

### 8.7 Admin Dashboard — Detail
| Item | Expected | Check |
|---|---|---|
| 4 stat cards: Users, Reports, Donations, Projects | ✅ fetch 4 API endpoints in parallel | ☐ |
| Each card: icon, label, value, trend arrow | ✅ `ArrowUpRight` icon + change label | ☐ |
| Loading state: spinner | ✅ `<div className="animate-spin ..." />` | ☐ |
| Recent reports table (last 10) | ✅ formSlug, user, status badge, date | ☐ |
| Recent registrations (last 5) | ✅ username, role chip, joined date | ☐ |
| Export buttons: Users CSV, Reports CSV, Donations CSV, Projects CSV | ✅ `/api/admin/export?entity=...&format=csv` | ☐ |
| Dark mode: all cards, tables, buttons | ✅ | ☐ |

### 8.8 Admin Users (/admin/users) — Detail
| Item | Expected | Check |
|---|---|---|
| Table columns: Username, Email, Phone, Role, Region, Points, Trust, Joined | ✅ 8 columns | ☐ |
| Email displayed with `Mail` icon | ✅ | ☐ |
| Phone displayed with `Phone` icon or "—" | ✅ | ☐ |
| Role: clickable chip → inline `<select>` to change role | ✅ 3 options: user, volunteer, admin | ☐ |
| Inline role edit: dropdown + Cancel button | ✅ | ☐ |
| Points: `Sparkles` icon + `toLocaleString("id-ID")` | ✅ | ☐ |
| Trust score: `Shield` icon + numeric value | ✅ | ☐ |
| Joined date: `toLocaleDateString("id-ID")` | ✅ | ☐ |
| Export CSV button | ✅ `/api/admin/export?entity=users&format=csv` | ☐ |
| Email/Phone masked for non-admin via RLS | ✅ Policy: only admin can SELECT | ☐ |
| Dark mode: row hover `dark:hover:bg-slate-800`, role chip `dark:bg-brand-900/30 dark:text-brand-300` | ✅ | ☐ |
| Row hover highlight: `hover:bg-slate-50 dark:hover:bg-slate-800` | ✅ | ☐ |

### 8.9 Admin Reports (/admin/reports) — Detail
| Item | Expected | Check |
|---|---|---|
| Table columns: Form, User, Status, Active, Precise Lat, Precise Lng, Snapped, Reviewed, Date | ✅ 9 columns | ☐ |
| Form slug → human label via formLabels map | ✅ "spring-monitoring" → "Spring Monitoring" | ☐ |
| Status: color-coded badge (approved=emerald, pending=amber, rejected=red) | ✅ | ☐ |
| Active toggle: `ToggleRight`/`ToggleLeft` button per row | ✅ POST `/api/admin/reports/[id]/toggle` | ☐ |
| Precise coords toggled by `showPrecise` state | ✅ `Eye`/`EyeOff` button, masked as "••••••" | ☐ |
| Snapped coords always visible: `toFixed(3)` | ✅ | ☐ |
| Reviewed by: username or "—" | ✅ `r.reviewedBy?.username ?? "—"` | ☐ |
| Date filter: dateFrom + dateTo inputs | ✅ | ☐ |
| Export CSV + Show/Hide precise coords buttons | ✅ | ☐ |
| Dark mode: input bg, status chips, row hover | ✅ | ☐ |

### 8.10 Admin Review (/admin/review) — Detail
| Item | Expected | Check |
|---|---|---|
| Pending reports only (filtered from `/api/admin/reports`) | ✅ `r.status === "pending"` | ☐ |
| Card layout: form slug chip, username, date | ✅ | ☐ |
| Field data preview (first 6 fields) | ✅ `Object.entries(fieldData).slice(0, 6)` | ☐ |
| Photo grid: clickable thumbnails, select featured photo | ✅ `Sparkles` overlay on selected | ☐ |
| Precise + snapped coordinates displayed | ✅ | ☐ |
| Review note input field | ✅ `<input>` with placeholder "Catatan review..." | ☐ |
| Approve button → POST `/api/admin/reports/[id]/approve` | ✅ with featuredPhotoId | ☐ |
| Reject button → POST `/api/admin/reports/[id]/reject` | ✅ with note | ☐ |
| Processing spinner per button | ✅ | ☐ |
| Empty state: `CheckCircle2` + "Semua laporan sudah direview" | ✅ | ☐ |
| Action feedback banner (success/error) | ✅ auto-dismiss 3s | ☐ |
| Dark mode: all cards, inputs, buttons, chips | ✅ | ☐ |

### 8.11 Admin Forms (/admin/forms) — Detail
| Item | Expected | Check |
|---|---|---|
| Form list as cards (not table) | ✅ `grid gap-4 sm:grid-cols-2 lg:grid-cols-3` | ☐ |
| Each card: icon, title, description, points badge, contribution type, field count, report count, slug | ✅ | ☐ |
| Filter: All / Active / Inactive tabs | ✅ | ☐ |
| Toggle active/inactive per form | ✅ `Eye`/`EyeOff` icon button | ☐ |
| Edit button → `/admin/forms/[id]` | ✅ | ☐ |
| Delete button: confirm dialog, soft-delete if has reports | ✅ `_count.reports > 0` → deactivate only | ☐ |
| Create New Form button → `/admin/forms/new` | ✅ `Plus` icon + bg-brand-600 | ☐ |
| Points config displayed: `+{pointsOnSubmit} pts` | ✅ | ☐ |
| Error + empty states | ✅ | ☐ |
| Dark mode: cards, chips, filters, buttons | ✅ | ☐ |

### 8.12 Admin Projects (/admin/projects) — Detail
| Item | Expected | Check |
|---|---|---|
| Table: Title, Type, Region, Status, Goal, Raised, User, Donations | ✅ 8+ columns | ☐ |
| Status filter tabs: All, Pending, Under Review, Approved, Rejected, Completed | ✅ 6 filters | ☐ |
| Status chips: pending=amber, under_review=blue, approved=emerald, rejected=red, completed=purple | ✅ | ☐ |
| Goal/Raised amounts: `formatNumber()` with IDR | ✅ | ☐ |
| Detail modal: full project info + contact details | ✅ `ProjectDetailModal` | ☐ |
| Inline approve/reject from detail modal | ✅ POST `/api/admin/projects/[id]/approve` or `/reject` | ☐ |
| Export CSV button | ✅ | ☐ |
| Dark mode: table, status chips, modal | ✅ | ☐ |

### 8.13 Admin Points (/admin/points) — Detail
| Item | Expected | Check |
|---|---|---|
| Point rules displayed as cards with icon, name, points, category chip | ✅ 3 categories: basic, bonus, milestone | ☐ |
| Category chip colors: basic=emerald, bonus=amber, milestone=purple | ✅ | ☐ |
| Create/Edit modal: name, description, points, sort order, category, icon selector | ✅ `RuleFormModal` | ☐ |
| Icon selector: 16 lucide-react options (Star, Eye, Wrench, etc.) | ✅ | ☐ |
| Delete with confirm dialog | ✅ | ☐ |
| Drag handle for sort order | ✅ `GripVertical` icon | ☐ |
| Dark mode: modal bg `dark:bg-slate-800`, inputs `dark:bg-slate-800`, chips | ✅ | ☐ |

### 8.14 Admin Courses (/admin/courses) — Detail
| Item | Expected | Check |
|---|---|---|
| Course list as cards: icon, title, description, level, duration, module count, enrollment count, slug | ✅ | ☐ |
| Filter: All / Active / Inactive | ✅ | ☐ |
| Edit → `/admin/courses/[id]` | ✅ | ☐ |
| Create New Course → `/admin/courses/new` | ✅ | ☐ |
| Delete with confirm | ✅ | ☐ |
| Level chip: `bg-emerald-50 dark:bg-emerald-900/30` | ✅ | ☐ |
| Module count: `Layers` icon + count | ✅ | ☐ |
| Enrolled count: `Users` icon + `_count.progress` | ✅ | ☐ |
| Dark mode: cards, chips, empty state | ✅ | ☐ |

### 8.15 Admin Content (/admin/content) — Detail
| Item | Expected | Check |
|---|---|---|
| Section tabs: Media, Featured Projects, Impact Stats | ✅ 3 sections | ☐ |
| Content items listed as cards | ✅ | ☐ |
| Create/Edit form: section, type, title, subtitle, description, imageUrl, linkUrl, linkLabel, sortOrder | ✅ | ☐ |
| Types per section: video/event/publication/press, project, stat | ✅ | ☐ |
| Image preview from URL | ✅ `<img>` tag | ☐ |
| Delete with confirm | ✅ | ☐ |
| Dark mode: form inputs, cards | ✅ | ☐ |

### 8.16 All Admin Tables Dark Mode
| Item | Expected | Check |
|---|---|---|
| Table header: `text-ink-subtle`, `border-ink-line` | ✅ | ☐ |
| Table row: `border-ink-line last:border-0` | ✅ | ☐ |
| Row hover: `dark:hover:bg-slate-800` | ✅ | ☐ |
| Input fields: `dark:bg-slate-800 dark:text-white` | ✅ | ☐ |
| Select dropdowns: `dark:bg-slate-800 dark:text-white` | ✅ | ☐ |
| Filter buttons inactive: `dark:bg-slate-700 dark:text-slate-300` | ✅ | ☐ |
| Status badges: `dark:bg-*-900/30 dark:text-*-300` | ✅ | ☐ |
| Empty states: text color `dark:text-slate-400` | ✅ | ☐ |
| Export buttons: `dark:hover:bg-slate-700` | ✅ | ☐ |

---

### 9.1 Points Per Form (server-side)
| Form | Points | Check |
|---|---|---|
| Spring Monitoring | +25 | ☐ |
| Spring Restoration | +100 | ☐ |
| Trench Development | +50 | ☐ |
| Tree Planting | +50 | ☐ |
| Seedling Stock | +15 | ☐ |

### 9.2 Bonus Points
| Kategori | Syarat | Check |
|---|---|---|
| Streak Harian | 3 hari berturut-turut | ☐ |
| Streak Mingguan | 7 hari penuh | ☐ |
| Laporan Lengkap | Semua field + foto + notes | ☐ |
| Foto Before/After | Minimal 2 foto | ☐ |
| Discovery | Mata air baru | ☐ |
| Milestone 10, 50, 100 | Laporan | ☐ |
| Course selesai | per course | ☐ |
| 20K pts threshold | Sekali | ☐ |

### 9.3 Profile Page (/profile)
| Item | Expected | Check |
|---|---|---|
| Total points display | ✅ | ☐ |
| Trust score | ✅ | ☐ |
| Reports submitted count | ✅ | ☐ |
| My reports list | ✅ | ☐ |
| Points history | ✅ | ☐ |
| Edit profile | ✅ PUT /api/user/profile | ☐ |
| Logout | ✅ POST /api/auth/logout | ☐ |

---

## 10. Offline Survey Mode (NEW)

### 10.1 Setup Flow (/offline)
| Step | Item | Expected | Check |
|---|---|---|---|
| 1 | Check login & PWA | Redirect jika gagal | ☐ |
| 2 | **Tutorial** — 4 kartu (Cache, GPS, Foto, Sync) | ✅ | ☐ |
| 2 | Agreement checkbox "Saya setuju" | ✅ Wajib dicentang | ☐ |
| 3 | **Form Selection** — fetch dari /api/admin/forms | ✅ Sinkron dengan admin | ☐ |
| 3 | Checkbox per form + points badge | ✅ | ☐ |
| 4 (full) | **Pilih Area Map** — SetupMap dengan Leaflet | ✅ Pilih bounding box | ☐ |
| 4 (full) | Download tiles progress bar | ✅ | ☐ |
| 5 | Ready screen "Siap! Mode Offline Aktif" | ✅ | ☐ |
| 5 | Tombol "Mulai Survey" | ✅ | ☐ |

### 10.2 Survey Map
| Item | Expected | Check |
|---|---|---|
| Top bar: menu, jarak (km), marker count, exit | ✅ | ☐ |
| Leaflet map with CartoDB dark/light tiles | ✅ | ☐ |
| GPS trail polyline (oranye/merah, set 10m) | ✅ | ☐ |
| Current position dot (hijau, 2 lingkaran) | ✅ | ☐ |
| Auto-follow GPS position | ✅ `map.panTo()` | ☐ |
| Grid 5km overlay | ✅ Circle | ☐ |
| Spring marker ⛳ (CircleMarker amber) | ✅ | ☐ |
| Sidebar: GPS start/stop, form list, markers list | ✅ | ☐ |
| Bottom bar: "Catat Mata Air" + "Isi Form" | ✅ | ☐ |
| Spring name input modal | ✅ | ☐ |

### 10.3 Offline Form Renderer
| Item | Expected | Check |
|---|---|---|
| Form title + description | ✅ | ☐ |
| Dynamic fields (text, number, date, select, photo) | ✅ | ☐ |
| Camera capture input | ✅ capture="environment" | ☐ |
| Photo preview check | ✅ CheckCircle2 | ☐ |
| Save to IndexedDB | ✅ offlineDB.saveReport() | ☐ |
| Location auto-filled from GPS | ✅ | ☐ |

### 10.4 Exit Sync Flow
| Step | Item | Expected | Check |
|---|---|---|---|
| 1 | Konfirmasi: list items (foto, laporan, tracks, cleanup) | ✅ | ☐ |
| 2 | **Upload FOTO** — WAJIB | Satu per satu | ☐ |
| 2 | Gagal → STOP, user tetap offline | ✅ | ☐ |
| 3 | Kirim reports ke POST /api/reports | ✅ | ☐ |
| 4 | Upload tracking points ke POST /api/offline/sync | ✅ | ☐ |
| 5 | Clear IndexedDB + Cache tiles | ✅ | ☐ |
| 6 | Done → redirect ke / | ✅ | ☐ |

### 10.5 IndexedDB Stores
| Store | Data | Check |
|---|---|---|
| pending-reports | Form submissions saved offline | ✅ |
| tracking-points | GPS trail points | ✅ |
| photo-blobs | Captured photos (Blob) | ✅ |
| form-definitions | Cached form schemas | ✅ |
| tile-manifest | Record of cached tiles | ✅ |

### 10.6 Service Worker Caches
| Cache Name | Content | Strategy | Check |
|---|---|---|---|
| springhub-static-v3 | /_next/static/* | Cache-first | ✅ |
| springhub-pages-v3 | /, /offline, /report/* | Network-first | ✅ |
| springhub-tiles-v3 | *.tile.openstreetmap.org/* | Cache-first | ✅ |
| springhub-assets-v3 | Fonts, favicon, SVG | Cache-first | ✅ |

### 10.7 Background Sync
| Event | Action | Check |
|---|---|---|
| sync-pending-reports | Kirim pesan ke client | ✅ |
| Message: precache-tiles | Terima batch tile URLs, cache | ✅ |
| Message: clear-tiles | Hapus tile cache | ✅ |
| Message: clear-all | Hapus semua cache | ✅ |

### 10.8 Setup Map Detail (Step 4 — full mode)
| Item | Expected | Check |
|---|---|---|
| Zoom/pan detects bounding box | ✅ `useMapEvents({ moveend, zoomend })` | ☐ |
| Rectangle overlay shows selected area | ✅ `<Rectangle bounds={areaBounds}>` | ☐ |
| Coordinates display in overlay | ✅ `north, south, east, west` | ☐ |
| Tile download progress bar updates in real-time | ✅ `{ current, total }` state | ☐ |
| Progress text: "Mengunduh {current} dari {total} tile..." | ✅ | ☐ |
| Error state if download fails | ✅ `setDownloadError(msg)` | ☐ |
| Retry button on error | ✅ | ☐ |

### 10.9 Form Selection Detail (Step 3)
| Item | Expected | Check |
|---|---|---|
| Forms fetched from `/api/admin/forms` | ✅ Only `isActive: true` shown | ☐ |
| Checkbox per form | ✅ `type="checkbox"` | ☐ |
| Points badge per form: `+{pointsOnSubmit} pts` | ✅ | ☐ |
| Auto-select all forms on first setup | ✅ `!hasSetupBefore` → select all | ☐ |
| Toggle individual form selection | ✅ `Set<string>` state | ☐ |

### 10.10 GPS Tracking Detail
| Item | Expected | Check |
|---|---|---|
| GPS accuracy displayed: `±${accuracy.toFixed(0)}m` | ✅ In sidebar info box | ☐ |
| Distance counter live update | ✅ `setTotalDistance(prev + dist * 1000)` | ☐ |
| Distance shown in top bar (km) | ✅ `(totalDistance / 1000).toFixed(2)` | ☐ |
| Distance overlay on map | ✅ `<Ruler>` icon + km value | ☐ |
| enableHighAccuracy: true | ✅ | ☐ |
| Timeout: 10000ms, maximumAge: 5000ms | ✅ | ☐ |
| Track point recorded every 10m (0.01 km) | ✅ `if (dist >= 0.01)` | ☐ |
| Stop tracking clears watch | ✅ `navigator.geolocation.clearWatch()` | ☐ |
| Pulse animation on tracking: `animate-pulse` | ✅ | ☐ |

### 10.11 Trail Polyline
| Item | Expected | Check |
|---|---|---|
| GPS trail rendered with `Polyline` | ✅ Light orange/red color | ☐ |
| Line width: 3px (or as configured) | ✅ | ☐ |
| Color: orange (#f97316) for active trail | ✅ | ☐ |
| Current position dot: green, 2 nested circles | ✅ pulsing outer circle | ☐ |
| Auto-follow GPS: `map.panTo(currentPos)` | ✅ | ☐ |
| Grid 5km overlay circles | ✅ `Circle` with radius 5000 | ☐ |
| Spring markers: amber `CircleMarker` with ⛳ icon | ✅ | ☐ |

### 10.12 Spring Marker Dialog
| Item | Expected | Check |
|---|---|---|
| "Catat Mata Air" button in bottom bar | ✅ Amber button, disabled if no GPS fix | ☐ |
| Modal opens with text input for spring name | ✅ `showSpringNameInput` state | ☐ |
| Snap confirmation: "Lokasi akan di-snap ke grid 5 km" | ✅ | ☐ |
| Optional name input placeholder "Nama mata air (opsional)" | ✅ | ☐ |
| "Batal" + "Simpan" buttons | ✅ | ☐ |
| On save: create `OfflineTrackingPoint` with `isSpringMarker: true` | ✅ | ☐ |
| Location snapped via `snapToProtectionGrid()` | ✅ | ☐ |
| Marker appears on map as amber CircleMarker | ✅ | ☐ |
| Marker added to sidebar list with `Flag` icon | ✅ | ☐ |

### 10.13 Form Renderer Detail
| Item | Expected | Check |
|---|---|---|
| Form title + description displayed | ✅ | ☐ |
| text field: `<input type="text">` | ✅ | ☐ |
| phone field: `<input type="tel">` | ✅ | ☐ |
| longtext field: `<textarea>` 3 rows | ✅ | ☐ |
| number field: `<input type="number">` | ✅ | ☐ |
| date field: `<input type="date">` | ✅ | ☐ |
| select field: `<select>` with options | ✅ | ☐ |
| province field: `<select>` with 38 options | ✅ | ☐ |
| photo field: `<input type="file" capture="environment">` | ✅ | ☐ |
| Photo preview: filename + `CheckCircle2` icon | ✅ `dark:text-emerald-400` | ☐ |
| Required field red asterisk | ✅ `<span className="text-red-500">*</span>` | ☐ |
| Location auto-filled from GPS (not rendered) | ✅ `filter((f) => f.id !== "location")` | ☐ |
| Save to IndexedDB: `offlineDB.saveReport()` | ✅ | ☐ |

### 10.14 Exit Sync Detail
| Item | Expected | Check |
|---|---|---|
| Confirmation step: list of photos, reports, tracking points | ✅ Phase="confirm" | ☐ |
| Upload FOTO: one-by-one, progress bar per file | ✅ `setProgress({ current, total })` | ☐ |
| Photo success → delete from IndexedDB | ✅ `offlineDB.deletePhoto(id)` | ☐ |
| Photo failure → STOP with error message | ✅ `setPhase("error")` | ☐ |
| Upload reports: POST `/api/reports` with CSRF + honeypot + snap location | ✅ | ☐ |
| Report success → delete from IndexedDB | ✅ `offlineDB.deleteReport(id)` | ☐ |
| Upload tracking: POST `/api/offline/sync` | ✅ | ☐ |
| Clear IndexedDB via `offlineDB.clearAll()` | ✅ Phase="cleaning-up" | ☐ |
| Clear SW tile caches via postMessage "clear-tiles" | ✅ | ☐ |
| Close session: DELETE `/api/offline/session` | ✅ | ☐ |
| Done → redirect to `/` | ✅ `onComplete()` → redirect | ☐ |

### 10.15 Cache Cleaning After Sync
| Step | Action | Check |
|---|---|---|
| 1 | `offlineDB.clearAll()` — clear IndexedDB | ☐ |
| 2 | Post message "clear-tiles" to service worker | ☐ |
| 3 | DELETE `/api/offline/session` | ☐ |
| Progress bar: 3 steps with labels | ✅ | ☐ |

---

### 11.1 Verified Dark Mode (16 file fixed)
| File | Status | Check |
|---|---|---|
| app/sign-in/page.tsx | ✅ Input bg, error banner, hover | ☐ |
| app/join/page.tsx | ✅ Input bg, error banner, hover | ☐ |
| app/forgot-password/page.tsx | ✅ Input bg, 3 banners | ☐ |
| app/reset-password/page.tsx | ✅ Input bg, error banner | ☐ |
| app/report-issue/page.tsx | ✅ 3 textarea bg, upload label | ☐ |
| app/projects/new/page.tsx | ✅ 8 input bg, eligibility badge | ☐ |
| app/report/[slug]/page.tsx | ✅ 6 input bg, file input | ☐ |
| app/profile/page.tsx | ✅ 3 banners, rings, hovers | ☐ |
| components/map/location-picker.tsx | ✅ 2 input bg, buttons, hint bar | ☐ |
| components/sections/points-guide-modal.tsx | ✅ Category bg, empty state | ☐ |
| components/sections/volunteer.tsx | ✅ Gradient, nav buttons | ☐ |
| components/sections/media.tsx | ✅ Gradient | ☐ |
| components/sections/learning-hub.tsx | ✅ Gradient, icon color | ☐ |
| components/sections/spring-map.tsx | ✅ Gradient, nav buttons | ☐ |
| app/learn/[slug]/page.tsx | ✅ Badges, rings | ☐ |
| app/learn/[slug]/[moduleId]/page.tsx | ✅ Chips, prose-invert | ☐ |

### 11.2 Test Dark Mode Per Page
| Halaman | Toggle dark | Check |
|---|---|---|
| Landing page (/) | ✅ | ☐ |
| Dashboard section (/#dashboard) | ✅ | ☐ |
| Map section (/#map) | ✅ | ☐ |
| Volunteer section (/#community) | ✅ | ☐ |
| Donate section (/#donate) | ✅ | ☐ |
| Learning Hub (/#learn) | ✅ | ☐ |
| Media section (/#media) | ✅ | ☐ |
| Sign In (/sign-in) | ✅ | ☐ |
| Join (/join) | ✅ | ☐ |
| Forgot Password (/forgot-password) | ✅ | ☐ |
| Reset Password (/reset-password) | ✅ | ☐ |
| Report Form (/report/[slug]) | ✅ | ☐ |
| Profile (/profile) | ✅ | ☐ |
| Admin panel (/admin/*) | ✅ (dari fix sebelumnya) | ☐ |
| Offline (/offline) | ✅ (bg-slate-900 default) | ☐ |

---

## 12. PWA & Service Worker

### 12.1 PWA Manifest
| Field | Value | Check |
|---|---|---|
| name | "SpringHub — Jaga Semesta" | ☐ |
| short_name | "SpringHub" | ☐ |
| display | "standalone" | ☐ |
| theme_color | #059669 | ☐ |
| background_color | #ffffff | ☐ |
| icons | /logo-dark.png, /favicon.png | ☐ |

### 12.2 PWA Installation
| Item | Expected | Check |
|---|---|---|
| beforeinstallprompt event fires | ✅ | ☐ |
| Install button di OfflineEntryButton | ✅ | ☐ |
| Detect installed (display-mode: standalone) | ✅ | ☐ |
| Service worker registered | ✅ /sw.js | ☐ |

### 12.3 Cache Behavior
| Scenario | Expected | Check |
|---|---|---|
| Online → load page | Network-first, cache update | ☐ |
| Offline → navigate to cached page | Served from cache | ☐ |
| Offline → navigate to uncached page | /offline fallback | ☐ |
| Offline → load map tiles | From tile cache (if pre-cached) | ☐ |
| API calls offline | Network-only, fail gracefully | ☐ |

---

## 13. Anti-Spam

### 13.1 CSRF Token
| Item | Expected | Check |
|---|---|---|
| GET /api/csrf → returns token | ✅ | ☐ |
| POST /api/reports requires x-csrf-token | ✅ 403 if invalid | ☐ |

### 13.2 Honeypot
| Item | Expected | Check |
|---|---|---|
| Hidden field `_website` | ✅ | ☐ |
| Bot mengisi → silakan accept (no save) | ✅ | ☐ |

### 13.3 Time Gate
| Item | Expected | Check |
|---|---|---|
| Form submit < 3 detik dari page load | ✅ 429 Too Fast | ☐ |

### 13.4 Rate Limit (Redis)
| Item | Expected | Check |
|---|---|---|
| 10 req/menit/IP | ✅ via apiLimiter | ☐ |

### 13.5 Daily Limit (Postgres)
| Item | Expected | Check |
|---|---|---|
| 5 report/hari/user | ✅ count by createdAt today | ☐ |

---

## 14. Rute API

### 14.1 Frontend Pages
| Path | Status | Fungsi |
|---|---|---|
| / | ✅ | Landing page |
| /sign-in | ✅ | Login |
| /join | ✅ | Register |
| /forgot-password | ✅ | Lupa password |
| /reset-password | ✅ | Reset password |
| /report/[slug] | ✅ | 5 form survey |
| /profile | ✅ | Profile user |
| /projects/new | ✅ | Proposal project |
| /report-issue | ✅ | Laporkan bug |
| /help | ✅ | Help center |
| /faq | ✅ | FAQ |
| /privacy | ✅ | Kebijakan privasi |
| /terms | ✅ | Ketentuan layanan |
| /admin | ✅ | Admin dashboard |
| /admin/users | ✅ | Manajemen user |
| /admin/reports | ✅ | Laporan |
| /admin/review | ✅ | Review queue |
| /admin/donations | ✅ | Donasi |
| /admin/projects | ✅ | Verifikasi project |
| /admin/points | ✅ | Point rules |
| /admin/courses | ✅ | Course management |
| /admin/forms | ✅ | Dynamic form builder |
| /admin/content | ✅ | Content CMS |
| /admin/feedback | ✅ | Bug reports |
| **/offline** | **✅ NEW** | **Offline survey mode** |

### 14.2 API Routes
| Method | Path | Fungsi |
|---|---|---|
| GET/POST | /api/auth/me, /login, /register, /logout | Auth |
| GET/POST | /api/auth/forgot-password, /reset-password | Password |
| POST | /api/reports | Submit form |
| GET | /api/reports | Public reports list |
| POST | /api/reports/[id]/photos | Upload foto |
| POST | /api/donations/invoice | Xendit invoice |
| POST | /api/donations/webhook | Xendit callback |
| GET | /api/leaderboard | Top 20 |
| GET/PUT | /api/user/profile | Profile |
| GET | /api/user/points | Points history |
| GET | /api/csrf | CSRF token |
| GET | /api/health | Heartbeat DB check |
| POST | /api/newsletter | Subscribe email |
| POST | /api/feedback | Bug report |
| GET | /api/forms/[slug] | Dynamic form |
| POST | /api/projects | Create project |
| GET | /api/upload/presign | Presigned upload URL |
| GET/POST/DELETE | **/api/offline/session** | **✅ NEW** |
| POST | **/api/offline/sync** | **✅ NEW** |
| GET/POST/PUT/DELETE | /api/admin/* | 19 admin CRUD routes |

---

## 15. Akun Test

```
Admin:        admin@springhub.id / demo12345
Volunteer:    volunteer@springhub.id / vol12345
Volunteer:    ucup@springhub.id / ucup123 (25.000 pts — eligible untuk project)
```

---

## 16. Visual Design Checklist

### 16.1 Font
| Item | Expected | Check |
|---|---|---|
| Inter font loaded via `next/font/google` | ✅ `app/layout.tsx:12` | ☐ |
| CSS variable `--font-inter` applied | ✅ Tailwind `font-sans` maps to it | ☐ |
| Inter renders in all text elements | ✅ Headings, body, labels, buttons | ☐ |
| No FOUT/FOIT | ✅ Self-hosted by Next.js | ☐ |

### 16.2 Card Component
| Item | Expected | Check |
|---|---|---|
| Rounded corners | ✅ `rounded-lg` or `rounded-2xl` | ☐ |
| Box shadow | ✅ `shadow-sm` hover: `shadow-md` | ☐ |
| Border | ✅ `border border-ink-line` | ☐ |
| Padding | ✅ `p-4` to `p-6` | ☐ |
| Dark mode: `dark:bg-slate-800` or `dark:bg-slate-900` | ✅ | ☐ |

### 16.3 Container
| Item | Expected | Check |
|---|---|---|
| Max-width container: `container-page` class | ✅ `mx-auto max-w-7xl px-4` | ☐ |
| Centered content | ✅ `mx-auto` | ☐ |
| Responsive padding: `px-4 sm:px-6 lg:px-8` | ✅ | ☐ |

### 16.4 Buttons
| Type | Classes | Expected | Check |
|---|---|---|---|
| Primary | `btn-primary` | `bg-brand-600 text-white hover:bg-brand-700` | ☐ |
| Secondary | `btn-secondary` | `border border-ink-line bg-transparent text-ink hover:bg-slate-100` | ☐ |
| Ghost | (inline) | `text-ink-muted hover:bg-slate-100 hover:text-ink` | ☐ |
| Danger | (inline) | `bg-red-50 text-red-700 hover:bg-red-100` | ☐ |
| Dark mode primary | `btn-primary` | `dark:hover:bg-brand-500` | ☐ |
| Dark mode secondary | `btn-secondary` | `dark:border-slate-600 dark:text-slate-300` | ☐ |
| Disabled state | `disabled:opacity-50 disabled:cursor-not-allowed` | ✅ | ☐ |

### 16.5 Icons (lucide-react)
| Item | Expected | Check |
|---|---|---|
| Small icons: `h-3 w-3` | ✅ Used in status badges, chips | ☐ |
| Medium icons: `h-4 w-4` | ✅ Nav links, buttons, sidebar | ☐ |
| Large icons: `h-5 w-5` | ✅ Icon containers, map markers | ☐ |
| Extra large: `h-8 w-8` | ✅ Empty states, hero | ☐ |
| Consistent padding in icon containers | ✅ `h-9 w-9 place-items-center rounded-lg` | ☐ |
| Icon colors use CSS text color classes | ✅ `text-brand-600`, `text-ink-muted`, etc. | ☐ |

### 16.6 Color Palette
| Color | Usage | CSS Class | Check |
|---|---|---|---|
| brand-50 | Icon/badge backgrounds | `bg-brand-50` | ☐ |
| brand-100 | Hover states | `hover:bg-brand-100` | ☐ |
| brand-600 | Primary buttons, links, accents | `bg-brand-600`, `text-brand-600` | ☐ |
| brand-700 | Hover primary, strong accents | `hover:bg-brand-700`, `text-brand-700` | ☐ |
| emerald-50/500 | Healthy status, success | `bg-emerald-50`, `text-emerald-500` | ☐ |
| amber-50/500 | Restoration/warning | `bg-amber-50`, `text-amber-500` | ☐ |
| red-50/500 | Degraded/error | `bg-red-50`, `text-red-500` | ☐ |
| ink | Primary text | `text-ink` | ☐ |
| ink-muted | Secondary text | `text-ink-muted` | ☐ |
| ink-subtle | Tertiary/hint text | `text-ink-subtle` | ☐ |
| ink-line | Borders | `border-ink-line` | ☐ |

### 16.7 Spacing
| Item | Expected | Check |
|---|---|---|
| Consistent horizontal: `px-4` pattern | ✅ | ☐ |
| Consistent vertical: `py-2` / `py-3` / `py-16` pattern | ✅ | ☐ |
| Gap between elements: `gap-1` through `gap-4` | ✅ | ☐ |
| Section spacing: `py-16` or `py-20` | ✅ | ☐ |
| Card padding: `p-4` or `p-5` or `p-6` | ✅ | ☐ |

### 16.8 Responsive Breakpoints
| Breakpoint | Tailwind | Target | Check |
|---|---|---|---|
| Mobile | (default) | 320px+ | ☐ |
| Tablet | `sm:` | 640px+ | ☐ |
| Tablet landscape | `md:` | 768px+ | ☐ |
| Desktop | `lg:` | 1024px+ | ☐ |
| Wide | `xl:` | 1280px+ | ☐ |

### 16.9 Interactive States
| State | Expected | Check |
|---|---|---|
| Hover | ✅ `hover:bg-*`, `hover:text-*`, opacity change | ☐ |
| Active/Click | ✅ `focus:ring-2 focus:ring-brand-500/30` | ☐ |
| Focus visible | ✅ `focus:outline-none` + ring | ☐ |
| Disabled | ✅ `opacity-50 cursor-not-allowed` | ☐ |
| Loading | ✅ `Loader2 animate-spin` or spinner div | ☐ |
| Dark mode hover | ✅ `dark:hover:bg-slate-800` or `dark:hover:bg-brand-900/30` | ☐ |

---

## 17. Known Issues & Limitations

| # | Issue | Detail | Workaround |
|---|---|---|---|
| 1 | **LSP errors for Prisma types in VS Code** | VS Code shows false positive TS errors for Prisma-generated types. `tsc` and `next build` pass clean. | Restart VS Code or run `npx prisma generate` to refresh types |
| 2 | **Background Sync API browser support** | `sync-pending-reports` only works in Chromium browsers (Chrome, Edge, Opera ≥ 80). Firefox/Safari do not support Background Sync. | Fallback: online event listener checks pending queue when coming back online |
| 3 | **Map tile caching requires online selection** | Tiles cannot be downloaded in offline mode. User must select area while connected. | Provide clear UI cue: "Pilih area saat online untuk caching tile" |
| 4 | **GPS tracking battery drain** | `enableHighAccuracy: true` and 10m recording interval drains battery on long surveys. | Advise user to bring power bank. Allow user to set recording interval (planned) |
| 5 | **Large photo upload timeout** | Photos >5MB may timeout during exit sync (30s AbortSignal.timeout per photo). | Implement chunked upload (planned). For now, compress photos before capture |
| 6 | **PWA install prompt inconsistencies** | `beforeinstallprompt` may not fire in all browsers. Safari iOS uses a different installation mechanism (Share → Add to Home Screen). | Fallback: manual instructions in OfflineEntryButton tooltip |
| 7 | **Prose content dark mode** | `/learn/[slug]/[moduleId]` uses `dark:prose-invert` for Tailwind typography plugin. | Ensure `@tailwindcss/typography` is in `devDependencies` |
| 8 | **Redis availability for rate limiting** | Rate limiter depends on Redis. If Redis is unreachable, `apiLimiter` middleware may throw errors. | Check `/api/health` endpoint. In dev, rate limiter is bypassed |
| 9 | **Email sending (nodemailer)** | Password reset emails require SMTP config. Currently stub/disabled in development. | Set SMTP env vars for production. Dev: reset URL shown in banner |
| 10 | **Offline form location accuracy** | Location auto-filled from GPS may have ±10-50m accuracy depending on environment (buildings, trees). | Allow manual override in offline form. Snapped to 5km grid reduces precision impact |
| 11 | **Admin export large datasets** | CSV export via `/api/admin/export` loads all records in memory. May timeout for 10K+ records. | Implement streaming export (planned). For now, use date filters |
| 12 | **Form slug hardcoded in offline mode** | Offline form selection uses slugs synced at setup time. New forms added to admin after setup won't appear. | User must re-run setup to sync new form definitions |
| 13 | **Xendit sandbox vs production** | Currently using sandbox API keys. Real transactions require production keys + webhook URL configuration. | Switch to prod keys in Vercel env vars before launch |
| 14 | **Supabase RLS policies not applied** | RLS policies in `supabase/rls-policies.sql` need manual application via Supabase Dashboard. | Apply policies before production deployment |

---

## Ringkasan Build

```
 ✓ Compiled successfully
 ✓ Zero TypeScript errors (0 error TS)
 ✓ 36 static pages generated
 ✓ 52+ API routes
 ✓ All dark mode: 16 files fixed, ±80 titik + admin tabs
 ✓ Offline Survey Mode: 10 new files, 3 API routes
 ✓ Build size: /offline 13.3 kB (129 kB first load)
 ✓ Total test scenarios: ~500+ across 17 sections
 ✓ Coverage: Landing, Auth, Forms, Dashboard, Map, Donation, Admin, Points, Offline, Dark Mode, PWA, Anti-Spam, Visual Design
```
