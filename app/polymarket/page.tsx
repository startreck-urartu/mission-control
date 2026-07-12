"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  TrendingUp,
  Activity,
  DollarSign,
  BarChart2,
  RefreshCw,
  Layers,
  AlertCircle,
  Terminal,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { cn, formatCurrency } from "@/lib/utils";
import { accentBg, accentPill, accentText, pnlDisplay, pnlDisplayUSD, type AccentName } from "@/lib/status-colors";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatUSD(n: number | null | undefined, decimals = 2) {
  return formatCurrency(n, { decimals });
}

function formatNum(n: number | null | undefined, decimals = 2) {
  if (n === null || n === undefined) return "—";
  return n.toFixed(decimals);
}

function formatPct(n: number | null | undefined) {
  if (n === null || n === undefined) return "—";
  return n.toFixed(1) + "%";
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  return `${h}h ago`;
}

function shortSlug(slug: string | undefined) {
  if (!slug) return "—";
  return slug.length > 42 ? slug.slice(0, 42) + "…" : slug;
}

function formatTimestamp(iso: string) {
  try {
    return new Date(iso).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

// ── Log level / source accent maps ────────────────────────────────────────────

const LEVEL_ACCENT: Record<string, AccentName> = {
  ERROR: "red",
  WARN: "yellow",
  WARNING: "yellow",
};

const SOURCE_ACCENT: Record<string, AccentName> = {
  directional: "blue",
  spread: "purple",
};

// ── Main Page ─────────────────────────────────────────────────────────────────

type LogEntry = {
  ts: string;
  level: string;
  module?: string;
  message: string;
  source: string;
};

const STATUS_DOT_ACCENT: Record<string, AccentName> = {
  running: "green",
  stopped: "gray",
  error: "red",
  unknown: "yellow",
};

export default function PolymarketPage() {
  const traderState = useQuery(api.polymarketTrader.getTraderState);
  const recentTrades = useQuery(api.polymarketTrader.getRecentTrades, { limit: 50 });
  const tradeStats = useQuery(api.polymarketTrader.getTradeStats);
  const [logFilter, setLogFilter] = useState<"all" | "directional" | "spread">("all");
  const logEndRef = useRef<HTMLDivElement>(null);

  const logs: LogEntry[] = ((traderState?.logs as LogEntry[]) ?? []).slice().reverse();
  const filteredLogs = logFilter === "all" ? logs : logs.filter((l) => l.source === logFilter);

  useEffect(() => {
    // No auto-scroll needed since we show newest first
  }, [logs.length]);

  const isLoading =
    traderState === undefined || recentTrades === undefined || tradeStats === undefined;

  const status = traderState?.status ?? "unknown";
  const dailyPnl = traderState?.dailyPnl ?? 0;
  const positions: {
    market_id: string;
    token_id: string;
    size: number;
    avg_entry_price: number;
    realized_pnl: number;
    unrealized_pnl: number;
    last_price: number | null;
  }[] = (traderState?.positions as typeof positions) ?? [];

  // Status pill accent
  const statusAccent: AccentName =
    status === "running" ? "green" : status === "error" ? "red" : "gray";

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <PageHeader
        title="Polymarket Trader"
        subtitle="Autonomous prediction market trading system"
      >
        {traderState && (
          <span className="text-xs text-muted">
            Synced {timeAgo(traderState.lastSyncedAt)}
          </span>
        )}
        <div
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border border-separator",
            accentPill[statusAccent]
          )}
        >
          <span
            className={cn(
              "w-2 h-2 rounded-full border border-background",
              accentBg[STATUS_DOT_ACCENT[status] ?? "gray"],
              status === "running" || status === "error" ? "animate-pulse" : ""
            )}
          />
          {status.charAt(0).toUpperCase() + status.slice(1)}
          {traderState?.strategyName && (
            <span className="text-tertiary">· {traderState.strategyName}</span>
          )}
        </div>
      </PageHeader>

      {/* No data state */}
      {!isLoading && !traderState && (
        <EmptyState
          icon={AlertCircle}
          message="No data yet"
          hint="Run the sync script on your trading machine to push state to this dashboard."
        >
          <code className="text-xs bg-fill px-3 py-2 rounded text-foreground font-mono">
            python sync_to_mission_control.py
          </code>
        </EmptyState>
      )}

      {/* Stats Cards */}
      {(traderState || isLoading) && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {isLoading ? (
            <>
              <Skeleton className="h-24 rounded-2xl" />
              <Skeleton className="h-24 rounded-2xl" />
              <Skeleton className="h-24 rounded-2xl" />
              <Skeleton className="h-24 rounded-2xl" />
            </>
          ) : (
            <>
              {(() => {
                const p = pnlDisplayUSD(dailyPnl);
                return (
                  <StatCard
                    label="Daily P&L"
                    value={<span className={cn("tabular-nums", p.className)}>{p.text}</span>}
                    sub={`Reset: ${traderState?.dailyResetDate ?? "—"}`}
                    icon={DollarSign}
                    accent={dailyPnl > 0 ? "green" : dailyPnl < 0 ? "red" : "gray"}
                  />
                );
              })()}
              <StatCard
                label="Trades Today"
                value={<span className="tabular-nums">{String(traderState?.totalTradesToday ?? 0)}</span>}
                sub={`${tradeStats?.totalTrades ?? 0} total recorded`}
                icon={Activity}
                accent="blue"
              />
              <StatCard
                label="Win Rate"
                value={
                  <span
                    className={cn(
                      "tabular-nums",
                      (tradeStats?.winRate ?? 0) >= 50 ? "text-accent-green" : "text-accent-red"
                    )}
                  >
                    {formatPct(tradeStats?.winRate)}
                  </span>
                }
                sub={`${tradeStats?.wins ?? 0}W / ${tradeStats?.losses ?? 0}L`}
                icon={BarChart2}
                accent="purple"
              />
              {(() => {
                const edgePct = tradeStats?.avgEdge ? tradeStats.avgEdge * 100 : undefined;
                const ep = edgePct !== undefined ? pnlDisplay(edgePct) : null;
                return (
                  <StatCard
                    label="Peak Equity"
                    value={<span className="tabular-nums">{formatUSD(traderState?.peakEquity)}</span>}
                    sub={ep ? `Avg edge: ${ep.text}%` : "Avg edge: —"}
                    icon={TrendingUp}
                    accent="yellow"
                  />
                );
              })()}
            </>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Active Positions */}
        <div className="glass-pane rounded-2xl">
          <div className="flex items-center justify-between px-5 py-4 border-b border-separator">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-accent-blue" />
              <h2 className="text-sm font-semibold text-foreground">Active Positions</h2>
            </div>
            <span className="text-xs text-muted bg-fill px-2 py-0.5 rounded-full">
              {positions.length}
            </span>
          </div>

          {isLoading ? (
            <div className="p-5 space-y-2">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : positions.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-muted">
              No open positions
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-muted border-b border-separator">
                    <th className="text-left px-5 py-2.5">Market ID</th>
                    <th className="text-right px-4 py-2.5">Size</th>
                    <th className="text-right px-4 py-2.5">Entry</th>
                    <th className="text-right px-4 py-2.5">Last</th>
                    <th className="text-right px-5 py-2.5">Unreal. PnL</th>
                  </tr>
                </thead>
                <tbody>
                  {positions.map((pos, i) => {
                    const upnl = pos.unrealized_pnl ?? 0;
                    const p = pnlDisplayUSD(upnl);
                    return (
                      <tr
                        key={pos.token_id ?? i}
                        className="border-b border-separator/40 hover:bg-fill/50 transition-colors"
                      >
                        <td className="px-5 py-3 font-mono text-xs text-foreground">
                          {pos.market_id}
                        </td>
                        <td className="px-4 py-3 text-right text-foreground tabular-nums">
                          {formatNum(pos.size, 1)}
                        </td>
                        <td className="px-4 py-3 text-right text-foreground tabular-nums">
                          ${formatNum(pos.avg_entry_price, 3)}
                        </td>
                        <td className="px-4 py-3 text-right text-muted tabular-nums">
                          {pos.last_price !== null ? `$${formatNum(pos.last_price, 3)}` : "—"}
                        </td>
                        <td className={cn("px-5 py-3 text-right font-medium tabular-nums", p.className)}>
                          {p.text}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Trade Stats Breakdown */}
        <div className="glass-pane rounded-2xl">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-separator">
            <RefreshCw className="w-4 h-4 text-accent-purple" />
            <h2 className="text-sm font-semibold text-foreground">Strategy Breakdown</h2>
          </div>
          {isLoading ? (
            <div className="p-5 space-y-2">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (recentTrades?.length ?? 0) === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-muted">
              No trades synced yet
            </div>
          ) : (
            <div className="p-5 space-y-3">
              {(() => {
                const byStrategy: Record<
                  string,
                  { count: number; buys: number; sells: number; totalValue: number }
                > = {};
                for (const t of recentTrades ?? []) {
                  const s = t.strategy ?? "unknown";
                  if (!byStrategy[s])
                    byStrategy[s] = { count: 0, buys: 0, sells: 0, totalValue: 0 };
                  byStrategy[s].count++;
                  if (t.side === "BUY") byStrategy[s].buys++;
                  else byStrategy[s].sells++;
                  byStrategy[s].totalValue += t.orderValue ?? 0;
                }
                return Object.entries(byStrategy).map(([name, data]) => (
                  <div
                    key={name}
                    className="flex items-center justify-between py-2.5 px-3 bg-fill rounded-lg"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">{name}</p>
                      <p className="text-xs text-muted mt-0.5">
                        {data.buys}B / {data.sells}S · {data.count} trades
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-foreground tabular-nums">
                        {formatUSD(data.totalValue, 0)}
                      </p>
                      <p className="text-xs text-muted">volume</p>
                    </div>
                  </div>
                ));
              })()}
            </div>
          )}
        </div>
      </div>

      {/* Recent Trades */}
      <div className="glass-pane rounded-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-separator">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-accent-green" />
            <h2 className="text-sm font-semibold text-foreground">Recent Trades</h2>
          </div>
          <span className="text-xs text-muted">Last 50</span>
        </div>

        {recentTrades === undefined ? (
          <div className="p-5 space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : recentTrades.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-muted">
            No trades recorded yet
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-muted border-b border-separator">
                  <th className="text-left px-5 py-2.5">Time</th>
                  <th className="text-left px-4 py-2.5">Market</th>
                  <th className="text-center px-3 py-2.5">Side</th>
                  <th className="text-right px-3 py-2.5">Price</th>
                  <th className="text-right px-3 py-2.5">Size</th>
                  <th className="text-right px-3 py-2.5">Value</th>
                  <th className="text-right px-3 py-2.5">Edge</th>
                  <th className="text-left px-3 py-2.5">Strategy</th>
                  <th className="text-right px-5 py-2.5">PnL</th>
                </tr>
              </thead>
              <tbody>
                {(recentTrades ?? []).map((trade) => {
                  const edge = trade.signalEdge ?? 0;
                  const edgeAccent: AccentName =
                    edge >= 0.7 ? "green" : edge >= 0.5 ? "yellow" : "gray";
                  const tradePnl = trade.pnl;
                  const pnlEl =
                    tradePnl !== null && tradePnl !== undefined
                      ? (() => {
                          const p = pnlDisplayUSD(tradePnl);
                          return (
                            <span className={cn("tabular-nums", p.className)}>
                              {p.text}
                            </span>
                          );
                        })()
                      : <span className="text-muted">open</span>;

                  return (
                    <tr
                      key={trade.tradeId}
                      className="border-b border-separator/40 hover:bg-fill/50 transition-colors"
                    >
                      <td className="px-5 py-2.5 text-xs text-muted whitespace-nowrap">
                        {formatTimestamp(trade.timestampUtc)}
                      </td>
                      <td
                        className="px-4 py-2.5 text-xs text-foreground max-w-[200px] truncate"
                        title={trade.marketSlug}
                      >
                        {shortSlug(trade.marketSlug)}
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <Badge color={trade.side === "BUY" ? "green" : "red"}>
                          {trade.side}
                        </Badge>
                      </td>
                      <td className="px-3 py-2.5 text-right text-foreground font-mono text-xs tabular-nums">
                        ${formatNum(trade.price, 3)}
                      </td>
                      <td className="px-3 py-2.5 text-right text-foreground font-mono text-xs tabular-nums">
                        {formatNum(trade.size, 1)}
                      </td>
                      <td className="px-3 py-2.5 text-right text-foreground font-mono text-xs tabular-nums">
                        {formatUSD(trade.orderValue)}
                      </td>
                      <td className={cn("px-3 py-2.5 text-right text-xs font-mono tabular-nums", accentText[edgeAccent])}>
                        {trade.signalEdge !== undefined && trade.signalEdge !== null
                          ? (trade.signalEdge * 100).toFixed(0) + "%"
                          : "—"}
                      </td>
                      <td className="px-3 py-2.5 text-left">
                        <span className="text-xs text-muted bg-fill px-1.5 py-0.5 rounded">
                          {trade.strategy ?? "—"}
                        </span>
                      </td>
                      <td className="px-5 py-2.5 text-right text-xs font-mono font-medium">
                        {pnlEl}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Trader Logs */}
      <div className="glass-pane rounded-2xl">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-separator">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-accent-green" />
            <h2 className="text-sm font-semibold text-foreground">Trader Logs</h2>
            <span className="text-xs text-muted bg-fill px-2 py-0.5 rounded-full">
              {filteredLogs.length}
            </span>
          </div>
          <div className="flex gap-1">
            {(["all", "directional", "spread"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setLogFilter(f)}
                className={cn(
                  "px-2.5 py-1 rounded text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/40",
                  logFilter === f
                    ? "bg-fill text-foreground"
                    : "text-muted hover:text-foreground"
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="h-72 overflow-y-auto font-mono text-xs p-4 space-y-0.5">
          {isLoading ? (
            <div className="space-y-1.5 pt-2">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-4" style={{ width: `${60 + (i % 3) * 15}%` }} />
              ))}
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="flex items-center justify-center h-full text-tertiary">
              No log entries — start the trader daemon to see output here
            </div>
          ) : (
            filteredLogs.map((entry, i) => {
              const levelAccent = LEVEL_ACCENT[entry.level];
              const srcAccent = SOURCE_ACCENT[entry.source];
              return (
                <div key={i} className="flex gap-2 leading-5 hover:bg-fill/50 px-1 rounded">
                  <span className="text-tertiary shrink-0 w-16">
                    {entry.ts?.slice(11, 19) || ""}
                  </span>
                  <span
                    className={cn(
                      "shrink-0 w-12",
                      levelAccent ? accentText[levelAccent] : "text-muted"
                    )}
                  >
                    {entry.level}
                  </span>
                  {entry.source && (
                    <span
                      className={cn(
                        "shrink-0 px-1 rounded text-[10px] leading-5",
                        srcAccent ? accentPill[srcAccent] : "bg-fill text-muted"
                      )}
                    >
                      {entry.source}
                    </span>
                  )}
                  {entry.module && (
                    <span className="text-muted shrink-0">{entry.module}:</span>
                  )}
                  <span
                    className={cn(
                      "break-all",
                      levelAccent ? accentText[levelAccent] : "text-foreground"
                    )}
                  >
                    {entry.message}
                  </span>
                </div>
              );
            })
          )}
          <div ref={logEndRef} />
        </div>
      </div>
    </div>
  );
}
