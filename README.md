# CRMO

A creative relationship management workspace for a design studio — clients, projects,
moodboards, deals, tasks, feedback and approvals in one place.

Built to feel like a project studio rather than a corporate admin panel: a warm-grey
canvas, soft panels, a single saturated accent, and a component language made
almost entirely of pills.

## Running it

```bash
npm install
```

```bash
npm run dev
```

The app opens at `http://localhost:5173`. With no Supabase credentials configured it
runs entirely in the browser against `localStorage` — see **Connecting Supabase** below.

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server with HMR |
| `npm run build` | Typecheck, then a production build into `dist/` |
| `npm run preview` | Serve the production build |
| `npm run typecheck` | `tsc --noEmit` |

## Setup and customisation

On first run, CRMO walks through four short steps: name the studio, introduce
yourself, pick an accent and theme, and choose whether to start from the demo
studio or an empty workspace. All of it is editable afterwards under
**Settings → Account & studio**, and **Open setup** runs the flow again.

This is a **local profile, not authentication.** There is no server, so there is
no password and no sign-in — the workspace lives in this browser's local storage.

The accent is the only chromatic decision in the product; everything else is warm
grey and near-black. Five presets ship (lime, amber, coral, sky, iris), each
defined once in `tokens.css` under a `[data-accent]` block for both themes, and
each light enough to carry near-black text well above 4.5:1.


## Live demo

**https://gigolajulian.github.io/crmo/**

Runs in local mode — no account, no server, everything in your browser. Deployed
from `main` by `.github/workflows/deploy.yml`.

## Connecting Supabase

Without credentials CRMO is local-only and works offline. Add them and it becomes
a real multi-user app with auth, Postgres and file storage.

1. Create a free project at [supabase.com](https://supabase.com).
2. Open **SQL Editor**, paste `supabase/migrations/0001_init.sql`, run it. That
   creates the tables, the row-level security policies and the storage bucket.
3. Copy **Project Settings → API** into `.env.local`:

   ```
   VITE_SUPABASE_URL=https://xxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJ...
   ```

4. `npm run dev`. You get a sign-in screen; create an account and your workspace
   is provisioned from whatever the setup flow produced locally.

To deploy it connected, add the same two values as **repository secrets** named
`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` — the workflow already reads them.

**The anon key is public by design.** It ships in the JavaScript bundle. Your data
is protected by the RLS policies in the migration and nothing else, which is why
every table is locked to workspace members. Never put the `service_role` key in the
client: it bypasses RLS entirely.

### How sync works

The ~40 store actions are untouched. `store/sync.ts` subscribes to the store,
diffs each collection by id against the last synced snapshot, and pushes only what
changed — debounced 400ms and coalesced, so dragging a moodboard item is one round
trip rather than thirty. A failed flush keeps its old snapshot so the change is
retried instead of silently lost.

Conflict resolution is last-write-wins. Honest for a studio where two people rarely
edit the same record in the same second; per-field versioning is the next step.

## Architecture

```
src/
  styles/tokens.css     Design tokens as CSS variables — light and dark
  styles/base.css       Reset, focus rings, scrollbars, motion, reduced-motion
  lib/                  brand · utils · art (generative fallback) · hotkeys · supabase
  data/                 types · schema (table map) · images · seed/ (demo studio)
  store/                useStore (zustand) · selectors · sync (Supabase) · useUI
  components/
    ui/                 primitives · form · overlay · feedback · Avatar · Tabs
    charts/             hand-drawn SVG chart primitives
    shell/              AppShell · CommandPalette · QuickAdd · Logo · nav
    common/             Img · records · PageHeader · FilterBar
  features/             auth · onboarding · dashboard · projects · moodboard
                        contacts · deals · tasks · activity · approvals · reports
                        settings
```

**Stack.** Vite · React 19 · TypeScript · Tailwind v4 (CSS-first `@theme`) ·
React Router 7 · Zustand · dnd-kit · lucide-react · Supabase (optional).

A few decisions worth knowing about:

- **All derived data lives in `store/selectors.ts`.** Project health, pipeline
  totals, task buckets, workload and the dashboard's priority list are computed
  there and nowhere else.
- **Charts are hand-drawn SVG,** not a charting library. The reference language —
  diagonal-hatch fills, grey bars with one accent bar, a single accent callout pill —
  is not something a library will give you, and this is ~250 lines with no
  dependency.
- **Never filter inside a zustand selector.** Returning a new array or object each
  render makes the store's snapshot comparison fail and loops React forever.
  Derived lists use memoised hooks (`useActiveTeam`, `useOpenStages`, …).
- **Grids carry `grid-cols-1` explicitly.** Without it the mobile track is sized to
  `min-content`, and one `truncate` line of nowrap text pushes the whole page wide.

## What is mocked

There is no server, so a few things stand in for real integrations. Each is
implemented so it behaves completely rather than being a dead end:

| Area | How it works |
| --- | --- |
| **Persistence** | Local mode uses `localStorage`; connected mode uses Postgres. Both survive a reload. |
| **File upload** | Still the curated photo library rather than a file dialog. The storage bucket and `storage_path` column exist; wiring the picker to them is the remaining step. |
| **Photography** | Curated Unsplash URLs, each checked to resolve. If one fails — offline, dead URL — `lib/art.ts` renders deterministic generated artwork seeded from the record id, so no image is ever broken. |
| **Avatars** | `pravatar.cc`, falling back to tinted initials. |
| **Email / calendar** | Activity entries are logged by hand through Quick add rather than synced from a provider. |
| **Accounts & auth** | Local mode has no sign-in — setup creates a browser-local profile. Connected mode uses real Supabase auth. Roles are reflected in the UI but only RLS enforces tenancy; per-role write rules are next. |
| **Notifications** | Preferences are stored; nothing is actually delivered. |

## Accessibility

- The accent is never foreground text on a light surface — only a background paired
  with ink, a large fill, or a chart mark. Muted ink clears 4.5:1 on canvas in both themes.
- Every icon-only control has an accessible name; there are no unlabelled focusables.
- Every drag has a keyboard equivalent: dnd-kit's keyboard sensor on the handle,
  plus a "move to…" menu on every draggable card.
- Overlays trap focus, restore it to the opener on close, lock background scroll,
  and close on `Escape`.
- A skip link is the first thing `Tab` reaches; route changes move focus to `<main>`.
- `prefers-reduced-motion` disables transitions and entrance animation.

## Keyboard

| Key | Action |
| --- | --- |
| `⌘K` / `Ctrl K`, or `/` | Search and jump to anything |
| `C` | Quick add |
| `G` then `H P M T R D C A E S` | Jump to a section |
| `Esc` | Close any overlay |
| `←` `→` | Move between references in the lightbox |
