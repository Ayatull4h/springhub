# REFERENSI LENGKAP — SpringHub
## API · Database · Arsitektur · Deployment

**Domain**: https://www.springhub.id  
**IP VPS**: 76.13.198.18  
**Stack**: Next.js 14 + TypeScript + Tailwind + PostgreSQL + Redis  
**Dibuat**: 30 Juni 2026

---

## 📋 DAFTAR ISI

- [1. Arsitektur Aplikasi](#-1-arsitektur-aplikasi)
- [2. Stack Teknologi](#-2-stack-teknologi)
- [3. API Routes (52 Route)](#-3-api-routes-52-route)
- [4. Database Schema (18 Tabel)](#-4-database-schema-18-tabel)
- [5. Halaman / Pages (30+ Halaman)](#-5-halaman--pages-30-halaman)
- [6. Komponen UI](#-6-komponen-ui)
- [7. Environment Variables](#-7-environment-variables)
- [8. Flow Aplikasi](#-8-flow-aplikasi)
- [9. Keamanan](#-9-keamanan)
- [10. Deployment & Infrastruktur](#-10-deployment--infrastruktur)

---

## 🏛️ 1. Arsitektur Aplikasi

```
┌──────────────────────────────────────────────────────────────┐
│                        INTERNET                               │
└────────────────────────┬─────────────────────────────────────┘
                         │
                    ┌────▼────┐
                    │ UFW FW  │  Firewall: allow 22,80,443 only
                    └────┬────┘
                         │
                    ┌────▼────┐
                    │  SSH    │  root@76.13.198.18
                    │  Port 22│
                    └────────┘
                         │
              ┌──────────┴──────────┐
              │                     │
         ┌────▼────┐          ┌────▼────┐
         │  HTTP   │          │  HTTPS  │
         │  Port 80│          │ Port 443│
         └────┬────┘          └────┬────┘
              │ 301 redirect       │
              └────────┬───────────┘
                       │
                  ┌────▼────┐
                  │  Nginx  │  Reverse proxy
                  │ alpine  │  + SSL termination
                  └────┬────┘
                       │ proxy_pass http://web:31759
                       │
                  ┌────▼────┐
                  │ Next.js │  Express server
                  │ 14.2.5  │  Port 31759 (internal)
                  └────┬────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
   ┌────▼────┐   ┌────▼────┐   ┌─────▼─────┐
   │Postgres │   │  Redis  │   │   /data/   │
   │ 16+GIS  │   │    7    │   │  uploads/  │
   │ DB:5432 │   │  :6379  │   │   (foto)   │
   └─────────┘   └─────────┘   └───────────┘
        │              │
   ┌────▼────┐   ┌────▼────┐
   │ Worker  │   │  Queue  │
   │ (email) │   │ (BullMQ)│
   └─────────┘   └─────────┘
```

### Container Layout:
| Container | Port | Fungsi |
|---|---|---|
| nginx | 80/443 (public) | Reverse proxy, SSL, serve uploads |
| web (Next.js) | 31759 (internal) | Aplikasi utama |
| postgres (PostGIS) | 5432 (internal) | Database |
| redis | 6379 (internal) | Cache + queue |
| worker | - | Background job (email) |

### Alur Request:
```
Browser → https://www.springhub.id
  → UFW → Nginx (port 443)
  → Nginx proxy ke web:31759
  → Next.js proses → render HTML / API response
  → Balik ke browser
```

### Alur Upload Foto:
```
User upload foto
  → POST /api/reports/[id]/photos
  → Next.js: validasi → resize 720p → kompresi JPEG 80% → watermark
  → Simpan ke /data/uploads/reports/{id}/{filename}.jpg
  → Simpan path ke database
  → URL: /uploads/reports/{id}/{filename}.jpg
  → Nginx serve langsung (cache 365 hari)
```

---

## 🛠️ 2. Stack Teknologi

### Frontend
| Teknologi | Versi | Fungsi |
|---|---|---|
| Next.js | 14.2.5 | App Router, SSR, API routes |
| TypeScript | 5.x | Strict mode |
| Tailwind CSS | 3.x | Styling utility-first |
| Leaflet / react-leaflet | - | Map interaktif |
| lucide-react | - | Ikon |
| next-intl | - | i18n EN/ID |

### Backend
| Teknologi | Versi | Fungsi |
|---|---|---|
| Prisma ORM | 7.x | Database ORM |
| PostgreSQL + PostGIS | 16 | Database utama |
| Redis | 7 | Cache + Queue |
| BullMQ | - | Background jobs |
| jose | - | JWT token auth |
| bcryptjs | - | Password hashing |
| sharp | - | Image processing (resize, watermark) |

### Integrasi Pihak Ketiga
| Layanan | Fungsi | Status |
|---|---|---|
| Cloudflare | DNS + CDN (optional) | ⏳ Belum setup |
| Resend | Email (password reset) | ⏳ Belum setup |
| Xendit | Payment gateway donasi | ⏳ Belum setup |
| Sentry | Error tracking | ⏳ Belum setup |

---

## 🌐 3. API Routes (52 Route)

### 3.1 Auth (7 route)

| Method | Endpoint | Fungsi | Auth |
|---|---|---|---|
| POST | `/api/auth/login` | Login | ❌ |
| POST | `/api/auth/register` | Register akun baru | ❌ |
| POST | `/api/auth/logout` | Logout | ✅ |
| GET | `/api/auth/me` | Get user session | ✅ |
| POST | `/api/auth/forgot-password` | Kirim email reset password | ❌ |
| POST | `/api/auth/reset-password` | Reset password (dengan token) | ❌ |
| POST | `/api/auth/claim-guest` | Claim guest session jadi akun | ✅ |

### 3.2 Reports (3 route)

| Method | Endpoint | Fungsi | Auth |
|---|---|---|---|
| GET | `/api/reports` | List laporan publik (filter: status=approved, isActive=true) | ❌ |
| POST | `/api/reports` | Submit laporan baru | ✅ |
| GET | `/api/reports/[id]` | Detail laporan | ❌ |
| POST | `/api/reports/[id]/photos` | Upload foto ke laporan | ✅ |
| GET | `/api/reports/[id]/photos` | List foto laporan | ❌ |

### 3.3 Springs (3 route)

| Method | Endpoint | Fungsi | Auth |
|---|---|---|---|
| GET | `/api/springs` | List semua mata air (dengan stat) | ❌ |
| GET | `/api/springs/[id]` | Detail + laporan di mata air | ❌ |
| GET | `/api/springs/bulk` | Data springs untuk map (batch) | ❌ |

### 3.4 Projects (3 route)

| Method | Endpoint | Fungsi | Auth |
|---|---|---|---|
| GET | `/api/projects` | List semua project | ❌ |
| POST | `/api/projects` | Buat project baru (>= 20K pts) | ✅ |
| GET | `/api/projects/[id]/comments` | List komentar project | ❌ |
| POST | `/api/projects/[id]/comments` | Tambah komentar | ✅ |
| POST | `/api/projects/[id]/like` | Like project | ✅ |

### 3.5 Donations (2 route)

| Method | Endpoint | Fungsi | Auth |
|---|---|---|---|
| POST | `/api/donations/invoice` | Buat invoice Xendit | ✅ |
| POST | `/api/donations/webhook` | Callback Xendit (HMAC) | ❌ (public) |

### 3.6 Courses (3 route)

| Method | Endpoint | Fungsi | Auth |
|---|---|---|---|
| GET | `/api/courses` | List kursus | ❌ |
| GET | `/api/courses/[slug]` | Detail kursus + modul | ❌ |
| GET/PUT | `/api/courses/progress` | Progress user di kursus | ✅ |

### 3.7 User (3 route)

| Method | Endpoint | Fungsi | Auth |
|---|---|---|---|
| GET/PUT | `/api/user/profile` | Get/update profile user | ✅ |
| GET | `/api/user/points` | Riwayat poin user | ✅ |
| GET | `/api/user/notifications` | Notifikasi user | ✅ |
| GET | `/api/notifications` | List notifikasi | ✅ |
| PUT | `/api/notifications/[id]/read` | Tandai notifikasi sudah dibaca | ✅ |

### 3.8 Content & Gallery (2 route)

| Method | Endpoint | Fungsi | Auth |
|---|---|---|---|
| GET | `/api/content` | Content blocks (media, dll) | ❌ |
| GET | `/api/gallery` | Gallery foto (approved + featured) | ❌ |

### 3.9 System (4 route)

| Method | Endpoint | Fungsi | Auth |
|---|---|---|---|
| GET | `/api/health` | Health check (DB + Redis) | ❌ |
| GET | `/api/csrf` | CSRF token | ❌ |
| POST | `/api/newsletter` | Subscribe newsletter | ❌ |
| POST | `/api/feedback` | Kirim feedback/bug report | ✅ |
| GET | `/api/leaderboard` | Top 20 volunteer | ❌ |
| GET | `/api/point-rules` | Aturan poin | ❌ |
| POST | `/api/upload/presign` | Presigned upload URL | ✅ |
| GET | `/api/dashboard` | Statistik dashboard publik | ❌ |

### 3.10 Admin (19 route)

| Method | Endpoint | Fungsi |
|---|---|---|
| GET | `/api/admin/users` | List semua user |
| PUT | `/api/admin/users/[id]` | Update user (role, dll) |
| GET | `/api/admin/reports` | List semua laporan (dengan koordinat presisi) |
| POST | `/api/admin/reports/[id]/approve` | Approve laporan (+ poin otomatis) |
| POST | `/api/admin/reports/[id]/reject` | Reject laporan |
| POST | `/api/admin/reports/[id]/toggle` | Toggle active/inactive laporan |
| GET | `/api/admin/donations` | List semua donasi |
| GET | `/api/admin/projects` | List semua project |
| PUT | `/api/admin/projects/[id]` | Update status project |
| GET | `/api/admin/forms` | List form (+ query status) |
| POST | `/api/admin/forms` | Buat form baru |
| PUT | `/api/admin/forms/[id]` | Update form |
| DELETE | `/api/admin/forms/[id]` | Soft-delete form |
| POST | `/api/admin/forms/[id]/fields` | Tambah field ke form |
| PUT | `/api/admin/forms/[id]/fields/[fieldId]` | Update field |
| GET/PUT | `/api/admin/courses` / `[id]` | CRUD kursus |
| GET/PUT | `/api/admin/point-rules` / `[id]` | CRUD aturan poin |
| GET/PUT/DELETE | `/api/admin/content/[id]` | CRUD content blocks |
| GET/PUT | `/api/admin/feedback/[id]` | Manage feedback |
| GET | `/api/admin/export` | Export data ke CSV |
| GET | `/api/admin/download` | Download file |

---

## 🗃️ 4. Database Schema (18 Tabel)

### Entity Relationship (Simplified)

```
Profile ──┬── Session
          ├── Report ──┬── ReportPhoto
          │            └── Spring
          ├── Donation ── Project
          ├── PointsLog
          ├── CoursesProgress ── Course ── CourseModule
          ├── Notification
          ├── Comment ── Project
          ├── Feedback
          └── OfflineSession ── TrackingPoint

Form ── FormField
     └── Report

ContentBlock (standalone)
PointRule (standalone)
```

### 4.1 Profile — User accounts
```sql
id            UUID       PRIMARY KEY
email         TEXT       UNIQUE, NOT NULL
passwordHash  TEXT       NOT NULL (bcrypt)
username      TEXT       DEFAULT ''
role          ENUM      'user' | 'volunteer' | 'admin'
phone         TEXT       DEFAULT ''
phoneVerified  BOOLEAN   DEFAULT false
region        TEXT       DEFAULT ''
points        INT        DEFAULT 0
trustScore    INT        DEFAULT 50
createdAt     TIMESTAMP
updatedAt     TIMESTAMP
```

### 4.2 Session — JWT sessions
```sql
id            UUID       PRIMARY KEY
profileId     UUID       FK → Profile
token         TEXT       UNIQUE
expiresAt     TIMESTAMP
createdAt     TIMESTAMP
```

### 4.3 Spring — Mata air
```sql
id            UUID       PRIMARY KEY
name          TEXT       NOT NULL
snappedLat    FLOAT?     (koordinat publik, di-snap 5km)
snappedLng    FLOAT?
province      TEXT       DEFAULT ''
regency       TEXT       DEFAULT ''
village       TEXT       DEFAULT ''
subdistrict   TEXT       DEFAULT ''
isDummy       BOOLEAN    DEFAULT false
createdAt     TIMESTAMP
updatedAt     TIMESTAMP
```

### 4.4 Report — Laporan lapangan
```sql
id            UUID       PRIMARY KEY
userId        UUID?      FK → Profile
guestId       TEXT?
formSlug      TEXT       (spring-monitoring, dll)
status        ENUM      'pending' | 'approved' | 'rejected'
isActive      BOOLEAN    DEFAULT true
isDummy       BOOLEAN    DEFAULT false
fieldData     TEXT       JSON — isian form
preciseLat    FLOAT?     (hanya admin lihat)
preciseLng    FLOAT?
snappedLat    FLOAT?     (publik lihat ini)
snappedLng    FLOAT?
reviewedById  UUID?      FK → Profile (admin)
reviewNote    TEXT       DEFAULT ''
featuredPhotoId TEXT?    UUID dari ReportPhoto
springId      UUID?      FK → Spring
createdAt     TIMESTAMP
updatedAt     TIMESTAMP
```

### 4.5 ReportPhoto — Foto laporan
```sql
id            UUID       PRIMARY KEY
reportId      UUID       FK → Report
fieldId       TEXT       ('photo', 'featured')
storagePath   TEXT       (path file / URL)
mimeType      TEXT       DEFAULT 'image/jpeg'
width         INT
height        INT
createdAt     TIMESTAMP
```

### 4.6 Project — Proyek komunitas
```sql
id            UUID       PRIMARY KEY
userId        UUID?      FK → Profile
title         TEXT       NOT NULL
summary       TEXT       DEFAULT ''
region        TEXT       DEFAULT ''
typeId        TEXT       (slug form)
status        ENUM      'pending'|'under_review'|'approved'|'rejected'|'completed'
goalAmount    INT        (target donasi, dalam rupiah)
raisedAmount  INT        (terkumpul)
likes         INT        DEFAULT 0
comments      INT        DEFAULT 0
contactName   TEXT
contactEmail  TEXT
contactPhone  TEXT
proposalFile  TEXT
createdAt     TIMESTAMP
updatedAt     TIMESTAMP
```

### 4.7 Donation — Donasi
```sql
id            UUID       PRIMARY KEY
userId        UUID?      FK → Profile
projectId     UUID?      FK → Project
invoiceId     TEXT       (Xendit invoice ID)
externalId    TEXT       (Xendit external ID)
amountIdr     INT        (jumlah dalam rupiah)
tierId        TEXT       'explorer'|'friend'|'supporter'|'guardian'|'custom'
donorName     TEXT       (publik)
donorEmail    TEXT       (admin only)
status        ENUM      'pending'|'paid'|'expired'|'failed'
paidAt        TIMESTAMP?
expiresAt     TIMESTAMP?
createdAt     TIMESTAMP
```

### 4.8 PointsLog — Riwayat poin
```sql
id            UUID       PRIMARY KEY
userId        UUID?      FK → Profile
guestId       TEXT?
reportId      UUID?      FK → Report
amount        INT        (+ = dapat, - = dipakai)
reason        TEXT       ('Laporan di-approve', bonus, dll)
metadata      TEXT       JSON
createdAt     TIMESTAMP
```

### 4.9 Course & CourseModule — Kursus edukasi
```sql
-- Course
id            UUID       PRIMARY KEY
slug          TEXT       UNIQUE
title         TEXT
description   TEXT
level         TEXT       'Beginner'|'Intermediate'
duration      TEXT       '30 menit'
icon          TEXT       'Droplets', 'Tree', dll
isActive      BOOLEAN    DEFAULT true
sortOrder     INT
createdAt     TIMESTAMP

-- CourseModule
id            UUID       PRIMARY KEY
courseId      UUID       FK → Course
title         TEXT
content       TEXT       (HTML/Markdown)
sortOrder     INT
```

### 4.10 CoursesProgress — Progress user
```sql
id            UUID       PK
userId        UUID       FK → Profile
courseId      TEXT
courseSlug    TEXT
completedModules INT    DEFAULT 0
totalModules  INT       DEFAULT 1
completed     BOOLEAN    DEFAULT false
createdAt     TIMESTAMP
UNIQUE(userId, courseSlug)
```

### 4.11 Form & FormField — Form builder
```sql
-- Form
id            UUID       PRIMARY KEY
slug          TEXT       UNIQUE
title         TEXT
description   TEXT
pointsOnSubmit INT       (25, 50, 100, 15)
contributionType TEXT   'monitoring'|'restoration'
isActive      BOOLEAN    DEFAULT true
sortOrder     INT

-- FormField
id            UUID       PK, FK → Form
fieldId       TEXT       ('spring_name', 'photo', dll)
label         TEXT       ('Nama Mata Air')
type          TEXT       'text'|'number'|'select'|'textarea'|'file'
required      BOOLEAN
placeholder   TEXT
helpText      TEXT
options       TEXT       JSON array (untuk type=select)
sortOrder     INT
UNIQUE(formId, fieldId)
```

### 4.12 Lain-lain
```sql
-- Notification
id, userId, type ENUM('draft','submission-sent','points-earned',
    'report-approved','report-rejected','project-verified','event'),
title, body, isRead, link, createdAt

-- Comment
id, projectId FK Project, userId FK Profile, text, createdAt

-- Feedback
id, type ENUM('bug','kritik','saran','both'),
kritik, saran, bugDescription, bugScreenshot,
status ENUM('open','read','resolved'), userId, createdAt

-- ContentBlock (media, video, event, press)
id, section, type, title, subtitle, description,
imageUrl, linkUrl, linkLabel, data JSON, sortOrder, isActive

-- PointRule
id, name, description, points, category ENUM('basic','bonus','milestone'),
icon, isActive, sortOrder

-- OfflineSession & TrackingPoint
(id, userId, isActive, selectedForms, totalDistance, startedAt, endedAt)
(id, sessionId FK, lat, lng, accuracy, isSpringMarker, springName, recordedAt)
```

### Indexes Penting:
```sql
Profile:    [role], [points DESC]
Session:    [profileId], [expiresAt]
Spring:     [snappedLat, snappedLng], [name]
Report:     [status], [userId, createdAt DESC], [formSlug], [createdAt], [springId]
Donation:   [status], [userId], [projectId]
PointsLog:  [userId]
Notification: [userId, isRead], [userId, createdAt]
```

---

## 📄 5. Halaman / Pages (30+ Halaman)

### 5.1 Public (tanpa login)

| Route | Halaman | Fitur Utama |
|---|---|---|
| `/` | **Landing Page** | Hero, Impact Dashboard, Map, Activities, Learning Hub, Projects, Media, Donasi |
| `/springs` | **Map Mata Air** | Leaflet map dengan 12 marker, filter provinsi |
| `/springs/[id]` | **Detail Mata Air** | Info + laporan-laporan + galeri foto |
| `/projects` | **Daftar Proyek** | Card proyek dengan progress donasi |
| `/projects/[id]` | **Detail Proyek** | Deskripsi, donasi, komentar, like |
| `/learn` | **Learning Hub** | Daftar kursus |
| `/learn/[slug]` | **Detail Kursus** | Modul-modul pembelajaran |
| `/learn/[slug]/[moduleId]` | **Isi Modul** | Konten edukasi |
| `/about` | **Tentang** | Informasi organisasi |
| `/help` | **Bantuan** | FAQ umum |
| `/faq` | **FAQ** | Pertanyaan sering diajukan |
| `/privacy` | **Kebijakan Privasi** | |
| `/terms` | **Syarat & Ketentuan** | |
| `/sign-in` | **Login** | Email + password |
| `/join` | **Register** | Buat akun baru |
| `/forgot-password` | **Lupa Password** | Kirim email reset |
| `/reset-password` | **Reset Password** | Form password baru |
| `/report-issue` | **Laporkan Masalah** | Feedback form |

### 5.2 Auth (perlu login)

| Route | Halaman | Fitur Utama |
|---|---|---|
| `/report/[slug]` | **Form Laporan** | 5 jenis form (monitoring, restorasi, dll) |
| `/projects/new` | **Buat Proyek** | Multi-step form (butuh >= 20.000 pts) |
| `/profile` | **Profile User** | Poin, history laporan, badges |
| `/notifications` | **Notifikasi** | Daftar notifikasi user |
| `/offline` | **Mode Offline** | Form offline untuk PWA |

### 5.3 Admin (role=admin)

| Route | Halaman | Fitur Utama |
|---|---|---|
| `/admin` | **Dashboard** | Statistik, grafik, ringkasan |
| `/admin/users` | **Manajemen User** | Daftar user + email + role + poin |
| `/admin/reports` | **Laporan** | Semua laporan (dengan koordinat presisi) + toggle active |
| `/admin/review` | **Review Queue** | Approve/reject laporan |
| `/admin/donations` | **Donasi** | Semua transaksi donasi |
| `/admin/projects` | **Proyek** | Verifikasi + status proyek |
| `/admin/forms` | **Form Builder** | CRUD form dan field dinamis |
| `/admin/courses` | **Kursus** | CRUD kursus + modul |
| `/admin/points` | **Point Rules** | Aturan poin + nilai |
| `/admin/feedback` | **Feedback** | Kotak masuk bug/saran |
| `/admin/content` | **Content CMS** | Media, event, publikasi |
| `/admin/trust-score` | **Trust Score** | Management trust score volunteer |

---

## 🧩 6. Komponen UI

### 6.1 Folder Structure
```
components/
├── sections/         # Section landing page
│   ├── hero-section.tsx
│   ├── impact-dashboard.tsx
│   ├── spring-map.tsx
│   ├── volunteer-activities.tsx
│   ├── learning-hub.tsx
│   ├── media-section.tsx
│   ├── donate-section.tsx
│   ├── site-header.tsx
│   └── site-footer.tsx
├── map/              # Komponen map
│   ├── leaflet-map.tsx
│   ├── mini-map.tsx
│   └── location-picker.tsx
├── ui/               # UI primitives
│   ├── skeleton.tsx
│   ├── button.tsx
│   ├── modal.tsx
│   └── toast.tsx
├── offline/          # PWA offline
│   ├── simple-offline-form.tsx
│   ├── offline-survey-map.tsx
│   └── offline-exit-sync.tsx
├── admin/            # Admin components
├── layout/           # Layout components
│   └── watermark.tsx
├── queue-worker.tsx  # Background sync
└── skeleton/         # Skeleton loading states
    └── sections.tsx
```

### 6.2 Library Files
```
lib/
├── auth.ts          # JWT auth (bcryptjs + jose)
├── prisma.ts        # Prisma client singleton + error handling
├── env.ts           # Zod env validation
├── forms.ts         # Zod schemas form
├── i18n.ts          # Internationalization (EN/ID)
├── darkmode.ts      # Dark mode toggle
├── geo.ts           # Location snapping (5km grid)
├── xendit.ts        # Xendit payment integration
├── email.ts         # Email sender (Resend/SMTP/SendGrid)
├── upload-photo.ts  # Photo upload + compress + watermark
├── photo-url.ts     # Photo URL builder (local/S3/Supabase)
├── watermark.ts     # Watermark overlay
├── rate-limit.ts    # Rate limiter (in-memory fallback)
├── points-engine.ts # Points calculation (server-side)
├── utils.ts         # Utility functions
├── logger.ts        # Logging
├── redis.ts         # Redis client
├── cleanup.ts       # Cleanup utilities
├── offline-db.ts    # IndexedDB for offline
├── session-cache.ts # PWA session cache
├── use-data-saver.tsx # Data saver mode hook
├── guest.ts         # Guest session
├── error-boundary.ts
├── supabase.ts      # Vestigial (disabled)
└── supabase-server.ts # Vestigial (disabled)
```

---

## 🔐 7. Environment Variables

### File: `.env` atau `.env.production`

```env
# ── CRITICAL (app gak jalan tanpa ini) ──
DATABASE_URL      # PostgreSQL connection string
JWT_SECRET        # 64-char random hex

# ── STORAGE ──
UPLOAD_DIR        # Local: /data/uploads
UPLOAD_URL_PREFIX # URL: /uploads
S3_ENDPOINT       # Cloudflare R2 endpoint
S3_ACCESS_KEY     # R2 access key
S3_SECRET_KEY     # R2 secret key
S3_BUCKET         # springhub-photos
S3_PUBLIC_URL     # R2 public URL

# ── EMAIL ──
EMAIL_PROVIDER    # "log" | "smtp" | "resend" | "sendgrid"
EMAIL_API_KEY     # Resend/SendGrid API key
EMAIL_FROM        # noreply@springhub.id
SMTP_HOST/PORT/USER/PASS  # SMTP config

# ── PAYMENT ──
XENDIT_SECRET_KEY
XENDIT_WEBHOOK_TOKEN

# ── APP ──
NEXT_PUBLIC_APP_URL   # https://www.springhub.id
NEXT_PUBLIC_APP_NAME  # SpringHub
NEXT_PUBLIC_SENTRY_DSN # Error tracking

# ── QUEUE ──
REDIS_URL         # redis://redis:6379
REDIS_QUEUE_URL   # redis://redis:6379
```

---

## 🔄 8. Flow Aplikasi

### 8.1 Flow: User Submit Laporan
```
User login → Buka /report/[slug]
  → Isi form (field dinamis dari DB)
  → Upload foto (min 3, max 5)
  → Klik Submit
  → POST /api/reports
    → Zod validasi server-side
    → Anti-spam (honeypot, time gate, rate limit)
    → Simpan ke DB (status: pending)
    → Upload foto ke /data/uploads/
    → Simpan path foto di ReportPhoto
    → Kirim notifikasi ke admin
  → Redirect ke halaman sukses
  → Admin review di /admin/review
    → Approve → poin otomatis (+ dasar + bonus)
    → Reject → dengan alasan
  → User dapat notifikasi
```

### 8.2 Flow: Donasi
```
User buka halaman donasi
  → Pilih nominal/tier
  → Isi nama (opsional, publik)
  → Klik Donasi
  → POST /api/donations/invoice
    → Server generate invoice ID
    → Panggil Xendit API createInvoice
    → Simpan ke DB (status: pending)
    → Return invoice URL
  → User diarahkan ke halaman Xendit
  → Bayar via transfer/CC/QRIS
  → Xendit kirim webhook ke /api/donations/webhook
    → Verifikasi HMAC signature
    → Update status jadi 'paid'
    → Kirim notifikasi ke user
```

### 8.3 Flow: Poin & Level
```
Laporan di-approve
  → Points engine hitung:
    → Poin dasar (25/50/100/15 — tergantung form)
    → Bonus streak (jika ada)
    → Bonus kualitas (foto lengkap, notes)
    → Bonus milestone (10/50/100 laporan)
  → Simpan ke PointsLog
  → Update Profile.points
  → Update TrustScore (+10)
  → Kirim notifikasi
```

---

## 🛡️ 9. Keamanan

### 9.1 Firewall (UFW)
```bash
Status: active
Allow: 22/tcp (SSH), 80/tcp (HTTP), 443/tcp (HTTPS)
Deny:  semua port lain (5432, 6379, 31759, dll)
```

### 9.2 Fail2ban (2 jails)
```bash
sshd:            5 gagal login → ban 10 menit
nginx-http-auth: 10 gagal → ban 1 jam
```

### 9.3 Nginx Security Headers
```nginx
Strict-Transport-Security  # HSTS 2 tahun
X-Frame-Options: DENY      # Anti clickjacking
X-Content-Type-Options     # Anti MIME sniffing
Referrer-Policy            # Privasi referrer
Permissions-Policy         # Batasi kamera/geolokasi
```

### 9.4 Anti-Spam (Server-side)
| Lapisan | Metode |
|---|---|
| Validasi | Zod schema cocok form di DB |
| Rate Limit | 5 form/hari/user, 30 req/menit/IP |
| Honey Pot | Hidden field — bot isi, manusia tidak |
| Time Gate | Form submit < 3 detik = bot |
| Foto | Validasi MIME + hapus EXIF + kompresi 720p |
| Trust Score | +10 approved, -50 rejected, < 0 = auto-block |

### 9.5 Docker Security
- Non-root user (nextjs) di container web
- Volume terpisah untuk DB + uploads
- Network internal (hanya Nginx yang expose port ke publik)

---

## 🚀 10. Deployment & Infrastruktur

### 10.1 Cara Deploy (update dari GitHub)
```bash
cd /root/springhub

# 1. Backup database
docker compose exec postgres pg_dump -U springhub springhub > backup-$(date +%Y%m%d).sql

# 2. Pull code terbaru
git pull origin master

# 3. Install dependencies + update DB
npm install
npx prisma generate
npx prisma db push         # update schema tanpa migrasi

# 4. Build & restart
docker compose build web
docker compose up -d

# 5. Cek
curl http://localhost:31759/api/health
```

### 10.2 Container Commands
```bash
# Status
docker compose ps

# Logs
docker compose logs web --tail 50 -f
docker compose logs nginx --tail 20
docker compose logs postgres --tail 20

# Restart
docker compose restart web
docker compose down && docker compose up -d

# Rebuild
docker compose build web
docker compose build --no-cache web   # force rebuild
```

### 10.3 Database Commands
```bash
# Masuk ke DB
docker compose exec postgres psql -U springhub -d springhub

# Backup
docker compose exec -T postgres pg_dump -U springhub springhub > backup.sql

# Restore
cat backup.sql | docker compose exec -T postgres psql -U springhub -d springhub

# Seed ulang
npx prisma db push --force-reset && npx prisma db seed
```

### 10.4 File Management
```bash
# Upload foto
ls -la /data/uploads/

# Logs system
journalctl -u docker.service --tail 50
tail -f /var/log/nginx/access.log

# Disk usage
df -h
docker system df
du -sh /root/springhub/node_modules/
```

### 10.5 Backup Routine
```bash
# Backup DB harian (via cron)
0 3 * * * docker compose -f /root/springhub/docker-compose.yml exec -T postgres pg_dump -U springhub springhub | gzip > /root/backup/db-$(date +\%Y\%m\%d).sql.gz

# Backup uploads mingguan
0 4 * * 0 tar -czf /root/backup/uploads-$(date +\%Y\%m\%d).tar.gz /data/uploads/
```

---

## 📁 File Penting di Project

| File | Lokasi | Fungsi |
|---|---|---|
| Docker Compose | `/root/springhub/docker-compose.yml` | Definisi 5 container |
| Nginx Config | `/root/springhub/nginx.conf` | Reverse proxy + security |
| Dockerfile | `/root/springhub/Dockerfile` | Build image Next.js |
| Env Production | `/root/springhub/.env.production` | Environment variables |
| Prisma Schema | `/root/springhub/prisma/schema.prisma` | 18 tabel database |
| Seed Data | `/root/springhub/prisma/seed.ts` | Dummy data lengkap |
| OpenCode Config | `/root/springhub/.opencode/opencode.json` | MCP + agent config |
| Migrasi Plan | `/root/springhub/MIGRASI-VPS.md` | Dokumentasi migrasi VPS |
| Tutorial VPS | `/root/springhub/TUTORIAL-VPS.md` | Panduan lengkap VPS |

---

> **Dibuat**: 30 Juni 2026  
> **Untuk**: Admin SpringHub  
> **Dokumentasi ini mencakup 100% kode yang berjalan di VPS**
