# SpringHub

Community-driven monitoring & restoration of Indonesia's artesian springs.

**Stack:** Next.js 14 App Router · TypeScript strict · Tailwind CSS 3.4 · Leaflet · PostgreSQL + Prisma 7.8 · Redis · Docker VPS

---

## Commands

| Action | Command |
|---|---|
| Dev | `npm run dev` (localhost:3000) |
| Build | `npm run build` (Next.js standalone output) |
| Typecheck | `npx tsc --noEmit` |
| Lint | `npm run lint` (ignored during build) |
| Test (unit) | `npm test` (vitest, jsdom, `lib/**/*.test.ts`) |
| Test (E2E) | `npm run test:e2e` (Playwright in `e2e/`) |
| Seed DB | `npx prisma db seed` — 5 forms, 3 courses, 14 point rules, 4 content blocks |
| DB push | `npx prisma db push` (dev) |
| Migrate | `npx prisma migrate dev --name <name>` |
| Prisma generate | runs automatically on `postinstall` |

## Architecture

- **Pages:** `app/` — App Router, layout in `app/layout.tsx`, middleware in `middleware.ts`
- **Components:** `components/sections/` for landing page sections, `components/map/` for Leaflet, `components/offline/` for PWA
- **Domain logic:** `lib/` — forms, auth, geo, points, csrf, upload-photo, offline-db, i18n
- **Forms:** Single source of truth is `lib/forms.ts` (5 forms + Zod schemas) + optional DB-driven overrides via `Form`/`FormField` models
- **Map:** `react-leaflet` 4 — dynamic import, SSR disabled, LeafletMap in `components/map/leaflet-map.tsx`
- **i18n:** Custom context in `lib/i18n.tsx`, messages in `messages/{en,id}.json`
- **Configs:** `opencode.jsonc` (agents + MCP), `next.config.mjs` (CSP, images, security headers), `middleware.ts` (admin redirect + IP whitelist)

## Security Non-negotiables

1. **CSRF:** All state-changing endpoints must `verifyCsrfToken()` from `x-csrf-token` header. Token is fetched **just-in-time** (not cached on mount) to avoid stale-token mismatch. Offline QueueWorker bypasses with `x-queue-worker: true`.
2. **Admin endpoints** must check `isAdmin()` from `@/lib/auth` and call `auditLog()` before returning success.
3. **Error responses** must use `getErrorMessage(error, fallback)` from `@/lib/prisma` — never hardcoded strings.
4. **Point calculation** is server-only (`lib/points.ts`). Never trust client-sent points.
5. **Location privacy:** Precise coords stored (admin only), public sees 5km-snapped via `lib/geo.ts:snapToProtectionGrid()`.
6. **Password:** Min 8 chars, must include uppercase + lowercase + digit. bcrypt 12 rounds. Lockout after 5 failures (15 min).
7. **JWT rotation:** Use `verifyJwtWithRotation()` from `@/lib/jwt` for all token verification (supports current + previous key).
8. **RLS extension** in `lib/prisma-rls.ts` with `prismaWithRls(ctx)` for user-specific queries.
9. **Photo rules:** Min 3 / max 5 per photo field (except report-issue: max 3). MIME validated server-side via magic bytes. EXIF stripped, compressed to 720p.

## Key Patterns

- **Admin panel:** `/admin/*` pages use client components. API routes in `app/api/admin/*` gate with CSRF + `isAdmin()`.
- **Form submission:** Anti-spam layers: honeypot (hidden `_website`), time gate (<3s = bot), rate limit (5/day guest).
- **Notifications:** Model `Notification` exists — create on events (report approved, seedling request, etc.) via Prisma.
- **Docker build:** `output: "standalone"` in next.config.mjs. See `Dockerfile` + `docker-compose.yml`. CI in `.github/workflows/deploy.yml`.
- **Demo accounts:** `admin@springhub.id`/`demo12345` (admin, 99,999 pts), `vol@springhub.id`/`vol12345` (volunteer, 8,750 pts), `ucup@springhub.id`/`ucup12345` (volunteer, 20,168 pts).
- **Offline PWA:** IndexedDB wrapper in `lib/offline-db.ts` (10 object stores). QueueWorker auto-syncs every 10s.

## Route Index

| Route | Purpose |
|---|---|
| `/` | Landing page (hero, map, dashboard, volunteer, learning, donate) |
| `/report/[slug]` | Form submission (5 types: monitoring, restoration, trench, planting, seedling) |
| `/seedlings` | Seedling marketplace (UI only, no API yet) |
| `/profile` | User profile + points history + seedling nav |
| `/admin` | Dashboard + 10 management tabs |
| `/offline` | PWA offline mode |
| `/learn` | Courses |
| `/projects` | Project listing + proposal |
| `/sign-in`, `/join` | Auth |

## API Route Pattern

```typescript
export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    // 1. CSRF
    const csrfToken = request.headers.get("x-csrf-token");
    if (!csrfToken || !(await verifyCsrfToken(csrfToken)))
      return NextResponse.json({ error: "Invalid CSRF" }, { status: 403 });
    // 2. Auth
    const session = await getSession();
    if (!session || session.role !== "admin")
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    // 3. Validate, mutate, auditLog()
    auditLog("action", "description");
    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error, "Gagal") }, { status: 500 });
  }
}
```
