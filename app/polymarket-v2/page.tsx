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
import { cn } from "@/lib/utils";

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

function timeAgo(tsIsoOrUnix: string | number) {
  const ms =
    typeof tsIsoOrUnix === "string"
      ? new Date(tsIsoOrUnix).getTime()
      : tsIsoOrUnix * 1000;
  const diff = Date.now() - ms;
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 48) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function formatBps(bps: number | null | undefined, signed = true) {
  if (bps === null || bps === undefined) return "—";
  const sign = signed && bps > 0 ? "+" : "";
  return `${sign}${Math.round(bps)} bps`;
}

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

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  iconBg,
  valueColor,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  valueColor?: string;
}) {
  return (
    <div className="glass rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-gray-400">{label}</span>
        <div className={cn("p-2 rounded-lg", iconBg)}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p className={cn("text-2xl font-bold", valueColor ?? "text-white")}>
        {value}
      </p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  );
}

const STATUS_STYLES: Record<Signal["status"], string> = {
  pending: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  claimed: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  executed: "bg-purple-500/15 text-purple-300 border-purple-500/30",
  "paper-filled": "bg-green-500/15 text-green-300 border-green-500/30",
  expired: "bg-gray-700/40 text-gray-400 border-gray-600/40",
  rejected: "bg-gray-700/40 text-gray-500 border-gray-600/30",
};

const DIRECTION_STYLES: Record<Signal["direction"], string> = {
  long_basket: "bg-green-500/10 text-green-300 border-green-500/20",
  short_basket: "bg-red-500/10 text-red-300 border-red-500/20",
};

function StatusBadge({ status }: { status: Signal["status"] }) {
  return (
    <span
      className={cn(
        "px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide rounded border",
        STATUS_STYLES[status]
      )}
    >
      {status}
    </span>
  );
}

function DirectionBadge({ direction }: { direction: Signal["direction"] }) {
  const short = direction === "long_basket" ? "LONG" : "SHORT";
  return (
    <span
      className={cn(
        "px-2 py-0.5 text-[10px] font-semibold rounded border",
        DIRECTION_STYLES[direction]
      )}
    >
      {short}
    </span>
  );
}

function SignalRow({ sig }: { sig: Signal }) {
  const pnl = sig.paperPnlBps;
  const pnlClass =
    pnl === undefined
      ? "text-gray-500"
      : pnl > 0
      ? "text-green-400"
      : "text-red-400";

  return (
    <tr className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
      <td className="px-3 py-2.5 text-xs">
        <div className="flex items-center gap-2">
          <StatusBadge status={sig.status} />
          <DirectionBadge direction={sig.direction} />
        </div>
      </td>
      <td className="px-3 py-2.5">
        <div className="text-sm text-gray-200 truncate max-w-[280px]" title={sig.eventTitle}>
          {sig.eventTitle ?? sig.eventId}
        </div>
        <div className="text-[11px] text-gray-500">
          {sig.nLegs}/{sig.totalLegs} legs · {formatUsdM(sig.eventVolume)}
        </div>
      </td>
      <td className="px-3 py-2.5 text-sm text-gray-300 font-mono text-right">
        {sig.sumYesProb.toFixed(4)}
      </td>
      <td className="px-3 py-2.5 text-sm text-right">
        <span className="font-mono text-gray-300">
          {formatBps(sig.absDeviationBps, false)}
        </span>
      </td>
      <td className={cn("px-3 py-2.5 text-sm font-mono text-right", pnlClass)}>
        {formatBps(pnl)}
      </td>
      <td className="px-3 py-2.5 text-xs text-gray-500 text-right">
        {timeAgo(sig.scanTs)}
      </td>
    </tr>
  );
}

function HealthPill({ status }: { status: TethysStatus }) {
  // Tethys runs every 30 min. Treat >45 min as "stale" — something stopped the cron.
  const STALE_AFTER_MS = 45 * 60 * 1000;

  if (status === null) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border bg-gray-700/40 border-gray-600/40 text-gray-400">
        <HeartPulse className="w-3.5 h-3.5" />
        Health: unknown
      </div>
    );
  }

  // Staleness is intentionally computed against wall-clock time at render.
  // eslint-disable-next-line react-hooks/purity
  const ageMs = Date.now() - new Date(status.createdAt).getTime();
  const stale = ageMs > STALE_AFTER_MS;
  const overall = status.metadata?.overall ?? "fail";
  const failureCount = status.metadata?.failureCount ?? 0;
  const checks = status.metadata?.checks ?? [];
  const failedChecks = checks.filter((c) => c.status === "fail");

  let styles: string;
  let label: string;
  let dotColor: string;
  if (stale) {
    styles = "bg-amber-500/10 border-amber-500/30 text-amber-300";
    label = `Health: stale (${timeAgo(status.createdAt)})`;
    dotColor = "bg-amber-400";
  } else if (overall === "ok") {
    styles = "bg-green-500/10 border-green-500/30 text-green-300";
    label = "Health: OK";
    dotColor = "bg-green-400 animate-pulse";
  } else {
    styles = "bg-red-500/10 border-red-500/30 text-red-300";
    label = `Health: ${failureCount} failure${failureCount === 1 ? "" : "s"}`;
    dotColor = "bg-red-400 animate-pulse";
  }

  const tooltip = [
    `Updated ${timeAgo(status.createdAt)}`,
    ...checks.map((c) => `${c.status === "ok" ? "✓" : "✗"} ${c.name}: ${c.detail}`),
  ].join("\n");

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border cursor-help",
        styles,
      )}
      title={tooltip}
    >
      <span className={cn("w-2 h-2 rounded-full", dotColor)} />
      <HeartPulse className="w-3.5 h-3.5" />
      {label}
      {failedChecks.length > 0 && !stale && (
        <span className="text-xs font-normal text-red-200/80 max-w-[220px] truncate">
          · {failedChecks.map((c) => c.name).join(", ")}
        </span>
      )}
    </div>
  );
}

