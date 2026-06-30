# Manual Test — SpringHub v1.0
**Tanggal**: 30 Juni 2026
**Domain**: https://www.springhub.id
**IP VPS**: 76.13.198.18
**Total Test**: 120+ test case — 12 kategori

> **Cara penggunaan**: Setiap test punya langkah jelas. Centang kolom **Hasil** setelah diuji.
> Test via terminal gunakan `curl` dengan cookie jar (`/tmp/springhub.txt`).

---

## Persiapan (Sekali)

```bash
# Variable global untuk test terminal
COOKIE="/tmp/springhub.txt"
API="https://www.springhub.id"

# Helper: login
login_admin() {
  curl -sk -c $COOKIE -b $COOKIE -X POST $API/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@springhub.id","password":"demo12345"}'
}

login_volunteer() {
  curl -sk -c $COOKIE -b $COOKIE -X POST $API/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"volunteer@springhub.id","password":"vol12345"}'
}

# Helper: ambil CSRF token
get_csrf() {
  curl -sk -b $COOKIE $API/api/csrf | python3 -c \
    "import json,sys; print(json.load(sys.stdin).get('token',''))"
}

# Helper: submit time (harus >3 detik dari page load)
past_time() {
  echo "$(date +%s)000 - 15000" | bc
}
```

---

## 🟢 Test 1 — Akses Web (5 test)

| # | Test | Langkah | Hasil |
|---|---|---|---|
| 1.1 | HTTPS www | Buka `https://www.springhub.id` | ☐ |
| 1.2 | HTTPS apex → redirect | Buka `https://springhub.id` → harus redirect ke `www.springhub.id` | ☐ |
| 1.3 | HTTP → HTTPS | Buka `http://www.springhub.id` → harus redirect ke HTTPS | ☐ |
| 1.4 | Akses via IP | Buka `http://76.13.198.18` → harusnya tampil halaman (Nginx) | ☐ |
| 1.5 | SSL valid | Browser TIDAK boleh kasih peringatan "Not Secure" | ☐ |

```bash
# Via terminal
curl -sk -o /dev/null -w "%{http_code}" https://www.springhub.id       # → 200
curl -sk -o /dev/null -w "%{http_code}" https://springhub.id            # → 200 (redirect)
curl -s -o /dev/null -w "%{http_code}" http://www.springhub.id          # → 301/302
curl -sk -o /dev/null -w "%{http_code}" http://76.13.198.18             # → 200
curl -skI https://www.springhub.id | grep -i "SSL certificate\|subject" # valid
```

---

## 🟢 Test 2 — Halaman Publik (11 test)

Buka setiap halaman di browser → pastikan status 200 dan konten tampil.

| # | Halaman | Langkah | Hasil |
|---|---|---|---|
| 2.1 | `/` Landing Page | Buka → scroll semua section (Hero, Impact, Map, Activity, Learning, Media) | ☐ |
| 2.2 | `/springs` | Buka → peta Leaflet dengan marker mata air muncul | ☐ |
| 2.3 | `/projects` | Buka → daftar proyek restorasi tampil | ☐ |
| 2.4 | `/learn` | Buka → daftar kursus edukasi tampil | ☐ |
| 2.5 | `/about` | Buka → halaman Tentang tampil | ☐ |
| 2.6 | `/help` | Buka → halaman Bantuan tampil | ☐ |
| 2.7 | `/faq` | Buka → halaman FAQ tampil | ☐ |
| 2.8 | `/privacy` | Buka → Kebijakan Privasi tampil | ☐ |
| 2.9 | `/terms` | Buka → Syarat & Ketentuan tampil | ☐ |
| 2.10 | `/sign-in` | Buka → form login (email + password) | ☐ |
| 2.11 | `/join` | Buka → form register | ☐ |

```bash
for path in "" springs projects learn about help faq privacy terms sign-in join; do
  code=$(curl -sk -o /dev/null -w "%{http_code}" "$API/$path")
  echo "$path → $code"
done
```

---

## 🟢 Test 3 — API Publik (12 test)

### 3.1 Health Check
```bash
curl -sk $API/api/health
# → {"status":"healthy","database":"ok","redis":"ok","uptime":12345}
```

### 3.2 CSRF Token
```bash
curl -sk $API/api/csrf
# → {"token":"eyJ..."}
```

### 3.3 Leaderboard
```bash
curl -sk $API/api/leaderboard
# → {"leaderboard":[...],"totalReports":15,"totalVolunteers":5}
```

### 3.4 Point Rules
```bash
curl -sk $API/api/point-rules
# → {"rules":[...]} — daftar aturan poin
```

### 3.5 Dashboard Stats
```bash
curl -sk $API/api/dashboard
# → {"total":15,"healthy":...,"restoration":...,"users":...,"donations":...}
```

### 3.6 Springs
```bash
curl -sk $API/api/springs
# → {"springs":[...]} — 12 mata air dengan snapped lat/lng
```

### 3.7 Projects
```bash
curl -sk $API/api/projects
# → {"projects":[...],"total":4}
```

### 3.8 Courses
```bash
curl -sk $API/api/courses
# → {"courses":[...]} — 3 kursus dengan modul
```

