#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# SpringHub — Database Backup Script
# Jadwal: Setiap hari jam 03:00 WIB (cron)
# Retensi: 7 hari
# ═══════════════════════════════════════════════════════════════

set -euo pipefail

TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_DIR="/root/backups"
DB_CONTAINER="springhub-postgres-1"
DB_USER="springhub"
DB_NAME="springhub"

# Buat direktori backup
mkdir -p "$BACKUP_DIR"

# Cek container running
if ! docker ps --format '{{.Names}}' | grep -q "^${DB_CONTAINER}$"; then
  echo "[$TIMESTAMP] ERROR: Container $DB_CONTAINER tidak running!" >&2
  exit 1
fi

# Execute backup
BACKUP_FILE="${BACKUP_DIR}/springhub-${TIMESTAMP}.sql.gz"

docker exec "$DB_CONTAINER" pg_dump \
  -U "$DB_USER" \
  --no-owner \
  --no-acl \
  --clean \
  --if-exists \
  "$DB_NAME" 2>> "$BACKUP_DIR/backup.log" | gzip > "$BACKUP_FILE"

# Validasi: file hasil backup harus > 1KB
if [ ! -s "$BACKUP_FILE" ] || [ "$(stat -c%s "$BACKUP_FILE")" -lt 1024 ]; then
  echo "[$TIMESTAMP] ERROR: Backup file terlalu kecil atau kosong!" >&2
  rm -f "$BACKUP_FILE"
  exit 1
fi

# Hitung size
BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
echo "[$TIMESTAMP] Backup OK: $BACKUP_FILE ($BACKUP_SIZE)"

# ── Retensi: hapus backup lebih dari 7 hari ──
find "$BACKUP_DIR" -name "springhub-*.sql.gz" -type f -mtime +7 -delete
