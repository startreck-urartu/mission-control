# Mission Control — Apple Liquid Glass UI Rebuild

**Date:** 2026-07-11
**Status:** Approved by Armen (visual direction chosen via browser mockups; approach C selected)
**Branch:** `liquid-glass-ui`

## Goal

Replace the current dark "neon glass" design (blue/purple glows, gradient wash, mixed
styling languages) with a clean Apple-inspired Liquid Glass system across all 15 pages.
Full semantic-token rebuild (approach C): every primitive and page consumes semantic
tokens only; no raw colors in page code. **Nothing from the old look survives** — no
noise texture, no glow classes, no neon gradient wash.

## Decisions (locked)

| Decision | Choice |
|---|---|
| Default mode | **Dark** (light mode ships too, via token flip) |
| Accent strategy | **Full Apple system palette** — semantic color per status/category |
| App frame | **Floating glass island sidebar** (Liquid Glass layer language, not attached macOS rail) |
| Typography | `-apple-system` stack (SF Pro on Mac); `ui-monospace` for mono. Geist removed |
| Scope | All 15 pages in one pass |
| Approach | C — full semantic-token rebuild of primitives + page refactor |
| Old look | Killed entirely: `.glow-*`, noise overlay, gradient wash, `--surface-*`, `.light` per-class override block |

## 1. Semantic token layer (`app/globals.css`)

Dark values on `:root`, light values on `.light`. Components reference vars only.

### Canvas & glass

```css
:root {
  --background: #000000;
  /* ambient washes rendered on body::before, fixed attachment:
     radial 70%x55% at 20% 0%   rgba(10,132,255,0.14)
     radial 60%x45% at 85% 90%  rgba(94,92,230,0.11)
     radial 45%x40% at 60% 30%  rgba(191,90,242,0.05) */
  --glass: rgba(28,28,30,0.55);
  --glass-elevated: rgba(44,44,46,0.72);   /* dialogs, menus, tooltips */
  --glass-border: rgba(255,255,255,0.12);
  --glass-highlight: rgba(255,255,255,0.08); /* inset 0 1px 0 */
  --glass-blur: 24px;                        /* + saturate(180%) */
  --shadow-glass: 0 10px 30px rgba(0,0,0,0.35);
  --fill: rgba(118,118,128,0.24);            /* inputs — Apple fill */
  --separator: rgba(255,255,255,0.10);       /* 0.5px hairlines */
}
```

### Text (Apple label hierarchy)

```css
--foreground: rgba(255,255,255,0.95);
--muted:      rgba(235,235,245,0.60);
--tertiary:   rgba(235,235,245,0.30);
```

### System palette (dark variants) — each with an ~18% tint pair

| Token | Hex | Tint bg |
|---|---|---|
| `--blue` | #0A84FF | rgba(10,132,255,0.18) |
| `--green` | #30D158 | rgba(48,209,88,0.18) |
| `--orange` | #FF9F0A | rgba(255,159,10,0.18) |
| `--red` | #FF453A | rgba(255,69,58,0.18) |
| `--purple` | #BF5AF2 | rgba(191,90,242,0.18) |
| `--teal` | #64D2FF | rgba(100,210,255,0.18) |
| `--yellow` | #FFD60A | rgba(255,214,10,0.18) |
| `--pink` | #FF375F | rgba(255,55,95,0.18) |
| `--indigo` | #5E5CE6 | rgba(94,92,230,0.18) |

### Light mode values (`.light`)

Canvas `#F2F2F7`; glass `rgba(255,255,255,0.62)` / elevated `rgba(255,255,255,0.8)`;
border `rgba(0,0,0,0.06)`; text `rgba(0,0,0,0.9)` / `rgba(60,60,67,0.6)` /
`rgba(60,60,67,0.3)`; palette switches to Apple light variants (blue `#007AFF`, green
`#34C759`, orange `#FF9500`, red `#FF3B30`, purple `#AF52DE`, teal `#5AC8FA`, yellow
`#FFCC00`, pink `#FF2D55`, indigo `#5856D6`); tints drop to ~12-15%; shadows soften.
**The entire legacy `.light .text-white {...}` override block is deleted.**

### Type & radii

- Font: `-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif`;
  mono `ui-monospace, "SF Mono", Menlo, monospace`.
- Scale: 11 caption / 13 footnote / 15 body / 17 headline / 22 title / 28 large-title.
  Large numerals: `font-weight 700`, `tracking-tight`, `tabular-nums`.
- Radii: `--radius-sm: 8px`, `--radius: 12px`, `--radius-lg: 16px`, `--radius-xl: 20px`.

### Tailwind wiring

