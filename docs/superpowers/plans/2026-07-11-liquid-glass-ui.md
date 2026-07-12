# Liquid Glass UI Rebuild — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the neon-glass design with an Apple Liquid Glass system (dark default, full Apple palette, floating island sidebar) across all 15 pages via a full semantic-token rebuild.

**Architecture:** One semantic token layer in `globals.css` (Tailwind 4 `@theme`) → shell (layout + sidebar) → 13 rebuilt primitives + 2 new ones + one `status-colors.ts` map → mechanical sweep of all 15 pages so no raw colors remain in page code.

**Tech Stack:** Next.js 16, Tailwind CSS 4 (`@theme inline`), CVA, Radix, Recharts, Framer Motion. No backend/Convex changes.

**Spec:** `docs/superpowers/specs/2026-07-11-liquid-glass-ui-design.md` (values there are authoritative).
**Branch:** `liquid-glass-ui` (already created; spec committed).

**Verification baseline (must stay true after every task):** `npm run lint` → 0 errors; `npx tsc --noEmit` → clean. `npm run build` at phase boundaries only (Tasks 11, 26).

**Naming rule:** accent utilities are namespaced `accent-*` (`bg-accent-blue`, `text-accent-green`, `bg-accent-blue-tint`) so Tailwind's default `blue-500` scale keeps working on not-yet-swept pages during rollout.

---

## Phase 1 — Token system & shell

### Task 1: Rewrite `app/globals.css` as the semantic token layer

**Files:**
- Modify: `app/globals.css` (full rewrite; keep the `@import "./office/office-animations.css";` line)

- [ ] **Step 1: Replace the entire file** with:

