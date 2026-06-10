# SpringHub — Complete Project State
> Saved: 20 Mei 2026
> Repo: https://github.com/Ayatull4h/springhub
> Live: https://springhub.vercel.app

---

## 🔐 Credentials & Access

### Supabase
- Project URL: https://bhelvywlvwlqmvyblwmn.supabase.co
- Anon Key: sb_publishable_pefFmwGmMQPCRsQsYf60pw_Dc4Htng8
- Password: jagasemesta001
- Pooler URL: postgresql://postgres.bhelvywlvwlqmvyblwmn:jagasemesta001@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres

### Test Accounts
| Role | Email | Password |
|---|---|---|
| Admin | admin@springhub.id | admin123 |
| Volunteer | volunteer@springhub.id | vol12345 |
| Ucup Bensing | ucup@springhub.id | ucup123 |

### Vercel
- Project: springhub (triggers: github.com/Ayatull4h/springhub)
- Environment Variables:
  - DATABASE_URL
  - JWT_SECRET = 58a9b0a476dc873fa8c1b1facf6d6fa0cdee9a0f04f9b6b9fce666c02b92
  - NEXT_PUBLIC_SUPABASE_URL
  - NEXT_PUBLIC_SUPABASE_ANON_KEY
  - NEXT_PUBLIC_APP_URL = https://springhub.vercel.app
  - NEXT_PUBLIC_APP_NAME = SpringHub

---

## 📋 What Has Been Built (100%)

### Frontend Pages
- Landing (Hero, Impact Dashboard, Map, Volunteer, Donate, Learning Hub, Media)
- Sign-in, Join, Forgot Password, Reset Password
- Profile (Edit, Points History, Activity, Claim Guest Reports)
- 5 Report Forms (Monitoring, Restoration, Trench, Tree Planting, Seedling)
- Project Proposal (/projects/new)
- Report Issue / Feedback
- FAQ, Help, Privacy, Terms

### Admin Panel (12 pages)
- Dashboard, Users (edit role), Reports (date filter, export CSV), Forms (builder with 11 field types), Donations, Points, Courses (+ PDF upload), Feedback, Review Queue, Projects (+ approve/reject), Content Manager

### Backend API (45+ endpoints)
- Auth: register, login, logout, me, forgot-password, reset-password, claim-guest
- Reports: CRUD + photo upload (sharp 720p, EXIF strip)
- Donations: Xendit invoice + webhook handler
- Forms: static + dynamic from DB
- Admin: full CRUD for all entities
- Content: public read, admin CRUD
- Leaderboard, newsletter, csrf, point rules, notifications

### Database (Supabase Postgres — 16+ tables)
- Profile, Session, Report, ReportPhoto, Project, Donation, PointsLog
- CoursesProgress, PointRule, Course, CourseModule, Form, FormField
- Feedback, ContentBlock
- RLS Policies active on all tables

### Security
- JWT httpOnly cookies (jose + bcrypt)
- CSRF token (double-submit pattern)
- Security Headers (CSP, HSTS, X-Frame-Options, etc.)
- Rate Limiting (10 req/min/IP + 5 form/day/user)
- Honeypot anti-bot + Time Gate (<3s = reject)
- RLS Policies on all tables

### Features
- Dark Mode toggle
- PWA (manifest + service worker)
- i18n EN/ID (470 keys, fully translated)
- Points Engine (base + bonus + milestone + streak)
- Smart Map (OpenStreetMap tiles, auto-refresh 30s, filter checkboxes)
- Pagination on spring details, activities, featured projects
- Notification bell → profile activity

### Media Assets
- public/logo-dark.svg, logo-light.svg (transparent)
- public/favicon.svg (green circle "S")
- public/images/event.png, pers.png, activity.svg, course.svg, project.svg, media.svg, spring.svg
- public/favicon.png, apple-touch-icon.png, manifest.json, sw.js

---

## 🐛 What Still Needs Work

### Minor Issues
| Issue | Location |
|---|---|
| Partner section buttons still vertical? | _senior/components/PartnerSection.tsx |
| Logo not optimized? | components/logo.tsx |
| Map tile loading slow sometimes | components/map/leaflet-map.tsx |

### Not Started
| Feature | Status |
|---|---|
| Xendit donation live | ❌ Need XENDIT_SECRET_KEY |
| Email notification system | ❌ Need Resend/SendGrid |
| Sentry error monitoring | ❌ Nice-to-have |
| Cloudflare DNS setup | ❌ After domain purchase |

---

## 💰 Infrastructure Plan (When Ready)

**Recommended:** $28/month ≈ Rp 434,000
- Vercel Hobby ($0) + Supabase Pro ($25) + Cloudflare R2 ($2) + Resend ($0) + Domain ($1)
- Handles: 3,000 users, 400 DAU, 600 forms/day, 250 donations/day
- Full analysis in SPRINGHUB-INFRASTRUCTURE.md

---

## 📁 Key File Locations

| File | Purpose |
|---|---|
| components/sections/* | All landing page sections |
| app/api/* | All API routes (45+) |
| app/admin/* | All admin pages (12) |
| lib/* | Core logic (auth, forms, points, csrf, upload, geo) |
| messages/en.json, id.json | Translations (470 keys each) |
| supabase/rls-policies.sql | RLS SQL (already executed) |
| _senior/* | Senior rewrite preview (not deployed) |
| dummy/seed-full.ts | Seed script for demo data |

---

## 📝 Notes for Continuing

1. Clone repo: `git clone https://github.com/Ayatull4h/springhub`
2. Install: `npm install`
3. Create .env with the credentials above
4. Run: `npm run dev`
5. The senior rewrite is in `_senior/` folder — view at http://localhost:3000/senior
6. All media content managed via Admin → Content Manager
7. Forms managed via Admin → Forms (builder with 11 field types)
8. Vercel deploys automatically from master branch
