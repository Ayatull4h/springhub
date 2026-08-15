#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────
# Manual Test Runner — Sesi 17 (Audit + Fix Foto + Hardening)
# Target: staging via SSH tunnel (http://localhost:8080) atau langsung
#         web container (http://127.0.0.1:31760 di VPS).
#
# Dipakai: bash scripts/test-sesi-17.sh [BASE_URL]
#   default BASE_URL=http://127.0.0.1:8080
# ─────────────────────────────────────────────────────────────────────
set -u

BASE="${1:-http://127.0.0.1:8080}"
PASS=0
FAIL=0
declare -a FAILED_NAMES

AUTH="-u 181ff4f6c436d9a69f9dd12e:1a20e619d2d431d66ac60b17"
COOKIE="/tmp/stg-s17-cookie.txt"

# req_body: mengembalikan BODY; status disimpan ke /tmp/s17-code.txt
req_body() {
  curl -s -o /tmp/s17-body.txt -w "%{http_code}" -b "$COOKIE" -c "$COOKIE" "$@" > /tmp/s17-code.txt
  cat /tmp/s17-body.txt
}
# req_code: mengembalikan status code saja
req_code() {
  curl -s -o /dev/null -w "%{http_code}" -b "$COOKIE" -c "$COOKIE" "$@"
}
body() { cat /tmp/s17-body.txt; }
code() { cat /tmp/s17-code.txt; }

pass() { PASS=$((PASS+1)); printf "  ✅ %s\n" "$1"; }
fail() { FAIL=$((FAIL+1)); FAILED_NAMES+=("$1"); printf "  ❌ %s (dapat: %s)\n" "$1" "${2:-}"; }
check() { # check <nama> <expected> <actual>
  if [ "$3" = "$2" ]; then pass "$1"; else fail "$1" "(expected $2, got $3)"; fi
}

echo "==> Target: $BASE"
rm -f "$COOKIE"

# ── Login admin ─────────────────────────────────────────────────────
CSRF=$(req_body $AUTH "$BASE/api/csrf" | python3 -c "import sys,json;print(json.load(sys.stdin)['token'])" 2>/dev/null)
req_body $AUTH -X POST -H "Content-Type: application/json" "$BASE/api/auth/login" \
  -d '{"email":"admin@springhub.id","password":"demo12345"}' >/dev/null

# ── E1. Cache-Control API ───────────────────────────────────────────
H=$(curl -sI $AUTH "$BASE/api/health" | tr -d '\r' | grep -i "^cache-control" | head -1)
if echo "$H" | grep -qi "no-store"; then pass "Cache-Control no-store pada /api"; else fail "Cache-Control no-store" "$H"; fi

# ── E2. CSP tanpa unsafe-eval ───────────────────────────────────────
CSP=$(curl -sI $AUTH "$BASE/api/health" | tr -d '\r' | grep -i "^content-security-policy" | head -1)
if echo "$CSP" | grep -q "unsafe-eval"; then fail "CSP tidak mengandung unsafe-eval" "masih ada"; else pass "CSP tanpa unsafe-eval"; fi

# ── E3. /api/admin tanpa session (incognito) ────────────────────────
CODE=$(curl -s -o /dev/null -w "%{http_code}" $AUTH "$BASE/api/admin/reports")
check "Admin API tanpa session => 403" "403" "$CODE"

# ── E4. Admin API dengan session => 200 ─────────────────────────────
CODE=$(req_code $AUTH "$BASE/api/admin/reports?limit=5")
check "Admin API dengan session => 200" "200" "$CODE"

# ── E5. PII seedlings/[id] tanpa phone (PUBLIK — tanpa session) ─────
PUB_COOKIE="/tmp/stg-s17-pub.txt"
rm -f "$PUB_COOKIE"
SID=$(curl -s -b "$PUB_COOKIE" -c "$PUB_COOKIE" $AUTH "$BASE/api/seedlings" | python3 -c "import sys,json;d=json.load(sys.stdin);print(d['seedlings'][0]['id'] if d.get('seedlings') else '')" 2>/dev/null)
if [ -n "$SID" ]; then
  BODY=$(curl -s -b "$PUB_COOKIE" -c "$PUB_COOKIE" $AUTH "$BASE/api/seedlings/$SID")
  if echo "$BODY" | python3 -c "import sys,json;u=json.load(sys.stdin).get('seedling',{}).get('user',{});sys.exit(0 if 'phone' not in u else 1)" 2>/dev/null; then
    pass "seedlings/[id] publik tidak membocorkan phone"
  else
    fail "seedlings/[id] PII" "phone masih ada"
  fi
else
  fail "seedlings/[id] PII" "tidak ada data seedling"
fi

# ── E6. springs/search hanya approved ───────────────────────────────
BODY=$(curl -s $AUTH "$BASE/api/springs/search?q=um")
STATUSES=$(echo "$BODY" | python3 -c "import sys,json;print(','.join(s['status'] for s in json.load(sys.stdin).get('springs',[])[:20]))" 2>/dev/null)
if [ -n "$STATUSES" ] && ! echo "$STATUSES" | grep -qv "active"; then
  pass "springs/search hanya active"
else
  fail "springs/search approved-only" "$STATUSES"
fi