```css
@import "tailwindcss";
@import "./office/office-animations.css";

/* ── Semantic tokens ─────────────────────────────────────────────── */
@layer base {
  :root {
    --background: #000000;
    --glass: rgba(28, 28, 30, 0.55);
    --glass-elevated: rgba(44, 44, 46, 0.72);
    --glass-border: rgba(255, 255, 255, 0.12);
    --glass-highlight: rgba(255, 255, 255, 0.08);
    --shadow-glass: 0 10px 30px rgba(0, 0, 0, 0.35);
    --fill: rgba(118, 118, 128, 0.24);
    --separator: rgba(255, 255, 255, 0.1);

    --foreground: rgba(255, 255, 255, 0.95);
    --muted: rgba(235, 235, 245, 0.6);
    --tertiary: rgba(235, 235, 245, 0.3);

    --accent-blue: #0a84ff;   --accent-blue-tint: rgba(10, 132, 255, 0.18);
    --accent-green: #30d158;  --accent-green-tint: rgba(48, 209, 88, 0.18);
    --accent-orange: #ff9f0a; --accent-orange-tint: rgba(255, 159, 10, 0.18);
    --accent-red: #ff453a;    --accent-red-tint: rgba(255, 69, 58, 0.18);
    --accent-purple: #bf5af2; --accent-purple-tint: rgba(191, 90, 242, 0.18);
    --accent-teal: #64d2ff;   --accent-teal-tint: rgba(100, 210, 255, 0.18);
    --accent-yellow: #ffd60a; --accent-yellow-tint: rgba(255, 214, 10, 0.18);
    --accent-pink: #ff375f;   --accent-pink-tint: rgba(255, 55, 95, 0.18);
    --accent-indigo: #5e5ce6; --accent-indigo-tint: rgba(94, 92, 230, 0.18);

    --radius-sm: 8px;
    --radius: 12px;
    --radius-lg: 16px;
    --radius-xl: 20px;
    color-scheme: dark;
  }

  .light {
    --background: #f2f2f7;
    --glass: rgba(255, 255, 255, 0.62);
    --glass-elevated: rgba(255, 255, 255, 0.8);
    --glass-border: rgba(0, 0, 0, 0.06);
    --glass-highlight: rgba(255, 255, 255, 0.7);
    --shadow-glass: 0 8px 24px rgba(0, 0, 0, 0.08);
    --fill: rgba(118, 118, 128, 0.12);
    --separator: rgba(0, 0, 0, 0.1);

    --foreground: rgba(0, 0, 0, 0.9);
    --muted: rgba(60, 60, 67, 0.6);
    --tertiary: rgba(60, 60, 67, 0.3);

    --accent-blue: #007aff;   --accent-blue-tint: rgba(0, 122, 255, 0.13);
    --accent-green: #34c759;  --accent-green-tint: rgba(52, 199, 89, 0.14);
    --accent-orange: #ff9500; --accent-orange-tint: rgba(255, 149, 0, 0.14);
    --accent-red: #ff3b30;    --accent-red-tint: rgba(255, 59, 48, 0.13);
    --accent-purple: #af52de; --accent-purple-tint: rgba(175, 82, 222, 0.13);
    --accent-teal: #5ac8fa;   --accent-teal-tint: rgba(90, 200, 250, 0.15);
    --accent-yellow: #ffcc00; --accent-yellow-tint: rgba(255, 204, 0, 0.16);
    --accent-pink: #ff2d55;   --accent-pink-tint: rgba(255, 45, 85, 0.13);
    --accent-indigo: #5856d6; --accent-indigo-tint: rgba(88, 86, 214, 0.13);
    color-scheme: light;
  }
}

/* ── Tailwind utility wiring ─────────────────────────────────────── */
@theme inline {
  --font-sans: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI",
    Roboto, sans-serif;
  --font-mono: ui-monospace, "SF Mono", Menlo, monospace;

  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-muted: var(--muted);
  --color-tertiary: var(--tertiary);
  --color-glass: var(--glass);
  --color-glass-elevated: var(--glass-elevated);
  --color-glass-border: var(--glass-border);
  --color-fill: var(--fill);
  --color-separator: var(--separator);

  --color-accent-blue: var(--accent-blue);
  --color-accent-blue-tint: var(--accent-blue-tint);
  --color-accent-green: var(--accent-green);
  --color-accent-green-tint: var(--accent-green-tint);
  --color-accent-orange: var(--accent-orange);
  --color-accent-orange-tint: var(--accent-orange-tint);
  --color-accent-red: var(--accent-red);
  --color-accent-red-tint: var(--accent-red-tint);
  --color-accent-purple: var(--accent-purple);
  --color-accent-purple-tint: var(--accent-purple-tint);
  --color-accent-teal: var(--accent-teal);
  --color-accent-teal-tint: var(--accent-teal-tint);
  --color-accent-yellow: var(--accent-yellow);
  --color-accent-yellow-tint: var(--accent-yellow-tint);
  --color-accent-pink: var(--accent-pink);
  --color-accent-pink-tint: var(--accent-pink-tint);
  --color-accent-indigo: var(--accent-indigo);
  --color-accent-indigo-tint: var(--accent-indigo-tint);

  --radius-sm: var(--radius-sm);
  --radius-md: var(--radius);
  --radius-lg: var(--radius-lg);
  --radius-xl: var(--radius-xl);
}

/* ── Base ────────────────────────────────────────────────────────── */
@layer base {
  * {
    border-color: var(--separator);
  }
  body {
    background-color: var(--background);
    color: var(--foreground);
    font-family: var(--font-sans);
    position: relative;
  }
  body::before {
    content: "";
    position: fixed;
    inset: 0;
    z-index: -1;
    pointer-events: none;
    background:
      radial-gradient(ellipse 70% 55% at 20% 0%, rgba(10, 132, 255, 0.14), transparent 60%),
      radial-gradient(ellipse 60% 45% at 85% 90%, rgba(94, 92, 230, 0.11), transparent 60%),
      radial-gradient(ellipse 45% 40% at 60% 30%, rgba(191, 90, 242, 0.05), transparent 60%);
  }
  .light body::before {
    background:
      radial-gradient(ellipse 70% 55% at 20% 0%, rgba(0, 122, 255, 0.1), transparent 60%),
      radial-gradient(ellipse 60% 45% at 85% 90%, rgba(88, 86, 214, 0.08), transparent 60%);
  }
}

/* ── Glass recipe ────────────────────────────────────────────────── */
@layer components {
  .glass-pane {
    background: var(--glass);
    border: 0.5px solid var(--glass-border);
    backdrop-filter: blur(24px) saturate(180%);
    -webkit-backdrop-filter: blur(24px) saturate(180%);
    box-shadow: var(--shadow-glass), inset 0 1px 0 var(--glass-highlight);
  }
  .glass-pane-elevated {
    background: var(--glass-elevated);
    border: 0.5px solid var(--glass-border);
    backdrop-filter: blur(32px) saturate(180%);
    -webkit-backdrop-filter: blur(32px) saturate(180%);
    box-shadow: 0 16px 48px rgba(0, 0, 0, 0.45), inset 0 1px 0 var(--glass-highlight);
  }
  .light .glass-pane-elevated {
    box-shadow: 0 16px 48px rgba(0, 0, 0, 0.15), inset 0 1px 0 var(--glass-highlight);
  }
}

/* ── Scrollbar ───────────────────────────────────────────────────── */
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--separator); border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: var(--muted); }

/* ── Motion (retimed) ────────────────────────────────────────────── */
@keyframes stagger-in {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
.stagger-in > * { opacity: 0; animation: stagger-in 0.25s ease-out forwards; }
.stagger-in > *:nth-child(1) { animation-delay: 0ms; }
.stagger-in > *:nth-child(2) { animation-delay: 40ms; }
.stagger-in > *:nth-child(3) { animation-delay: 80ms; }
.stagger-in > *:nth-child(4) { animation-delay: 120ms; }
.stagger-in > *:nth-child(5) { animation-delay: 160ms; }
.stagger-in > *:nth-child(6) { animation-delay: 200ms; }
.stagger-in > *:nth-child(7) { animation-delay: 240ms; }
.stagger-in > *:nth-child(8) { animation-delay: 280ms; }

@keyframes fade-in-up {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fade-in-up { animation: fade-in-up 0.2s ease-out; }

/* Kanban */
.kanban-card { cursor: grab; }
.kanban-card:active { cursor: grabbing; }
.kanban-column { min-height: 200px; }

@media (prefers-reduced-motion: reduce) {
  .stagger-in > * { animation: none; opacity: 1; }
  .animate-fade-in-up { animation: none; }
}
```