### 3.9 Gallery
```bash
curl -sk $API/api/gallery
# → {"items":[...]} — foto-foto dari report approved
```

### 3.10 Sitemap
```bash
curl -sk $API/sitemap.xml | head -5
# → XML dengan 30 URL
```

### 3.11 robots.txt
```bash
curl -sk $API/robots.txt
# → Allow: /, Sitemap: https://...
```

### 3.12 manifest.json (PWA)
```bash
curl -sk $API/manifest.json
# → JSON manifest PWA
```

| # | Endpoint | Perintah | Hasil |
|---|---|---|---|
| 3.1 | `GET /api/health` | `curl -sk $API/api/health` | ☐ `{"status":"healthy"}` |
| 3.2 | `GET /api/csrf` | `curl -sk $API/api/csrf` | ☐ `{"token":"..."}` |
| 3.3 | `GET /api/leaderboard` | `curl -sk $API/api/leaderboard` | ☐ 200 + array |
| 3.4 | `GET /api/point-rules` | `curl -sk $API/api/point-rules` | ☐ 200 |
| 3.5 | `GET /api/dashboard` | `curl -sk $API/api/dashboard` | ☐ 200 |
| 3.6 | `GET /api/springs` | `curl -sk $API/api/springs` | ☐ 200 + 12 springs |
| 3.7 | `GET /api/projects` | `curl -sk $API/api/projects` | ☐ 200 |
| 3.8 | `GET /api/courses` | `curl -sk $API/api/courses` | ☐ 200 + 3 courses |
| 3.9 | `GET /api/gallery` | `curl -sk $API/api/gallery` | ☐ 200 |
| 3.10 | `GET /sitemap.xml` | `curl -sk $API/sitemap.xml` | ☐ XML 30 URL |
| 3.11 | `GET /robots.txt` | `curl -sk $API/robots.txt` | ☐ 200 |
| 3.12 | `GET /manifest.json` | `curl -sk $API/manifest.json` | ☐ 200 |

---

## 🟢 Test 4 — Auth Flow (11 test)

### Persiapan: login admin
```bash
login_admin
```

| # | Test | Langkah / Perintah | Hasil |
|---|---|---|---|
| 4.1 | Login admin | `login_admin` + cek response | ☐ `{"success":true,"user":{"role":"admin"}}` |
| 4.2 | Login volunteer | `login_volunteer` | ☐ `{"success":true,"user":{"role":"volunteer"}}` |
| 4.3 | Session cookie | `cat $COOKIE` → ada baris `session` | ☐ cookie ter-set |
| 4.4 | GET /api/auth/me | `curl -sk -b $COOKIE $API/api/auth/me` | ☐ `{"id":"...","email":"admin@springhub.id"}` |
| 4.5 | Login gagal (salah password) | `curl -sk -X POST $API/api/auth/login -H "Content-Type: application/json" -d '{"email":"admin@springhub.id","password":"wrong"}'` | ☐ `{"error":"..."}` (401) |
| 4.6 | Register baru | `curl -sk -X POST $API/api/auth/register -H "Content-Type: application/json" -d '{"email":"test$(date +%s)@test.com","password":"test12345","username":"Test User"}'` | ☐ `{"success":true}` |
| 4.7 | Register gagal (password pendek) | `curl -sk -X POST $API/api/auth/register -H "Content-Type: application/json" -d '{"email":"test@test.com","password":"123"}'` | ☐ error validasi |
| 4.8 | Register duplikat email | Coba register dengan email yang sudah ada | ☐ error |
| 4.9 | Forgot password | `curl -sk -X POST $API/api/auth/forgot-password -H "Content-Type: application/json" -d '{"email":"admin@springhub.id"}'` | ☐ `{"success":true}` (email terkirim) |
| 4.10 | Logout | `curl -sk -X POST -b $COOKIE $API/api/auth/logout` | ☐ `{"success":true}` |
| 4.11 | Session hilang setelah logout | `curl -sk -b $COOKIE $API/api/auth/me` | ☐ `{"error":"..."}` (401) |

---

## 🟢 Test 5 — Form Report (10 test)

### 5.1 — Cek semua form punya field foto (type=photo)
```bash
for slug in spring-monitoring spring-restoration trench-development tree-planting seedling-stock; do
  echo "=== $slug ==="
  curl -sk "$API/api/forms/$slug" | python3 -c "
import json,sys
data = json.load(sys.stdin)
for f in data['form']['fields']:
  if 'photo' in f['fieldId'].lower():
    print(f'  {f[\"fieldId\"]}: type={f[\"type\"]}, required={f[\"required\"]}')
"
done
```

### 5.2 — Submit form via browser
| # | Langkah | Hasil |
|---|---|---|
| 1 | Buka `https://www.springhub.id/report/spring-monitoring` | ☐ |
| 2 | Isi semua field (Nama, Provinsi dropdown, Kota, Tanggal, Kondisi debit, Kualitas, Kebersihan) | ☐ |
| 3 | Upload **3 foto** via tombol "Pilih File" | ☐ counter jadi `3 / 5` |
| 4 | Klik tombol lokasi (📍) → izinkan GPS | ☐ lokasi terisi |
| 5 | Klik **Kirim Laporan** | ☐ |
| 6 | Muncul halaman sukses "Laporan terkirim" | ☐ |

