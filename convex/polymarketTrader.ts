import { query, internalMutation } from "./_generated/server";
import { v } from "convex/values";

// ── Queries ───────────────────────────────────────────────────────────────────

export const getTraderState = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("polymarketTrader").order("desc").first();
  },
});

export const getRecentTrades = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    return await ctx.db
      .query("polymarketTrades")
      .withIndex("by_timestamp")
      .order("desc")
      .take(limit);
  },
});

export const getTradeStats = query({
  args: {},
  handler: async (ctx) => {
    const trades = await ctx.db.query("polymarketTrades").collect();
    const closed = trades.filter(
      (t) => t.pnl !== null && t.pnl !== undefined
    );
    const wins = closed.filter((t) => (t.pnl ?? 0) > 0);
    const losses = closed.filter((t) => (t.pnl ?? 0) < 0);
    const totalPnl = closed.reduce((sum, t) => sum + (t.pnl ?? 0), 0);
    const avgEdge =
      trades.length > 0
        ? trades
            .filter((t) => t.signalEdge !== undefined)
            .reduce((sum, t) => sum + (t.signalEdge ?? 0), 0) /
          trades.filter((t) => t.signalEdge !== undefined).length
        : 0;

    return {
      totalTrades: trades.length,
      closedTrades: closed.length,
      wins: wins.length,
      losses: losses.length,
      winRate: closed.length > 0 ? (wins.length / closed.length) * 100 : 0,
      totalPnl,
      avgEdge,
    };
  },
});

// ── Internal Mutations (called from HTTP endpoint) ────────────────────────────

export const upsertTraderState = internalMutation({
  args: {
    status: v.union(
      v.literal("running"),
      v.literal("stopped"),
      v.literal("error"),
      v.literal("unknown")
    ),
    strategyName: v.optional(v.string()),
    balance: v.optional(v.number()),
    dailyPnl: v.number(),
    dailyResetDate: v.string(),
    totalTradesToday: v.number(),
    peakEquity: v.number(),
    positions: v.array(v.any()),
    logs: v.optional(v.array(v.any())),
    lastRunAt: v.optional(v.string()),
    lastSyncedAt: v.string(),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    const existing = await ctx.db.query("polymarketTrader").first();
    if (existing) {
      await ctx.db.patch(existing._id, { ...args, updatedAt: now });
      return existing._id;
    } else {
      return await ctx.db.insert("polymarketTrader", {
        ...args,
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});

export const upsertTrades = internalMutation({
  args: {
    trades: v.array(
      v.object({
        tradeId: v.string(),
        timestampUtc: v.string(),
        marketId: v.string(),
        tokenId: v.string(),
        marketSlug: v.optional(v.string()),
        side: v.union(v.literal("BUY"), v.literal("SELL")),
        price: v.number(),
        size: v.number(),
        orderValue: v.number(),
        signalSide: v.optional(v.string()),
        signalEdge: v.optional(v.number()),
        signalStrength: v.optional(v.string()),
        strategy: v.optional(v.string()),
        mode: v.optional(v.string()),
        pnl: v.optional(v.number()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    for (const trade of args.trades) {
      const existing = await ctx.db
        .query("polymarketTrades")
        .withIndex("by_trade_id", (q) => q.eq("tradeId", trade.tradeId))
        .first();
      if (!existing) {
        await ctx.db.insert("polymarketTrades", { ...trade, createdAt: now });
      } else if (trade.pnl !== undefined && trade.pnl !== null) {
        await ctx.db.patch(existing._id, { pnl: trade.pnl });
      }
    }
  },
});
