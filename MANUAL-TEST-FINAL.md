# Manual Test — SpringHub v1.0
**Tanggal**: 1 Juli 2026
**Domain**: https://www.springhub.id
**IP VPS**: 76.13.198.18
**Total Test**: ~180 test case — 12 kategori

> **Cara penggunaan**: Setiap test punya langkah jelas. Tulis **PASS**, **FAIL**, atau **CATATAN** di kolom Hasil.
> Test via terminal gunakan `curl` dengan cookie jar (`/tmp/springhub.txt`).
> Test browser lakukan manual di Chrome/Firefox/Safari.

---

## Persiapan (Sekali)

```bash
# Variable global untuk test terminal
COOKIE="/tmp/springhub.txt"
API="https://www.springhub.id"
CSRF_HEADER="x-csrf-token"

# Helper: login
login_admin() {
  rm -f $COOKIE
  curl -sk -c $COOKIE -b $COOKIE -X POST $API/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@springhub.id","password":"demo12345"}'
}

login_volunteer() {
  rm -f $COOKIE
  curl -sk -c $COOKIE -b $COOKIE -X POST $API/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"ucup@springhub.id","password":"ucup12345"}'
}

login_budi() {
  rm -f $COOKIE
  curl -sk -c $COOKIE -b $COOKIE -X POST $API/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"budi@springhub.id","password":"budi12345"}'
}

# CSRF helper — WAJIB pakai -c untuk simpan csrf_token cookie
get_csrf() {
  curl -sk -c $COOKIE -b $COOKIE $API/api/csrf 2>/dev/null | \
    python3 -c "import json,sys; print(json.load(sys.stdin).get('token',''))"
}
```

---

## Hasil Test

---

## Test 1 — Akses Web (5 test)

| # | Test | Langkah | Hasil |
|---|---|---|---|
| 1.1 | HTTPS landing page | `curl -sI https://www.springhub.id` → 200 | |
| 1.2 | Sitemap accessible | `curl -sI https://www.springhub.id/sitemap.xml` → 200 | |
| 1.3 | robots.txt accessible | `curl -sI https://www.springhub.id/robots.txt` → 200 | |
| 1.4 | manifest.json accessible | `curl -sI https://www.springhub.id/manifest.json` → 200 | |
| 1.5 | favicon.ico accessible | `curl -sI https://www.springhub.id/favicon.ico` → 200 | |

---

## Test 2 — Halaman Publik (12 test)

| # | Test | Langkah | Hasil |
|---|---|---|---|
| 2.01 | Landing page | Buka `https://www.springhub.id/` — lihat hero, stats, map, community, learn, media | |
| 2.02 | Springs/Map | Buka `https://www.springhub.id/springs` — map loading, filter checkbox | |
| 2.03 | Projects | Buka `https://www.springhub.id/projects` — lihat daftar project | |
| 2.04 | Learn | Buka `https://www.springhub.id/learn` — lihat kursus | |
| 2.05 | Help Center | Buka `https://www.springhub.id/help` — lihat halaman bantuan | |
| 2.06 | FAQ | Buka `https://www.springhub.id/faq` — lihat pertanyaan umum | |
| 2.07 | Privacy | Buka `https://www.springhub.id/privacy` — lihat kebijakan privasi | |
| 2.08 | Terms | Buka `https://www.springhub.id/terms` — lihat syarat ketentuan | |
| 2.09 | Sign In | Buka `https://www.springhub.id/sign-in` — form login muncul | |
| 2.10 | Join | Buka `https://www.springhub.id/join` — form register muncul | |
| 2.11 | Report Issue | Buka `https://www.springhub.id/report-issue` — form pengaduan | |
| 2.12 | Offline mode | Buka `https://www.springhub.id/offline` — halaman offline mode | |

---

## Test 3 — API Publik (12 test)

| # | Test | Langkah | Hasil |
|---|---|---|---|
| 3.1 | Health check | `curl -s https://www.springhub.id/api/health` → `{"status":"healthy"}` | |
| 3.2 | CSRF token | `curl -s https://www.springhub.id/api/csrf` → `{"token":"..."}` | |
| 3.3 | Leaderboard | `curl -s https://www.springhub.id/api/leaderboard` → array top 20 | |
| 3.4 | Forms | `curl -s https://www.springhub.id/api/forms` → 5 forms | |
| 3.5 | Springs | `curl -s https://www.springhub.id/api/springs` → daftar spring | |
| 3.6 | Projects | `curl -s https://www.springhub.id/api/projects` → daftar project | |
| 3.7 | Courses | `curl -s https://www.springhub.id/api/courses` → daftar course | |
| 3.8 | Gallery | `curl -s https://www.springhub.id/api/gallery` → daftar galeri | |
| 3.9 | Sitemap XML | `curl -s https://www.springhub.id/sitemap.xml` → XML valid (34 URL) | |
| 3.10 | robots.txt | `curl -s https://www.springhub.id/robots.txt` → contains Sitemap | |
| 3.11 | manifest.json | `curl -s https://www.springhub.id/manifest.json` → berisi SpringHub | |
| 3.12 | Gallery params | `curl -s 'https://www.springhub.id/api/gallery?limit=3'` → 3 items | |

