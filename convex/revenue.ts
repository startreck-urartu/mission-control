import { v } from "convex/values";
import { query, mutation, QueryCtx } from "./_generated/server";
import { getAll } from "./utils";

const revenueCategoryValidator = v.union(
  v.literal("cadcam-design"),
  v.literal("3dgoldsmith"),
  v.literal("trading"),
  v.literal("consulting"),
  v.literal("other")
);

async function aggregateByPeriod(ctx: QueryCtx, startDate: string, endDate: string) {
  const items = await ctx.db
    .query("revenue")
    .withIndex("by_date", (q) => q.gte("date", startDate).lte("date", endDate))
    .collect();

  const byCategory: Record<string, { amount: number; count: number }> = {};
  let total = 0;
  let pending = 0;
  let received = 0;
  for (const r of items) {
    if (!byCategory[r.category]) byCategory[r.category] = { amount: 0, count: 0 };
    byCategory[r.category].amount += r.amount;
    byCategory[r.category].count += 1;
    total += r.amount;
    if (r.status === "pending") pending += r.amount;
    else received += r.amount;
  }

  return { items, byCategory, total, pending, received };
}

// ── Queries ──────────────────────────────────────────────

export const getAllRevenue = query({
  args: {},
  handler: async (ctx) => {
    return await getAll(ctx, "revenue");
  },
});

export const getRevenueByPeriod = query({
  args: {
    startDate: v.string(),
    endDate: v.string(),
  },
  handler: async (ctx, args) => {
    return await aggregateByPeriod(ctx, args.startDate, args.endDate);
  },
});

export const getCurrentMonthRevenue = query({
  args: {},
  handler: async (ctx) => {
    const now = new Date(Date.now());
    const year = now.getUTCFullYear();
    const month = now.getUTCMonth();
    const prefix = `${year}-${String(month + 1).padStart(2, "0")}`;
    const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    return await aggregateByPeriod(ctx, `${prefix}-01`, `${prefix}-${lastDay}`);
  },
});

// ── Mutations ────────────────────────────────────────────

export const createRevenue = mutation({
  args: {
    amount: v.number(),
    currency: v.optional(v.string()),
    description: v.string(),
    category: revenueCategoryValidator,
    clientId: v.optional(v.id("clients")),
    date: v.string(),
    status: v.union(v.literal("pending"), v.literal("received")),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    return await ctx.db.insert("revenue", {
      ...args,
      createdAt: now,
    });
  },
});

export const updateRevenue = mutation({
  args: {
    id: v.id("revenue"),
    amount: v.optional(v.number()),
    currency: v.optional(v.string()),
    description: v.optional(v.string()),
    category: v.optional(revenueCategoryValidator),
    clientId: v.optional(v.id("clients")),
    date: v.optional(v.string()),
    status: v.optional(v.union(v.literal("pending"), v.literal("received"))),
  },
  handler: async (ctx, args) => {
    const { id, ...rest } = args;
    await ctx.db.patch(id, rest);
  },
});

export const deleteRevenue = mutation({
  args: { id: v.id("revenue") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