### 5.3 — Submit form gagal (foto < 3)
| # | Langkah | Hasil |
|---|---|---|
| 1 | Buka form, upload **0-2 foto** saja | ☐ |
| 2 | Klik Kirim | ☐ error "Minimal 3 foto" |

### 5.4 — Submit form via terminal (5 form berbeda)
```bash
login_volunteer
CSRF=$(get_csrf)
PAST=$(past_time)

# Spring Monitoring
curl -sk -b $COOKIE -X POST $API/api/reports \
  -H "x-csrf-token: $CSRF" \
  -F "form_slug=spring-monitoring" \
  -F "spring_name=Mata Air Test" -F "village=Desa X" \
  -F "subdistrict=Kec Y" -F "province=Jawa Barat" \
  -F "regency=Bandung" -F "date=$(date +%Y-%m-%d)" \
  -F "flow_condition=Sedang" -F "water_quality=Jernih" \
  -F "cleanliness=Bersih" \
  -F "_submit_time=$PAST" -F "_website=" \
  -F "notes=Test monitoring"
# → {"success":true,"report":{"status":"pending"}}
```

| # | Form Slug | Variasi data | Hasil |
|---|---|---|---|
| 5.4a | `spring-monitoring` | flow_condition, water_quality, cleanliness | ☐ pending |
| 5.4b | `spring-restoration` | activity_types[], volunteer_count | ☐ pending |
| 5.4c | `trench-development` | trench_count, dimensions | ☐ pending |
| 5.4d | `tree-planting` | tree_count, tree_species | ☐ pending |
| 5.4e | `seedling-stock` | species, count, contact_name, contact_phone | ☐ pending |

### 5.5 — Upload foto ke report yang sudah dibuat
```bash
# Ambil report ID dari response submit
REPORT_ID="<id-dari-response>"
curl -sk -b $COOKIE -X POST "$API/api/reports/$REPORT_ID/photos" \
  -F "photo=@/path/to/test-image.jpg" -F "field_id=photo"
# → {"success":true,"photo":{"id":"..."}}
```

| # | Test | Langkah | Hasil |
|---|---|---|---|
| 5.6 | Hapus report sendiri | `curl -sk -X DELETE -b $COOKIE "$API/api/reports/$REPORT_ID"` | ☐ sukses |
| 5.7 | Akses form yang tidak ada | Buka `/report/form-tidak-ada` | ☐ "Form tidak ditemukan" |
| 5.8 | Rate limit (spam) | Kirim >5 laporan dalam 1 hari sebagai guest | ☐ 429 error |

---

## 🟢 Test 6 — Donasi (4 test)

### 6.1 — Create invoice
```bash
login_admin
CSRF=$(get_csrf)
curl -sk -b $COOKIE -X POST $API/api/donations/invoice \
  -H "x-csrf-token: $CSRF" \
  -H "Content-Type: application/json" \
  -d '{
    "amount":50000,
    "donor_name":"Test Donor",
    "donor_email":"donor@test.com",
    "tier_id":"seedling"
  }'
# → {"success":true,"invoice":{"id":"...","invoice_url":"https://..."}}
```

| # | Test | Langkah | Hasil |
|---|---|---|---|
| 6.1 | Create invoice sukses | curl di atas | ☐ 200 + invoice_url |
| 6.2 | Create invoice gagal (amount < 1000) | `"amount":500` | ☐ error validasi |
| 6.3 | Create invoice gagal (amount > 100jt) | `"amount":1000000000` | ☐ error |
| 6.4 | Webhook Xendit (simulasi) | Pakai API key Xendit dashboard → trigger webhook | ☐ status donation berubah |

---

## 🟢 Test 7 — Project (6 test)

### 7.1 — List projects
```bash
curl -sk $API/api/projects
# → {"projects":[...],"total":4}
```

### 7.2 — Create project (butuh >= 20.000 poin)
```bash
login_volunteer  # volunteer@springhub.id punya 24.168 pts
CSRF=$(get_csrf)
PAST=$(past_time)
curl -sk -b $COOKIE -X POST $API/api/projects \
  -H "x-csrf-token: $CSRF" \
  -H "Content-Type: application/json" \
  -d '{
    "title":"Test Project",
    "summary":"Deskripsi proyek test",
    "region":"Jawa Barat",
    "type_id":"rebuild",
    "goal_amount":5000000,
    "_submit_time":"'$PAST'"
  }'
# → {"success":true,"project":{"id":"...","status":"under_review"}}
```

### 7.3 — Gagal create project (poin < 20.000)
```bash
# Login sebagai budi (8.750 pts)
curl -sk -c $COOKIE -b $COOKIE -X POST $API/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"budi@springhub.id","password":"budi12345"}'
CSRF=$(get_csrf)
PAST=$(past_time)
curl -sk -b $COOKIE -X POST $API/api/projects \
  -H "x-csrf-token: $CSRF" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","summary":"...","region":"Jabar","type_id":"rebuild","goal_amount":1000000,"_submit_time":"'$PAST'"}'
# → {"error":"Minimal 20.000 poin untuk membuat proyek"}
```