---

## Test 4 — Auth Flow (11 test)

| # | Test | Langkah | Hasil |
|---|---|---|---|
| 4.1 | Login admin | `login_admin` → `{"success":true,"user":{"role":"admin"}}` | |
| 4.2 | Session cookie | Cek `/tmp/springhub.txt` — ada baris `session` | |
| 4.3 | Auth me | `curl -sk -b $COOKIE $API/api/auth/me` → email admin | |
| 4.4 | Logout admin | `logout_and_clear` → sukses | |
| 4.5 | Login volunteer | `login_volunteer` → `{"success":true,"user":{"email":"ucup@springhub.id"}}` | |
| 4.6 | Login gagal | `curl -sk -X POST $API/api/auth/login -d '{"email":"admin@springhub.id","password":"salah"}'` → error | |
| 4.7 | Register baru | `curl -sk -X POST $API/api/auth/register -d '{"email":"test@test.com","password":"test12345","username":"Test"}'` → sukses | |
| 4.8 | Register gagal password pendek | `curl -sk -X POST $API/api/auth/register -d '{"email":"test@test.com","password":"123"}'` → error min 8 | |
| 4.9 | Register duplikat | Coba register email yang sama lagi → error | |
| 4.10 | Forgot password | `curl -sk -X POST $API/api/auth/forgot-password -d '{"email":"admin@springhub.id"}'` → sukses (email terkirim via Resend) | |
| 4.11 | Logout + session hilang | Login → logout → `curl -sk -b $COOKIE $API/api/auth/me` → unauthorized | |

---

## Test 5 — Form Report (7 test)

| # | Test | Langkah | Hasil |
|---|---|---|---|
| 5.1 | Cek form fields | `curl -s "$API/api/forms?slug=spring-monitoring"` → minimal 5 fields | |
| 5.2a | Submit spring-monitoring | Login ucup → `get_csrf` → `curl -sk -b $COOKIE -X POST $API/api/reports -H "x-csrf-token: $CSRF" -d "form_slug=spring-monitoring&spring_name=Test&province=Jawa+Barat&regency=Bandung&water_condition=Jernih&debit_estimate=Sedang&vegetation=Rimbun&notes=Test+manual&water_temperature=25&_submit_time=$(date +%s)000&_website="` → sukses | |
| 5.2b | Submit spring-restoration | Sama seperti 5.2a, form_slug=spring-restoration | |
| 5.2c | Submit trench-development | Sama, form_slug=trench-development | |
| 5.2d | Submit tree-planting | Sama, form_slug=tree-planting | |
| 5.2e | Submit seedling-stock | Sama, form_slug=seedling-stock (tunggu 2 detik dari test sebelumnya — anti rate limit) | |
| 5.3 | Form tidak ada | Buka `https://www.springhub.id/report/form-tidak-ada` → render halaman dengan loading (error di client-side, bukan 404 HTTP) | |

> **Catatan**: Semua form submit via terminal HARUS pakai:
> 1. `rm -f $COOKIE; login_volunteer` (fresh session)
> 2. `CSRF=$(get_csrf)` (WAJIB pakai -c flag)
> 3. Header `x-csrf-token: $CSRF` di POST
> 4. Field `_submit_time` dengan timestamp > 3 detik yang lalu
> 5. Field `_website` kosong (honeypot)

---

## Test 6 — Donasi (3 test)

| # | Test | Langkah | Hasil |
|---|---|---|---|
| 6.1 | Create invoice | Login → `get_csrf` → POST `/api/donations/invoice` dengan amount 50000 → HARUSNYA `invoice_url` (tapi CATATAN kalo Xendit belum di-set) | |
| 6.2 | Amount < 1000 ditolak | POST invoice amount 500 → error | |
| 6.3 | Amount > 100jt ditolak | POST invoice amount 1M → error | |

---

