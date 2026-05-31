#!/bin/bash
# Auto backup script — pg_dump + sync to R2
# Run via cron: 0 */6 * * * /path/to/scripts/backup.sh

set -e

TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_DIR="/tmp/springhub-backups"
DB_NAME="springhub"
DB_USER="springhub"
S3_ENDPOINT="${S3_ENDPOINT:-}"
S3_ACCESS_KEY="${S3_ACCESS_KEY:-}"
S3_SECRET_KEY="${S3_SECRET_KEY:-}"
S3_BUCKET="${S3_BUCKET:-springhub-backups}"

mkdir -p "$BACKUP_DIR"

echo "[BACKUP] Starting backup at $TIMESTAMP"

# Dump database
pg_dump -U "$DB_USER" -d "$DB_NAME" --no-owner --no-acl -F c \
  -f "$BACKUP_DIR/${DB_NAME}-${TIMESTAMP}.dump"

echo "[BACKUP] Database dump created: ${DB_NAME}-${TIMESTAMP}.dump"

# Compress
gzip "$BACKUP_DIR/${DB_NAME}-${TIMESTAMP}.dump"
echo "[BACKUP] Compressed: ${DB_NAME}-${TIMESTAMP}.dump.gz"

# Upload to R2 using rclone or aws-cli
if command -v rclone &> /dev/null; then
  rclone copy "$BACKUP_DIR/${DB_NAME}-${TIMESTAMP}.dump.gz" \
    ":s3,access_key=${S3_ACCESS_KEY},secret_key=${S3_SECRET_KEY},endpoint=${S3_ENDPOINT}:${S3_BUCKET}/database/"
  echo "[BACKUP] Uploaded to R2 via rclone"
elif command -v aws &> /dev/null; then
  aws s3 cp "$BACKUP_DIR/${DB_NAME}-${TIMESTAMP}.dump.gz" \
    "s3://${S3_BUCKET}/database/${DB_NAME}-${TIMESTAMP}.dump.gz" \
    --endpoint-url="${S3_ENDPOINT}"
  echo "[BACKUP] Uploaded to R2 via aws-cli"
else
  echo "[BACKUP] WARNING: Neither rclone nor aws-cli found. Backup file at: $BACKUP_DIR"
fi

# Cleanup old backups (keep last 7 days)
find "$BACKUP_DIR" -name "*.dump.gz" -mtime +7 -delete
echo "[BACKUP] Cleaned up backups older than 7 days"

# Delete old backups from R2 (keep last 30)
if command -v rclone &> /dev/null; then
  rclone delete --min-age 30d \
    ":s3,access_key=${S3_ACCESS_KEY},secret_key=${S3_SECRET_KEY},endpoint=${S3_ENDPOINT}:${S3_BUCKET}/database/"
  echo "[BACKUP] Cleaned up R2 backups older than 30 days"
fi

echo "[BACKUP] Backup completed at $(date +%Y%m%d-%H%M%S)"
echo "[BACKUP] File: ${DB_NAME}-${TIMESTAMP}.dump.gz"