- [ ] **Step 2: Verify deletions took.** Run:
```bash
grep -nE "glow-|nav-active|noise|highlight-top|glass-subtle|surface-[0-3]|empty-shimmer|card-hover" app/globals.css
```
Expected: no matches.

- [ ] **Step 3: Lint + typecheck**
Run: `npm run lint && npx tsc --noEmit` — Expected: clean. (Pages still reference deleted classes like `glow-blue`; unknown CSS classes don't fail lint/tsc — they just render un-styled until swept.)

- [ ] **Step 4: Commit**
```bash
git add app/globals.css
git commit -m "feat(ui): semantic Liquid Glass token layer"
```

### Task 2: App shell — `app/layout.tsx`

**Files:**
- Modify: `app/layout.tsx`

- [ ] **Step 1: Replace file contents** with (drops Geist, adds gutter layout):

```tsx
import type { Metadata } from "next";
import "./globals.css";
import { ConvexClientProvider } from "@/components/providers/convex-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { NavigationSidebar } from "@/components/navigation-sidebar";

export const metadata: Metadata = {
  title: "OpenClaw Mission Control",
  description: "Mission Control Dashboard for OpenClaw",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <ConvexClientProvider>
          <ThemeProvider>
            <div className="flex h-screen gap-4 p-4">
              <NavigationSidebar />
              <main className="flex-1 overflow-auto pt-12 md:pt-0">
                <div className="max-w-[1600px] mx-auto">{children}</div>
              </main>
            </div>
          </ThemeProvider>
        </ConvexClientProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Lint + typecheck** — `npm run lint && npx tsc --noEmit` → clean.
- [ ] **Step 3: Commit** — `git add app/layout.tsx && git commit -m "feat(ui): ambient shell with floating gutter layout"`

### Task 3: Floating island sidebar — `components/navigation-sidebar.tsx`

**Files:**
- Modify: `components/navigation-sidebar.tsx`

- [ ] **Step 1: Add a section→accent map and restyle.** Keep the `sections` array, state, and mobile drawer logic exactly as-is. Apply these changes:

Add after the `sections` array:
```tsx
const sectionAccent: Record<string, { icon: string; activeBg: string; activeText: string }> = {
  Overview:  { icon: "text-accent-blue",   activeBg: "bg-accent-blue-tint",   activeText: "text-accent-blue" },
  Business:  { icon: "text-accent-green",  activeBg: "bg-accent-green-tint",  activeText: "text-accent-green" },
  Content:   { icon: "text-accent-purple", activeBg: "bg-accent-purple-tint", activeText: "text-accent-purple" },
  Trading:   { icon: "text-accent-orange", activeBg: "bg-accent-orange-tint", activeText: "text-accent-orange" },
  Workspace: { icon: "text-accent-teal",   activeBg: "bg-accent-teal-tint",   activeText: "text-accent-teal" },
};
```

Replace the header block (`<h1>` gradient + subtitle) with:
```tsx
<h1 className="text-[15px] font-semibold tracking-tight text-foreground">
  Mission Control
</h1>
<p className="text-[11px] text-tertiary mt-0.5">OpenClaw AI Coordination</p>
```

Replace the section label class with:
```tsx
className="text-[10px] font-semibold text-tertiary uppercase tracking-[0.12em] px-3 mb-1.5"
```

Replace the nav `<Link>` className logic (inside `sections.map` — use `sectionAccent[section.label]`) with:
```tsx
className={cn(
  "flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors duration-150",
  isActive
    ? cn(sectionAccent[section.label].activeBg, "text-foreground")
    : "text-muted hover:bg-fill hover:text-foreground"
)}
```
and the icon className with:
```tsx
className={cn("w-4 h-4", isActive ? sectionAccent[section.label].icon : "text-tertiary")}
```

Footer: theme-toggle button classes → `text-muted hover:bg-fill hover:text-foreground`; both Sun/Moon icons → `className="w-4 h-4 text-muted"`; System Online: delete the `animate-ping` div, keep `<div className="w-2 h-2 bg-accent-green rounded-full" />`, label → `text-xs text-tertiary`; footer border → `border-t border-separator`.

Mobile hamburger button: `glass` → `glass-pane rounded-lg`; icon → `text-muted`.
Mobile drawer container: replace `bg-[var(--surface-1)] backdrop-blur-xl border-r border-white/[0.04]` with `glass-pane-elevated`.
Desktop sidebar: replace the whole wrapper div classes and delete the gradient hairline div:
```tsx
<div className="hidden md:flex w-64 flex-col glass-pane rounded-2xl overflow-hidden">
  {navContent}
</div>
```

- [ ] **Step 2: Verify no legacy classes remain in the file**
```bash
grep -nE "gray-[0-9]|blue-[0-9]{3}|purple-[0-9]{3}|amber-[0-9]{3}|green-500|surface-|nav-active|white/\[" components/navigation-sidebar.tsx
```
Expected: no matches.
- [ ] **Step 3: Lint + typecheck** — clean.
- [ ] **Step 4: Commit** — `git commit -am "feat(ui): floating Liquid Glass island sidebar"`

### Task 4: `lib/status-colors.ts` — single semantic color map

**Files:**
- Create: `lib/status-colors.ts`

- [ ] **Step 1: Create the file:**

```ts
/**
 * Single source of truth mapping every domain status to the Apple accent
 * palette. Pages must import from here — no local color maps.
 * Each entry pairs bright text with its tint background (pill idiom).
 */
export type AccentName =
  | "blue" | "green" | "orange" | "red" | "purple"
  | "teal" | "yellow" | "pink" | "indigo" | "gray";

export const accentPill: Record<AccentName, string> = {
  blue: "bg-accent-blue-tint text-accent-blue",
  green: "bg-accent-green-tint text-accent-green",
  orange: "bg-accent-orange-tint text-accent-orange",
  red: "bg-accent-red-tint text-accent-red",
  purple: "bg-accent-purple-tint text-accent-purple",
  teal: "bg-accent-teal-tint text-accent-teal",
  yellow: "bg-accent-yellow-tint text-accent-yellow",
  pink: "bg-accent-pink-tint text-accent-pink",
  indigo: "bg-accent-indigo-tint text-accent-indigo",
  gray: "bg-fill text-muted",
};

export const accentText: Record<AccentName, string> = {
  blue: "text-accent-blue", green: "text-accent-green",
  orange: "text-accent-orange", red: "text-accent-red",
  purple: "text-accent-purple", teal: "text-accent-teal",
  yellow: "text-accent-yellow", pink: "text-accent-pink",
  indigo: "text-accent-indigo", gray: "text-muted",
};

/* Task board (convex/schema.ts tasks.status) */
export const taskStatusAccent: Record<string, AccentName> = {
  todo: "gray", "in-progress": "blue", dispatched: "indigo",
  processing: "teal", review: "orange", done: "green",
  "agent-reviewed": "purple", "validation-error": "red", failed: "red",
};

/* Content pipeline (content.stage) */
export const contentStageAccent: Record<string, AccentName> = {
  idea: "gray", script: "blue", thumbnail: "purple",
  filming: "orange", editing: "teal", published: "green",
};

/* Client pipeline (clients.stage) */
export const clientStageAccent: Record<string, AccentName> = {
  lead: "gray", qualified: "blue", proposal: "purple", contract: "indigo",
  "in-production": "orange", delivered: "teal", paid: "green",
};

/* Priority */
export const priorityAccent: Record<string, AccentName> = {
  low: "gray", medium: "orange", high: "red",
};

/* Team member status */
export const teamStatusAccent: Record<string, AccentName> = {
  online: "green", busy: "red", away: "yellow", offline: "gray",
};

/* Revenue categories */
export const revenueCategoryAccent: Record<string, AccentName> = {
  "cadcam-design": "blue", "3dgoldsmith": "purple",
  trading: "green", consulting: "orange", other: "gray",
};

/* Recharts series palette (ordered) */
export const CHART_COLORS = [
  "var(--accent-blue)", "var(--accent-green)", "var(--accent-orange)",
  "var(--accent-purple)", "var(--accent-teal)", "var(--accent-pink)",
  "var(--accent-indigo)", "var(--accent-yellow)",
];

/* P&L: sign-prefixed, colored, non-color cue included */
export function pnlDisplay(value: number): { text: string; className: string } {
  const sign = value > 0 ? "+" : value < 0 ? "−" : "";
  return {
    text: `${sign}${Math.abs(value).toLocaleString(undefined, { maximumFractionDigits: 2 })}`,
    className: value > 0 ? "text-accent-green" : value < 0 ? "text-accent-red" : "text-muted",
  };
}
```

- [ ] **Step 2: Lint + typecheck** — clean.
- [ ] **Step 3: Commit** — `git add lib/status-colors.ts && git commit -m "feat(ui): semantic status-color map"`

---

## Phase 2 — Primitives

### Task 5: Card + StatCard

**Files:**
- Modify: `components/ui/card.tsx`
- Modify: `components/ui/stat-card.tsx`

- [ ] **Step 1: In `card.tsx`**, replace the `Card` root className string with:
```
"rounded-2xl glass-pane text-foreground"
```
(removes `card-hover`/`highlight-top`/old border+bg; hover lift is gone by default). Replace `CardDescription` class `text-muted-foreground` → `text-muted`.

- [ ] **Step 2: Replace `stat-card.tsx`** with:
```tsx
import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { accentPill, type AccentName } from "@/lib/status-colors";

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  icon?: LucideIcon;
  accent?: AccentName;
  iconClassName?: string;
  sub?: React.ReactNode;
  className?: string;
}

