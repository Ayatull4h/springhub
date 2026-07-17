#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# SpringHub — Performa Optimasi & Rollback Script
# ═══════════════════════════════════════════════════════════════
# Cara pakai:
#   bash scripts/perf-optimize.sh        → jalanin optimasi
#   bash scripts/perf-optimize.sh undo   → balikin ke sebelum optimasi
# ═══════════════════════════════════════════════════════════════

set -euo pipefail

ACTION="${1:-run}"

if [ "$ACTION" = "undo" ]; then
  echo "[UNDO] Balikin ke sebelum optimasi..."
  git checkout pre-perf-backup -- \
    lib/upload-photo.ts \
    app/springs/\[id\]/page.tsx \
    _senior/components/ActivitiesCard.tsx \
    app/layout.tsx
  echo "[UNDO] File balik. Build + deploy..."
  cd /root/springhub && docker compose build web && docker compose up -d web
  echo "[UNDO] ✅ Selesai. Health check:"
  curl -s -o /dev/null -w "HTTP %{http_code}\n" --max-time 5 http://127.0.0.1:31759/api/health
  exit 0
fi

echo "══════════════════════════════════════════════"
echo "  OPTIMASI PERFORMA — SpringHub"
echo "══════════════════════════════════════════════"
echo ""

# ── 1. Backup (sudah dibuat: git tag pre-perf-backup) ──
echo "[1/4] Backup state: ✅ (git tag: pre-perf-backup)"

# ── 2. Optimasi ──
echo "[2/4] Terapkan optimasi..."

# 2a. Kompres foto lebih kecil (720p → 480p)
sed -i 's/.resize(1280, 720)/.resize(854, 480)/' lib/upload-photo.ts
echo "  ✅ lib/upload-photo.ts: resize 720p → 480p"

# 2b. Hapus unoptimized dari spring detail page
cd /root/springhub
python3 << 'PYEOF'
files_to_fix = {
    "app/springs/[id]/page.tsx": ["unoptimized"],
    "_senior/components/ActivitiesCard.tsx": ["unoptimized"],
}
for fp, props in files_to_fix.items():
    with open(fp, 'r') as f:
        content = f.read()
    for prop in props:
        # Hapus prop "unoptimized" dari baris Image
        content = content.replace(f'\n              {prop}\n', '\n')
        content = content.replace(f' {prop}\n', '\n')
    with open(fp, 'w') as f:
        f.write(content)
    print(f"  ✅ {fp}: hapus unoptimized")
PYEOF

# 2c. Tambah preconnect Google Fonts
python3 << 'PYEOF'
with open("app/layout.tsx", 'r') as f:
    content = f.read()

preconnect = '''    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />'''

if "fonts.googleapis.com" not in content:
    content = content.replace(
        '    <link rel="icon" href="/favicon.ico" sizes="any" />',
        f'{preconnect}\n    <link rel="icon" href="/favicon.ico" sizes="any" />'
    )
    with open("app/layout.tsx", 'w') as f:
        f.write(content)
    print("  ✅ app/layout.tsx: tambah preconnect font")
else:
    print("  ⏭️ app/layout.tsx: preconnect sudah ada")
PYEOF

# ── 3. Build + Deploy ──
echo "[3/4] Build & deploy..."
docker compose build web 2>&1 | tail -3
docker compose up -d web 2>&1 | tail -3

# ── 4. Verifikasi ──
echo "[4/4] Verifikasi..."
sleep 5
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 http://127.0.0.1:31759/api/health)
if [ "$HTTP_CODE" = "200" ]; then
  echo ""
  echo "══════════════════════════════════════════════"
  echo "  ✅ OPTIMASI BERHASIL — Health: HTTP 200"
  echo "══════════════════════════════════════════════"
  echo ""
  echo "⚠️  Kalo error, langsung rollback:"
  echo "   bash scripts/perf-optimize.sh undo"
else
  echo ""
  echo "❌ Health check gagal (HTTP $HTTP_CODE). Rollback otomatis..."
  bash "$0" undo
fi