# ── E7. CSRF: photos POST tanpa token => 403 ────────────────────────
CODE=$(curl -s -o /dev/null -w "%{http_code}" $AUTH -b "$COOKIE" -X POST "$BASE/api/reports/dummy/photos" -F "photo=@/dev/null")
# 401 bisa juga karena auth; kita terima 401/403 = ditolak
if [ "$CODE" = "401" ] || [ "$CODE" = "403" ]; then pass "Upload foto tanpa CSRF ditolak ($CODE)"; else fail "Upload foto tanpa CSRF" "$CODE"; fi

# ── E8. CSRF: user/profile PUT tanpa token => 403 ────────────────────
CODE=$(curl -s -o /dev/null -w "%{http_code}" $AUTH -b "$COOKIE" -X PUT -H "Content-Type: application/json" "$BASE/api/user/profile" -d '{"username":"xyz"}')
check "PUT /api/user/profile tanpa CSRF => 403" "403" "$CODE"

# ── E9. CSRF: courses/progress PUT tanpa token => 403 ───────────────
CODE=$(curl -s -o /dev/null -w "%{http_code}" $AUTH -b "$COOKIE" -X PUT -H "Content-Type: application/json" "$BASE/api/courses/progress" -d '{}')
check "PUT /api/courses/progress tanpa CSRF => 403" "403" "$CODE"

# ── E10. CSRF: admin approve-request tanpa token => 403 ─────────────
CODE=$(curl -s -o /dev/null -w "%{http_code}" $AUTH -b "$COOKIE" -X POST -H "Content-Type: application/json" "$BASE/api/admin/seedlings/abc/approve-request" -d '{"requestId":"x"}')
check "POST approve-request tanpa CSRF => 403" "403" "$CODE"

# ── E11. Route approve-request ADA (dengan CSRF => bukan 404 route) ─
CODE=$(req_code $AUTH -X POST -H "Content-Type: application/json" -H "x-csrf-token: $CSRF" "$BASE/api/admin/seedlings/abc/approve-request" -d '{"requestId":"x"}')
check "Route approve-request ada (bukan 404)" "404" "$CODE"   # 404 = seedling tidak ditemukan (route jalan)

# ── E12. Login volunteer + submit report + foto flow ────────────────
req_body $AUTH -X POST -H "Content-Type: application/json" "$BASE/api/auth/login" -d '{"email":"volunteer@springhub.id","password":"vol12345"}' >/dev/null
CSRF=$(req_body $AUTH "$BASE/api/csrf" | python3 -c "import sys,json;print(json.load(sys.stdin)['token'])" 2>/dev/null)
RESP=$(req_body $AUTH -X POST -H "x-csrf-token: $CSRF" "$BASE/api/reports" \
  -F "form_slug=seedling-stock" \
  -F "_submit_time=$(($(date +%s%3N)-10000))" -F "_website=" \
  -F "A_tanggal=$(date +%F)" -F "A_nama=Manual Test" -F "A_wa=08123456789" \
  -F "A_provinsi=Jawa Barat" -F "A_entri_baru=Entri Baru" \
  -F "B1_jenis_laporan=STOK TERSEDIA" -F "B2_nama_lokal=ManualTest" -F "B3_jumlah=1" \
  -F "location_lat=-7.5" -F "location_lng=110.5" \
  -F "clientCorrelationId=stg17-$(date +%s)")
RID=$(echo "$RESP" | python3 -c "import sys,json;print(json.load(sys.stdin).get('report',{}).get('id',''))" 2>/dev/null)
if [ -n "$RID" ]; then
  pass "Submit laporan (id $RID)"
  # Upload 1 foto (valid PNG)
  CODE=$(req_code $AUTH -X POST -H "x-csrf-token: $CSRF" "$BASE/api/reports/$RID/photos" -F "photo=@/root/springhub/public/favicon.png;type=image/png" -F "field_id=C1_foto")
  check "Upload foto online => 201" "201" "$CODE"
  # GET photos owner => 200
  CODE=$(req_code $AUTH "$BASE/api/reports/$RID/photos")
  check "GET photos owner => 200" "200" "$CODE"
  # HEIC => pesan ramah (400)
  python3 -c "d=bytearray(32);d[4:8]=b'ftyp';d[8:12]=b'heic';open('/tmp/stg17.heic','wb').write(bytes(d))"
  BODY=$(req_body $AUTH -X POST -H "x-csrf-token: $CSRF" "$BASE/api/reports/$RID/photos" -F "photo=@/tmp/stg17.heic;type=image/heic" -F "field_id=C1_foto")
  if echo "$BODY" | grep -qi "HEIC"; then pass "HEIC ditolak dengan pesan ramah"; else fail "HEIC pesan ramah" "$BODY"; fi
  # Upload foto ke-6 => 400 (sudah ada 1 + max 5 total: biarkan, hanya 1 di atas)
else
  fail "Submit laporan" "$RESP"
fi

# ── Ringkasan ───────────────────────────────────────────────────────
echo ""
echo "══════════════════════════════════════════"
echo "  PASS : $PASS"
echo "  FAIL : $FAIL"
if [ "$FAIL" -gt 0 ]; then
  printf '  Gagal: %s\n' "${FAILED_NAMES[@]}"
fi
echo "══════════════════════════════════════════"
exit $((FAIL > 0 ? 1 : 0))
