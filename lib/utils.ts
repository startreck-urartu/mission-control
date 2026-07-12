import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: date.getHours() > 0 ? "numeric" : undefined,
    minute: date.getHours() > 0 ? "2-digit" : undefined,
  });
}

// Avatar URLs entered during local dev may be absolute localhost URLs;
// resolve them against the current origin so they work in production too
export function normalizeAssetUrl(url: string | undefined): string | undefined {
  if (!url) return url;
  return url.replace(/^https?:\/\/localhost(:\d+)?\//, "/");
}

export function formatTimeAgo(dateString: string | undefined | null): string {
  if (!dateString) return "—";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "—";
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(dateString);
}

export function formatCurrency(
  amount: number | null | undefined,
  { decimals = 2, fallback = "—" }: { decimals?: number; fallback?: string } = {}
): string {
  if (amount === null || amount === undefined || Number.isNaN(amount)) {
    return fallback;
  }
  const sign = amount < 0 ? "-" : "";
  return (
    sign +
    "$" +
    Math.abs(amount).toLocaleString("en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })
  );
}
