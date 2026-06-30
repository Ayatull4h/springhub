#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# SpringHub — Database Backup Script
# Jadwal: Setiap Minggu jam 03:00 WIB (cron)
# Retensi: 8 backup terakhir (~2 bulan)
# ═══════════════════════════════════════════════════════════════

set -euo pipefail

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/springhub"
DB_CONTAINER="springhub-postgres-1"
DB_USER="springhub"
DB_NAME="springhub"
LOG_FILE="/var/log/springhub-backup.log"

# Buat direktori backup
mkdir -p "$BACKUP_DIR"

# Mulai logging
echo "[$TIMESTAMP] Starting backup..." >> "$LOG_FILE"

# Cek container running
if ! docker ps --format '{{.Names}}' | grep -q "^${DB_CONTAINER}$"; then
  echo "[$TIMESTAMP] ERROR: Container $DB_CONTAINER tidak running!" >> "$LOG_FILE"
  exit 1
fi

# Execute backup
BACKUP_FILE="${BACKUP_DIR}/${DB_NAME}_${TIMESTAMP}.sql.gz"

docker exec "$DB_CONTAINER" pg_dump \
  -U "$DB_USER" \
  --no-owner \
  --no-acl \
  --clean \
  --if-exists \
  "$DB_NAME" 2>> "$LOG_FILE" | gzip > "$BACKUP_FILE"

# Validasi: file hasil backup harus > 1KB
if [ ! -s "$BACKUP_FILE" ] || [ "$(stat -c%s "$BACKUP_FILE")" -lt 1024 ]; then
  echo "[$TIMESTAMP] ERROR: Backup file terlalu kecil atau kosong!" >> "$LOG_FILE"
  rm -f "$BACKUP_FILE"
  exit 1
fi

# Hitung size
BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
echo "[$TIMESTAMP] Backup OK: $BACKUP_FILE ($BACKUP_SIZE)" >> "$LOG_FILE"

# ── Retensi: hapus backup lebih dari 8 file (≈2 bulan backup mingguan) ──
OLD_BACKUPS=$(ls -t "$BACKUP_DIR"/*.sql.gz 2>/dev/null | tail -n +9)
if [ -n "$OLD_BACKUPS" ]; then
  echo "$OLD_BACKUPS" | while read -r OLD; do
    rm -f "$OLD"
    echo "[$TIMESTAMP] Hapus backup lama: $OLD" >> "$LOG_FILE"
  done
fi

echo "[$TIMESTAMP] Backup selesai." >> "$LOG_FILE"
