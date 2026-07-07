#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# SpringHub — Database Backup Script
# Jadwal: Setiap hari jam 03:00 WIB (cron)
# Retensi: 7 hari
# Enkripsi: GPG symmetric (AES256) — file .gpg aman disimpan di cloud
# ═══════════════════════════════════════════════════════════════

set -euo pipefail

TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_DIR="/root/backups"
DB_CONTAINER="springhub-postgres-1"
DB_USER="springhub"
DB_NAME="springhub"
ENV_FILE="/root/springhub/.env.production"

# Muat encryption key dari .env (BACKUP_ENCRYPT_KEY)
if [ -f "$ENV_FILE" ]; then
  # shellcheck source=/dev/null
  source "$ENV_FILE" 2>/dev/null || true
fi

ENCRYPT_KEY="${BACKUP_ENCRYPT_KEY:-}"

# Buat direktori backup
mkdir -p "$BACKUP_DIR"

# Cek container running
if ! docker ps --format '{{.Names}}' | grep -q "^${DB_CONTAINER}$"; then
  echo "[$TIMESTAMP] ERROR: Container $DB_CONTAINER tidak running!" >&2
  exit 1
fi

# Execute backup — langsung pipe ke gzip + gpg kalo ada key
BACKUP_FILE="${BACKUP_DIR}/springhub-${TIMESTAMP}.sql.gz"

if [ -n "$ENCRYPT_KEY" ]; then
  # Backup encrypted (.gpg)
  ENCRYPTED_FILE="${BACKUP_DIR}/springhub-${TIMESTAMP}.sql.gz.gpg"
  docker exec "$DB_CONTAINER" pg_dump \
    -U "$DB_USER" \
    --no-owner \
    --no-acl \
    --clean \
    --if-exists \
    "$DB_NAME" 2>> "$BACKUP_DIR/backup.log" | gzip | gpg \
      --batch \
      --symmetric \
      --cipher-algo AES256 \
      --passphrase "$ENCRYPT_KEY" \
      --output "$ENCRYPTED_FILE"
  
  # Validasi
  if [ ! -s "$ENCRYPTED_FILE" ] || [ "$(stat -c%s "$ENCRYPTED_FILE")" -lt 1024 ]; then
    echo "[$TIMESTAMP] ERROR: Encrypted backup terlalu kecil atau kosong!" >&2
    rm -f "$ENCRYPTED_FILE"
    exit 1
  fi
  
  BACKUP_SIZE=$(du -h "$ENCRYPTED_FILE" | cut -f1)
  echo "[$TIMESTAMP] Encrypted backup OK: $ENCRYPTED_FILE ($BACKUP_SIZE)"
  
  # Hapus file .gz yang tidak dienkripsi (kalo ada)
  rm -f "$BACKUP_FILE"
else
  # Backup plaintext (tanpa enkripsi)
  docker exec "$DB_CONTAINER" pg_dump \
    -U "$DB_USER" \
    --no-owner \
    --no-acl \
    --clean \
    --if-exists \
    "$DB_NAME" 2>> "$BACKUP_DIR/backup.log" | gzip > "$BACKUP_FILE"
  
  # Validasi
  if [ ! -s "$BACKUP_FILE" ] || [ "$(stat -c%s "$BACKUP_FILE")" -lt 1024 ]; then
    echo "[$TIMESTAMP] ERROR: Backup file terlalu kecil atau kosong!" >&2
    rm -f "$BACKUP_FILE"
    exit 1
  fi
  
  BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
  echo "[$TIMESTAMP] Backup OK: $BACKUP_FILE ($BACKUP_SIZE)"
  echo "[$TIMESTAMP] WARNING: Backup TIDAK dienkripsi. Set BACKUP_ENCRYPT_KEY di .env.production"
fi

# ── Retensi: hapus backup lebih dari 7 hari ──
find "$BACKUP_DIR" -name "springhub-*.sql.gz*" -type f -mtime +7 -delete
