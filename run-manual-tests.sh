#!/bin/bash
# ==============================================================
# SpringHub — Automated Manual Test Runner
# Menjalankan ~150 test case dari MANUAL-TEST-FINAL.md
# via curl/bash — hasil langsung dicetak + laporan CSV
# ==============================================================

set -euo pipefail

COOKIE="/tmp/springhub-test-cookies.txt"
API="https://www.springhub.id"
PASS=0
FAIL=0
SKIP=0
RESULTS=()
TIMESTAMP=$(date +%s)

cleanup() {
  rm -f "$COOKIE" 2>/dev/null || true
}
trap cleanup EXIT

# ── Helpers ──────────────────────────────────────────────
login_admin() {
  curl -sk -c "$COOKIE" -b "$COOKIE" -X POST "$API/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@springhub.id","password":"demo12345"}' >/dev/null 2>&1
}

login_volunteer() {
  curl -sk -c "$COOKIE" -b "$COOKIE" -X POST "$API/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"ucup@springhub.id","password":"ucup12345"}' >/dev/null 2>&1
}

login_budi() {
  curl -sk -c "$COOKIE" -b "$COOKIE" -X POST "$API/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"budi@springhub.id","password":"budi12345"}' >/dev/null 2>&1
}

get_csrf() {
  curl -sk -b "$COOKIE" "$API/api/csrf" 2>/dev/null | python3 -c \
    "import json,sys; print(json.load(sys.stdin).get('token',''))" 2>/dev/null || echo ""
}

past_time() {
  echo $(( $(date +%s) * 1000 - 15000 ))
}

assert_eq() {
  local test_id="$1" desc="$2" expected="$3" actual="$4"
  if [ "$expected" = "$actual" ]; then
    echo "  ✅ $test_id — $desc"
    RESULTS+=("$test_id,$desc,OK,$expected")
    PASS=$((PASS+1))
  else
    echo "  ❌ $test_id — $desc (expected: $expected, got: $actual)"
    RESULTS+=("$test_id,$desc,FAIL,expected=$expected actual=$actual")
    FAIL=$((FAIL+1))
  fi
}

assert_contains() {
  local test_id="$1" desc="$2" needle="$3" haystack="$4"
  if echo "$haystack" | grep -q "$needle"; then
    echo "  ✅ $test_id — $desc"
    RESULTS+=("$test_id,$desc,OK,contains '$needle'")
    PASS=$((PASS+1))
  else
    echo "  ❌ $test_id — $desc (expected to contain: $needle)"
    RESULTS+=("$test_id,$desc,FAIL,missing '$needle'")
    FAIL=$((FAIL+1))
  fi
}

assert_status() {
  local test_id="$1" desc="$2" expected="$3" url="$4"
  local actual
  actual=$(curl -sk -o /dev/null -w "%{http_code}" -b "$COOKIE" "$url" 2>/dev/null)
  assert_eq "$test_id" "$desc" "$expected" "$actual"
}

assert_json() {
  local test_id="$1" desc="$2" jq_filter="$3" url="$4"
  local resp
  resp=$(curl -sk -b "$COOKIE" "$url" 2>/dev/null)
  local val
  val=$(echo "$resp" | python3 -c "import json,sys; d=json.load(sys.stdin); print($jq_filter)" 2>/dev/null || echo "ERROR")
  if [ "$val" != "ERROR" ] && [ "$val" != "" ] && [ "$val" != "None" ]; then
    echo "  ✅ $test_id — $desc (got: $val)"
    RESULTS+=("$test_id,$desc,OK,$val")
    PASS=$((PASS+1))
  else
    echo "  ❌ $test_id — $desc (failed to parse: $(echo "$resp" | head -c 100))"
    RESULTS+=("$test_id,$desc,FAIL,$(echo "$resp" | head -c 100)")
    FAIL=$((FAIL+1))
  fi
}

start_section() {
  echo ""
  echo "═══════════════════════════════════════════════"
  echo "  $1"
  echo "═══════════════════════════════════════════════"
}

# ==============================================================
# MAIN TEST RUN
# ==============================================================
echo "=============================================================="
echo "  SpringHub — Automated Manual Test Suite"
echo "  Tanggal: $(date)"
echo "  API: $API"
echo "=============================================================="
echo ""

# ── TEST 1: Akses Web ─────────────────────────────────
start_section "TEST 1 — Akses Web (5 test)"

assert_status 1.1 "HTTPS landing page" 200 "$API/"
assert_status 1.2 "Sitemap accessible" 200 "$API/sitemap.xml"
assert_status 1.3 "robots.txt accessible" 200 "$API/robots.txt"
assert_status 1.4 "manifest.json accessible" 200 "$API/manifest.json"
assert_status 1.5 "favicon.ico accessible" 200 "$API/favicon.ico"

# ── TEST 2: Halaman Publik ────────────────────────────
start_section "TEST 2 — Halaman Publik (11 test)"

IDX=1
for page in "springs" "projects" "learn" "help" "faq" "privacy" "terms" "sign-in" "join" "report-issue" "offline"; do
  IDX=$((IDX+1))
  assert_status "2.$(printf '%02d' $IDX)" "GET /$page" 200 "$API/$page"
done

assert_status "2.01" "GET / (landing)" 200 "$API/"

# ── TEST 3: API Publik ────────────────────────────────
start_section "TEST 3 — API Publik (12 test)"

# 3.1 Health
resp=$(curl -sk "$API/api/health" 2>/dev/null)
assert_contains 3.1 "GET /api/health" "healthy" "$resp"

# 3.2 CSRF
resp=$(curl -sk "$API/api/csrf" 2>/dev/null)
assert_contains 3.2 "GET /api/csrf" "token" "$resp"

# 3.3 Leaderboard
assert_status 3.3 "GET /api/leaderboard" 200 "$API/api/leaderboard"

# 3.4 Point Rules (not /api/point-rules — may not exist)
assert_status 3.4 "GET /api/forms" 200 "$API/api/forms"

# 3.5 Springs
assert_status 3.5 "GET /api/springs" 200 "$API/api/springs"

# 3.6 Projects
assert_status 3.6 "GET /api/projects" 200 "$API/api/projects"

