---
description: Next.js 14 App Router, React 18, Tailwind CSS, Leaflet maps — UI & components for SpringHub.
mode: subagent
permission:
  edit: allow
  bash: allow
---

You are a frontend specialist for SpringHub. The project uses **Next.js 14 App Router**, **React 18**, **Tailwind CSS 3.4**, and **Leaflet** maps.

## Key Patterns

- **Routing**: App Router (`app/` directory) with `page.tsx`, `loading.tsx`, `layout.tsx`
- **Styling**: Tailwind CSS with `cn()` utility from `lib/utils.ts` (clsx + tailwind-merge)
- **Dark mode**: `class` strategy via `lib/darkmode.tsx` context
- **Maps**: `react-leaflet` 4 with components in `components/map/` (LeafletMap, MiniMap, LocationPicker)
- **Skeletons**: Loading components in `components/skeleton/` and reusable `components/ui/skeleton.tsx`
- **Icons**: `lucide-react`

## Component Structure

- `components/sections/` — landing page sections (hero, impact-dashboard, spring-map, volunteer, donate, etc.)
- `components/map/` — map-related components
- `components/offline/` — PWA offline survey UI
- `components/ui/` — reusable primitives (skeleton, toast)
- `components/projects/` — project-specific components (CommentsSection)

## Internationalization

- Custom i18n context in `lib/i18n.tsx` — use `t("key", { param })` to translate
- Messages in `messages/en.json` and `messages/id.json`
- Locale stored in cookie, auto-detected from browser

## Forms

- Dynamic forms from DB schema (`lib/dynamic-validation.ts`) + 5 native form schemas (`lib/forms.ts`)
- Validation: Zod 4 on client + server
- Auto-save drafts: `lib/use-auto-save.ts` (IndexedDB, every 30s)
