# 🔐 Cloudflare WAF Rules — SpringHub

Daftar aturan firewall yang bisa kamu aktifkan di **Cloudflare Dashboard → Security → WAF**.

---

## 1. 🚫 Blokir Traffic dari Negara Berisiko Tinggi

| Field | Value |
|---|---|
| **Rule Name** | Block High-Risk Countries |
| **Field** | `ip.geoip.country` |
| **Operator** | `in` |
| **Value** | `RU`, `CN`, `KP`, `IR`, `SY`, `CU` |
| **Action** | 🛑 Block |
| **Order** | 1 |

> Blokir traffic dari negara yang sering jadi sumber serangan (Rusia, China, Korea Utara, Iran, Suriah, Kuba). Sesuaikan dengan kebutuhan.

---

## 2. 🛡️ Rate Limit — Login & Register

| Field | Value |
|---|---|
| **Rule Name** | Rate Limit — Auth |
| **When** | URI Path contains `/api/auth/login` OR `/api/auth/register` |
| **Requests** | 10 per 60 seconds |
| **Action** | 🛑 Block for 10 minutes |

---

## 3. 🛡️ Rate Limit — Donasi & Report

| Field | Value |
|---|---|
| **Rule Name** | Rate Limit — Donasi & Report |
| **When** | URI Path contains `/api/donations/` OR `/api/reports/` |
| **Requests** | 5 per 60 seconds |
| **Action** | 🛑 Block for 10 minutes |

---

## 4. 🛡️ Rate Limit — API Umum

| Field | Value |
|---|---|
| **Rule Name** | Rate Limit — General API |
| **When** | URI Path contains `/api/` |
| **Requests** | 50 per 60 seconds |
| **Action** | 🛑 Block for 5 minutes |

---

## 5. 🔒 Blokir Traffic Tanpa User-Agent

| Field | Value |
|---|---|
| **Rule Name** | Block Missing User-Agent |
| **Field** | `http.user_agent` |
| **Operator** | `eq` |
| **Value** | (empty) |
| **Action** | 🛑 Block |

> Banyak bot/attacker kirim request tanpa User-Agent.

---

## 6. 🛡️ Blokir Proxy/VPN (Opsional)

Aktifkan **Cloudflare WAF Managed Rules**:
- **Cloudflare IP Reputation** → ON
- **Anomaly Detection** → ON

Atau buat rule manual:
| Field | Value |
|---|---|
| **Rule Name** | Block Known Proxies |
| **Field** | `cf.edge.server_ip` + `cf.client.bot` |
| **Condition** | `cf.client.bot` eq `true` |
| **Action** | 🛑 Block |

---

## 7. 🔐 HSTS Preload & HTTPS

Di **SSL/TLS → Edge Certificates**:
| Setelan | Status |
|---|---|
| Always Use HTTPS | 🔘 ON |
| HTTP Strict Transport Security (HSTS) | 🔘 ON (max-age=1 year, include subdomains, preload) |
| Minimum TLS Version | 🔘 TLS 1.2 |
| Opportunistic Encryption | 🔘 ON |

---

## Cara Aktivasi

1. Buka **[Cloudflare Dashboard](https://dash.cloudflare.com)** → `springhub.id`
2. **Security → WAF → Custom Rules**
3. Klik **Create Rule**
4. Isi nama, kondisi, action per rule di atas
5. Klik **Deploy**

Semua rules ini **gratis** (termasuk paket Free Cloudflare).
