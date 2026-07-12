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
