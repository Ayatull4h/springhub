# SPRINGHUB

A community-driven web platform under the **Jaga Semesta** umbrella to coordinate field work, funding, capacity building, and gamified volunteer activity around restoring Indonesia's artesian springs.

The current build is a fully responsive landing page (Next.js + Tailwind) plus a self-contained `preview.html` you can open in any browser without installing anything.

## Modules in this build

| Section | What's there |
| --- | --- |
| Hero | Tagline, two CTAs (Start Monitoring, Back to Jaga Semesta) |
| Real-Time Impact Dashboard | KPI tiles, monthly progress, top regions, top volunteers (with eligibility tag) |
| Interactive Spring Map | OpenStreetMap via Leaflet, status filter chips, 5 km protection circles, source-protection notice |
| File a Field Report | Four native SpringHub forms accessible from the map sidebar |
| Volunteer Activities | Recent activity feed (form-tagged), Submit-your-Project card with eligibility gate |
| Donations | Xendit-powered widget with 4 impact-tied tiers + custom, featured projects with Verified / Under Review badges |
| Become Partner / Sponsor / Donor | Full-width CTA card with the four project types we accept (no logos) |
| Learning Hub | Three course cards, including "Field Reporting with SpringHub Forms" |
| Header / Footer | Logo, primary nav (Map / Dashboard / Community / Learn / Donate), Sign-In / Join, footer with link columns and newsletter |

## Architecture for the product requirements

### 1. Native field-reporting forms (no Epicollect5 dependency)

SpringHub hosts its own light, mobile-friendly forms — built from the same schemas the Jaga Semesta team already uses on the ground. Source of truth: `lib/forms.ts`.

- `spring-monitoring` — Pemantauan Mata Air (+25 pts)
- `spring-restoration` — Restorasi Mata Air (+100 pts)
- `seedling-stock` — Stok Bibit (+15 pts)
- `trench-and-trees` — Tracker Rorak & Tanaman (+50 pts)

Each form has a typed schema (`FormSchema` → `FormField[]`) consumed by the dynamic route `app/report/[slug]/page.tsx`, which renders the right input controls (text, longtext, number, date, select, multiselect, photo, location, phone). Submitted entries flow into our DB; activities are tagged with the originating `formSlug` so the public feed shows "Form · Pemantauan Mata Air" etc.

`lib/epicollect.ts` is **deprecated** — kept only as a marker for one-off historical CSV imports. The runtime no longer touches Epicollect5.

### 2. 5 km source protection

Every public spring location is **snapped to a 5 km grid** (≈ 0.045°). All springs within the same cell render at the same coordinate, protecting vulnerable sites from being targeted.

- `lib/geo.ts` → `snapToProtectionGrid(latLng)` and `visibleLocation(precise, role)`.
- Springs in `lib/data.ts` carry both `precise` (server-only) and `publicLoc` (snapped).
- Roles `field_lead` and `admin` get precise; `public` and `volunteer` get the snapped version.
- The map draws a dashed 5 km circle around each pin so the boundary is visible.
- The native forms inform reporters that their submitted GPS will be snapped before going public.

### 3. Open-source map (OpenStreetMap + Leaflet)

The dashboard map uses **Leaflet** with **OpenStreetMap** tiles — no API keys, no commercial licence.

- React: `components/map/leaflet-map.tsx`, mounted via `next/dynamic({ ssr: false })`.
- Standalone preview: vanilla Leaflet via CDN.
- Markers are `CircleMarker`s coloured by status (Healthy / Degraded / Restoration), with a 5 km buffer circle.

### 4. Admin verification before projects are published

Projects move through a status workflow:

```
under_review → approved → published
              ↘ rejected
```

- Type: `ProjectStatus` in `lib/data.ts`.
- Public users only see `approved` projects in the donation flow; `under_review` projects render with an amber badge and a disabled "Awaiting Admin Verification" button.
- The Submit-your-Project card explicitly says: "Reviewed by admin before publishing".

### 5. >20,000 pts proposal eligibility

Only volunteers who've reached **20,000 contribution points** can propose their own projects.