### 7.4 — Admin bypass (admin bisa submit meski 0 pts)
```bash
login_admin
...
# → sukses
```

### 7.5 — Comment di project
```bash
login_volunteer
CSRF=$(get_csrf)
curl -sk -b $COOKIE -X POST "$API/api/projects/<project-id>/comments" \
  -H "x-csrf-token: $CSRF" \
  -H "Content-Type: application/json" \
  -d '{"content":"Komentar test"}'
# → {"success":true,"comment":{"id":"..."}}
```

### 7.6 — Like project
```bash
curl -sk -b $COOKIE -X POST "$API/api/projects/<project-id>/like" \
  -H "x-csrf-token: $(get_csrf)"
# → {"success":true,"liked":true,"count":1}
```

| # | Test | Langkah | Hasil |
|---|---|---|---|
| 7.1 | GET /api/projects | `curl -sk $API/api/projects` | ☐ 200 |
| 7.2 | POST project (poin cukup) | volunteer@springhub.id (24.168 pts) | ☐ sukses |
| 7.3 | POST project (poin kurang) | budi@springhub.id (8.750 pts) | ☐ error |
| 7.4 | POST project (admin bypass) | admin@springhub.id (0 pts) | ☐ sukses |
| 7.5 | POST comment | Login → comment di project | ☐ sukses |
| 7.6 | POST like/unlike | Toggle like | ☐ sukses |

---

## 🟢 Test 8 — Courses (4 test)

### 8.1 — List courses
```bash
curl -sk $API/api/courses
# → {"courses":[...]} — 3 kursus
```

### 8.2 — Detail course
```bash
curl -sk "$API/api/courses/pengantar-konservasi-mata-air"
# → {"course":{"slug":"pengantar-konservasi-mata-air","modules":[...]}}
```

### 8.3 — Progress (GET)
```bash
login_volunteer
curl -sk -b $COOKIE "$API/api/courses/progress"
# → {"progresses":[...]}
```

### 8.4 — Update progress (PUT)
```bash
CSRF=$(get_csrf)
curl -sk -b $COOKIE -X PUT $API/api/courses/progress \
  -H "x-csrf-token: $CSRF" \
  -H "Content-Type: application/json" \
  -d '{"course_slug":"pengantar-konservasi-mata-air","completed_modules":1,"total_modules":4}'
# → {"success":true,"completed":false}
```

| # | Test | Perintah | Hasil |
|---|---|---|---|
| 8.1 | GET /api/courses | `curl -sk $API/api/courses` | ☐ 200 |
| 8.2 | GET /api/courses/[slug] | `curl -sk "$API/api/courses/pengantar-konservasi-mata-air"` | ☐ 200 + modules |
| 8.3 | GET /api/courses/progress | Login → curl | ☐ 200 |
| 8.4 | PUT /api/courses/progress | Login + CSRF | ☐ 200 |

---

## 🟢 Test 9 — Springs & Map (3 test)

### 9.1 — List springs
```bash
curl -sk $API/api/springs
# → {"springs":[{"id":"...","name":"Sumber Umbul","snappedLat":-8.211,"snappedLng":112.749}]}
```

### 9.2 — Detail spring
```bash
# Ambil ID spring pertama
SPRING_ID=$(curl -sk $API/api/springs | python3 -c "import json,sys; print(json.load(sys.stdin)['springs'][0]['id'])")
curl -sk "$API/api/springs/$SPRING_ID"
# → {"spring":{"name":"Sumber Umbul","reports":[...]}}
```

### 9.3 — Bulk springs
```bash
curl -sk "$API/api/springs/bulk?ids=$SPRING_ID"
# → {"springs":[{"id":"...","name":"..."}]}
```

| # | Test | Perintah | Hasil |
|---|---|---|---|
| 9.1 | GET /api/springs | `curl -sk $API/api/springs` | ☐ 200 + 12 springs |
| 9.2 | GET /api/springs/[id] | `curl -sk "$API/api/springs/$SPRING_ID"` | ☐ 200 + detail |
| 9.3 | GET /api/springs/bulk | `curl -sk "$API/api/springs/bulk?ids=..."` | ☐ 200 |

---

## 🟢 Test 10 — Admin Panel (20 test)

### 10.1 — Akses halaman admin (via browser)
Login sebagai **admin@springhub.id / demo12345**, lalu buka:

| # | Halaman | Cek | Hasil |
|---|---|---|---|
| 10.1 | `/admin` | Dashboard: stat cards, error count | ☐ |
| 10.2 | `/admin/users` | Tabel user + role + email + phone | ☐ |
| 10.3 | `/admin/reports` | Tabel laporan + toggle active/inactive | ☐ |
| 10.4 | `/admin/review` | Queue review + tombol Approve/Reject | ☐ |
| 10.5 | `/admin/donations` | Tabel donasi + status pembayaran | ☐ |
| 10.6 | `/admin/projects` | Tabel proyek + status | ☐ |
| 10.7 | `/admin/forms` | Form builder + daftar form | ☐ |
| 10.8 | `/admin/courses` | Manajemen kursus | ☐ |
| 10.9 | `/admin/points` | Point rules list | ☐ |
| 10.10 | `/admin/content` | CMS konten | ☐ |
| 10.11 | `/admin/feedback` | Inbox feedback | ☐ |
| 10.12 | `/admin/trust-score` | Daftar trust score | ☐ |
| 10.13 | `/admin/errors` | Error log | ☐ |

