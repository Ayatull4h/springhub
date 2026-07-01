#!/bin/bash
# Capture Docker nginx logs untuk fail2ban
# Jalan tiap 60 detik via cron
LOG_FILE="/var/log/springhub-nginx.log"
CONTAINER="springhub-nginx-1"

# Cek apakah container running
docker ps --format '{{.Names}}' | grep -q "$CONTAINER" || exit 0

# Ambil log 60 detik terakhir
docker logs "$CONTAINER" --since 60s 2>&1 | grep -v "^$" >> "$LOG_FILE"

# Rotate — keep max 10000 lines
if [ $(wc -l < "$LOG_FILE") -gt 10000 ]; then
  tail -5000 "$LOG_FILE" > /tmp/nginx-log.tmp
  mv /tmp/nginx-log.tmp "$LOG_FILE"
fi