Tailwind 4 `@theme inline` maps vars to utilities: `bg-glass`, `bg-glass-elevated`,
`text-foreground/muted/tertiary`, `bg-blue/green/...`, `bg-blue-tint/...`,
`border-glass`, `rounded-*` from radii. A `.glass-pane` component class carries the
full recipe (bg + border + blur + highlight + shadow) so it stays consistent.

### Deleted from globals.css

`.glow-*` (5 classes), `.nav-active`, `.noise`, `.highlight-top`, `.glass-subtle`,
`--surface-0..3`, the old gradient wash, the 120-line light-mode override block.
Kept (retimed to 0.2-0.3s ease-out): `stagger-in`, `fade-in-up`, skeleton shimmer,
reduced-motion block, scrollbar styling (recolored to token).

## 2. App shell

- **`app/layout.tsx`**: drop Geist imports; body = `--background` + ambient washes;
  flex layout with 16px gutter; main content `max-w-[1600px]`.
- **`components/navigation-sidebar.tsx`**: floating island — `rounded-2xl glass-pane`,
  16px margin from every edge, own scroll region, `h-fit` max-h full. Active item:
  blue-tint pill (`--blue-tint` bg, white text). Each nav item keeps its Lucide icon,
  tinted with its section color. Mobile: existing hamburger/sheet behavior, sheet
  becomes elevated glass.

## 3. Primitives (`components/ui/`) — all rebuilt on tokens

| Primitive | Treatment |
|---|---|
| `card.tsx` | `.glass-pane`, `--radius-lg`; hover lift becomes opt-in `interactive` prop |
| `button.tsx` | primary = filled `--blue` white text; secondary = white/8% fill; ghost; destructive = `--red`; link; `active:scale-[0.97]`; blue focus ring |
| `badge.tsx` | `color` prop (blue/green/orange/red/purple/teal/yellow/pink/indigo/gray) → tint bg + bright text pill |
| `stat-card.tsx` | numeral typography (22-28px, tracking-tight, tabular-nums), optional tinted icon chip |
| `input/textarea/select` | `--fill` bg, `--radius-sm`, blue focus ring, `--muted` placeholder |
| `dialog.tsx` | `--glass-elevated` + blur 32px, overlay rgba(0,0,0,0.4); light: rgba(0,0,0,0.25) |
| `skeleton.tsx` | shimmer on white/6% (dark) black/6% (light) |
| `avatar/label/confirm-dialog/formatted-result` | token alignment |
| **NEW `page-header.tsx`** | title (22/28 semibold) + subtitle (`--muted`) + actions slot — replaces per-page copies |
| **NEW `empty-state.tsx`** | icon + message + optional action — replaces per-page copies |

`components/office/*` and `components/badges/*` get the same token alignment.

## 4. Page refactor — all 15 pages

Sweep: `app/page.tsx` (home), tasks, content, calendar, memory, office, team, usage,
books, clients, revenue, assistant, polymarket, polymarket-v2, trading-team.

- Remove every raw `bg-gray-*`, `bg-white/[0.0x]`, `text-gray-*`, `glow-*`,
  `border-white/[…]`, hardcoded hex. Replace with primitives + semantic utilities.
- **NEW `lib/status-colors.ts`** — single map: task statuses (9), content stages (6),
  client stages (7), team status, priority levels, revenue categories, P&L sign →
  palette token + tint. All pages import from here; no local color maps remain.
- Recharts: series colors from the palette; grid `--separator`; tooltips styled as
  elevated glass.
- P&L / delta numbers: `+`/`−` prefix (non-color cue) alongside green/red.
- Framer Motion: keep animations, durations 0.2-0.3s ease-out.
- Loading gates and skeletons (from the earlier polish pass) preserved.

## 5. Out of scope

- No Convex/backend changes (frontend-only; no `convex deploy` needed).
- No information-architecture changes — same pages, same layouts, same features.
- Phase-3 a11y sweep stays queued (except the free P&L sign cue above).
- No new pages, no copy changes.

## 6. Verification

1. `npm run lint` — 0 errors (repo is at 0 today; keep it there).
2. `npx tsc --noEmit` — clean (repo is tsc-clean today).
3. `npm run build` — passes.
4. Visual QA: dev server, walk all 15 pages dark + light. For real-data screenshots,
   temporarily point `NEXT_PUBLIC_CONVEX_URL` at prod (read-only browsing), revert
   immediately after.
5. Ship: PR from `liquid-glass-ui` (matches repo convention, e.g. PR #5); Vercel
   deploys on merge. No Convex deploy.

## Rollout order

globals.css tokens → shell (layout + sidebar) → primitives → status-colors map →
pages in passes: home → tasks/content/calendar/memory → clients/revenue/team →
office/books/usage → assistant → polymarket/polymarket-v2/trading-team.