### 10.14 — Approve report via API
```bash
login_admin
CSRF=$(get_csrf)

# Ambil report ID yang pending
REPORT_ID=$(curl -sk -b $COOKIE $API/api/admin/reports | python3 -c "
import json,sys
data = json.load(sys.stdin)
for r in data.get('reports', []):
    if r.get('status') == 'pending':
        print(r['id'])
        break
")

curl -sk -b $COOKIE -X POST "$API/api/admin/reports/$REPORT_ID/approve" \
  -H "x-csrf-token: $CSRF"
# → {"success":true,"pointsAwarded":25}
```

### 10.15 — Reject report
```bash
curl -sk -b $COOKIE -X POST "$API/api/admin/reports/$REPORT_ID/reject" \
  -H "x-csrf-token: $(get_csrf)" \
  -H "Content-Type: application/json" \
  -d '{"note":"Data tidak lengkap"}'
# → {"success":true}
```

### 10.16 — Toggle report active/inactive
```bash
curl -sk -b $COOKIE -X POST "$API/api/admin/reports/$REPORT_ID/toggle" \
  -H "x-csrf-token: $(get_csrf)"
# → {"success":true,"isActive":false}
```

### 10.17 — Update user role
```bash
curl -sk -b $COOKIE -X PUT "$API/api/admin/users/$USER_ID" \
  -H "x-csrf-token: $(get_csrf)" \
  -H "Content-Type: application/json" \
  -d '{"role":"volunteer"}'
# → {"success":true}
```

### 10.18 — CRUD forms
```bash
# Buat form baru
CSRF=$(get_csrf)
curl -sk -b $COOKIE -X POST $API/api/admin/forms \
  -H "Content-Type: application/json" \
  -H "x-csrf-token: $CSRF" \
  -d '{"slug":"test-form","title":"Test Form","pointsOnSubmit":10,"contributionType":"monitoring","fields":[{"fieldId":"name","label":"Nama","type":"text","required":true,"sortOrder":1},{"fieldId":"photo","label":"Foto","type":"photo","required":true,"sortOrder":2}]}'

# Update form
# Soft-delete / hard-delete
```

### 10.19 — CRUD point rules
```bash
CSRF=$(get_csrf)
curl -sk -b $COOKIE -X POST $API/api/admin/point-rules \
  -H "x-csrf-token: $CSRF" \
  -H "Content-Type: application/json" \
  -d '{"slug":"test-rule","label":"Test Rule","points":10,"category":"bonus","isActive":true,"sortOrder":99}'
```

### 10.20 — Admin akses tanpa login
```bash
curl -sk $API/api/admin/users
# → 401 {"error":"Unauthorized"}
```

| # | Test | Hasil |
|---|---|---|
| 10.1-13 | Semua halaman admin | ☐ 200 + konten tampil |
| 10.14 | Approve report → poin +25 | ☐ sukses |
| 10.15 | Reject report → trust score turun | ☐ sukses |
| 10.16 | Toggle active/inactive | ☐ sukses |
| 10.17 | Update user role | ☐ sukses |
| 10.18 | Create/Update/Delete form | ☐ sukses |
| 10.19 | Create point rule | ☐ sukses |
| 10.20 | Non-admin cannot access | ☐ 401 |

---

## 🟢 Test 11 — Points Engine (8 test)

### 11.1 — Poin bertambah setelah approve
```bash
# Cek poin sebelum
PTS_BEFORE=$(curl -sk -b $COOKIE $API/api/user/points | python3 -c "import json,sys; print(json.load(sys.stdin).get('points',0))")
echo "Before: $PTS_BEFORE"

# Approve report
...

# Cek poin setelah
PTS_AFTER=$(curl -sk -b $COOKIE $API/api/user/points | python3 -c "import json,sys; print(json.load(sys.stdin).get('points',0))")
echo "After: $PTS_AFTER"
echo "Diff: $((PTS_AFTER - PTS_BEFORE))"
# → Diff harus 25 (base) atau sesuai bonus
```

### 11.2 — Points log
```bash
curl -sk -b $COOKIE $API/api/user/points
# → {"points":24168,"trustScore":100,"logs":[{"amount":25,"reason":"Spring Monitoring","createdAt":"..."}]}
```

### 11.3 — Trust score
```bash
curl -sk -b $COOKIE $API/api/user/points
# → trustScore field
```

### 11.4 — Leaderboard
```bash
curl -sk $API/api/leaderboard
# → {"leaderboard":[{"username":"...","points":24168},...]}
```

