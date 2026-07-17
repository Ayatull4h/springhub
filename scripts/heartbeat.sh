#!/bin/bash
# SpringHub — Heartbeat / Uptime monitor
# Kirim sinyal ke Better Stack (ganti URL dengan milikmu)
# Atau alternatif sederhana: log status ke file

HEALTH_URL="https://www.springhub.id/api/health"
LOG_FILE="/var/log/springhub-heartbeat.log"
STATUS=$(curl -sk -o /dev/null -w "%{http_code}" --connect-timeout 10 "$HEALTH_URL" 2>/dev/null || echo "000")
DATE=$(date '+%Y-%m-%d %H:%M:%S')

if [ "$STATUS" = "200" ]; then
  echo "$DATE OK $STATUS" >> "$LOG_FILE"
else
  echo "$DATE FAIL $STATUS" >> "$LOG_FILE"
  # Kirim alert via Telegram/email jika perlu
fi

# Rotate log — keep last 10000 lines
tail -10000 "$LOG_FILE" > /tmp/hb.tmp && mv /tmp/hb.tmp "$LOG_FILE"
