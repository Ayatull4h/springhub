# SpringHub — Complete Project Reference

**Author**: Ayatullah Reza Chalid
**Role**: Full-Stack Engineer (Solo Developer)
**Domain**: [www.springhub.id](https://www.springhub.id)
**GitHub**: [github.com/Ayatull4h/springhub](https://github.com/Ayatull4h/springhub)
**Status**: Production — 94% Complete

---

## Daftar Isi

1. [Project Overview](#1-project-overview)
2. [Problem & Solution](#2-problem--solution)
3. [Target Audience](#3-target-audience)
4. [System Architecture](#4-system-architecture)
5. [Tech Stack Detail](#5-tech-stack-detail)
6. [Feature Breakdown](#6-feature-breakdown)
7. [Role & Access Control](#7-role--access-control)
8. [API Surface](#8-api-surface)
9. [Database Schema](#9-database-schema)
10. [Security Implementation](#10-security-implementation)
11. [Infrastructure & DevOps](#11-infrastructure--devops)
12. [Challenges & Solutions](#12-challenges--solutions)
13. [Testing Strategy](#13-testing-strategy)
14. [How to Explain to Interviewers](#14-how-to-explain-to-interviewers)
15. [How to Explain to Clients](#15-how-to-explain-to-clients)
16. [Key Talking Points](#16-key-talking-points)
17. [File Structure Reference](#17-file-structure-reference)

---

## 1. Project Overview

SpringHub adalah platform **community-driven monitoring & restoration** untuk mata air di Indonesia. Dibangun dari 0 oleh satu orang (saya) sebagai **full-stack production-grade product**.

### Tagline
> Protecting Indonesia's precious springs through community monitoring, transparent restoration funding, and real-time impact tracking.

### Status
- **Production**: Sudah live di springhub.id dengan domain, SSL, Cloudflare
- **Complete**: 94% (99% dari sisi fungsional, sisanya production hardening + Xendit API key dari client)
- **Users**: 3 akun demo (admin, volunteer dengan 20K poin, volunteer dengan 8K poin)
- **Data**: 7 proyek seeded, 3 course, 5 form type

### Kenapa Proyek Ini Signifikan
- **Real problem**: 70% mata air Indonesia terancam kritis
- **Real users**: Komunitas, volunteer, admin
- **Real money**: Integrasi Xendit untuk donasi
- **Real impact**: Setiap laporan diverifikasi, proyek didanai langsung
- **Solo full-stack**: Dari design, backend, frontend, DevOps, security — semua saya kerjakan sendiri

---

## 2. Problem & Solution

### Problem
| Aspek | Detail |
|---|---|
| Krisis Air | 70% mata air Indonesia terancam karena erosi, alih fungsi lahan, dan perubahan iklim |
| No Data | Tidak ada data terpusat tentang kondisi mata air — mana yang sehat, mana yang kritis |
| No Transparency | Donasi sering tidak jelas alirannya — donor tidak tahu uangnya dipakai untuk apa |
| Hard to Contribute | Masyarakat ingin membantu tapi tidak tahu caranya |

### Solution
| Aspek | Detail |
|---|---|
| Community Reporting | Siapa pun bisa melaporkan kondisi mata air melalui form yang mudah (online & offline) |
| Points System | Setiap kontribusi dapat poin — gamification untuk sustain engagement |
| Verification | Admin memverifikasi setiap laporan — data terpercaya |
| Transparent Funding | Donasi langsung ke proyek spesifik, progress bisa dipantau real-time |
| Public Map | Semua data tampil di peta interaktif — transparan ke publik |

---

## 3. Target Audience

| Siapa | Kebutuhan Mereka |
|---|---|
| **Interviewer / Tech Lead** | Ingin lihat kemampuan teknis: arsitektur, security, database design, problem-solving |
| **Client / Founder** | Ingin lihat value: apakah platform ini bisa dipakai, bagaimana cara kerja, berapa biaya |
| **Investor** | Ingin lihat traction: user growth, engagement, monetization potential |
| **Volunteer / User** | Ingin lihat cara pakai: gampang atau tidak, apa benefitnya |

---

## 4. System Architecture

```
                          ┌─────────────────────────────┐
                          │       Cloudflare             │
                          │   DNS · Proxy · WAF · SSL   │
                          └─────────────┬───────────────┘
                                        │
                          ┌─────────────▼───────────────┐
                          │          Nginx               │
                          │   Reverse Proxy · Rate Limit │
                          │   SSL Termination · Cache   │
                          └─────────────┬───────────────┘
                                        │
                          ┌─────────────▼───────────────┐
                          │     Next.js 14 (Standalone)  │
                          │   App Router · 54+ API · SSR │
                          └──┬──────────────┬───────────┘
                             │              │
              ┌──────────────▼──┐      ┌────▼──────────────┐
              │  PostgreSQL 16  │      │    Redis 7         │
              │  + PostGIS      │      │ Cache · Queue     │
              │  Prisma ORM     │      │ Rate Limit Store  │
              └─────────────────┘      └───────────────────┘
                             │
              ┌──────────────▼───────────────────────────┐
              │      Queue Worker (BullMQ)                │
              │   Email (Resend) · Points Engine · Sync  │
              └──────────────────────────────────────────┘
```

### Container Architecture (Docker Compose)

| Container | Image | Port | Healthcheck |
|---|---|---|---|
| `springhub-web` | `springhub-web` (custom) | 31759 | ✅ /api/health |
| `springhub-nginx` | `nginx:alpine` | 80, 443 | ✅ |
| `springhub-postgres` | `postgis/postgis:16-3.4-alpine` | 5432 | ✅ pg_isready |
| `springhub-redis` | `redis:7-alpine` | 6379 | ✅ redis ping |
| `springhub-worker` | `springhub-worker` (custom) | — | ✅ /api/health |

---

## 5. Tech Stack Detail

### Frontend

| Teknologi | Versi | Fungsi |
|---|---|---|
| Next.js | 14.2.5 | App Router, SSR, React 18 |
| TypeScript | 5.x | Strict mode (`strict: true`) |
| Tailwind CSS | 3.x | Utility-first, dark mode, custom brand palette |
| Leaflet / react-leaflet | — | Interactive map, dynamic import (SSR=false) |
| lucide-react | — | Icon library |
| next-intl (planned) | — | i18n EN/ID |

### Backend

| Teknologi | Versi | Fungsi |
|---|---|---|
| Next.js API Routes | 14.2.5 | 54+ route.ts — App Router pattern |
| Prisma ORM | 7.8.0 | Type-safe database queries, migrations |
| PostgreSQL | 16 | Primary database with PostGIS |
| Redis | 7 | Cache, BullMQ queue, rate limit store |
| JWT | — | Session auth with key rotation |
| bcryptjs | — | Password hashing (12 salt rounds) |

### Third Party

| Service | Fungsi | Status |
|---|---|---|
| Xendit | Payment gateway — invoice + webhook | 🔶 Production (butuh API key client) |
| Cloudflare | DNS, proxy, WAF, SSL | ✅ Active |
| Resend | Email — notifikasi, forgot password | ✅ Active |
| OpenStreetMap | Map tiles (gratis) | ✅ Active |

### Tools & Infrastructure

| Tool | Fungsi |
|---|---|
| Docker Compose | Container orchestration |
| fail2ban | DOCKER-NGINX jail — block IP abuse |
| BullMQ | Background job queue (email, points, sync) |
| PgBouncer | PostgreSQL connection pooling |
| k6 | Load testing (5 scenarios) |
| Playwright | E2E testing (17 specs) |

---

## 6. Feature Breakdown

### 6.1 User System
- **Register**: Email + password (Zod validation, password policy)
- **Login**: JWT session (7 days), rate limited, lockout after 5 fails
- **Profile**: Username, region, points, history, avatar
- **Roles**: Public → Volunteer → Admin (3-tier)

### 6.2 Report & Monitoring Forms
- **5 form types**: Spring Monitoring, Restoration, Trench, Tree Planting, Seedling Stock
- **Dynamic forms**: Admin bisa membuat form baru melalui panel
- **Anti-spam**: Zod validation + rate limit (5/hari) + honey pot + time gate (3 detik)
- **Photo upload**: Min 3, max 5, MIME validation, EXIF stripped, compressed 720p
- **Geolocation**: One-tap button + manual pin drop + EXIF match
- **Points**: Awarded otomatis saat laporan di-approve

### 6.3 Interactive Map
- **Leaflet** dengan tile OSM
- **Filter** by type (spring, conservation, tree planting, trench)
- **Location snap**: 5km grid untuk privacy publik
- **Precise location**: Hanya admin yang bisa lihat
- **Dynamic markers**: Warna sesuai kategori (dari admin panel)

### 6.4 Points & Gamification
- **Base points**: Monitoring 25, Restoration 100, Trench 50, Planting 50, Seedling 15
- **Bonuses**: Streak (5-50), quality (10), discovery (50+badge), verification (10)
- **Milestones**: 10 reports (50), 50 reports (250), 100 reports (500), 20K threshold (1000)
- **Server-side**: Semua perhitungan poin di server, tidak bisa dimanipulasi
- **Anti-duplicate**: PointsLog check sebelum award

### 6.5 Projects
- **Submission**: User dengan >= 20K poin bisa propose project
- **Workflow**: Pending → Under Review → Approved / Rejected
- **Like**: Toggle like per user (Like model with unique constraint)
- **Comments**: Full CRUD comments
- **Funding**: Progress bar, goal amount, raised amount
- **Featured**: 3 approved projects ditampilkan di landing page

### 6.6 Donation
- **Xendit invoice**: Generate invoice dengan payment methods (OVO, GOPAY, DANA, QRIS)
- **Webhook**: HMAC verification, atomic transaction
- **Points awarded**: 1 point per Rp 1,000 donated
- **Security**: CSRF, rate limit, amount validation, tier cross-check
- **Project-specific**: Donasi bisa langsung ke proyek tertentu

### 6.7 Admin Panel (10 tabs)
| Tab | Fungsi |
|---|---|
| Dashboard | Statistik real-time (users, reports, donations, projects) |
| Users | CRUD user, role management, trust score |
| Reports | List laporan, toggle active/inactive, filter |
| Review Queue | Approve/reject laporan (CSRF protected) |
| Donations | Semua transaksi donasi |
| Projects | Verifikasi project + email notification |
| Forms | Dynamic form builder + field management |
| Points | Point rules CRUD |
| Courses | Course + module management |
| Content | CMS untuk landing page sections |
| Feedback | Bug reports inbox |
| Errors | Error log viewer |

### 6.8 Learning Hub
- Course dengan modules
- Progress tracking per user
- Points awarded on completion (25 default)
- Admin bisa create/edit courses

### 6.9 Offline PWA
- **Full offline surveys**: IndexedDB untuk data + foto
- **Photo compression**: 720p, MIME validation via magic bytes
- **Session cache**: Login session disimpan di IndexedDB
- **Queue sync**: Otomatis sync saat online
- **Service worker**: Cache-first strategy

### 6.10 Security Features
- CSRF token di semua mutation endpoints
- JWT rotation (current + previous secret)
- Login lockout (5 fails → 15 min)
- Rate limiting per endpoint
- Password policy (min 8, uppercase + lowercase + number)
- RLS policies per role
- CSP strict headers
- HSTS, X-Frame-Options, XSS Protection
- fail2ban + Cloudflare WAF

---

## 7. Role & Access Control

### Three-Tier System

| Role | Akses |
|---|---|
| **Public** (no session) | Lihat landing page, map, projects list, courses, leaderboard |
| **Volunteer** (verified) | Submit reports + points + submit projects (if >= 20K pts) |
| **Admin** (session.role === "admin") | All data: email, phone, precise coords, CRUD everything |

### Data Privacy — RLS First

| Data | Publik | Volunteer | Admin |
|---|---|---|---|
| Username, region | ✅ | ✅ | ✅ |
| Snapped location (5km) | ✅ | ✅ | ✅ |
| Precise location | ❌ | ❌ | ✅ |
| Email, phone | ❌ | ❌ | ✅ |
| Donation detail | ❌ (aggregate only) | ❌ | ✅ |
| Trust score | ❌ | ❌ | ✅ |

### Implementation
- **Backend**: `getSession()` reads JWT cookie, verifies with key rotation
- **API Level**: Setiap route check via `session.role === "admin"`
- **Database Level**: Prisma $extends + RLS context per request
- **Project Gate**: `POST /api/projects` checks `profile.points >= 20000 || role === "admin"`

---

## 8. API Surface

### Auth (7 routes)
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | /api/auth/login | Public | Login with rate limit + lockout |
| POST | /api/auth/register | Public | Register with Zod validation |
| POST | /api/auth/logout | Public | Destroy session |
| GET | /api/auth/me | Public | Get current user or null |
| POST | /api/auth/forgot-password | Public | Send reset email |
| POST | /api/auth/reset-password | Public | Reset with token |
| POST | /api/auth/claim-guest | User | Claim guest data after register |

### Projects (4 routes)
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | /api/projects | Public | List approved + under_review projects |
| POST | /api/projects | User | Create project (20K pts gate) |
| GET | /api/projects/:id | Public | Project detail with counts |
| GET/POST | /api/projects/:id/like | Public/User | Check like status / toggle like |
| GET/POST | /api/projects/:id/comments | Public/User | List comments / add comment |

### Donations (2 routes)
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | /api/donations/invoice | Public+CSRF | Create Xendit invoice |
| POST | /api/donations/webhook | Public | Xendit callback (HMAC) |

### Reports (6 routes)
| Method | Path | Auth | Description |
|---|---|---|---|
| GET/POST | /api/reports | User | List public reports / submit report |
| GET | /api/reports/:id | User | Report detail |
| POST | /api/reports/:id/photos | User | Upload photo |
| DELETE | /api/reports/:id/photos/:photoId | User | Delete photo |

### Courses (3 routes)
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | /api/courses | Public | List courses |
| GET | /api/courses/:slug | Public | Course detail with modules |
| GET/PUT | /api/courses/progress | User | Get progress / update + award points |

### Admin (25 routes)
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | /api/admin/users | Admin | List users |
| GET/PUT/DELETE | /api/admin/users/:id | Admin | CRUD user |
| GET | /api/admin/reports | Admin | All reports |
| POST | /api/admin/reports/:id/approve | Admin+CSRF | Approve + award points |
| POST | /api/admin/reports/:id/reject | Admin+CSRF | Reject |
| GET | /api/admin/donations | Admin | All donations |
| GET/PATCH | /api/admin/projects/:id | Admin+CSRF | Approve/reject project |
| GET/POST | /api/admin/forms | Admin | CRUD forms |
| GET/POST | /api/admin/courses | Admin | CRUD courses |
| GET/POST | /api/admin/content | Admin | CRUD content blocks |
| GET/POST | /api/admin/point-rules | Admin | CRUD point rules |
| GET | /api/admin/export | Admin | CSV export |
| +12 more | | | |

### Public (14 routes)
Map points, map types, springs, gallery, leaderboard, dashboard, newsletter, feedback, CSRF, health, upload presign, notifications, content, point-rules.

**Total**: 55+ route files, ~61 API endpoints

---

## 9. Database Schema

### Prisma Models (16 models)

```
Profile (22 fields)
├── id, email (unique), passwordHash, username (unique), role (enum)
├── phone, phoneVerified, region, points, trustScore
├── createdAt, updatedAt
└── relations: reports, donations, projects, pointsLogs, sessions, courses, comments, likes

Session (6 fields)
├── id, profileId (FK), token (unique), expiresAt, createdAt
└── relations: profile

Spring (12 fields)
├── id, name, snappedLat/Lng, province, regency, village, subdistrict
├── isDummy, createdAt, updatedAt
└── relations: reports

Report (11 fields)
├── id, userId (FK), formSlug, status (enum), fieldData (JSONB)
├── preciseLat/Lng, snappedLat/Lng, reviewedBy (FK), reviewNote
├── createdAt
└── relations: user, reviewer, photos, pointsLogs

ReportPhoto (7 fields)
├── id, reportId (FK), fieldId, storagePath, mimeType, width, height

Project (16 fields)
├── id, userId (FK), title, summary, region, typeId, status (enum)
├── goalAmount, raisedAmount, likes (counter), comments (counter)
├── contactName/Email/Phone, proposalFile
├── createdAt, updatedAt
└── relations: user, donations, comments, likes

Donation (12 fields)
├── id, userId (FK), projectId (FK), invoiceId, externalId
├── amountIdr, tierId, donorName, donorEmail, status (enum)
├── paidAt, expiresAt, createdAt
└── relations: user, project

PointsLog (6 fields)
├── id, userId (FK), guestId, reportId (FK), amount, reason, metadata (JSON)

Comment (4 fields)
├── id, projectId (FK), userId (FK), text, createdAt
└── relations: project, user

Like (4 fields)  ← NEW
├── id, projectId (FK), userId (FK), createdAt
├── UNIQUE (userId, projectId)
└── relations: project, user

Notification (7 fields)
├── id, userId (FK), type, title, message, link, isRead

Course (8 fields)
├── id, title, slug (unique), description, icon, sortOrder, isActive

CourseModule (8 fields)
├── id, courseId (FK), title, slug, content, sortOrder, estimatedMinutes

CoursesProgress (5 fields)
├── id, userId (FK), courseId, courseSlug, completedModules, totalModules, completed
├── UNIQUE (userId, courseSlug)

PointRule (6 fields)
├── id, name, description, points (Int), category, icon

Form (10 fields)
├── id, slug (unique), title, description, icon, mapTypeId, isActive, pointsOnSubmit

FormField (8 fields)
├── id, formId (FK), type, label, key, required, options (JSON), sortOrder

ContentBlock (8 fields)
├── id, section, type, title, subtitle, description, imageUrl, linkUrl

OfflineSession, TrackingPoint, Feedback, AppError
├── Supporting models for offline sync, tracking, feedback, error logging
```

### Key Indexes
- Profile: `index(role)`, `index(points DESC)`
- Report: `index(userId)`, `index(formSlug)`, `index(status)`, `index(createdAt DESC)`
- Project: `index(status)`, `index(createdAt DESC)`
- Donation: `index(status)`, `index(userId)`, `index(projectId)`
- Comment: `index(projectId, createdAt)`
- Like: `index(projectId)`, `UNIQUE(userId, projectId)`
- PointsLog: `index(userId)`
- Notification: `index(userId, isRead)`, `index(userId, createdAt)`

---

## 10. Security Implementation

### Authentication
- **JWT**: HS256, 7-day expiry, stored in httpOnly secure cookie
- **Key rotation**: `verifyJwtWithRotation()` — coba current `JWT_SECRET`, fallback ke `JWT_SECRET_PREVIOUS`
- **Password**: bcryptjs with 12 salt rounds
- **Lockout**: 5 failed attempts → 15 minute lock via Redis

### Authorization
- **Route-level**: `getSession()` + role check di setiap route
- **CSRF**: Setiap admin mutation endpoint wajib `verifyCsrfToken()` dari header `x-csrf-token`
- **Project gate**: Backend check `profile.points >= 20000 || role === "admin"`

### Data Protection
- **RLS**: Prisma $extends dengan context per request
- **PII never exposed**: Email, phone, precise location tidak pernah di endpoint publik
- **Location snap**: 5km grid snapping via `lib/geo.ts`
- **Trust score**: +10 per accepted, -50 per rejected, < 0 = auto-block

### Rate Limiting
- **Global**: 30 req/s per IP
- **Auth**: 5 req/s
- **Donate**: 3 req/s
- **Report**: 1 req/s
- **Newsletter**: 2 req/m
- **Connection**: 10 concurrent per IP

### Headers & Infrastructure
- **CSP**: Strict policy — script-src, style-src, img-src, connect-src, frame-src, form-action
- **HSTS**: max-age=63072000, includeSubDomains, preload
- **X-Frame-Options**: DENY
- **X-Content-Type-Options**: nosniff
- **X-XSS-Protection**: 1; mode=block
- **Referrer-Policy**: strict-origin-when-cross-origin
- **Permissions-Policy**: camera, geolocation, microphone restricted
- **Cloudflare WAF**: Additional layer
- **fail2ban**: NGINX jail for IP blocking

---

## 11. Infrastructure & DevOps

### Hosting
| Spec | Detail |
|---|---|
| Provider | Hostinger VPS |
| CPU | 4 vCPU |
| RAM | 8 GB |
| Storage | 100 GB NVMe |
| OS | Ubuntu (Docker) |

### Deployment
```
Push ke GitHub → Docker compose build → Docker compose up -d → Nginx restart
```
Sederhana, no CI/CD pipeline complex. Cukup `git push` lalu `docker compose build && docker compose up -d` di server.

### Monitoring
- **Healthcheck**: Docker HEALTHCHECK tiap container
- **Heartbeat**: Setiap 5 menit
- **Backup**: Daily pg_dump jam 3am, rotated 7 hari
- **Error logging**: AppError model + admin panel viewer

### Firewall & Security
- **Cloudflare**: WAF, DDoS protection, rate limiting
- **fail2ban**: DOCKER-NGINX jail — block IP setelah N attempts
- **Nginx**: Rate limiting zones per endpoint type
- **Docker**: Container isolation, no root inside containers

### SSL
- Let's Encrypt via certbot
- Auto-renewal
- TLS 1.2 + 1.3 only
- Secure ciphersuite

---

## 12. Challenges & Solutions

| # | Challenge | Context | Solution |
|---|---|---|---|
| 1 | **Offline photo upload broken on Chrome Android** | PWA offline mode — foto gagal upload karena `canvas.toBlob()` produce blob dengan `type: ""` | Fallback: jika blob type kosong, deteksi MIME via magic bytes (`detectMimeFromBuffer`), re-create blob dengan `new Blob([data], { type: "image/jpeg" })` |
| 2 | **CSRF token stale on tab switch** | Token di-fetch saat mount (useEffect) → disimpan di state → tab lain buka di antara mount dan submit → cookie di-rotate → state mismatch | **Just-in-time fetch**: Token di-fetch pas mau submit, bukan saat mount |
| 3 | **Nginx 502 from bot flood** | Server kena banjir request dari bot scanning (Drupal, WordPress, dll) | Cloudflare WAF + fail2ban DOCKER-NGINX jail + nginx rate limiting per IP |
| 4 | **Prisma shadow database migration error** | Migration `20260615_add_rls_policies` error karena schema `auth` tidak ada | Gunakan `prisma db push` sebagai alternatif — sync schema langsung tanpa shadow database |
| 5 | **Dark mode inkonsisten di 15+ file** | Ada komponen yang pake `bg-white` langsung tanpa `dark:` variant | Audit manual semua halaman + ganti CSS selector `.card.shadow-*` → `[class*=shadow-]` |
| 6 | **Offline sync session cookie gak terkirim** | PWA standalone mode — cookie `SameSite: "strict"` tidak compatible | Ganti `sameSite: "lax"` untuk PWA compatibility |
| 7 | **Like duplicate prevention** | Awalnya like hanya increment counter tanpa check duplicate | Buat `Like` model dengan `@@unique([userId, projectId])` — toggle like/unlike |
| 8 | **Project detail page 404** | API route `GET /api/projects/[id]` tidak ada — frontend selalu fallback ke dummy data | Buat route baru `app/api/projects/[id]/route.ts` |
| 9 | **FeaturedProjects gak muncul di SSR** | Komponen pake loading state → render spinner di server → user lihat kosong | Hapus loading gate, langsung render dengan dummy data, update setelah fetch |

---

## 13. Testing Strategy

### Manual Testing — 155 Test Cases (19 Categories)

| Category | Tests | Coverage |
|---|---|---|
| Website | 6 | Landing, HTTPS, 404, Favicon, Dark mode |
| Login & Register | 8 | Login, wrong password, lockout, register, validation |
| Admin | 18 | Dashboard, Users, Reports, Queue, Map, Forms |
| Forms & Reports | 11 | 5 form types, validation, upload, CSRF, geolocation |
| Map | 6 | Leaflet, filters, markers, popups, scroll zoom |
| Points & Leaderboard | 6 | Award, streak, milestone, threshold |
| Donation | 5 | Xendit invoice, amount validation, webhook |
| Security | 9 | CSRF, rate limit, XSS, SQL injection, data privacy |
| Dark Mode | 5 | All pages, admin panel, map, forms, logo |
| Profile | 4 | Info, points history, password change, logout |
| Admin CRUD | 8 | Courses, forms, content, export, error logs |
| API Endpoints | 10 | Health, forms, map, leaderboard, admin, export |
| Storage & Backup | 4 | Disk usage, build cache, database, photos |
| Offline PWA | 10 | Setup, survey, photos, sync, PWA icon |
| Course & Points | 4 | Complete course, edit points, form points, DB override |
| Route Map | 3 | Graph, filter, click node |
| Project & Like | 6 | Featured, pagination, detail, like toggle, comments |
| API Routing | 8 | All project endpoints + course progress |
| Aksi Nyata Section | 4 | Layout, blue theme, donate card, spacing |

### Automated Testing
| Type | Tool | Count | What |
|---|---|---|---|
| E2E | Playwright | 17 specs | Guest, volunteer, admin, offline, UI consistency |
| Load | k6 | 5 scenarios | API throughput, auth burst, report, donation, concurrent |
| Unit | Jest | 3 files | Zod schemas, form mapping, auth parsing |

---

## 14. How to Explain to Interviewers

### Elevator Pitch (30 detik)
> "Saya membangun SpringHub dari 0 — sebuah platform untuk monitoring dan restorasi mata air Indonesia. Ini bukan side project biasa: production-grade dengan 54+ API endpoints, PostgreSQL 16 dengan 16 model, Redis untuk caching dan queue, integrasi pembayaran Xendit, PWA offline-first, dan keamanan berlapis dari CSRF sampai JWT key rotation. Semua saya kerjakan sendiri — dari design database, frontend, backend, DevOps, sampai deployment di VPS dengan Docker."

### Deep Dive (5-10 menit)

**1. Architecture**
- "Saya pakai Next.js 14 App Router untuk frontend dan backend — jadi satu framework untuk semuanya. Di belakangnya ada PostgreSQL 16 dengan Prisma ORM, Redis 7 untuk caching dan queue, dan nginx sebagai reverse proxy."
- "Yang menarik: karena ini platform real dengan user, saya harus pikirkan connection pooling (PgBouncer), rate limiting per endpoint, dan healthcheck tiap container."

**2. Database Design**
- "Ada 16 model Prisma. Yang paling challenging adalah Report — karena punya field_data JSONB (dynamic form), precise+snapped location untuk privacy, dan foto dengan validasi MIME."
- "Saya juga bikin Like model dengan unique constraint (userId, projectId) untuk cegah spam like — lebih reliable daripada sekedar increment counter."

**3. Security**
- "Keamanan adalah prioritas karena ini handle data real dan uang. Saya implementasi CSRF di setiap mutation endpoint, JWT dengan key rotation, login lockout via Redis, rate limiting 5 layer, dan RLS policies di level database."
- "Password wajib 8+ karakter dengan uppercase+lowercase+number. Trust score untuk anti-spam. Dan data sensitif seperti email dan lokasi presisi tidak pernah ke frontend publik."

**4. PWA Offline**
- "Ini yang paling tricky. User harus bisa isi form di daerah tanpa sinyal — foto termasuk. Saya pakai IndexedDB untuk cache data, canvas compression untuk foto (720p), dan queue sync otomatis saat online."
- "Challenge: Chrome Android kadang produce blob kosong. Solusi: deteksi MIME via magic bytes, bukan dari file.type."

**5. Payment Integration**
- "Integrasi Xendit untuk donasi. Saya bikin invoice generation, webhook handler dengan HMAC verification, dan atomic transaction — jadi saat pembayaran sukses, status donation UPDATE + points AWARD dalam satu transaksi."

**6. Solo Development**
- "Ini proyek solo — dari design, kode, testing, sampai deployment. Total 54+ route.ts, 40+ komponen React, 155 test case manual. Build zero error, lint zero warning."

---

## 15. How to Explain to Clients

### Value Proposition (1 menit)
> "SpringHub adalah platform yang memungkinkan siapa pun untuk berkontribusi dalam menyelamatkan mata air Indonesia. Caranya: laporkan kondisi mata air melalui form online atau offline, dapatkan poin untuk setiap kontribusi, dan danai langsung proyek restorasi yang terverifikasi. Semua transparan — dari data, peta, sampai aliran donasi."

### Key Selling Points

**Untuk Donatur**
- "Anda bisa lihat proyek mana yang butuh dana, berapa progress-nya, dan donasi Anda langsung ke proyek itu — bukan ke organisasi yang tidak jelas."
- "Setiap donasi bisa dipantau: setelah bayar lewat Xendit (QRIS, GoPay, OVO, Dana), donasi langsung tercatat dan Anda dapat notifikasi."

**Untuk Volunteer / Relawan**
- "Isi form monitoring — dapat poin. Semakin banyak laporan, semakin tinggi poin. Street harian dapat bonus. Milestone 10/50/100 laporan dapat bonus besar."
- "Kalo udah 20.000 poin, bisa ajukan proyek restorasi sendiri."

**Untuk Pemerintah / NGO**
- "Data kondisi mata air terkumpul secara real-time dari komunitas — jadi Anda punya database untuk pengambilan keputusan."
- "Peta interaktif dengan filter tipe lokasi. Bisa lihat tren: mana daerah yang kritis, mana yang butuh intervensi."

### Biaya & Sustainability
- "Server: Hostinger VPS 4 CPU 8GB — ~Rp 373K/bulan"
- "Domain: springhub.id"
- "Xendit: biaya per transaksi (standard payment gateway)"
- "Email: Resend (free tier untuk dev, pay-as-you-go untuk production)"

---

## 16. Key Talking Points

### For Interviewers — Technical Depth

| Topik | Yang Bisa Dijual |
|---|---|
| **Database** | "Desain 16 model dengan RLS, JSONB untuk dynamic forms, PostGIS untuk geospasial" |
| **Security** | "CSRF + JWT rotation + login lockout + rate limiting + trust score — dibangun dari awal, bukan copy-paste" |
| **Performance** | "Redis caching, PgBouncer pooling, nginx caching static files, Next.js SSR" |
| **Testing** | "155 test case manual + 17 E2E Playwright + 5 k6 load test + 3 unit test" |
| **DevOps** | "Docker Compose 5 container, fail2ban, daily backup, healthcheck, nginx rate limiting" |
| **PWA** | "Offline-first dengan IndexedDB, photo compression, queue sync — solved real Chrome Android bug" |
| **Payment** | "Xendit integration with HMAC webhook + atomic transaction + points award" |
| **Solo** | "Saya sendiri yang buat semua — menunjukkan kemampuan full-stack, problem-solving, dan ownership" |

### For Clients — Business Value

| Topik | Yang Bisa Dijual |
|---|---|
| **Transparency** | "Setiap laporan diverifikasi, setiap donasi tercatat, data real-time di peta" |
| **Engagement** | "Points system + leaderboard + milestones — gamification untuk sustain volunteer" |
| **Low Cost** | "Server Rp 373K/bulan, bisa handle ribuan user" |
| **Scalable** | "Arsitektur containerized — tinggal scale vertikal kalau traffic naik" |
| **Secure** | "Data aman dengan RLS, encryption, CSRF — sudah diaudit" |
| **Proven** | "Sudah production dengan real domain, SSL, Cloudflare" |

---

## 17. File Structure Reference

```
springhub/
├── app/                          # Next.js 14 App Router
│   ├── page.tsx                  # Landing page (10 components)
│   ├── layout.tsx                # Root layout + metadata
│   ├── loading.tsx               # Skeleton loading
│   ├── not-found.tsx             # 404 page
│   ├── error.tsx                 # Error boundary
│   ├── globals.css               # Tailwind + custom classes
│   ├── (auth)/                   # Sign-in, Join (register)
│   ├── admin/                    # Admin panel (10 tabs)
│   ├── projects/                 # Projects list + detail + new
│   ├── report/[slug]/            # Dynamic forms (5 types)
│   ├── learn/                    # Learning hub
│   ├── profile/                  # User profile
│   ├── offline/                  # PWA offline page
│   ├── api/                      # 54+ route.ts
│   │   ├── auth/                 # 7 routes
│   │   ├── projects/             # 3 routes
│   │   ├── donations/            # 2 routes
│   │   ├── reports/              # 6 routes
│   │   ├── courses/              # 3 routes
│   │   └── admin/                # 25 routes
│   └── ...
├── components/
│   ├── sections/                 # Landing page sections
│   │   ├── hero.tsx
│   │   ├── impact-dashboard.tsx
│   │   ├── spring-map.tsx
│   │   ├── volunteer.tsx
│   │   ├── featured-projects.tsx
│   │   ├── learning-hub.tsx
│   │   ├── media.tsx
│   │   └── donate.tsx
│   ├── map/                      # Map components
│   ├── projects/                 # Project components
│   ├── ui/                       # UI primitives (skeleton, etc.)
│   └── skeleton/                 # Skeleton loading states
├── lib/
│   ├── auth.ts                   # JWT session management
│   ├── prisma.ts                 # Prisma client + error handling
│   ├── prisma-rls.ts             # RLS extension
│   ├── jwt.ts                    # JWT verification with rotation
│   ├── csrf.ts                   # CSRF token
│   ├── xendit.ts                 # Xendit integration
│   ├── forms.ts                  # Form schemas
│   ├── geo.ts                    # Geospatial utilities
│   ├── data.ts                   # Constants + dummy data
│   ├── email.ts                  # Resend email
│   ├── rate-limit.ts             # Rate limiting with Redis
│   ├── audit.ts                  # Audit trail
│   ├── offline-db.ts             # IndexedDB for PWA
│   └── utils.ts                  # Utility functions
├── prisma/
│   ├── schema.prisma             # 16 models
│   ├── seed.ts                   # Seed data (users, forms, courses)
│   └── migrations/               # SQL migrations
├── public/
│   ├── robots.txt
│   ├── sitemap.xml
│   ├── api-routes.html           # Interactive route map
│   └── vis-network.min.js        # Graph visualization
├── SPRINGHUB-PITCH/
│   ├── presentation.pptx         # Portfolio PPT (14 slides)
│   ├── presentation.pdf          # Portfolio PDF
│   ├── project-reference.md      # ← This file
│   └── screenshots/              # 7 production screenshots
├── docker-compose.yml            # 5 containers
├── nginx.conf                    # Full nginx configuration
├── Dockerfile                    # Next.js standalone build
├── next.config.mjs
└── package.json
```

---

> **Final Note**: Proyek ini bukan sekadar coding — tapi membangun produk nyata dari 0 sampai production. Setiap baris kode punya alasan, setiap keputusan arsitektur punya pertimbangan. Ini yang membedakan dari tutorial project biasa.
>
> *"I don't just build apps. I build systems that work, scale, and survive real users."*