- `PROJECT_PROPOSAL_THRESHOLD = 20_000` in `lib/data.ts`.
- The Submit card shows a points-progress bar and either "Eligible" + active CTA, or a disabled Lock button: "Earn N more pts to unlock".
- The leaderboard tags eligible volunteers and shows the gap remaining for the rest.

### 6. Four accepted project types

Every project proposal must pick one of these four (defined in `PROJECT_TYPES`):

1. **Endemic Tree Planting** — native species around a spring or its recharge area.
2. **Trench (Rorak) Development** — infiltration trenches that recharge groundwater.
3. **Spring Restoration** — sediment removal and rehabilitation.
4. **Monitoring Expedition** — field expedition to inventory and assess springs.

This keeps impact reporting consistent and ties donations directly to verified outputs.

### 7. Donations via Xendit

Donations go through **Xendit** (cards, virtual accounts, e-wallets, QRIS). Stub: `lib/xendit.ts` (`createInvoice`, `DONATION_TIERS`).

| Tier | Amount | Impact |
| --- | --- | --- |
| Seedling | Rp 20K | 1 tree seedling |
| Trench | Rp 50K | 1 trench (rorak) |
| Sediment | Rp 100K | 1 m³ sediment removed from a spring |
| Monitoring | Rp 1M | 50 springs monitored |
| Custom | any | freeform |

Configure with `XENDIT_SECRET_KEY` (server-only). The donate UI calls a server action that returns the Xendit-hosted checkout URL.

## Stack

- Next.js 14 (App Router, RSC where possible)
- TypeScript (strict)
- Tailwind CSS 3 with a custom `brand-*` palette (sky blue)
- lucide-react for icons
- Leaflet + react-leaflet (map)
- Mock data lives in `lib/data.ts` — swap for API/DB calls when the backend is wired up

## Project layout

```
app/
  layout.tsx
  page.tsx
  globals.css
  report/
    [slug]/page.tsx           # dynamic form renderer
components/
  logo.tsx
  site-header.tsx
  site-footer.tsx
  map/
    leaflet-map.tsx           # client-only Leaflet/OSM map
  sections/
    hero.tsx
    impact-dashboard.tsx
    spring-map.tsx            # filters, list, file-a-report panel
    volunteer.tsx             # eligibility gate, form-tagged activities
    donate.tsx                # Xendit tiers, verified badges, full-width Become-Partner card
    learning-hub.tsx
lib/
  data.ts                     # springs + projects + activities + threshold + project types
  forms.ts                    # 4 native form schemas (single source of truth)
  geo.ts                      # 5 km grid + role-based location visibility
  xendit.ts                   # Xendit donation stub + tier config
  utils.ts
  epicollect.ts               # DEPRECATED — historical-import marker only
preview.html                  # standalone static preview (Tailwind + Leaflet via CDN)
```

## Run it locally

```bash
npm install
npm run dev
# open http://localhost:3000
```

Or just open `preview.html` in any browser to see the design without Node.

## Suggested next steps

1. **Auth + roles** — pick a stack (NextAuth + Postgres, Supabase, or Clerk). Roles: `public`, `volunteer`, `field_lead`, `admin`. Wire `visibleLocation()` into the springs API based on the request's role.
2. **API endpoints for forms** — `POST /api/reports` ingests the multipart form, validates against the schema, snaps GPS, awards points.
3. **Project submission flow** — gated by `PROJECT_PROPOSAL_THRESHOLD`. Multi-step: type → location → budget → impact metrics → submit → enter admin queue.
4. **Admin review console** — list of `under_review` projects, side-by-side diff with submission history, approve/reject + reason, audit log.
5. **Xendit integration** — implement `createInvoice`, webhook handler for payment success, link payments back to a project + impact tier.
6. **Gamification engine** — backend service that awards points when each form is accepted; emits an eligibility event when a volunteer crosses 20K.
7. **i18n** — wire up `next-intl` for `id` / `en` since target audience is Indonesian.
8. **Public dashboard API** — expose impact metrics so partner sites can embed live numbers.
