#!/usr/bin/env bash
# Setup htpasswd untuk Basic Auth staging + preview.
# Wajib dijalankan sebelum nginx staging start (atau diidempoten saat deploy).
set -euo pipefail
cd "$(dirname "$0")/.."

ENV_FILE="${ENV_FILE:-.env.staging}"
if [[ ! -f "$ENV_FILE" ]]; then
  echo "ERROR: $ENV_FILE tidak ditemukan" >&2
  exit 1
fi

set -a
source "$ENV_FILE"
set +a

: "${BASIC_AUTH_USER:?BASIC_AUTH_USER belum di-set}"
: "${BASIC_AUTH_PASS:?BASIC_AUTH_PASS belum di-set}"
: "${PREVIEW_BASIC_USER:?PREVIEW_BASIC_USER belum di-set}"
: "${PREVIEW_BASIC_PASS:?PREVIEW_BASIC_PASS belum di-set}"

mkdir -p scripts
umask 077
if command -v htpasswd >/dev/null 2>&1; then
  htpasswd -bc scripts/htpasswd-staging "$BASIC_AUTH_USER" "$BASIC_AUTH_PASS"
  htpasswd -bc scripts/htpasswd-preview "$PREVIEW_BASIC_USER" "$PREVIEW_BASIC_PASS"
else
  # Fallback: htpasswd generator pure-bash (crypt via openssl)
  openssl passwd -apr1 "$BASIC_AUTH_PASS" > /tmp/stg_pw.$$ 
  printf '%s:%s\n' "$BASIC_AUTH_USER" "$(cat /tmp/stg_pw.$$)" > scripts/htpasswd-staging
  openssl passwd -apr1 "$PREVIEW_BASIC_PASS" > /tmp/stg_pw2.$$
  printf '%s:%s\n' "$PREVIEW_BASIC_USER" "$(cat /tmp/stg_pw2.$$)" > scripts/htpasswd-preview
  rm -f /tmp/stg_pw.$$ /tmp/stg_pw2.$$
fi
chmod 644 scripts/htpasswd-staging scripts/htpasswd-preview
echo "htpasswd siap: scripts/htpasswd-staging + scripts/htpasswd-preview"