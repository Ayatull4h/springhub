#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# SpringHub — Server Firewall & Hardening Script
# ═══════════════════════════════════════════════════════════════
# Setelah Cloudflare Proxy ON, akses langsung ke VPS via HTTP/HTTPS
# hanya berasal dari IP Cloudflare. Script ini memperkuat UFW dengan:
#   1. Restrict port 80/443 hanya dari Cloudflare IPs
#   2. Rate limit SSH (port 22)
#   3. Block port selain 22, 80, 443
# ═══════════════════════════════════════════════════════════════

set -euo pipefail

echo "=== SpringHub Firewall Hardening ==="
echo ""

# ── 1. Reset UFW ke default ──
echo "[1/5] Reset UFW ke default..."
ufw --force reset
ufw default deny incoming
ufw default allow outgoing

# ── 2. SSH — rate limited ──
echo "[2/5] SSH rate limit (port 22)..."
ufw limit ssh comment "SSH rate limited"

# ── 3. Cloudflare-only untuk HTTP/HTTPS ──
echo "[3/5] Allow HTTP/HTTPS hanya dari Cloudflare..."
CLOUDFLARE_IPV4_URL="https://www.cloudflare.com/ips-v4"
CLOUDFLARE_IPV6_URL="https://www.cloudflare.com/ips-v6"

if command -v curl &>/dev/null; then
  # IPv4 ranges
  for ip in $(curl -s "$CLOUDFLARE_IPV4_URL"); do
    ufw allow proto tcp from "$ip" to any port 80,443 comment "Cloudflare IPv4"
  done
  # IPv6 ranges
  for ip in $(curl -s "$CLOUDFLARE_IPV6_URL"); do
    ufw allow proto tcp from "$ip" to any port 80,443 comment "Cloudflare IPv6"
  done
  echo "   ✅ Cloudflare IPs loaded ($(curl -s "$CLOUDFLARE_IPV4_URL" | wc -l) IPv4, $(curl -s "$CLOUDFLARE_IPV6_URL" | wc -l) IPv6)"
else
  echo "   ⚠️  curl not found — allow all to port 80/443 (fallback)"
  ufw allow 80/tcp
  ufw allow 443/tcp
fi

# ── 4. Enable UFW ──
echo "[4/5] Enable UFW..."
ufw --force enable

# ── 5. Status ──
echo ""
echo "[5/5] UFW Status:"
ufw status numbered

echo ""
echo "=== Done ==="
echo "Catatan: Jalankan script ini SETELAH Cloudflare Proxy ON."
echo "Kalau web tiba-tiba gak bisa diakses, jalankan: ufw allow 80,443/tcp"
