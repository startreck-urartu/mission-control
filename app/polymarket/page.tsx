"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  TrendingUp,
  TrendingDown,
  Activity,
  DollarSign,
  BarChart2,
  RefreshCw,
  Layers,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatUSD(n: number | null | undefined, decimals = 2) {
  if (n === null || n === undefined) return "—";
  const formatted = Math.abs(n).toFixed(decimals);
  return (n < 0 ? "-$" : "$") + formatted;
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

// ── Sub-components ─────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  color,
  valueColor,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  valueColor?: string;
}) {
  return (
    <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-gray-400">{label}</span>
        <div className={cn("p-2 rounded-lg", color)}>
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

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function PolymarketPage() {
  const traderState = useQuery(api.polymarketTrader.getTraderState);
  const recentTrades = useQuery(api.polymarketTrader.getRecentTrades, { limit: 50 });
  const tradeStats = useQuery(api.polymarketTrader.getTradeStats);

  const isLoading =
    traderState === undefined || recentTrades === undefined || tradeStats === undefined;

  const statusColors: Record<string, string> = {
    running: "text-green-400",
    stopped: "text-gray-400",
    error: "text-red-400",
    unknown: "text-yellow-400",
  };

  const statusDot: Record<string, string> = {
    running: "bg-green-500 animate-pulse",
    stopped: "bg-gray-500",
    error: "bg-red-500 animate-pulse",
    unknown: "bg-yellow-500",
  };

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

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Polymarket Trader</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Autonomous prediction market trading system
          </p>
        </div>
        <div className="flex items-center gap-3">
          {traderState && (
            <span className="text-xs text-gray-500">
              Synced {timeAgo(traderState.lastSyncedAt)}
            </span>
          )}
          <div
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border",
              status === "running"
                ? "bg-green-500/10 border-green-500/30 text-green-400"
                : status === "error"
                ? "bg-red-500/10 border-red-500/30 text-red-400"
                : "bg-gray-700 border-gray-600 text-gray-400"
            )}
          >
            <span
              className={cn("w-2 h-2 rounded-full", statusDot[status] ?? "bg-gray-500")}
            />
            {status.charAt(0).toUpperCase() + status.slice(1)}
            {traderState?.strategyName && (
              <span className="text-gray-500">· {traderState.strategyName}</span>
            )}
          </div>
        </div>
      </div>

      {/* No data state */}
      {!isLoading && !traderState && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <AlertCircle className="w-12 h-12 text-gray-600 mb-4" />
          <h3 className="text-lg font-medium text-gray-300">No data yet</h3>
          <p className="text-sm text-gray-500 mt-1 max-w-sm">
            Run the sync script on your trading machine to push state to this dashboard.
          </p>
          <code className="mt-4 text-xs bg-gray-800 px-3 py-2 rounded text-gray-300 font-mono">
            python sync_to_mission_control.py
          </code>
        </div>
      )}

      {/* Stats Cards */}
      {(traderState || isLoading) && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Daily P&L"
            value={isLoading ? "…" : formatUSD(dailyPnl)}
            sub={`Reset: ${traderState?.dailyResetDate ?? "—"}`}
            icon={DollarSign}
            color="bg-green-500/10 text-green-400"
            valueColor={
              isLoading
                ? "text-white"
                : dailyPnl > 0
                ? "text-green-400"
                : dailyPnl < 0
                ? "text-red-400"
                : "text-white"
            }
          />
          <StatCard
            label="Trades Today"
            value={isLoading ? "…" : String(traderState?.totalTradesToday ?? 0)}
            sub={`${tradeStats?.totalTrades ?? 0} total recorded`}
            icon={Activity}
            color="bg-blue-500/10 text-blue-400"
          />
          <StatCard
            label="Win Rate"
            value={isLoading ? "…" : formatPct(tradeStats?.winRate)}
            sub={`${tradeStats?.wins ?? 0}W / ${tradeStats?.losses ?? 0}L`}
            icon={BarChart2}
            color="bg-purple-500/10 text-purple-400"
            valueColor={
              (tradeStats?.winRate ?? 0) >= 50 ? "text-green-400" : "text-red-400"
            }
          />
          <StatCard
            label="Peak Equity"
            value={isLoading ? "…" : formatUSD(traderState?.peakEquity)}
            sub={`Avg edge: ${formatPct(
              tradeStats?.avgEdge ? tradeStats.avgEdge * 100 : undefined
            )}`}
            icon={TrendingUp}
            color="bg-yellow-500/10 text-yellow-400"
          />
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Active Positions */}
        <div className="bg-gray-800 rounded-xl border border-gray-700">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-400" />
              <h2 className="text-sm font-semibold text-white">Active Positions</h2>
            </div>
            <span className="text-xs text-gray-500 bg-gray-700 px-2 py-0.5 rounded-full">
              {positions.length}
            </span>
          </div>

          {isLoading ? (
            <div className="p-5 space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-10 bg-gray-700 rounded animate-pulse" />
              ))}
            </div>
          ) : positions.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-gray-500">
              No open positions
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-500 border-b border-gray-700">
                    <th className="text-left px-5 py-2.5">Market ID</th>
                    <th className="text-right px-4 py-2.5">Size</th>
                    <th className="text-right px-4 py-2.5">Entry</th>
                    <th className="text-right px-4 py-2.5">Last</th>
                    <th className="text-right px-5 py-2.5">Unreal. PnL</th>
                  </tr>
                </thead>
                <tbody>
                  {positions.map((pos, i) => (
                    <tr
                      key={pos.token_id ?? i}
                      className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors"
                    >
                      <td className="px-5 py-3 font-mono text-xs text-gray-300">
                        {pos.market_id}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-300">
                        {formatNum(pos.size, 1)}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-300">
                        ${formatNum(pos.avg_entry_price, 3)}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-400">
                        {pos.last_price !== null ? `$${formatNum(pos.last_price, 3)}` : "—"}
                      </td>
                      <td
                        className={cn(
                          "px-5 py-3 text-right font-medium",
                          (pos.unrealized_pnl ?? 0) > 0
                            ? "text-green-400"
                            : (pos.unrealized_pnl ?? 0) < 0
                            ? "text-red-400"
                            : "text-gray-400"
                        )}
                      >
                        {formatUSD(pos.unrealized_pnl)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Trade Stats Breakdown */}
        <div className="bg-gray-800 rounded-xl border border-gray-700">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-700">
            <RefreshCw className="w-4 h-4 text-purple-400" />
            <h2 className="text-sm font-semibold text-white">Strategy Breakdown</h2>
          </div>
          {isLoading ? (
            <div className="p-5 space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-10 bg-gray-700 rounded animate-pulse" />
              ))}
            </div>
          ) : (recentTrades?.length ?? 0) === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-gray-500">
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
                    className="flex items-center justify-between py-2.5 px-3 bg-gray-700/40 rounded-lg"
                  >
                    <div>
                      <p className="text-sm font-medium text-white">{name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {data.buys}B / {data.sells}S · {data.count} trades
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-200">
                        {formatUSD(data.totalValue, 0)}
                      </p>
                      <p className="text-xs text-gray-500">volume</p>
                    </div>
                  </div>
                ));
              })()}
            </div>
          )}
        </div>
      </div>

      {/* Recent Trades */}
      <div className="bg-gray-800 rounded-xl border border-gray-700">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-green-400" />
            <h2 className="text-sm font-semibold text-white">Recent Trades</h2>
          </div>
          <span className="text-xs text-gray-500">Last 50</span>
        </div>

        {isLoading ? (
          <div className="p-5 space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-10 bg-gray-700 rounded animate-pulse" />
            ))}
          </div>
        ) : (recentTrades?.length ?? 0) === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-gray-500">
            No trades recorded yet
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-500 border-b border-gray-700">
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
                {(recentTrades ?? []).map((trade) => (
                  <tr
                    key={trade.tradeId}
                    className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors"
                  >
                    <td className="px-5 py-2.5 text-xs text-gray-400 whitespace-nowrap">
                      {formatTimestamp(trade.timestampUtc)}
                    </td>
                    <td
                      className="px-4 py-2.5 text-xs text-gray-300 max-w-[200px] truncate"
                      title={trade.marketSlug}
                    >
                      {shortSlug(trade.marketSlug)}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <span
                        className={cn(
                          "inline-block px-1.5 py-0.5 rounded text-xs font-semibold",
                          trade.side === "BUY"
                            ? "bg-green-500/15 text-green-400"
                            : "bg-red-500/15 text-red-400"
                        )}
                      >
                        {trade.side}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-right text-gray-300 font-mono text-xs">
                      ${formatNum(trade.price, 3)}
                    </td>
                    <td className="px-3 py-2.5 text-right text-gray-300 font-mono text-xs">
                      {formatNum(trade.size, 1)}
                    </td>
                    <td className="px-3 py-2.5 text-right text-gray-300 font-mono text-xs">
                      {formatUSD(trade.orderValue)}
                    </td>
                    <td
                      className={cn(
                        "px-3 py-2.5 text-right text-xs font-mono",
                        (trade.signalEdge ?? 0) >= 0.7
                          ? "text-green-400"
                          : (trade.signalEdge ?? 0) >= 0.5
                          ? "text-yellow-400"
                          : "text-gray-400"
                      )}
                    >
                      {trade.signalEdge !== undefined && trade.signalEdge !== null
                        ? (trade.signalEdge * 100).toFixed(0) + "%"
                        : "—"}
                    </td>
                    <td className="px-3 py-2.5 text-left">
                      <span className="text-xs text-gray-500 bg-gray-700/50 px-1.5 py-0.5 rounded">
                        {trade.strategy ?? "—"}
                      </span>
                    </td>
                    <td
                      className={cn(
                        "px-5 py-2.5 text-right text-xs font-mono font-medium",
                        trade.pnl === null || trade.pnl === undefined
                          ? "text-gray-500"
                          : trade.pnl > 0
                          ? "text-green-400"
                          : trade.pnl < 0
                          ? "text-red-400"
                          : "text-gray-400"
                      )}
                    >
                      {trade.pnl !== null && trade.pnl !== undefined
                        ? formatUSD(trade.pnl)
                        : "open"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