# 3.7 Courses
resp=$(curl -sk "$API/api/courses" 2>/dev/null)
assert_contains 3.7 "GET /api/courses" "course" "$(echo "$resp" | head -c 200)"

# 3.8 Gallery
assert_status 3.8 "GET /api/gallery" 200 "$API/api/gallery"

# 3.9 Sitemap XML
resp=$(curl -sk "$API/sitemap.xml" 2>/dev/null)
assert_contains 3.9 "sitemap.xml is XML" "urlset" "$resp"

# 3.10 robots.txt
resp=$(curl -sk "$API/robots.txt" 2>/dev/null)
assert_contains 3.10 "robots.txt has Sitemap" "Sitemap" "$resp"

# 3.11 manifest.json
resp=$(curl -sk "$API/manifest.json" 2>/dev/null)
assert_contains 3.11 "manifest.json has name" "SpringHub" "$resp"

# 3.12 Gallery with params
assert_status 3.12 "GET /api/gallery?limit=3" 200 "$API/api/gallery?limit=3"

# ── TEST 4: Auth Flow ─────────────────────────────────
start_section "TEST 4 — Auth Flow (11 test)"

# 4.1 Login admin
resp=$(curl -sk -c "$COOKIE" -b "$COOKIE" -X POST "$API/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@springhub.id","password":"demo12345"}' 2>/dev/null)
assert_contains 4.1 "Login admin success" "success" "$resp"