/** Apple-style stat tile: tinted icon chip left, numeral right. */
export function StatCard({
  label, value, icon: Icon, accent = "gray", iconClassName, sub, className,
}: StatCardProps) {
  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          {Icon && (
            <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", accentPill[accent], iconClassName)}>
              <Icon className="w-5 h-5" />
            </div>
          )}
          <div className="text-right">
            <div className="text-2xl font-bold tracking-tight tabular-nums text-foreground">{value}</div>
            <div className="text-xs font-medium text-muted">{label}</div>
            {sub && <div className="text-xs text-tertiary mt-0.5">{sub}</div>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```
Note: `iconClassName` is kept for compatibility (pages pass it today); callers get migrated to `accent` during the page sweep.

- [ ] **Step 3: Lint + typecheck** — clean. **Commit:** `git commit -am "feat(ui): glass Card + tinted StatCard"`

### Task 6: Button

**Files:**
- Modify: `components/ui/button.tsx`

- [ ] **Step 1: Replace `buttonVariants`** cva call with:
```tsx
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-[13px] font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/50 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-accent-blue text-white hover:opacity-90 active:scale-[0.97]",
        destructive:
          "bg-accent-red text-white hover:opacity-90 active:scale-[0.97]",
        outline:
          "border border-glass-border bg-fill text-foreground hover:bg-glass-elevated active:scale-[0.97]",
        secondary:
          "bg-fill text-foreground hover:bg-glass-elevated active:scale-[0.97]",
        ghost: "text-muted hover:bg-fill hover:text-foreground",
        link: "text-accent-blue underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
)
```
- [ ] **Step 2: Lint + typecheck** — clean. **Commit:** `git commit -am "feat(ui): Apple system buttons"`

### Task 7: Badge

**Files:**
- Modify: `components/ui/badge.tsx`

- [ ] **Step 1: Replace the file** with (adds `color` prop over the tint idiom; legacy `variant` values map to colors so existing call sites keep compiling until swept):
```tsx
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { accentPill, type AccentName } from "@/lib/status-colors"

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "", secondary: "", destructive: "", outline: "",
        success: "", warning: "",
      },
    },
    defaultVariants: { variant: "default" },
  }
)