function SignalTable({ rows, emptyMessage }: { rows: Signal[]; emptyMessage: string }) {
  if (rows.length === 0) {
    return (
      <div className="p-6 text-center text-sm text-gray-500">{emptyMessage}</div>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-white/[0.06] text-[10px] uppercase tracking-wider text-gray-500">
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
      <div className="p-6">
        <div className="text-sm text-gray-500">Loading POLY-DELTA signals…</div>
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

  // Recent fills + expires, newest first, for the history table.
  const recentClosed = signals
    .filter((s) =>
      ["paper-filled", "executed", "expired", "rejected"].includes(s.status)
    )
    .slice(0, 40);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Polymarket Trader v2</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            POLY-DELTA cross-market arb · negRisk mutex events · paper mode
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-xs text-gray-500">
            {mostRecentScanTs > 0
              ? `Last signal ${timeAgo(mostRecentScanTs)}`
              : "No signals yet"}
          </span>
          <HealthPill status={tethysStatus === undefined ? null : tethysStatus} />
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border bg-blue-500/10 border-blue-500/30 text-blue-300">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            Live
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          label="Pending"
          value={String(pending.length + claimed.length)}
          sub={claimed.length > 0 ? `${claimed.length} claimed` : "awaiting fill"}
          icon={Clock}
          iconBg="bg-blue-500/20 text-blue-300"
        />
        <StatCard
          label="Paper Filled"
          value={String(filled.length)}
          sub={filled.length > 0 ? `${wins}W / ${filled.length - wins}L` : "—"}
          icon={CheckCircle2}
          iconBg="bg-green-500/20 text-green-300"
        />
        <StatCard
          label="Win Rate"
          value={wr === null ? "—" : formatPct(wr)}
          sub={fillPnls.length > 0 ? `n=${fillPnls.length}` : "no fills yet"}
          icon={Activity}
          iconBg="bg-purple-500/20 text-purple-300"
          valueColor={
            wr === null
              ? "text-gray-400"
              : wr >= 0.8
              ? "text-green-400"
              : wr >= 0.5
              ? "text-yellow-400"
              : "text-red-400"
          }
        />
        <StatCard
          label="Median P&L"
          value={medianPnl === null ? "—" : formatBps(medianPnl)}
          sub={
            fillPnls.length > 0 ? `Σ ${formatBps(totalBps)}` : "no fills yet"
          }
          icon={TrendingUp}
          iconBg="bg-amber-500/20 text-amber-300"
          valueColor={
            medianPnl === null
              ? "text-gray-400"
              : medianPnl > 0
              ? "text-green-400"
              : "text-red-400"
          }
        />
        <StatCard
          label="Expired / Rejected"
          value={String(expired.length + rejected.length)}
          sub={expired.length > 0 ? `${expired.length} aged out` : "—"}
          icon={AlertCircle}
          iconBg="bg-gray-700/50 text-gray-400"
        />
      </div>

      {/* Pending panel */}
      <div className="glass rounded-xl">
        <div className="flex items-center justify-between p-5 border-b border-white/[0.04]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/20 text-blue-300">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">
                Pending Signals
              </h2>
              <p className="text-xs text-gray-500">
                Live — updates automatically as scanner enqueues matches
              </p>
            </div>
          </div>
          <span className="text-sm text-gray-400 font-mono">
            {pending.length + claimed.length}
          </span>
        </div>
        <SignalTable
          rows={[...claimed, ...pending]}
          emptyMessage="No pending signals. Scanner runs every 5 min; POLY-DELTA matches are rare by design."
        />
      </div>

      {/* Recent fills panel */}
      <div className="glass rounded-xl">
        <div className="flex items-center justify-between p-5 border-b border-white/[0.04]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/20 text-green-300">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">
                Recent Fills &amp; Closed
              </h2>
              <p className="text-xs text-gray-500">
                Paper-filled, executed, expired, and rejected signals
              </p>
            </div>
          </div>
          <span className="text-sm text-gray-400 font-mono">
            {recentClosed.length}
          </span>
        </div>
        <SignalTable
          rows={recentClosed}
          emptyMessage="No closed signals yet. First paper fills arrive ~72h after the first pending signal."
        />
      </div>

      {/* Footer legend */}
      <div className="text-[11px] text-gray-600 flex flex-wrap items-center gap-x-5 gap-y-1 pt-2">
        <span className="flex items-center gap-1.5">
          <TrendingUp className="w-3 h-3 text-green-400" /> LONG = Σ YES &lt; 1 ·
          buy basket
        </span>
        <span className="flex items-center gap-1.5">
          <TrendingDown className="w-3 h-3 text-red-400" /> SHORT = Σ YES &gt; 1
          · sell basket
        </span>
        <span className="flex items-center gap-1.5">
          <XCircle className="w-3 h-3 text-gray-500" /> Expired = resolver
          couldn&apos;t fill after 14 days
        </span>
      </div>
    </div>
  );
}