| # | Test | Langkah | Hasil |
|---|---|---|---|
| 11.1 | Poin naik setelah approve | Approve report → cek poin | ☐ +25 |
| 11.2 | Points log tercatat | GET /api/user/points | ☐ ada logs |
| 11.3 | Trust score visible | GET /api/user/points | ☐ trustScore |
| 11.4 | Leaderboard top 20 | GET /api/leaderboard | ☐ array 20 |
| 11.5 | Streak harian (3 hari berturut) | Submit 3 hari berbeda | ☐ bonus +5 |
| 11.6 | Milestone 10 laporan | Approve 10 laporan user yang sama | ☐ bonus +50 |
| 11.7 | Milestone 50 laporan | Approve 50 laporan | ☐ bonus +250 |
| 11.8 | Laporan lengkap (semua field + foto) | Submit dengan semua field terisi | ☐ bonus +10 |

---

## 🟢 Test 12 — Error Logger (3 test)

### 12.1 — Kirim error dari frontend
```bash
curl -sk -X POST $API/api/log/error \
  -H "Content-Type: application/json" \
  -d '{"level":"error","message":"Test error dari manual test","source":"manual-test","stack":"Error: test\\n at test ()","metadata":{"browser":"curl","test":true}}'
# → {"ok":true}
```

### 12.2 — Lihat error log (admin)
```bash
login_admin
curl -sk -b $COOKIE "$API/api/admin/errors?limit=5"
# → {"errors":[...],"total":1}
```

### 12.3 — Mark as read
```bash
ERROR_ID=$(curl -sk -b $COOKIE "$API/api/admin/errors?limit=1" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d['errors'][0]['id'] if d['errors'] else '')")
curl -sk -b $COOKIE -X PATCH "$API/api/admin/errors/$ERROR_ID" \
  -H "x-csrf-token: $(get_csrf)" \
  -H "Content-Type: application/json" \
  -d '{"isRead":true}'
# → {"success":true}
```

---

## 🟢 Test 13 — Offline Mode (5 test)

### 13.1 — Offline page accessible
```bash
curl -sk -o /dev/null -w "%{http_code}" $API/offline
# → 200
```

### 13.2 — Simple offline form
Buka PWA / offline mode → form muncul → isi + foto → submit → "Tersimpan!"
- Buka `https://www.springhub.id/offline`
- Pilih form
- Isi data + GPS + 3 foto
- Submit → muncul "Tersimpan!"

### 13.3 — Create offline session
```bash
login_volunteer
CSRF=$(get_csrf)
curl -sk -b $COOKIE -X POST $API/api/offline/session \
  -H "x-csrf-token: $CSRF" \
  -H "Content-Type: application/json" \
  -d '{"selectedForms":["spring-monitoring"],"mode":"save-only","radiusKm":5,"qualityLevel":"ringan"}'
# → {"success":true,"session":{"id":"..."}}
```

### 13.4 — Sync tracking points
```bash
CSRF=$(get_csrf)
curl -sk -b $COOKIE -X POST $API/api/offline/sync \
  -H "x-csrf-token: $CSRF" \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"<session-id>","trackingPoints":[{"lat":-7.5,"lng":110.0,"recordedAt":'$(date +%s)'}]}'
# → {"success":true}
```

### 13.5 — Get active session
```bash
curl -sk -b $COOKIE $API/api/offline/session
# → {"session":{...}}
```

---

## 🟢 Test 14 — Content & Feedback (4 test)

### 14.1 — Newsletters subscribe
```bash
CSRF=$(get_csrf)
curl -sk -b $COOKIE -X POST $API/api/newsletter \
  -H "x-csrf-token: $CSRF" \
  -H "Content-Type: application/json" \
  -d '{"email":"test-subscribe@test.com"}'
# → {"success":true}
```

### 14.2 — Submit feedback
```bash
curl -sk -b $COOKIE -X POST $API/api/feedback \
  -H "x-csrf-token: $(get_csrf)" \
  -F "message=Test feedback dari manual test" \
  -F "category=suggestion"
# → {"success":true,"feedback":{"id":"...","status":"open"}}
```

### 14.3 — Gallery
```bash
curl -sk "$API/api/gallery?limit=3"
# → {"items":[...]}
```

### 14.4 — Content blocks per section
```bash
curl -sk "$API/api/content"
curl -sk "$API/api/content?section=landing-hero"
# → {"blocks":[...]}
```

---

## 🟢 Test 15 — Security & Anti-Spam (8 test)

| # | Test | Langkah | Hasil |
|---|---|---|---|
| 15.1 | CSRF protection | Submit tanpa header `x-csrf-token` | ☐ 403 |
| 15.2 | Time gate (< 3 detik) | `_submit_time` dalam 3 detik terakhir | ☐ 429 |
| 15.3 | Honeypot | Isi field `_website` → bot detected | ☐ sukses palsu (honeypot) |
| 15.4 | Rate limit | Kirim 11+ request dalam 1 menit | ☐ 429 |
| 15.5 | Daily limit guest | Guest > 5 submits/hari | ☐ 429 |
| 15.6 | Phone validasi | `coordinator_phone` format salah | ☐ error |
| 15.7 | Non-admin akses admin API | Guest call `/api/admin/users` | ☐ 401 |
| 15.8 | Trust score auto-block | Trust score <= 0 → submit ditolak | ☐ 403 |