const legacyVariantColor: Record<string, AccentName> = {
  default: "blue", secondary: "gray", destructive: "red",
  outline: "gray", success: "green", warning: "yellow",
}

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  color?: AccentName
}

function Badge({ className, variant, color, ...props }: BadgeProps) {
  const accent = color ?? legacyVariantColor[variant ?? "default"]
  return (
    <div
      className={cn(badgeVariants({ variant }), accentPill[accent], className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
```
- [ ] **Step 2: Lint + typecheck** — clean. **Commit:** `git commit -am "feat(ui): tinted pill Badge with accent color prop"`

### Task 8: Form controls — input, textarea, select, label

**Files:**
- Modify: `components/ui/input.tsx`, `components/ui/textarea.tsx`, `components/ui/select.tsx`, `components/ui/label.tsx`

- [ ] **Step 1: In `input.tsx` and `textarea.tsx`**, replace the root className string with:
```
"flex w-full rounded-lg bg-fill px-3 py-2 text-[13px] text-foreground placeholder:text-tertiary border border-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/50 disabled:cursor-not-allowed disabled:opacity-50"
```
(keep each file's height class: input `h-9`, textarea `min-h-[80px]`).

- [ ] **Step 2: In `select.tsx`**: Trigger gets the same recipe as input (`h-9 rounded-lg bg-fill …`). `SelectContent` container class → `"glass-pane-elevated rounded-xl text-foreground overflow-hidden"` (replace old bg/border classes; keep positioning/animation classes). `SelectItem` hover/focus classes → `focus:bg-fill focus:text-foreground`.

- [ ] **Step 3: In `label.tsx`**: text class → `text-[13px] font-medium text-muted`.

- [ ] **Step 4: Verify** `grep -nE "gray-[0-9]|white/\[|blue-[0-9]{3}" components/ui/input.tsx components/ui/textarea.tsx components/ui/select.tsx components/ui/label.tsx` → no matches. Lint + tsc clean.
- [ ] **Step 5: Commit** — `git commit -am "feat(ui): Apple fill form controls"`

### Task 9: Dialog, ConfirmDialog, Skeleton, Avatar, FormattedResult

**Files:**
- Modify: `components/ui/dialog.tsx`, `components/ui/confirm-dialog.tsx`, `components/ui/skeleton.tsx`, `components/ui/avatar.tsx`, `components/ui/formatted-result.tsx`

- [ ] **Step 1: `dialog.tsx`** — `DialogOverlay` bg → `bg-black/40` (`.light` handled globally, no per-mode class). `DialogContent` surface classes → `glass-pane-elevated rounded-2xl text-foreground` (replace old bg/border; keep layout/animation classes). Title → `text-foreground font-semibold`; description → `text-muted`.
- [ ] **Step 2: `skeleton.tsx`** — className → `"animate-pulse rounded-lg bg-fill"`.
- [ ] **Step 3: `confirm-dialog.tsx`, `avatar.tsx`, `formatted-result.tsx`** — apply the Sweep Map (below): every `gray-*`, `white/[…]`, raw hex → semantic equivalent.
- [ ] **Step 4: Verify** `grep -nE "gray-[0-9]|white/\[|#[0-9a-fA-F]{3,6}" components/ui/*.tsx` → no matches (excluding this plan's allowed `text-white` on filled accent surfaces). Lint + tsc clean.
- [ ] **Step 5: Commit** — `git commit -am "feat(ui): elevated glass dialogs + token-aligned ui primitives"`

### Task 10: New primitives — PageHeader + EmptyState

**Files:**
- Create: `components/ui/page-header.tsx`
- Create: `components/ui/empty-state.tsx`

- [ ] **Step 1: Create `page-header.tsx`:**
```tsx
interface PageHeaderProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode; // actions (buttons, filters)
}

/** Standard page header: large-title typography + optional actions row. */
export function PageHeader({ title, subtitle, children }: PageHeaderProps) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
      <div>
        <h1 className="text-[28px] font-bold tracking-tight text-foreground">{title}</h1>
        {subtitle && <p className="text-[13px] text-muted mt-1">{subtitle}</p>}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}
```
- [ ] **Step 2: Create `empty-state.tsx`:**
```tsx
import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon;
  message: string;
  hint?: string;
  children?: React.ReactNode; // optional action button
}

/** Standard empty state for lists/boards with no data. */
export function EmptyState({ icon: Icon, message, hint, children }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      {Icon && <Icon className="w-8 h-8 text-tertiary mb-3" />}
      <p className="text-[13px] font-medium text-muted">{message}</p>
      {hint && <p className="text-xs text-tertiary mt-1">{hint}</p>}
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}
```
- [ ] **Step 3: Lint + tsc clean. Commit** — `git add components/ui/page-header.tsx components/ui/empty-state.tsx && git commit -m "feat(ui): PageHeader + EmptyState primitives"`

### Task 11: Phase checkpoint — build + visual smoke

- [ ] **Step 1:** `npm run build` — Expected: success.
- [ ] **Step 2:** `npm run dev:next` (dev deployment data is fine); open `/` and `/tasks`; confirm: black ambient canvas, floating rounded sidebar, glass cards, no neon glows. Kill server.
- [ ] **Step 3:** Fix anything broken (missing utility, blur not applying). Commit fixes: `git commit -am "fix(ui): phase-1 smoke fixes"` (skip if none).

---

## Phase 3 — Page sweep (Tasks 12–25)

### THE SWEEP MAP (applies to every page task below)

Replace, in this order (verbatim class swaps unless noted):

| Old | New |
|---|---|
| `glass` / `glass-subtle` (className) | remove if on a `<Card>` (Card carries it now); else `glass-pane rounded-2xl` |
| `glow-blue/purple/green/amber/teal` | delete |
| `card-hover`, `highlight-top`, `nav-active` | delete |
| `bg-[var(--surface-N)]`, `bg-gray-800/900/950` | `bg-glass` (panel) or delete when inside Card |
| `bg-gray-700`, `bg-white/[0.03..0.06]`, `hover:bg-white/[…]` | `bg-fill`, `hover:bg-fill` |
| `text-white` (on glass/neutral bg) | `text-foreground` |
| `text-white` (on filled accent bg, e.g. blue button) | keep |
| `text-gray-100/200/300` | `text-foreground` |
| `text-gray-400/500` | `text-muted` |
| `text-gray-600` | `text-tertiary` |
| `border-gray-600/700/800`, `border-white/[…]` | `border-separator` |
| `divide-gray-*`, `divide-white/[…]` | `divide-separator` |
| `bg-blue-600` (buttons) | use `<Button>` default variant |
| `text-blue-400/300`, `bg-blue-500/xx` | `text-accent-blue`, `bg-accent-blue-tint` |
| `text-green-*`, `bg-green-*` | `text-accent-green`, `bg-accent-green-tint` |
| `text-red-*`, `bg-red-*` | `text-accent-red`, `bg-accent-red-tint` |
| `text-yellow-*`/`amber-*` | `text-accent-yellow` / `text-accent-orange` (+`-tint` bgs) |
| `text-purple-*`/`violet-*`, `text-teal-*`/`cyan-*`, `text-pink-*`, `text-indigo-*` | matching `accent-*` |
| local status→color maps/ternaries | import from `lib/status-colors` |
| page-local header markup (h1+p) | `<PageHeader title subtitle>` |
| page-local empty-state markup | `<EmptyState …>` |
| StatCard `iconClassName="text-…"` | `accent="<name>"` |
| Recharts `stroke`/`fill` hex | `CHART_COLORS[i]` / specific `var(--accent-*)` |
| Recharts `CartesianGrid` stroke | `var(--separator)` |
| Recharts `Tooltip` contentStyle | `{ background: "var(--glass-elevated)", border: "0.5px solid var(--glass-border)", borderRadius: 12, color: "var(--foreground)", backdropFilter: "blur(24px)" }` |
| Framer Motion `duration:` > 0.35 | 0.25 |

**Per-page procedure (every page task):**
1. Enumerate offenders: `grep -nE "gray-[0-9]|white/\[|glow-|surface-|#[0-9a-fA-F]{6}|(blue|green|red|purple|amber|yellow|teal|cyan|pink|indigo|violet)-[0-9]{2,3}" <file>`
2. Apply the Sweep Map to every hit; adopt `PageHeader`/`EmptyState`/`Badge color`/`status-colors` imports.
3. Gate: re-run the same grep → **only allowed matches**: `text-white` on filled-accent elements.
4. `npm run lint && npx tsc --noEmit` → clean.
5. Commit: `git commit -am "feat(ui): liquid glass — <page>"`

### Task 12: Home dashboard — `app/page.tsx` (797 lines, 13 glass refs)
Page-specific: Financial Snapshot row → `StatCard accent` props (`green` revenue, `blue` tasks, `purple` clients); activity feed rows → `divide-separator`; any gradient headline text → `text-foreground font-bold tracking-tight`. Then the standard procedure.

### Task 13: Tasks board — `app/tasks/page.tsx` (598 lines)
Page-specific: kanban column headers get `accentPill[taskStatusAccent[status]]` dot/pill; drag overlay card → `glass-pane-elevated rounded-2xl`; priority chips → `priorityAccent`. Keep all @dnd-kit logic untouched.

### Task 14: Content pipeline — `app/content/page.tsx` (625 lines)
Page-specific: stage columns/chips → `contentStageAccent`; type icons (video/blog/social/podcast) → `accentText` blue/purple/teal/orange.

### Task 15: Calendar — `app/calendar/page.tsx` (578 lines, gray=7)
Page-specific: day-grid borders → `border-separator`; today highlight → `bg-accent-blue-tint text-accent-blue`; event type colors → `accentPill` (cron=teal, task=blue, meeting=purple, milestone=orange).

### Task 16: Memory — `app/memory/page.tsx` (482 lines)
Page-specific: type filter chips → `accentPill` (conversation=blue, task=teal, decision=orange, insight=purple, note=gray); importance → `priorityAccent`.

### Task 17: Clients — `app/clients/page.tsx` (651 lines)
Page-specific: 7-stage kanban columns → `clientStageAccent`; deal value numerals → `tabular-nums`; keep dnd logic untouched.

### Task 18: Revenue — `app/revenue/page.tsx` (642 lines)
Page-specific: category chips → `revenueCategoryAccent`; goal progress bars → `bg-fill` track + `bg-accent-green` fill; Recharts per Sweep Map; money numerals `tracking-tight tabular-nums`.

### Task 19: Team — `app/team/page.tsx` (594 lines, gray=4)
Page-specific: status dots → `teamStatusAccent` (replaces globals `.status-*` classes — those no longer exist); role labels → `text-muted`.

### Task 20: Office — `app/office/page.tsx` + `components/office/*` (4 files)
Page-specific: sweep `OfficeStats`, `TeamMemberDesk`, `ActivityIndicator`, `AnimatedAvatar` with the same map; desk surfaces → `glass-pane rounded-xl`; activity states → `teamStatusAccent`. Leave `office-animations.css` keyframes as-is unless they reference deleted vars — if they do, re-point to `var(--accent-*)`.

### Task 21: Books — `app/books/page.tsx` (717 lines, gray=6)
Page-specific: category chips → `accentPill` (business=blue, technical=teal, design=purple, marketing=orange, finance=green, other=gray — map any remaining categories to gray); status chips (reading=blue, completed=green, to-read=gray, reference=purple, archived=gray).

### Task 22: Usage — `app/usage/page.tsx` (434 lines, glass=7)
Page-specific: provider colors in charts → `CHART_COLORS`; cost numerals `tabular-nums`; budget warnings → `text-accent-orange` / over-budget `text-accent-red` with `+/−` handled via `pnlDisplay` where deltas shown.

### Task 23: Assistant — `app/assistant/page.tsx` (290 lines, uses undefined shadcn tokens)
Page-specific: this page references shadcn tokens that don't exist (`bg-primary`, `border-border`, `bg-muted`…). Replace: `bg-primary`→`bg-accent-blue`, `text-primary-foreground`→`text-white`, `bg-muted`/`bg-secondary`→`bg-fill`, `border-border`/`border-input`→`border-separator`, `text-muted-foreground`→`text-muted`, `bg-background`→`bg-glass`, `ring-ring`→`ring-accent-blue/50`. Chat bubbles: user = filled `bg-accent-blue text-white rounded-2xl`, assistant = `glass-pane rounded-2xl`.

### Task 24: Polymarket + Polymarket v2 — `app/polymarket/page.tsx` (584, gray=11), `app/polymarket-v2/page.tsx` (533)
Page-specific: ALL P&L numbers through `pnlDisplay()` (sign prefix + color); position side LONG/`long_basket`=`accentPill.green`, SHORT/`short_basket`=`accentPill.red`; signal status → (pending=gray, claimed=blue, executed/paper-filled=green, expired=gray, rejected=red); HealthPill → `accentPill` green/red. One commit per page.

### Task 25: Trading team — `app/trading-team/page.tsx` (920 lines)
Page-specific: agent cards → glass Card; result panels keep `animate-fade-in-up`; P&L via `pnlDisplay`; agent status → `teamStatusAccent`.

---

## Phase 4 — Final QA & ship

### Task 26: Repo-wide gates, light mode, build

- [ ] **Step 1: Repo-wide sweep gate:**
```bash
grep -rnE "bg-gray-[0-9]|text-gray-[0-9]|border-gray-[0-9]|glow-|surface-[0-3]|white/\[0" app components --include="*.tsx" | grep -v node_modules
```
Expected: zero matches. Fix any stragglers.
- [ ] **Step 2:** `npm run lint` → 0 errors; `npx tsc --noEmit` → clean; `npm run build` → success.
- [ ] **Step 3: Visual walk (dark):** `npm run dev:next`; visit all 15 routes; check glass rendering, palette pills, sidebar active states.
- [ ] **Step 4: Visual walk (light):** toggle theme; every page must be legible with zero dark-mode remnants (the old `.light` override block is gone — semantic vars carry everything).
- [ ] **Step 5: Real-data QA:** temporarily set `NEXT_PUBLIC_CONVEX_URL=https://vibrant-shepherd-814.convex.cloud` in `.env.local`, restart dev server, browse (read-only — do not create/edit/delete anything), then **revert `.env.local` immediately** and restart.
- [ ] **Step 6: Commit any fixes** — `git commit -am "fix(ui): final QA polish"`

### Task 27: PR

- [ ] **Step 1:**
```bash
git push -u origin liquid-glass-ui
gh pr create --title "Apple Liquid Glass UI rebuild" --body "$(cat <<'EOF'
## Summary
- Full semantic-token rebuild: Apple Liquid Glass (dark default), full Apple system palette, floating island sidebar
- All 15 pages swept — zero raw colors left in page code; one status-colors map
- Light mode = pure token flip (legacy override block deleted)
- Frontend-only; no Convex changes

Spec: docs/superpowers/specs/2026-07-11-liquid-glass-ui-design.md

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```
- [ ] **Step 2:** Report PR URL to Armen for review/merge (Vercel deploys on merge).