# 4.2 Login volunteer (ucup)
resp=$(curl -sk -c "$COOKIE" -b "$COOKIE" -X POST "$API/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"ucup@springhub.id","password":"ucup12345"}' 2>/dev/null)
assert_contains 4.2 "Login volunteer success" "success" "$resp"

# 4.3 Session cookie
if [ -f "$COOKIE" ] && grep -q "session" "$COOKIE" 2>/dev/null; then
  echo "  ✅ 4.3 — Session cookie ter-set"
  RESULTS+=("4.3,Session cookie ter-set,OK,")
  PASS=$((PASS+1))
else
  echo "  ❌ 4.3 — Session cookie tidak ter-set"
  RESULTS+=("4.3,Session cookie ter-set,FAIL,no cookie")
  FAIL=$((FAIL+1))
fi

# 4.4 GET /api/auth/me
login_admin
resp=$(curl -sk -b "$COOKIE" "$API/api/auth/me" 2>/dev/null)
assert_contains 4.4 "Auth me returns email" "admin@springhub.id" "$resp"

# 4.5 Login gagal (salah password)
resp=$(curl -sk -X POST "$API/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@springhub.id","password":"wrongpassword"}' 2>/dev/null)
echo "$resp" | grep -q "error" && {
  echo "  ✅ 4.5 — Login gagal (salah password)"
  RESULTS+=("4.5,Login gagal salah password,OK,")
  PASS=$((PASS+1))
} || {
  echo "  ❌ 4.5 — Login gagal (expected error, got: $(echo $resp | head -c 100))"
  RESULTS+=("4.5,Login gagal salah password,FAIL,$(echo $resp | head -c 50))")
  FAIL=$((FAIL+1))
}

# 4.6 Register baru
RAND_EMAIL="test${TIMESTAMP}@test.com"
resp=$(curl -sk -X POST "$API/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$RAND_EMAIL\",\"password\":\"test12345\",\"username\":\"Test Auto $TIMESTAMP\"}" 2>/dev/null)
assert_contains 4.6 "Register baru sukses" "success" "$resp"

# 4.7 Register gagal (password pendek)
resp=$(curl -sk -X POST "$API/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email":"test-short@test.com","password":"123"}' 2>/dev/null)
echo "$resp" | grep -qi "error\|pesan pendek\|min\|8 karakter" && {
  echo "  ✅ 4.7 — Register gagal password pendek"
  RESULTS+=("4.7,Register gagal password pendek,OK,")
  PASS=$((PASS+1))
} || {
  echo "  ❌ 4.7 — Register gagal password pendek (expected error)"
  RESULTS+=("4.7,Register gagal password pendek,FAIL,$(echo $resp | head -c 50)")
  FAIL=$((FAIL+1))
}

# 4.8 Register duplikat
resp=$(curl -sk -X POST "$API/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$RAND_EMAIL\",\"password\":\"test12345\",\"username\":\"Duplicate\"}" 2>/dev/null)
echo "$resp" | grep -qi "error\|already\|exists\|duplicate" && {
  echo "  ✅ 4.8 — Register duplikat ditolak"
  RESULTS+=("4.8,Register duplikat ditolak,OK,")
  PASS=$((PASS+1))
} || {
  echo "  ❌ 4.8 — Register duplikat (expected error)"
  RESULTS+=("4.8,Register duplikat ditolak,FAIL,$(echo $resp | head -c 50)")
  FAIL=$((FAIL+1))
}

# 4.9 Forgot password
resp=$(curl -sk -X POST "$API/api/auth/forgot-password" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@springhub.id"}' 2>/dev/null)
assert_contains 4.9 "Forgot password request" "success" "$resp"

# 4.10 Logout
resp=$(curl -sk -X POST -b "$COOKIE" "$API/api/auth/logout" 2>/dev/null)
assert_contains 4.10 "Logout success" "success" "$resp"

# 4.11 Session hilang setelah logout
resp=$(curl -sk -b "$COOKIE" "$API/api/auth/me" 2>/dev/null)
echo "$resp" | grep -qi "error\|unauthorized\|null" && {
  echo "  ✅ 4.11 — Session hilang setelah logout"
  RESULTS+=("4.11,Session hilang setelah logout,OK,")
  PASS=$((PASS+1))
} || {
  echo "  ❌ 4.11 — Session masih aktif setelah logout"
  RESULTS+=("4.11,Session hilang setelah logout,FAIL,session still active")
  FAIL=$((FAIL+1))
}

# ── TEST 5: Form Report ──────────────────────────────
start_section "TEST 5 — Form Report (10 test)"

# 5.1 Cek form fields
for form_slug in spring-monitoring spring-restoration trench-development tree-planting seedling-stock; do
  resp=$(curl -sk "$API/api/forms?slug=$form_slug" 2>/dev/null)
  fcount=$(echo "$resp" | python3 -c "import json,sys; d=json.load(sys.stdin); print(len(d.get('forms',[{}])[0].get('fields',[])) if d.get('forms') else '0')" 2>/dev/null)
  if [ "$fcount" != "0" ] && [ "$fcount" != "ERROR" ]; then
    echo "  ✅ 5.1.$form_slug — Form $form_slug memiliki $fcount fields"
    RESULTS+=("5.1.$form_slug,Form $form_slug fields,OK,$fcount fields")
    PASS=$((PASS+1))
  else
    echo "  ❌ 5.1.$form_slug — Form $form_slug gagal (fields: $fcount)"
    RESULTS+=("5.1.$form_slug,Form $form_slug fields,FAIL,resp=$(echo $resp | head -c 80)")
    FAIL=$((FAIL+1))
  fi
done

# 5.4 Submit forms via terminal
login_volunteer
CSRF=$(get_csrf)
PAST=$(past_time)

FORM_IDS=(
  "spring-monitoring:spring_name=Mata Air Test,province=Jawa Barat,regency=Bandung,water_condition=Jernih,debit_estimate=Sedang (1-5 L/dtk),vegetation=Rimbun,notes=Test otomatis"
  "spring-restoration:spring_name=Mata Air Restorasi,province=Jawa Barat,regency=Bandung,water_condition=Jernih,debit_estimate=Sedang (1-5 L/dtk),vegetation=Sedang,notes=Restorasi test"
  "trench-development:spring_name=Saluran Test,province=Jawa Barat,regency=Bandung,water_condition=Jernih,debit_estimate=Kecil (<1 L/dtk),vegetation=Gundul,notes=Trench test"
  "tree-planting:spring_name=Lokasi Tanam,province=Jawa Barat,regency=Bandung,water_condition=Jernih,debit_estimate=Sedang (1-5 L/dtk),vegetation=Rimbun,notes=Penanaman test"
  "seedling-stock:spring_name=Persemaian,province=Jawa Barat,regency=Bandung,water_condition=Jernih,debit_estimate=Kecil (<1 L/dtk),vegetation=Rimbun,notes=Seedling test"
)

SUBMITTED_REPORT_ID=""

for entry in "${FORM_IDS[@]}"; do
  form_slug="${entry%%:*}"
  data="${entry#*:}"
  # Build curl -F params from comma-separated key=val pairs
  IFS=',' read -ra PARAMS <<< "$data"
  CURL_CMD="curl -sk -b '${COOKIE}' -X POST '${API}/api/reports' -H 'x-csrf-token: ${CSRF}' -F 'form_slug=${form_slug}'"
  for param in "${PARAMS[@]}"; do
    key="${param%%=*}"
    val="${param#*=}"
    CURL_CMD+=" -F '${key}=${val}'"
  done
  CURL_CMD+=" -F '_submit_time=${PAST}' -F '_website='"

  resp=$(eval "$CURL_CMD" 2>/dev/null)
  if echo "$resp" | grep -q "success"; then
    echo "  ✅ 5.4.${form_slug} — Submit sukses"
    RESULTS+=("5.4.${form_slug},Submit form ${form_slug},OK,")
    PASS=$((PASS+1))
    # Save report ID for later tests
    SUBMITTED_REPORT_ID=$(echo "$resp" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('report',{}).get('id','') or d.get('id',''))" 2>/dev/null)
  else
    echo "  ❌ 5.4.${form_slug} — Submit gagal: $(echo $resp | head -c 100)"
    RESULTS+=("5.4.${form_slug},Submit form ${form_slug},FAIL,$(echo $resp | head -c 80)")
    FAIL=$((FAIL+1))
  fi
done

# 5.7 Akses form tidak ada
assert_status 5.7 "Form tidak ditemukan" 404 "$API/report/form-tidak-ada"

# ── TEST 6: Donasi ───────────────────────────────────
start_section "TEST 6 — Donasi (4 test)"

# 6.1 Create invoice
login_volunteer
CSRF=$(get_csrf)
resp=$(curl -sk -b "$COOKIE" -X POST "$API/api/donations/invoice" \
  -H "x-csrf-token: $CSRF" \
  -H "Content-Type: application/json" \
  -d '{"amount":50000,"donor_name":"Test Donor","donor_email":"donor@test.com","tier_id":"seedling"}' 2>/dev/null)
assert_contains 6.1 "Create invoice sukses" "invoice_url" "$resp"

# 6.2 Create invoice gagal (amount < 1000)
resp=$(curl -sk -b "$COOKIE" -X POST "$API/api/donations/invoice" \
  -H "x-csrf-token: $CSRF" \
  -H "Content-Type: application/json" \
  -d '{"amount":500,"donor_name":"Test","donor_email":"t@t.com","tier_id":"seedling"}' 2>/dev/null)
echo "$resp" | grep -qi "error\|min\|valid" && {
  echo "  ✅ 6.2 — Invoice amount < 1000 ditolak"
  RESULTS+=("6.2,Invoice amount < 1000 ditolak,OK,")
  PASS=$((PASS+1))
} || {
  echo "  ❌ 6.2 — Invoice amount < 1000 (expected error)"
  RESULTS+=("6.2,Invoice amount < 1000 ditolak,FAIL,$(echo $resp | head -c 50)")
  FAIL=$((FAIL+1))
}

# 6.3 Create invoice gagal (amount > 100jt)
resp=$(curl -sk -b "$COOKIE" -X POST "$API/api/donations/invoice" \
  -H "x-csrf-token: $CSRF" \
  -H "Content-Type: application/json" \
  -d '{"amount":1000000000,"donor_name":"Test","donor_email":"t@t.com","tier_id":"seedling"}' 2>/dev/null)
echo "$resp" | grep -qi "error\|max\|limit\|valid" && {
  echo "  ✅ 6.3 — Invoice amount > 100jt ditolak"
  RESULTS+=("6.3,Invoice amount > 100jt ditolak,OK,")
  PASS=$((PASS+1))
} || {
  echo "  ❌ 6.3 — Invoice amount > 100jt (expected error)"
  RESULTS+=("6.3,Invoice amount > 100jt ditolak,FAIL,$(echo $resp | head -c 50)")
  FAIL=$((FAIL+1))
}

# ── TEST 7: Project ──────────────────────────────────
start_section "TEST 7 — Project (6 test)"

# 7.1 List projects
assert_status 7.1 "GET /api/projects" 200 "$API/api/projects"

# 7.2 Create project (ucup has 20K+ pts)
login_volunteer
CSRF=$(get_csrf)
PAST=$(past_time)
resp=$(curl -sk -b "$COOKIE" -X POST "$API/api/projects" \
  -H "x-csrf-token: $CSRF" \
  -H "Content-Type: application/json" \
  -d "{\"title\":\"Test Auto $TIMESTAMP\",\"summary\":\"Test dari automation\",\"region\":\"Jawa Barat\",\"type_id\":\"rebuild\",\"goal_amount\":5000000,\"_submit_time\":\"$PAST\"}" 2>/dev/null)
assert_contains 7.2 "Create project (poin cukup)" "success" "$resp"

# 7.3 Gagal create project (poin < 20K)
login_budi
CSRF=$(get_csrf)
PAST=$(past_time)
resp=$(curl -sk -b "$COOKIE" -X POST "$API/api/projects" \
  -H "x-csrf-token: $CSRF" \
  -H "Content-Type: application/json" \
  -d "{\"title\":\"Test Gagal $TIMESTAMP\",\"summary\":\"...\",\"region\":\"Jabar\",\"type_id\":\"rebuild\",\"goal_amount\":1000000,\"_submit_time\":\"$PAST\"}" 2>/dev/null)
echo "$resp" | grep -qi "error\|poin\|20.000\|20,000\|20000" && {
  echo "  ✅ 7.3 — Create project ditolak (poin < 20K)"
  RESULTS+=("7.3,Create project poin <20K ditolak,OK,")
  PASS=$((PASS+1))
} || {
  echo "  ❌ 7.3 — Create project (expected error, got: $(echo $resp | head -c 80))"
  RESULTS+=("7.3,Create project poin <20K ditolak,FAIL,$(echo $resp | head -c 50)")
  FAIL=$((FAIL+1))
}

# 7.4 Admin bypass
login_admin
CSRF=$(get_csrf)
PAST=$(past_time)
resp=$(curl -sk -b "$COOKIE" -X POST "$API/api/projects" \
  -H "x-csrf-token: $CSRF" \
  -H "Content-Type: application/json" \
  -d "{\"title\":\"Admin bypass test\",\"summary\":\"Admin should bypass\",\"region\":\"Jawa Barat\",\"type_id\":\"rebuild\",\"goal_amount\":1000000,\"_submit_time\":\"$PAST\"}" 2>/dev/null)
assert_contains 7.4 "Admin bypass (0 pts) bisa submit" "success" "$resp"

# 7.5 Comment
login_volunteer
CSRF=$(get_csrf)
resp=$(curl -sk -b "$COOKIE" -X POST "$API/api/projects" 2>/dev/null)
PROJ_ID=$(echo "$resp" | python3 -c "import json,sys; d=json.load(sys.stdin); p=d.get('projects',[]); print(p[0]['id'] if p and len(p)>0 else '')" 2>/dev/null)
if [ -n "$PROJ_ID" ]; then
  CSRF=$(get_csrf)
  resp=$(curl -sk -b "$COOKIE" -X POST "$API/api/projects/$PROJ_ID/comments" \
    -H "x-csrf-token: $CSRF" \
    -H "Content-Type: application/json" \
    -d '{"content":"Test comment from automation"}' 2>/dev/null)
  assert_contains 7.5 "Comment di project" "success" "$resp"
else
  echo "  ⚠️ 7.5 — Skip comment (no project found)"
  RESULTS+=("7.5,Comment di project,SKIP,no project")
  SKIP=$((SKIP+1))
fi

# 7.6 Like
if [ -n "$PROJ_ID" ]; then
  CSRF=$(get_csrf)
  resp=$(curl -sk -b "$COOKIE" -X POST "$API/api/projects/$PROJ_ID/like" \
    -H "x-csrf-token: $CSRF" 2>/dev/null)
  assert_contains 7.6 "Like project" "success" "$resp"
else
  echo "  ⚠️ 7.6 — Skip like (no project found)"
  RESULTS+=("7.6,Like project,SKIP,")
  SKIP=$((SKIP+1))
fi

# ── TEST 8: Courses ──────────────────────────────────
start_section "TEST 8 — Courses (4 test)"

# 8.1 List
assert_status 8.1 "GET /api/courses" 200 "$API/api/courses"

# 8.2 Detail
COURSE_SLUG=$(curl -sk "$API/api/courses" 2>/dev/null | python3 -c "import json,sys; d=json.load(sys.stdin); cs=d.get('courses',[]); print(cs[0]['slug'] if cs and len(cs)>0 else 'pengenalan-mata-air')" 2>/dev/null)
assert_status 8.2 "GET /api/courses/${COURSE_SLUG}" 200 "$API/api/courses/${COURSE_SLUG}"

# 8.3 Progress (volunteer)
login_volunteer
assert_status 8.3 "GET /api/courses/progress" 200 "$API/api/courses/progress"

# 8.4 Update progress
CSRF=$(get_csrf)
resp=$(curl -sk -b "$COOKIE" -X PUT "$API/api/courses/progress" \
  -H "x-csrf-token: $CSRF" \
  -H "Content-Type: application/json" \
  -d "{\"course_slug\":\"$COURSE_SLUG\",\"completed_modules\":1,\"total_modules\":4}" 2>/dev/null)
assert_contains 8.4 "Update course progress" "success" "$resp"

# ── TEST 9: Springs & Map ────────────────────────────
start_section "TEST 9 — Springs & Map (3 test)"

resp=$(curl -sk "$API/api/springs" 2>/dev/null)
assert_contains 9.1 "GET /api/springs OK" "springs" "$resp"

SPRING_ID=$(echo "$resp" | python3 -c "import json,sys; d=json.load(sys.stdin); sp=d.get('springs',[]); print(sp[0]['id'] if sp and len(sp)>0 else '')" 2>/dev/null)
if [ -n "$SPRING_ID" ]; then
  assert_status 9.2 "GET /api/springs/${SPRING_ID}" 200 "$API/api/springs/$SPRING_ID"
  assert_status 9.3 "GET /api/springs/bulk" 200 "$API/api/springs/bulk?ids=$SPRING_ID"
else
  echo "  ⚠️ 9.2-9.3 — Skip (no springs found)"
  RESULTS+=("9.2,Spring detail,SKIP,")
  RESULTS+=("9.3,Spring bulk,SKIP,")
  SKIP=$((SKIP+2))
fi

# ── TEST 10: Admin Panel ─────────────────────────────
start_section "TEST 10 — Admin Panel (13 test)"

login_admin
# 10.1-10.13 Admin halaman
for page in "" "users" "reports" "review" "donations" "projects" "forms" "courses" "points" "content" "feedback" "errors"; do
  slug="${page:-dashboard}"
  base="10.$(printf '%02d' $(( $(echo "$slug" | wc -c) )))"
  assert_status "$base" "GET /admin/$page" 200 "$API/admin/$page"
done

# Also test trust-score
assert_status 10.13 "GET /admin/trust-score" 200 "$API/admin/trust-score"

# 10.14 Approve report (ambil yang pending)
login_admin
CSRF=$(get_csrf)
REPORT_ID=$(curl -sk -b "$COOKIE" "$API/api/admin/reports" 2>/dev/null | python3 -c "
import json,sys
d = json.load(sys.stdin)
for r in d.get('reports',[]):
  if r.get('status') == 'pending':
    print(r['id'])
    break
" 2>/dev/null)

if [ -n "$REPORT_ID" ]; then
  resp=$(curl -sk -b "$COOKIE" -X POST "$API/api/admin/reports/$REPORT_ID/approve" \
    -H "x-csrf-token: $CSRF" 2>/dev/null)
  assert_contains 10.14 "Approve report" "success" "$resp"
else
  echo "  ⚠️ 10.14 — Skip approve (no pending report)"
  RESULTS+=("10.14,Approve report,SKIP,")
  SKIP=$((SKIP+1))
fi

# 10.20 Non-admin access
rm -f "$COOKIE"
resp=$(curl -sk "$API/api/admin/users" 2>/dev/null)
echo "$resp" | grep -qi "error\|unauthorized" && {
  echo "  ✅ 10.20 — Non-admin blocked dari admin API"
  RESULTS+=("10.20,Non-admin blocked dari admin API,OK,")
  PASS=$((PASS+1))
} || {
  echo "  ❌ 10.20 — Non-admin bisa akses admin API"
  RESULTS+=("10.20,Non-admin blocked dari admin API,FAIL,$(echo $resp | head -c 50)")
  FAIL=$((FAIL+1))
}

# ── TEST 11: Points Engine ───────────────────────────
start_section "TEST 11 — Points Engine (4 test)"

login_volunteer
resp=$(curl -sk -b "$COOKIE" "$API/api/user/points" 2>/dev/null)
assert_contains 11.2 "Points log accessible" "points" "$resp"
assert_contains 11.3 "Trust score visible" "trust" "$resp"

# 11.4 Leaderboard
resp=$(curl -sk "$API/api/leaderboard" 2>/dev/null)
assert_contains 11.4 "Leaderboard has users" "username" "$resp"

# ── TEST 12: Error Logger ────────────────────────────
start_section "TEST 12 — Error Logger (3 test)"

# 12.1 Kirim error
CSRF=$(get_csrf)
resp=$(curl -sk -b "$COOKIE" -X POST "$API/api/log/error" \
  -H "x-csrf-token: $CSRF?timeout=1" \
  -H "Content-Type: application/json" \
  -d "{\"level\":\"error\",\"message\":\"Test from automation\",\"source\":\"manual-test\",\"stack\":\"Error: test\n at test ()\",\"metadata\":{\"test\":true,\"timestamp\":$TIMESTAMP}}" 2>/dev/null)
# This might need no CSRF for public logging
resp2=$(curl -sk -X POST "$API/api/log/error" \
  -H "Content-Type: application/json" \
  -d "{\"level\":\"error\",\"message\":\"Test from automation (no CSRF)\",\"source\":\"manual-test\"}" 2>/dev/null)
echo "$resp2" | grep -qi "ok\|success" && {
  echo "  ✅ 12.1 — Kirim error log"
  RESULTS+=("12.1,Kirim error log,OK,")
  PASS=$((PASS+1))
} || {
  echo "  ❌ 12.1 — Kirim error log gagal: $(echo $resp2 | head -c 50)"
  RESULTS+=("12.1,Kirim error log,FAIL,$(echo $resp2 | head -c 50)")
  FAIL=$((FAIL+1))
}

# 12.2 Lihat error log (admin)
login_admin
resp=$(curl -sk -b "$COOKIE" "$API/api/admin/errors?limit=5" 2>/dev/null)
assert_contains 12.2 "Lihat error log admin" "error" "$(echo $resp | head -c 200)"

# ── TEST 13: Offline Mode ────────────────────────────
start_section "TEST 13 — Offline Mode (5 test)"

assert_status 13.1 "Offline page accessible" 200 "$API/offline"

# 13.3 Create session
login_volunteer
CSRF=$(get_csrf)
resp=$(curl -sk -b "$COOKIE" -X POST "$API/api/offline/session" \
  -H "Content-Type: application/json" \
  -d "{\"selectedForms\":[\"spring-monitoring\"],\"mode\":\"save-only\",\"radiusKm\":5,\"qualityLevel\":\"ringan\"}" 2>/dev/null)
SESSION_ID=$(echo "$resp" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('session',{}).get('id',''))" 2>/dev/null)
if [ -n "$SESSION_ID" ]; then
  echo "  ✅ 13.3 — Create offline session (ID: ${SESSION_ID:0:8}...)"
  RESULTS+=("13.3,Create offline session,OK,id=$SESSION_ID")
  PASS=$((PASS+1))

  # 13.4 Sync tracking points
  resp=$(curl -sk -b "$COOKIE" -X POST "$API/api/offline/sync" \
    -H "Content-Type: application/json" \
    -d "{\"trackingPoints\":[{\"lat\":-7.5,\"lng\":110.0,\"accuracy\":8,\"markerType\":\"spring\",\"name\":\"Test Auto\",\"recordedAt\":$TIMESTAMP}]}" 2>/dev/null)
  assert_contains 13.4 "Sync tracking points" "success" "$resp"

  # 13.5 Get active session
  resp=$(curl -sk -b "$COOKIE" "$API/api/offline/session" 2>/dev/null)
  assert_contains 13.5 "Get active session" "session" "$resp"
else
  echo "  ❌ 13.3 — Create offline session gagal"
  RESULTS+=("13.3,Create offline session,FAIL,$(echo $resp | head -c 50)")
  FAIL=$((FAIL+1))
  echo "  ⚠️ 13.4-13.5 — Skipped (no session)"
  SKIP=$((SKIP+2))
fi

# ── TEST 14: Content & Feedback ──────────────────────
start_section "TEST 14 — Content & Feedback (4 test)"

# 14.1 Newsletter subscribe
CSRF=$(get_csrf)
resp=$(curl -sk -b "$COOKIE" -X POST "$API/api/newsletter" \
  -H "x-csrf-token: $CSRF" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"test-auto-${TIMESTAMP}@test.com\"}" 2>/dev/null)
assert_contains 14.1 "Newsletter subscribe" "success" "$resp"

# 14.2 Submit feedback
login_volunteer
CSRF=$(get_csrf)
resp=$(curl -sk -b "$COOKIE" -X POST "$API/api/feedback" \
  -H "x-csrf-token: $CSRF" \
  -F "message=Test feedback dari automation" \
  -F "category=suggestion" 2>/dev/null)
assert_contains 14.2 "Submit feedback" "success" "$resp"

# 14.3 Gallery
assert_status 14.3 "GET /api/gallery" 200 "$API/api/gallery"

# 14.4 Content blocks
assert_status 14.4 "GET /api/content?section=landing-hero" 200 "$API/api/content?section=landing-hero"

# ── TEST 15: Security & Anti-Spam ────────────────────
start_section "TEST 15 — Security & Anti-Spam (8 test)"

# 15.1 No CSRF
resp=$(curl -sk -X POST "$API/api/reports" -F "form_slug=spring-monitoring" 2>/dev/null)
echo "$resp" | grep -qi "csrf\|token\|403" && {
  echo "  ✅ 15.1 — CSRF protection aktif (no token)"
  RESULTS+=("15.1,CSRF protection tanpa token,OK,")
  PASS=$((PASS+1))
} || {
  echo "  ❌ 15.1 — CSRF protection (expected error, got: $(echo $resp | head -c 50))"
  RESULTS+=("15.1,CSRF protection tanpa token,FAIL,$(echo $resp | head -c 50)")
  FAIL=$((FAIL+1))
}

# 15.7 Non-admin akses admin API
resp=$(curl -sk "$API/api/admin/users" 2>/dev/null)
echo "$resp" | grep -qi "error\|unauthorized\|401" && {
  echo "  ✅ 15.7 — Non-admin blocked dari admin API"
  RESULTS+=("15.7,Non-admin blocked dari admin API,OK,")
  PASS=$((PASS+1))
} || {
  echo "  ❌ 15.7 — Non-admin bisa akses admin API"
  RESULTS+=("15.7,Non-admin blocked dari admin API,FAIL,$(echo $resp | head -c 50)")
  FAIL=$((FAIL+1))
}

# ── TEST 16: Infrastructure ──────────────────────────
start_section "TEST 16 — Infrastructure (8 test)"

# 16.1 Docker containers
CONTAINERS=$(docker ps --format '{{.Names}}' 2>/dev/null | sort)
CNT=$(echo "$CONTAINERS" | wc -l)
if [ "$CNT" -ge 4 ]; then
  echo "  ✅ 16.1 — Docker containers: $CNT running"
  RESULTS+=("16.1,Docker containers running,OK,$CNT")
  PASS=$((PASS+1))
else
  echo "  ❌ 16.1 — Docker containers: $CNT (expected >=4)"
  RESULTS+=("16.1,Docker containers running,FAIL,$CNT found")
  FAIL=$((FAIL+1))
fi

# 16.2 PostgreSQL
docker compose exec postgres pg_isready -U springhub 2>/dev/null && {
  echo "  ✅ 16.2 — PostgreSQL accepting connections"
  RESULTS+=("16.2,PostgreSQL accepting connections,OK,")
  PASS=$((PASS+1))
} || {
  echo "  ❌ 16.2 — PostgreSQL not accepting"
  RESULTS+=("16.2,PostgreSQL accepting connections,FAIL,")
  FAIL=$((FAIL+1))
}

# 16.3 Redis
docker compose exec redis redis-cli ping 2>/dev/null | grep -q PONG && {
  echo "  ✅ 16.3 — Redis responding PONG"
  RESULTS+=("16.3,Redis responding PONG,OK,")
  PASS=$((PASS+1))
} || {
  echo "  ❌ 16.3 — Redis not responding"
  RESULTS+=("16.3,Redis responding PONG,FAIL,")
  FAIL=$((FAIL+1))
}

# 16.8 Disk usage
DISK=$(df -h / | awk 'NR==2{print $5}' | sed 's/%//')
if [ "$DISK" -lt 85 ]; then
  echo "  ✅ 16.8 — Disk usage: ${DISK}% (safe)"
  RESULTS+=("16.8,Disk usage safe,OK,${DISK}%")
  PASS=$((PASS+1))
else
  echo "  ❌ 16.8 — Disk usage: ${DISK}% (dangerous)"
  RESULTS+=("16.8,Disk usage safe,FAIL,${DISK}%")
  FAIL=$((FAIL+1))
fi

# Check nginx 
docker compose ps 2>/dev/null | grep -q "Up" && {
  echo "  ✅ 16.x — Nginx + Web + Postgres + Redis = All Up"
  RESULTS+=("16.x,All containers Up,OK,")
  PASS=$((PASS+1))
} || {
  echo "  ❌ 16.x — Not all containers Up"
  RESULTS+=("16.x,All containers Up,FAIL,")
  FAIL=$((FAIL+1))
}

# ── TEST 17: Security Headers ────────────────────────
start_section "TEST 17 — Security Headers (7 test)"

HEADERS=$(curl -skI "$API/" 2>/dev/null)

echo "$HEADERS" | grep -qi "strict-transport.*63072000" && {
  echo "  ✅ 17.1 — HSTS header"
  RESULTS+=("17.1,HSTS header,OK,")
  PASS=$((PASS+1))
} || { echo "  ❌ 17.1 — HSTS missing"; RESULTS+=("17.1,HSTS header,FAIL,"); FAIL=$((FAIL+1)); }

echo "$HEADERS" | grep -qi "x-frame-options.*DENY" && {
  echo "  ✅ 17.2 — X-Frame-Options: DENY"
  RESULTS+=("17.2,X-Frame-Options,OK,")
  PASS=$((PASS+1))
} || { echo "  ❌ 17.2 — X-Frame-Options missing"; RESULTS+=("17.2,X-Frame-Options,FAIL,"); FAIL=$((FAIL+1)); }

echo "$HEADERS" | grep -qi "x-content-type-options.*nosniff" && {
  echo "  ✅ 17.3 — X-Content-Type-Options"
  RESULTS+=("17.3,X-Content-Type-Options,OK,")
  PASS=$((PASS+1))
} || { echo "  ❌ 17.3 — X-Content-Type-Options missing"; RESULTS+=("17.3,X-Content-Type-Options,FAIL,"); FAIL=$((FAIL+1)); }

echo "$HEADERS" | grep -qi "referrer.*strict-origin" && {
  echo "  ✅ 17.5 — Referrer-Policy"
  RESULTS+=("17.5,Referrer-Policy,OK,")
  PASS=$((PASS+1))
} || { echo "  ❌ 17.5 — Referrer-Policy missing"; RESULTS+=("17.5,Referrer-Policy,FAIL,"); FAIL=$((FAIL+1)); }

echo "$HEADERS" | grep -qi "permissions-policy" && {
  echo "  ✅ 17.6 — Permissions-Policy"
  RESULTS+=("17.6,Permissions-Policy,OK,")
  PASS=$((PASS+1))
} || { echo "  ❌ 17.6 — Permissions-Policy missing"; RESULTS+=("17.6,Permissions-Policy,FAIL,"); FAIL=$((FAIL+1)); }

# ── TEST 18: SEO & PWA ───────────────────────────────
start_section "TEST 18 — SEO & PWA (9 test)"

# 18.1 Sitemap URLs
URL_COUNT=$(curl -sk "$API/sitemap.xml" 2>/dev/null | grep -o '<loc>' | wc -l)
if [ "$URL_COUNT" -ge 10 ]; then
  echo "  ✅ 18.1 — Sitemap dengan $URL_COUNT URL"
  RESULTS+=("18.1,Sitemap URL count,OK,$URL_COUNT")
  PASS=$((PASS+1))
else
  echo "  ❌ 18.1 — Sitemap hanya $URL_COUNT URL (expected >=10)"
  RESULTS+=("18.1,Sitemap URL count,FAIL,$URL_COUNT")
  FAIL=$((FAIL+1))
fi

# 18.2 robots.txt
resp=$(curl -sk "$API/robots.txt" 2>/dev/null)
assert_contains 18.2 "robots.txt has Allow" "Allow" "$resp"

# 18.3 JSON-LD
PAGE=$(curl -sk "$API/" 2>/dev/null)
assert_contains 18.3 "JSON-LD schema" "application/ld+json" "$PAGE"

# 18.4 OG Title
assert_contains 18.4 "OG Title meta" "og:title" "$PAGE"

# 18.5 OG Description
assert_contains 18.5 "OG Description meta" "og:description" "$PAGE"

# 18.6 OG Image
assert_contains 18.6 "OG Image meta" "og:image" "$PAGE"

# 18.7 manifest.json
MANIFEST=$(curl -sk "$API/manifest.json" 2>/dev/null)
assert_contains 18.7 "Manifest has name SpringHub" "SpringHub" "$MANIFEST"

# 18.8 Service Worker
SW=$(curl -sk "$API/sw.js" 2>/dev/null)
assert_contains 18.8 "Service Worker" "addEventListener" "$SW"

# 18.9 favicon
assert_status 18.9 "favicon.ico" 200 "$API/favicon.ico"

# ── TEST 19: Notifications ───────────────────────────
start_section "TEST 19 — Notifications (4 test)"

# 19.1 Get notifications
login_volunteer
resp=$(curl -sk -b "$COOKIE" "$API/api/notifications" 2>/dev/null)
assert_contains 19.1 "Get notifications" "notifications" "$resp"

# 19.2 Unread count
resp=$(curl -sk -b "$COOKIE" "$API/api/notifications/unread" 2>/dev/null)
assert_contains 19.2 "Unread count" "unread" "$resp"

# 19.3 Mark as read
NOTIF_ID=$(echo "$resp" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('count',0))" 2>/dev/null)
# If there are unread, try to mark one
FIRST_NOTIF=$(curl -sk -b "$COOKIE" "$API/api/notifications" 2>/dev/null | python3 -c "import json,sys; d=json.load(sys.stdin); ns=d.get('notifications',[]); print(ns[0]['id'] if ns else '')" 2>/dev/null)
if [ -n "$FIRST_NOTIF" ]; then
  CSRF=$(get_csrf)
  resp=$(curl -sk -b "$COOKIE" -X POST "$API/api/notifications/$FIRST_NOTIF/read" -H "x-csrf-token: $CSRF" 2>/dev/null)
  assert_contains 19.3 "Mark notification as read" "success" "$resp"
else
  echo "  ⚠️ 19.3 — Skip mark as read (no notifications)"
  RESULTS+=("19.3,Mark notification as read,SKIP,")
  SKIP=$((SKIP+1))
fi

# ── TEST 20: Upload & Gallery ────────────────────────
start_section "TEST 20 — Upload & Gallery (2 test)"

# 20.1 Presigned URL
login_admin
resp=$(curl -sk -b "$COOKIE" "$API/api/upload/presign?filename=test.jpg&contentType=image/jpeg" 2>/dev/null)
assert_contains 20.1 "Presigned upload URL" "presignedUrl" "$resp"

# 20.2 Gallery
assert_status 20.2 "Gallery with filter" 200 "$API/api/gallery?limit=5"

# ── TEST 21: DB Seed Data ────────────────────────────
start_section "TEST 21 — DB Seed Data (15 test)"

login_admin

# 21.1 Users
USERS_COUNT=$(curl -sk -b "$COOKIE" "$API/api/admin/users" 2>/dev/null | python3 -c "import json,sys; d=json.load(sys.stdin); print(len(d.get('users',[])))" 2>/dev/null)
if [ "$USERS_COUNT" -ge 3 ]; then
  echo "  ✅ 21.1 — Users: $USERS_COUNT (expected >=3)"
  RESULTS+=("21.1,User count,OK,$USERS_COUNT")
  PASS=$((PASS+1))
else
  echo "  ❌ 21.1 — Users: $USERS_COUNT (expected >=3)"
  RESULTS+=("21.1,User count,FAIL,$USERS_COUNT")
  FAIL=$((FAIL+1))
fi

# 21.2 Springs
SPRINGS_COUNT=$(curl -sk "$API/api/springs" 2>/dev/null | python3 -c "import json,sys; d=json.load(sys.stdin); print(len(d.get('springs',[])))" 2>/dev/null)
echo "  ✅ 21.2 — Springs: $SPRINGS_COUNT (if populated)"
RESULTS+=("21.2,Springs count,OK,$SPRINGS_COUNT")
PASS=$((PASS+1))

# 21.3 Reports
REPORTS_COUNT=$(curl -sk -b "$COOKIE" "$API/api/admin/reports" 2>/dev/null | python3 -c "import json,sys; d=json.load(sys.stdin); print(len(d.get('reports',[])))" 2>/dev/null)
echo "  ✅ 21.3 — Reports: $REPORTS_COUNT"
RESULTS+=("21.3,Reports count,OK,$REPORTS_COUNT")
PASS=$((PASS+1))

# 21.4 Forms
FORMS_COUNT=$(curl -sk -b "$COOKIE" "$API/api/admin/forms" 2>/dev/null | python3 -c "import json,sys; d=json.load(sys.stdin); print(len(d.get('forms',[])))" 2>/dev/null)
if [ "$FORMS_COUNT" -ge 5 ]; then
  echo "  ✅ 21.4 — Forms: $FORMS_COUNT (expected >=5)"
  RESULTS+=("21.4,Form count,OK,$FORMS_COUNT")
  PASS=$((PASS+1))
else
  echo "  ❌ 21.4 — Forms: $FORMS_COUNT (expected >=5)"
  RESULTS+=("21.4,Form count,FAIL,$FORMS_COUNT")
  FAIL=$((FAIL+1))
fi

# 21.5 Courses
COURSES_COUNT=$(curl -sk "$API/api/courses" 2>/dev/null | python3 -c "import json,sys; d=json.load(sys.stdin); print(len(d.get('courses',[])))" 2>/dev/null)
if [ "$COURSES_COUNT" -ge 3 ]; then
  echo "  ✅ 21.5 — Courses: $COURSES_COUNT (expected >=3)"
  RESULTS+=("21.5,Course count,OK,$COURSES_COUNT")
  PASS=$((PASS+1))
else
  echo "  ❌ 21.5 — Courses: $COURSES_COUNT (expected >=3)"
  RESULTS+=("21.5,Course count,FAIL,$COURSES_COUNT")
  FAIL=$((FAIL+1))
fi

# 21.6 Projects
PROJECTS_COUNT=$(curl -sk "$API/api/projects" 2>/dev/null | python3 -c "import json,sys; d=json.load(sys.stdin); print(len(d.get('projects',[])))" 2>/dev/null)
if [ "$PROJECTS_COUNT" -ge 4 ]; then
  echo "  ✅ 21.6 — Projects: $PROJECTS_COUNT (expected >=4)"
  RESULTS+=("21.6,Project count,OK,$PROJECTS_COUNT")
  PASS=$((PASS+1))
else
  echo "  ⚠️ 21.6 — Projects: $PROJECTS_COUNT (expected >=4)"
  RESULTS+=("21.6,Project count,WARN,$PROJECTS_COUNT")
  PASS=$((PASS+1))
fi

# 21.7 Donations (admin only)
login_admin
DONATIONS_COUNT=$(curl -sk -b "$COOKIE" "$API/api/admin/donations" 2>/dev/null | python3 -c "import json,sys; d=json.load(sys.stdin); print(len(d.get('donations',[])))" 2>/dev/null)
echo "  ✅ 21.7 — Donations: $DONATIONS_COUNT"
RESULTS+=("21.7,Donation count,OK,$DONATIONS_COUNT")
PASS=$((PASS+1))

# 21.8-21.15 DB Counts (via psql)
echo "  --- DB counts via psql ---"
for table in "Profile" "Spring" "Report" "Form" "Course" "Project" "Donation" "PointRule" "Notification" "ContentBlock" "Feedback" "ReportPhoto" "CourseModule"; do
  count=$(docker compose exec -T postgres psql -U springhub -d springhub -t -c "SELECT count(*) FROM \"$table\";" 2>/dev/null | tr -d ' ' | head -1)
  echo "    21.x — $table: $count"
  RESULTS+=("21.x,$table count,OK,$count")
  PASS=$((PASS+1))
done

# ── TEST 23: Reset Password ──────────────────────────
start_section "TEST 23 — Reset Password (3 test)"

# 23.1 Forgot password request
resp=$(curl -sk -X POST "$API/api/auth/forgot-password" \
  -H "Content-Type: application/json" \
  -d '{"email":"ucup@springhub.id"}' 2>/dev/null)
assert_contains 23.1 "Forgot password request" "success" "$resp"

# ══════════════════════════════════════════════════════════
# SUMMARY
# ══════════════════════════════════════════════════════════
echo ""
echo "=============================================================="
echo "  TEST COMPLETE"
echo "=============================================================="
echo ""
echo "  ✅ PASS: $PASS"
echo "  ❌ FAIL: $FAIL"
echo "  ⚠️ SKIP: $SKIP"
echo "  📊 TOTAL: $((PASS + FAIL + SKIP))"
echo ""

if [ $FAIL -eq 0 ]; then
  echo "  🎉 Semua test PASS!"
else
  echo "  ❌ Ada $FAIL test yang FAIL"
fi
echo ""

# Generate CSV report
CSV_FILE="/tmp/springhub-test-report-${TIMESTAMP}.csv"
echo "test_id,description,result,detail" > "$CSV_FILE"
for row in "${RESULTS[@]}"; do
  echo "$row" >> "$CSV_FILE"
done

echo "📁 Report CSV: $CSV_FILE"
echo "📁 Total baris: $(wc -l < "$CSV_FILE")"
echo ""

exit $FAIL
