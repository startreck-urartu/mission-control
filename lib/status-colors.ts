/**
 * Single source of truth mapping every domain status to the Apple accent
 * palette. Pages must import from here — no local RAW-CLASS color maps.
 * (Page-scoped Record<string, AccentName> maps for page-only domains are OK.)
 * Each entry pairs bright text with its tint background (pill idiom).
 * Policy: the palette is pure Apple system colors — there is no `amber`;
 * anything formerly amber maps to `orange` (or `yellow` where truly yellow).
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

/* Solid backgrounds — for indicator dots and progress-bar fills */
export const accentBg: Record<AccentName, string> = {
  blue: "bg-accent-blue", green: "bg-accent-green",
  orange: "bg-accent-orange", red: "bg-accent-red",
  purple: "bg-accent-purple", teal: "bg-accent-teal",
  yellow: "bg-accent-yellow", pink: "bg-accent-pink",
  indigo: "bg-accent-indigo", gray: "bg-fill",
};

/* Top-border accents — per-column/status color identity on headers */
export const accentBorderT: Record<AccentName, string> = {
  blue: "border-t-accent-blue", green: "border-t-accent-green",
  orange: "border-t-accent-orange", red: "border-t-accent-red",
  purple: "border-t-accent-purple", teal: "border-t-accent-teal",
  yellow: "border-t-accent-yellow", pink: "border-t-accent-pink",
  indigo: "border-t-accent-indigo", gray: "border-t-separator",
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

/* Trading agents (n8n Orion/Vega/Atlas/Mercury) — identity accents */
export const tradingAgentAccent: Record<string, AccentName> = {
  "Orion Prime": "orange", Vega: "teal", Atlas: "green", Mercury: "purple",
};

/* Polymarket trader process status */
export const traderStatusAccent: Record<string, AccentName> = {
  running: "green", stopped: "gray", error: "red", unknown: "yellow",
};

/* Polymarket signal queue (polymarketSignals.status) */
export const polymarketSignalAccent: Record<string, AccentName> = {
  pending: "gray", claimed: "blue", executed: "green",
  "paper-filled": "green", expired: "gray", rejected: "red",
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

/* USD variant: sign, then $, e.g. "+$1.23" / "−$4.56" */
export function pnlDisplayUSD(value: number): { text: string; className: string } {
  const base = pnlDisplay(value);
  const sign = value > 0 ? "+" : value < 0 ? "−" : "";
  return {
    text: `${sign}$${Math.abs(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    className: base.className,
  };
}