```bash
# 15.1 - No CSRF
curl -sk -X POST $API/api/reports -F "form_slug=spring-monitoring"
# → 403 "Invalid CSRF token"

# 15.2 - Too fast (submit_time < 3 detik)
curl -sk -b $COOKIE -X POST $API/api/reports \
  -H "x-csrf-token: $(get_csrf)" \
  -F "form_slug=spring-monitoring" \
  -F "_submit_time=$(date +%s)000"
# → 429 "Terlalu cepat"

# 15.4 - Rate limit
for i in $(seq 1 12); do curl -sk -b $COOKIE $API/api/health > /dev/null; done
# Request ke-11+ harus 429
```

---

## 🟢 Test 16 — Infrastructure (8 test)

| # | Cek | Perintah | Hasil |
|---|---|---|---|
| 16.1 | Docker containers | `docker ps` | ☐ 5 containers Up |
| 16.2 | PostgreSQL | `docker exec springhub-postgres-1 pg_isready` | ☐ accepting connections |
| 16.3 | Redis | `docker exec springhub-redis-1 redis-cli ping` | ☐ PONG |
| 16.4 | UFW Firewall | `ufw status` | ☐ 22,80,443 active |
| 16.5 | Fail2ban | `fail2ban-client status` | ☐ 6 jails active |
| 16.6 | SSL Certificate | `openssl s_client -connect www.springhub.id:443 -servername www.springhub.id </dev/null 2>/dev/null \| openssl x509 -noout -dates` | ☐ valid, not after Sep 28 2026 |
| 16.7 | Unattended upgrades | `systemctl status unattended-upgrades` | ☐ active |
| 16.8 | Disk usage | `df -h /` | ☐ tidak penuh |

---

## 🟢 Test 17 — Security Headers (7 test)

| # | Header | Perintah | Hasil |
|---|---|---|---|
| 17.1 | HSTS | `curl -skI $API \| grep -i strict-transport` | ☐ `max-age=63072000; includeSubDomains; preload` |
| 17.2 | X-Frame-Options | `curl -skI $API \| grep -i x-frame` | ☐ `DENY` |
| 17.3 | X-Content-Type-Options | `curl -skI $API \| grep -i x-content-type` | ☐ `nosniff` |
| 17.4 | X-XSS-Protection | `curl -skI $API \| grep -i x-xss` | ☐ `1; mode=block` |
| 17.5 | Referrer-Policy | `curl -skI $API \| grep -i referrer` | ☐ `strict-origin-when-cross-origin` |
| 17.6 | Permissions-Policy | `curl -skI $API \| grep -i permissions` | ☐ ada |
| 17.7 | Content-Security-Policy | `curl -skI $API \| grep -i content-security` | ☐ ada |

```bash
curl -skI https://www.springhub.id | grep -E "strict-transport|x-frame|x-content|x-xss|referrer|permissions|content-security"
```

---

## 🟢 Test 18 — SEO & PWA (9 test)

| # | Item | Perintah | Hasil |
|---|---|---|---|
| 18.1 | Sitemap 30 URL | `curl -sk $API/sitemap.xml \| grep -o '<loc>' \| wc -l` | ☐ 30 |
| 18.2 | robots.txt | `curl -sk $API/robots.txt` | ☐ Allow + Sitemap |
| 18.3 | JSON-LD | `curl -sk $API \| grep -o 'application/ld+json'` | ☐ ada |
| 18.4 | OG Title | `curl -sk $API \| grep -o 'og:title'` | ☐ ada |
| 18.5 | OG Description | `curl -sk $API \| grep -o 'og:description'` | ☐ ada |
| 18.6 | OG Image | `curl -sk $API \| grep -o 'og:image'` | ☐ ada |
| 18.7 | manifest.json | `curl -sk $API/manifest.json \| python3 -c "import json,sys; d=json.load(sys.stdin); print(d['name'])"` | ☐ `SpringHub` |
| 18.8 | Service Worker | `curl -sk $API/sw.js \| head -1` | ☐ `self.addEventListener` |
| 18.9 | favicon.ico | `curl -sk -o /dev/null -w "%{http_code}" $API/favicon.ico` | ☐ 200 |

---

## 🟢 Test 19 — Notifications (4 test)

### 19.1 — Get notifications
```bash
login_volunteer
curl -sk -b $COOKIE $API/api/notifications
# → {"notifications":[...]}
```

### 19.2 — Unread count
```bash
curl -sk -b $COOKIE $API/api/notifications/unread
# → {"count":3}
```

### 19.3 — Mark as read
```bash
NOTIF_ID=$(curl -sk -b $COOKIE $API/api/notifications | python3 -c "import json,sys; d=json.load(sys.stdin); print(d['notifications'][0]['id'] if d['notifications'] else '')")
curl -sk -b $COOKIE -X POST "$API/api/notifications/$NOTIF_ID/read" \
  -H "x-csrf-token: $(get_csrf)"
# → {"success":true}
```

### 19.4 — Create notification
```bash
CSRF=$(get_csrf)
curl -sk -b $COOKIE -X POST $API/api/notifications \
  -H "x-csrf-token: $CSRF" \
  -H "Content-Type: application/json" \
  -d '{"type":"info","title":"Test Notif","body":"Ini test notifikasi dari manual test"}'
# → {"success":true}
```

---

## 🟢 Test 20 — Upload & Gallery (2 test)