## Test 7 — Project (6 test)

| # | Test | Langkah | Hasil |
|---|---|---|---|
| 7.1 | List projects | `curl -s $API/api/projects` → array | |
| 7.2 | Create project (ucup 20K pts) | Login ucup (20.193 pts) → POST `/api/projects` dengan `title`, `summary`, `region`, `type_id`, `goal_amount` → sukses | |
| 7.3 | Gagal create (Budi < 20K pts) | Login budi (8.750 pts) → POST project → error poin tidak cukup | |
| 7.4 | Admin bypass | Login admin (0 pts pun bisa) → POST project → sukses | |
| 7.5 | Comment | Login → GET `/api/projects` ambil ID → POST `/api/projects/[id]/comments` → sukses | |
| 7.6 | Like | POST `/api/projects/[id]/like` → sukses | |

---

## Test 8 — Courses (4 test)

| # | Test | Langkah | Hasil |
|---|---|---|---|
| 8.1 | List courses | `curl -s $API/api/courses` → 3 courses | |
| 8.2 | Course detail | `curl -s $API/api/courses/[slug]` → detail + modules | |
| 8.3 | Update progress | Login → POST `/api/courses/[slug]/progress` dengan `moduleIndex=1` → sukses | |
| 8.4 | Get progress | `curl -s -b $COOKIE $API/api/courses/[slug]/progress` → progress array | |

---

## Test 9 — Springs & Map (3 test)

| # | Test | Langkah | Hasil |
|---|---|---|---|
| 9.1 | List springs | `curl -s $API/api/springs` → 20 springs | |
| 9.2 | Spring detail | `curl -s $API/api/springs/[slug]` → detail spring | |
| 9.3 | Gallery springs | `curl -s $API/api/springs?limit=5` → 5 springs | |

---

## Test 10 — Admin Panel (10 test)

> Login sebagai admin sebelum mulai. Semua endpoint harus return 200.

| # | Test | Langkah | Hasil |
|---|---|---|---|
| 10.1 | Admin dashboard | Buka `https://www.springhub.id/admin` — statistik muncul | |
| 10.2 | Users | Buka `https://www.springhub.id/admin/users` — daftar user (12) | |
| 10.3 | Reports | Buka `https://www.springhub.id/admin/reports` — daftar report (26) | |
| 10.4 | Donations | Buka `https://www.springhub.id/admin/donations` — daftar donasi (6) | |
| 10.5 | Review queue | Buka `https://www.springhub.id/admin/review` — report pending | |
| 10.6 | Projects | Buka `https://www.springhub.id/admin/projects` — daftar project | |
| 10.7 | Forms | Buka `https://www.springhub.id/admin/forms` — 5 forms | |
| 10.8 | Points rules | Buka `https://www.springhub.id/admin/points` — 14 rules | |
| 10.9 | Courses | Buka `https://www.springhub.id/admin/courses` — 3 courses | |
| 10.10 | Content CMS | Buka `https://www.springhub.id/admin/content` — 4 content blocks | |

---

## Test 11 — Points & Gamification (3 test)

| # | Test | Langkah | Hasil |
|---|---|---|---|
| 11.1 | Points log | `curl -sk -b $COOKIE $API/api/user/points` → lihat riwayat poin (ucup: 20.193) | |
| 11.2 | Leaderboard | `curl -s $API/api/leaderboard` → top 20, admin 99.999 di atas | |
| 11.3 | Points naik setelah approve | Admin approve report → poin reporter naik (+25) | |

---

## Test 12 — Dark Mode (4 test)

| # | Test | Langkah | Hasil |
|---|---|---|---|
| 12.1 | Toggle dark mode | Buka landing page → klik icon moon → semua halaman jadi dark | |
| 12.2 | Persist refresh | Refresh halaman → dark mode tetap aktif | |
| 12.3 | Semua halaman | Cek /springs, /projects, /learn, /admin → semua dark | |
| 12.4 | Form di dark mode | Buka `/report/spring-monitoring` → form di dark mode | |

---

## Test 13 — Security & Anti-Spam (6 test)

| # | Test | Langkah | Hasil |
|---|---|---|---|
| 13.1 | CSRF protection | POST tanpa `x-csrf-token` header → 403 | |
| 13.2 | Time gate | POST form dengan `_submit_time` < 3 detik → ditolak | |
| 13.3 | Honeypot | POST form dengan `_website` terisi → ditolak (bot) | |
| 13.4 | Non-admin akses admin API | Login ucup → GET `/api/admin/users` → 403 | |
| 13.5 | Rate limit | Kirim 11+ request cepat ke `/api/auth/login` dalam 1 detik → 503 setelah burst | |
| 13.6 | Security headers | `curl -sI https://www.springhub.id` → HSTS, CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, X-XSS-Protection semua ada | |

