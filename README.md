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

The app opens at `http://localhost:5173`. There is no backend — everything runs in
the browser and persists to `localStorage`.

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

## Architecture

```
src/
  styles/tokens.css     Design tokens as CSS variables — light and dark
  styles/base.css       Reset, focus rings, scrollbars, motion, reduced-motion
  lib/                  brand · utils · art (generative fallback) · hotkeys
  data/                 types · images (curated photography) · seed/ (demo studio)
  store/                useStore (zustand + persist) · selectors · useUI
  components/
    ui/                 primitives · form · overlay · feedback · Avatar · Tabs
    charts/             hand-drawn SVG chart primitives
    shell/              AppShell · CommandPalette · QuickAdd · Logo · nav
    common/             Img · records · PageHeader · FilterBar
  features/             onboarding · dashboard · projects · moodboard · contacts
                        deals · tasks · activity · approvals · reports · settings
```

**Stack.** Vite · React 19 · TypeScript · Tailwind v4 (CSS-first `@theme`) ·
React Router 7 · Zustand (persisted) · dnd-kit · lucide-react.

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
| **Persistence** | `localStorage` via zustand's `persist`. Every create, edit, drag and decision survives a reload. Settings → Demo data resets it. |
| **File upload** | "Add reference" and "Upload new version" pick from a curated photo library instead of opening a file dialog. The records, versions and approval trail behave exactly as they would with real uploads. |
| **Photography** | Curated Unsplash URLs, each checked to resolve. If one fails — offline, dead URL — `lib/art.ts` renders deterministic generated artwork seeded from the record id, so no image is ever broken. |
| **Avatars** | `pravatar.cc`, falling back to tinted initials. |
| **Email / calendar** | Activity entries are logged by hand through Quick add rather than synced from a provider. |
| **Accounts & auth** | Setup creates a local profile in this browser. There is no server, no password and no sign-in. Roles are stored and reflected in the UI, not enforced by a backend; "View as" in Settings switches the current user. |
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