### 20.1 — Presigned upload URL
```bash
login_admin
curl -sk -b $COOKIE "$API/api/upload/presign?filename=test.jpg&contentType=image/jpeg"
# → {"url":"...","publicUrl":"..."}
```

### 20.2 — Gallery with photos
```bash
curl -sk "$API/api/gallery?limit=5&form_slug=spring-monitoring"
# → {"items":[{"id":"...","photoUrl":"...","fieldData":{...}},...]}
```

---

## 🟢 Test 21 — DB Seed Data Verification (15 test)

Cek via admin panel atau terminal:

```bash
# Login admin dulu
login_admin

# Hitung profile
curl -sk -b $COOKIE $API/api/admin/users | python3 -c "import json,sys; d=json.load(sys.stdin); print(f'Profiles: {len(d.get(\"users\",[]))}')"

# Hitung forms
curl -sk -b $COOKIE $API/api/admin/forms | python3 -c "import json,sys; d=json.load(sys.stdin); print(f'Forms: {len(d.get(\"forms\",[]))}')"
```

| # | Tabel | Expected | Hasil |
|---|---|---|---|
| 21.1 | Profile (users) | 6 | ☐ |
| 21.2 | Spring (mata air) | 12 | ☐ |
| 21.3 | Report (laporan) | 15+ (bisa lebih setelah test) | ☐ |
| 21.4 | Form | 5 (dengan >= 41 field) | ☐ |
| 21.5 | Course | 3 | ☐ |
| 21.6 | Project | 4 | ☐ |
| 21.7 | Donation | 6 | ☐ |
| 21.8 | PointRule | 14 | ☐ |
| 21.9 | PointsLog | 13+ | ☐ |
| 21.10 | Comment | 8 | ☐ |
| 21.11 | Notification | 5+ | ☐ |
| 21.12 | ContentBlock | 4 | ☐ |
| 21.13 | Feedback | 3+ | ☐ |
| 21.14 | ReportPhoto | 48+ | ☐ |
| 21.15 | CourseModule | 10 | ☐ |

---

## 🟢 Test 22 — Dark Mode (4 test)

| # | Test | Langkah | Hasil |
|---|---|---|---|
| 22.1 | Toggle dark mode | Klik ikon bulan/matahari di header | ☐ semua halaman berubah gelap |
| 22.2 | Dark mode persistent | Refresh halaman → tetap dark | ☐ |
| 22.3 | Dark mode semua halaman | Cek `/`, `/springs`, `/projects`, `/learn`, `/admin` | ☐ semua konsisten |
| 22.4 | Dark mode form | Buka `/report/spring-monitoring` dalam dark mode | ☐ input, card, tombol sesuai |

---

## 🟢 Test 23 — Reset Password Flow (3 test)

### 23.1 — Forgot password request
```bash
curl -sk -X POST $API/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"volunteer@springhub.id"}'
# → {"success":true,"message":"Jika email terdaftar, link reset akan dikirim"}
```

### 23.2 — Reset password dengan token valid
```bash
# Ambil token dari email (cek inbox Resend)
RESET_TOKEN="<token-dari-email>"
curl -sk -X POST $API/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{"token":"'$RESET_TOKEN'","password":"newpassword123"}'
# → {"success":true}
```

### 23.3 — Login dengan password baru
```bash
curl -sk -c $COOKIE -b $COOKIE -X POST $API/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"volunteer@springhub.id","password":"newpassword123"}'
# → {"success":true}
# Kembalikan password lama
curl -sk -X POST $API/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"volunteer@springhub.id","password":"vol12345"}'
```

---

## 📊 Ringkasan

| Kategori | Jumlah Test | Status |
|---|---|---|
| Test 1 — Akses Web | 5 | ☐ |
| Test 2 — Halaman Publik | 11 | ☐ |
| Test 3 — API Publik | 12 | ☐ |
| Test 4 — Auth Flow | 11 | ☐ |
| Test 5 — Form Report | 10 | ☐ |
| Test 6 — Donasi | 4 | ☐ |
| Test 7 — Project | 6 | ☐ |
| Test 8 — Courses | 4 | ☐ |
| Test 9 — Springs & Map | 3 | ☐ |
| Test 10 — Admin Panel | 20 | ☐ |
| Test 11 — Points Engine | 8 | ☐ |
| Test 12 — Error Logger | 3 | ☐ |
| Test 13 — Offline Mode | 5 | ☐ |
| Test 14 — Content & Feedback | 4 | ☐ |
| Test 15 — Security & Anti-Spam | 8 | ☐ |
| Test 16 — Infrastructure | 8 | ☐ |
| Test 17 — Security Headers | 7 | ☐ |
| Test 18 — SEO & PWA | 9 | ☐ |
| Test 19 — Notifications | 4 | ☐ |
| Test 20 — Upload & Gallery | 2 | ☐ |
| Test 21 — DB Seed Data | 15 | ☐ |
| Test 22 — Dark Mode | 4 | ☐ |
| Test 23 — Reset Password | 3 | ☐ |
| **Total** | **~166 test case** | **☐** |

> **Cara pakai**: Ganti setiap ☐ menjadi ✅ setelah test lulus, atau ❌ jika gagal (catat errornya).

---