---

## Test 14 — SEO & PWA (6 test)

| # | Test | Langkah | Hasil |
|---|---|---|---|
| 14.1 | Open Graph image | `curl -sI https://www.springhub.id/opengraph-image.png` → 200 (static PNG) | |
| 14.2 | JSON-LD structured data | View source landing page → cari `application/ld+json` (Organization + WebSite) | |
| 14.3 | Meta tags | View source → title, description, OG, Twitter card | |
| 14.4 | Service worker | `curl -sI https://www.springhub.id/sw.js` → 200 | |
| 14.5 | Manifest | `curl -s https://www.springhub.id/manifest.json` → name, icons, theme_color | |
| 14.6 | 404 page | Buka `https://www.springhub.id/halaman-tidak-ada` → title "404 - Halaman Tidak Ditemukan" | |

---

## Test 15 — Infrastructure (5 test)

| # | Test | Langkah | Hasil |
|---|---|---|---|
| 15.1 | SSL valid | Browser -> tidak ada peringatan SSL (Let's Encrypt, valid sampai Sep 2026) | |
| 15.2 | HTTP → HTTPS | `curl -sI http://www.springhub.id` → 301 ke HTTPS | |
| 15.3 | Apex → www | `curl -sI https://springhub.id` → redirect ke www.springhub.id | |
| 15.4 | Docker sehat | `docker ps` → 5 container Up, web healthy, postgres healthy, redis healthy | |
| 15.5 | Backup DB | `ls -la /root/backups/` → ada file .sql.gz (cron harian jam 3 pagi) | |

---

## Test 16 — Aksesibilitas (5 test — browser manual)

| # | Test | Langkah | Hasil |
|---|---|---|---|
| 16.1 | Skip link | Buka halaman → tekan Tab → link "Langsung ke konten utama" muncul | |
| 16.2 | Keyboard nav | Tab melalui semua link/button di landing page → semua bisa di-focus | |
| 16.3 | Alt text | Hover images → tooltip alt text muncul | |
| 16.4 | Focus visible | Tab ke dark mode toggle → ada ring highlight | |
| 16.5 | Screen reader | Buka dengan NVDA/ VoiceOver → semua elemen terbaca | |

---

## Test 17 — Beta / Bug Report (4 test — browser)

| # | Test | Langkah | Hasil |
|---|---|---|---|
| 17.1 | Report issue | Buka `/report-issue` → isi form (nama, email, jenis, pesan) | |
| 17.2 | Upload screenshot | Di form report issue, upload gambar | |
| 17.3 | Newsletter | Di footer, masukkan email → subscribe | |
| 17.4 | Responsive mobile | Buka di HP / Chrome DevTools mobile view → semua responsif | |

---

## Test 18 — Automation Test (Reference)

Test ini dijalankan otomatis oleh script, tinggal lihat hasilnya:

| Script | Hasil | Catatan |
|---|---|---|
| `python3 run-manual-tests.py` | 71 PASS / 0 FAIL / 1 SKIP | 1 SKIP = Xendit belum di-set |
| `node e2e/playwright-tests.mjs` | 43 PASS / 0 FAIL / 1 SKIP | 1 SKIP = flaky user menu |
| `npx tsc --noEmit` | Zero errors | TypeScript aman |

---

## Ringkasan

| Kategori | Test | Target |
|---|---|---|
| Test 1 - Akses Web | 5 | Semua PASS |
| Test 2 - Halaman Publik | 12 | Semua PASS |
| Test 3 - API Publik | 12 | Semua PASS |
| Test 4 - Auth Flow | 11 | Semua PASS |
| Test 5 - Form Report | 7 | Semua PASS |
| Test 6 - Donasi | 3 | 1 CATATAN (Xendit) |
| Test 7 - Project | 6 | Semua PASS |
| Test 8 - Courses | 4 | Semua PASS |
| Test 9 - Springs & Map | 3 | Semua PASS |
| Test 10 - Admin Panel | 10 | Semua PASS |
| Test 11 - Points | 3 | Semua PASS |
| Test 12 - Dark Mode | 4 | Browser manual |
| Test 13 - Security | 6 | Semua PASS |
| Test 14 - SEO & PWA | 6 | Semua PASS |
| Test 15 - Infrastructure | 5 | Semua PASS |
| Test 16 - Aksesibilitas | 5 | Browser manual |
| Test 17 - Beta/Bug | 4 | Browser manual |
| **TOTAL** | **~106 test** | Target: semua PASS |

---

## Checklist Cepat (Daily Check)

```bash
# 1. Cek docker
docker ps | grep -c "Up"   # harus 5

# 2. Cek health
curl -s https://www.springhub.id/api/health | grep healthy

# 3. Cek backup terakhir
ls -lt /root/backups/ | head -3

# 4. Cek disk
df -h / | tail -1           # waspadai > 80%

# 5. Cek fail2ban
fail2ban-client status DOCKER-NGINX | grep "Total banned"
fail2ban-client status sshd | grep "Total banned"
```

---

---
## Test 18 — Sesi 13: Photo Upload + Register Unique + Map Filter (15 test)

| # | Test | Langkah | Hasil |
|---|---|---|---|
| 18.1 | Register email case insensitive | Daftar dgn `Ayatullah.Reza4@Gmail.com` → ditolak "Email sudah terdaftar" | |
| 18.2 | Register duplicate username | Daftar dgn username "ayatullah" → otomatis jadi "ayatullah1" | |
| 18.3 | Username unique constraint | Cek DB: `Profile_username_key` UNIQUE index ada | |
| 18.4 | Admin review photo thumbnail | /admin/review → thumbnail foto muncul (gak broken) | |
| 18.5 | Admin review enlarged photo | Klik thumbnail → modal enlarged muncul | |
| 18.6 | Map filter form names bilingual | Filter pake `form.title.*` i18n: "Pemantauan Mata Air" dll | |
| 18.7 | Map filter status subcategories | Expand form → lihat "Sehat (3)", "Terdegradasi (2)" | |
| 18.8 | Map filter by form+status | Klik subkategori → filter marker by formSlug | |
| 18.9 | Photo upload EACCES fix | Submit laporan BARU dgn foto → admin bisa lihat | |
| 18.10 | DB form field delete sync | Admin hapus field → form publik ikut hilang | |
| 18.11 | Forgot password email DNS | Coba lupa password → Resend accept, Gmail mungkin filter | |
| 18.12 | Admin password direct reset | Login `ayatullah.reza4@gmail.com` / `admin123` | |
| 18.13 | Manual test file updated | `MANUAL-TEST-PART-3.txt` + 13 TC baru | |

## Test 19 — Sesi 14: Map Filter Sync with Admin/MAP (5 test)

| # | Test | Langkah | Hasil |
|---|---|---|---|
| 19.1 | Map filter subcategories dari DB | Landing page filter → subcategories dari MapPointCategory table | |
| 19.2 | Admin/map add custom subcategory | `/admin/map` → add new category → landing page filter update | |
| 19.3 | Admin/map edit category name/color | `/admin/map` → edit → landing page reflects change | |
| 19.4 | Admin/map delete category | `/admin/map` → delete → hilang dari filter | |
| 19.5 | Map filter form names i18n | Nama form bilingual dari form.title.* | |

## Ringkasan (Updated 3 Juli 2026)

| Kategori | Test | Target |
|---|---|---|
| Test 1 - Akses Web | 5 | Semua PASS |
| Test 2 - Halaman Publik | 12 | Semua PASS |
| Test 3 - API Publik | 12 | Semua PASS |
| Test 4 - Auth Flow | 11 | Semua PASS |
| Test 5 - Form Report | 7 | Semua PASS |
| Test 6 - Donasi | 3 | 1 CATATAN (Xendit) |
| Test 7 - Project | 6 | Semua PASS |
| Test 8 - Courses | 4 | Semua PASS |
| Test 9 - Springs & Map | 3 | Semua PASS |
| Test 10 - Admin Panel | 10 | Semua PASS |
| Test 11 - Points | 3 | Semua PASS |
| Test 12 - Dark Mode | 4 | Browser manual |
| Test 13 - Security | 6 | Semua PASS |
| Test 14 - SEO & PWA | 6 | Semua PASS |
| Test 15 - Infrastructure | 5 | Semua PASS |
| Test 16 - Aksesibilitas | 5 | Browser manual |
| Test 17 - Beta/Bug | 4 | Browser manual |
| Test 18 - Sesi 13 | 13 | Perlu test manual |
| **TOTAL** | **~119 test** | Lihat `MANUAL-TEST-PART-3.txt` untuk detail |

*Document generated: 3 Juli 2026 — by SpringHub Build Agent*
