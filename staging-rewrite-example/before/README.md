# SEBELUM — Bertele-tele (1 file = 200 baris)

File: `app/api/reports/route.ts` (sekarang, staging)

```ts
// 200 baris campur 6 lapis dalam 1 file
import { verifyCsrfToken } from "@/lib/csrf";
import { getSession, isAdmin } from "@/lib/auth";
import { publicLimiter } from "@/lib/rate-limit";
import { z } from "zod";

export async function POST(req: Request) {
  const csrf = req.headers.get("x-csrf-token");
  if (!csrf || !(await verifyCsrfToken(csrf))) return 403;
  const session = await getSession();
  if (!session) return 401;
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
  const lim = await publicLimiter.check(`reports:${ip}`);
  if (!lim.allowed) return 429;
  // ... 83 field Zod .max(500) + phoneRegex ...
  // ... prisma.report.create + clientCorrelationId ...
  // ... sharp magic bytes + EXIF strip ...
  // ... select user.email (PII bocor) ...
}
```

**Masalah:** 15 baris guard di-copy 95 kali (`app/api/**`). Ganti `RATE_LIMIT` harus buka 95 file. Kredensial `JWT_SECRET` di `const SECRET = getJwtSecret()` cache.

**Total staging sekarang:** `app+lib` 27.491 baris, `components` tidak disentuh.
