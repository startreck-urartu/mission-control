"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Activity,
  CheckCircle2,
  Clock,
  HeartPulse,
  Layers,
  TrendingUp,
  TrendingDown,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { cn, formatTimeAgo } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import {
  accentBg,
  accentPill,
  accentText,
  polymarketSignalAccent,
  pnlDisplay,
  type AccentName,
} from "@/lib/status-colors";

// ── Types ─────────────────────────────────────────────────────────────────────

type Leg = {
  conditionId: string;
  tokenYes?: string;
  tokenNo?: string;
  question?: string;
  yesPrice: number;
};

type TethysCheck = {
  name: string;
  status: "ok" | "fail";
  detail: string;
};

type TethysStatus = {
  _id: string;
  _creationTime: number;
  type: string;
  message: string;
  createdAt: string;
  metadata?: {
    overall?: "ok" | "fail";
    failureCount?: number;
    checks?: TethysCheck[];
  };
} | null;

type Signal = {
  _id: string;
  _creationTime: number;
  strategy: string;
  mode: "paper" | "live";
  status:
    | "pending"
    | "claimed"
    | "executed"
    | "paper-filled"
    | "expired"
    | "rejected";
  eventId: string;
  eventSlug?: string;
  eventTitle?: string;
  eventVolume: number;
  endTs?: number;
  scanTs: number;
  sumYesProb: number;
  absDeviationBps: number;
  direction: "long_basket" | "short_basket";
  nLegs: number;
  totalLegs: number;
  observationCompleteness: number;
  legs: Leg[];
  claimedBy?: string;
  claimedAt?: string;
  rejectReason?: string;
  paperPnlBps?: number;
  paperFilledAt?: string;
  createdAt: string;
  updatedAt: string;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatUsdM(n: number) {
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}k`;
  return `$${n.toFixed(0)}`;
}

function formatPct(x: number, decimals = 1) {
  return `${(x * 100).toFixed(decimals)}%`;
}

function median(xs: number[]): number | null {
  if (xs.length === 0) return null;
  const sorted = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

// formatBps: sign-prefixed via pnlDisplay for P&L bps, raw for deviation
function formatBpsRaw(bps: number | null | undefined) {
  if (bps === null || bps === undefined) return "—";
  return `${Math.round(bps)} bps`;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SignalRow({ sig }: { sig: Signal }) {
  const pnl = sig.paperPnlBps;

  let pnlEl: React.ReactNode;
  if (pnl === undefined || pnl === null) {
    pnlEl = <span className="text-muted">—</span>;
  } else {
    const p = pnlDisplay(Math.round(pnl));
    pnlEl = <span className={cn("tabular-nums", p.className)}>{p.text} bps</span>;
  }

  return (
    <tr className="border-b border-separator/40 hover:bg-fill/50 transition-colors">
      <td className="px-3 py-2.5 text-xs">
        <div className="flex items-center gap-2">
          <Badge color={polymarketSignalAccent[sig.status] ?? "gray"}>
            {sig.status}
          </Badge>
          <Badge color={sig.direction === "long_basket" ? "green" : "red"}>
            {sig.direction === "long_basket" ? "LONG" : "SHORT"}
          </Badge>
        </div>
      </td>
      <td className="px-3 py-2.5">
        <div className="text-sm text-foreground truncate max-w-[280px]" title={sig.eventTitle}>
          {sig.eventTitle ?? sig.eventId}
        </div>
        <div className="text-[11px] text-muted">
          {sig.nLegs}/{sig.totalLegs} legs · {formatUsdM(sig.eventVolume)}
        </div>
      </td>
      <td className="px-3 py-2.5 text-sm text-foreground font-mono text-right tabular-nums">
        {sig.sumYesProb.toFixed(4)}
      </td>
      <td className="px-3 py-2.5 text-sm text-right">
        <span className="font-mono text-foreground tabular-nums">
          {formatBpsRaw(sig.absDeviationBps)}
        </span>
      </td>
      <td className="px-3 py-2.5 text-sm font-mono text-right">
        {pnlEl}
      </td>
      <td className="px-3 py-2.5 text-xs text-muted text-right">
        {formatTimeAgo(new Date(sig.scanTs * 1000).toISOString())}
      </td>
    </tr>
  );
}

function HealthPill({ status }: { status: TethysStatus }) {
  const STALE_AFTER_MS = 45 * 60 * 1000;

  if (status === null) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border bg-fill border-separator text-muted">
        <HeartPulse className="w-3.5 h-3.5" />
        Health: unknown
      </div>
    );
  }

  // eslint-disable-next-line react-hooks/purity
  const ageMs = Date.now() - new Date(status.createdAt).getTime();
  const stale = ageMs > STALE_AFTER_MS;
  const overall = status.metadata?.overall ?? "fail";
  const failureCount = status.metadata?.failureCount ?? 0;
  const checks = status.metadata?.checks ?? [];
  const failedChecks = checks.filter((c) => c.status === "fail");

  let dotAccent: AccentName;
  let pillClass: string;
  let label: string;
  let dotPulse = false;

  if (stale) {
    dotAccent = "orange";
    pillClass = cn(accentPill["orange"], "border border-separator");
    label = `Health: stale (${formatTimeAgo(status.createdAt)})`;
  } else if (overall === "ok") {
    dotAccent = "green";
    pillClass = cn(accentPill["green"], "border border-separator");
    label = "Health: OK";
    dotPulse = true;
  } else {
    dotAccent = "red";
    pillClass = cn(accentPill["red"], "border border-separator");
    label = `Health: ${failureCount} failure${failureCount === 1 ? "" : "s"}`;
    dotPulse = true;
  }

  const tooltip = [
    `Updated ${formatTimeAgo(status.createdAt)}`,
    ...checks.map((c) => `${c.status === "ok" ? "✓" : "✗"} ${c.name}: ${c.detail}`),
  ].join("\n");

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium cursor-help",
        pillClass,
      )}
      title={tooltip}
    >
      <span
        className={cn(
          "w-2 h-2 rounded-full border border-background",
          accentBg[dotAccent],
          dotPulse ? "animate-pulse" : ""
        )}
      />
      <HeartPulse className="w-3.5 h-3.5" />
      {label}
      {failedChecks.length > 0 && !stale && (
        <span className={cn("text-xs font-normal max-w-[220px] truncate", accentText["red"])}>
          · {failedChecks.map((c) => c.name).join(", ")}
        </span>
      )}
    </div>
  );
}

function SignalTable({ rows, emptyMessage }: { rows: Signal[]; emptyMessage: string }) {
  if (rows.length === 0) {
    return (
      <div className="p-6 text-center text-sm text-muted">{emptyMessage}</div>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-separator text-[10px] uppercase tracking-wider text-muted">
            <th className="px-3 py-2 text-left font-medium">Status / Dir</th>
            <th className="px-3 py-2 text-left font-medium">Event</th>
            <th className="px-3 py-2 text-right font-medium">Σ YES</th>
            <th className="px-3 py-2 text-right font-medium">|dev|</th>
            <th className="px-3 py-2 text-right font-medium">P&amp;L</th>
            <th className="px-3 py-2 text-right font-medium">Scanned</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((sig) => (
            <SignalRow key={sig._id} sig={sig} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function PolymarketV2Page() {
  const signals = useQuery(api.polymarketSignals.getSignalsByStrategy, {
    strategy: "poly-delta-v1",
    limit: 200,
  }) as Signal[] | undefined;

  const tethysStatus = useQuery(
    api.polymarketSignals.getLatestTethysStatus,
    {},
  ) as TethysStatus | undefined;

  const isLoading = signals === undefined;

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-56" />
            <Skeleton className="h-4 w-80" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
        </div>
        <Skeleton className="h-48 rounded-2xl" />
      </div>
    );
  }

  const pending = signals.filter((s) => s.status === "pending");
  const claimed = signals.filter((s) => s.status === "claimed");
  const filled = signals.filter((s) => s.status === "paper-filled");
  const expired = signals.filter((s) => s.status === "expired");
  const rejected = signals.filter((s) => s.status === "rejected");

  const fillPnls = filled
    .map((s) => s.paperPnlBps)
    .filter((x): x is number => x !== undefined && x !== null);
  const wins = fillPnls.filter((p) => p > 0).length;
  const wr = fillPnls.length > 0 ? wins / fillPnls.length : null;
  const medianPnl = median(fillPnls);
  const totalBps = fillPnls.reduce((a, b) => a + b, 0);

  const mostRecentScanTs = signals.reduce(
    (max, s) => (s.scanTs > max ? s.scanTs : max),
    0
  );

  const recentClosed = signals
    .filter((s) =>
      ["paper-filled", "executed", "expired", "rejected"].includes(s.status)
    )
    .slice(0, 40);

  // Median P&L display
  const medianPnlDisplay =
    medianPnl !== null ? (() => {
      const p = pnlDisplay(Math.round(medianPnl));
      return { text: `${p.text} bps`, className: p.className };
    })() : null;

  // Total bps display
  const totalPnl = pnlDisplay(Math.round(totalBps));
  const totalPnlDisplay =
    fillPnls.length > 0
      ? <span className={cn("tabular-nums", totalPnl.className)}>Σ {totalPnl.text} bps</span>
      : "no fills yet";

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <PageHeader
        title="Polymarket Trader v2"
        subtitle="POLY-DELTA cross-market arb · negRisk mutex events · paper mode"
      >
        <span className="text-xs text-muted">
          {mostRecentScanTs > 0
            ? `Last signal ${formatTimeAgo(new Date(mostRecentScanTs * 1000).toISOString())}`
            : "No signals yet"}
        </span>
        <HealthPill status={tethysStatus === undefined ? null : tethysStatus} />
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border bg-accent-blue-tint border-separator text-accent-blue">
          <span className="w-2 h-2 rounded-full bg-accent-blue border border-background animate-pulse" />
          Live
        </div>
      </PageHeader>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          label="Pending"
          value={<span className="tabular-nums">{String(pending.length + claimed.length)}</span>}
          sub={claimed.length > 0 ? `${claimed.length} claimed` : "awaiting fill"}
          icon={Clock}
          accent="blue"
        />
        <StatCard
          label="Paper Filled"
          value={<span className="tabular-nums">{String(filled.length)}</span>}
          sub={filled.length > 0 ? `${wins}W / ${filled.length - wins}L` : "—"}
          icon={CheckCircle2}
          accent="green"
        />
        <StatCard
          label="Win Rate"
          value={
            <span
              className={cn(
                "tabular-nums",
                wr === null
                  ? "text-muted"
                  : wr >= 0.8
                  ? "text-accent-green"
                  : wr >= 0.5
                  ? "text-accent-yellow"
                  : "text-accent-red"
              )}
            >
              {wr === null ? "—" : formatPct(wr)}
            </span>
          }
          sub={fillPnls.length > 0 ? `n=${fillPnls.length}` : "no fills yet"}
          icon={Activity}
          accent="purple"
        />
        <StatCard
          label="Median P&L"
          value={
            medianPnlDisplay ? (
              <span className={cn("tabular-nums", medianPnlDisplay.className)}>
                {medianPnlDisplay.text}
              </span>
            ) : (
              <span className="tabular-nums text-muted">—</span>
            )
          }
          sub={totalPnlDisplay}
          icon={TrendingUp}
          accent={medianPnl === null ? "gray" : medianPnl > 0 ? "green" : "red"}
        />
        <StatCard
          label="Expired / Rejected"
          value={<span className="tabular-nums">{String(expired.length + rejected.length)}</span>}
          sub={expired.length > 0 ? `${expired.length} aged out` : "—"}
          icon={AlertCircle}
          accent="gray"
        />
      </div>

      {/* Pending panel */}
      <div className="glass-pane rounded-2xl">
        <div className="flex items-center justify-between p-5 border-b border-separator">
          <div className="flex items-center gap-3">
            <div className={cn("p-2 rounded-lg", accentPill["blue"])}>
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">
                Pending Signals
              </h2>
              <p className="text-xs text-muted">
                Live — updates automatically as scanner enqueues matches
              </p>
            </div>
          </div>
          <span className="text-sm text-foreground font-mono tabular-nums">
            {pending.length + claimed.length}
          </span>
        </div>
        <SignalTable
          rows={[...claimed, ...pending]}
          emptyMessage="No pending signals. Scanner runs every 5 min; POLY-DELTA matches are rare by design."
        />
      </div>

      {/* Recent fills panel */}
      <div className="glass-pane rounded-2xl">
        <div className="flex items-center justify-between p-5 border-b border-separator">
          <div className="flex items-center gap-3">
            <div className={cn("p-2 rounded-lg", accentPill["green"])}>
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">
                Recent Fills &amp; Closed
              </h2>
              <p className="text-xs text-muted">
                Paper-filled, executed, expired, and rejected signals
              </p>
            </div>
          </div>
          <span className="text-sm text-foreground font-mono tabular-nums">
            {recentClosed.length}
          </span>
        </div>
        <SignalTable
          rows={recentClosed}
          emptyMessage="No closed signals yet. First paper fills arrive ~72h after the first pending signal."
        />
      </div>

      {/* Footer legend */}
      <div className="text-[11px] text-tertiary flex flex-wrap items-center gap-x-5 gap-y-1 pt-2">
        <span className="flex items-center gap-1.5">
          <TrendingUp className="w-3 h-3 text-accent-green" /> LONG = Σ YES &lt; 1 ·
          buy basket
        </span>
        <span className="flex items-center gap-1.5">
          <TrendingDown className="w-3 h-3 text-accent-red" /> SHORT = Σ YES &gt; 1
          · sell basket
        </span>
        <span className="flex items-center gap-1.5">
          <XCircle className="w-3 h-3 text-muted" /> Expired = resolver
          couldn&apos;t fill after 14 days
        </span>
      </div>
    </div>
  );
}
