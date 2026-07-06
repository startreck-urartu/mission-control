import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAll } from "./utils";

const goalCategoryValidator = v.union(
  v.literal("profit"),
  v.literal("revenue"),
  v.literal("clients"),
  v.literal("trading"),
  v.literal("custom")
);

// ── Queries ──────────────────────────────────────────────

export const getAllGoals = query({
  args: {},
  handler: async (ctx) => {
    return await getAll(ctx, "goals");
  },
});

export const getActiveGoals = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("goals")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();
  },
});

export const getGoalProgress = query({
  args: {},
  handler: async (ctx) => {
    const activeGoals = await ctx.db
      .query("goals")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();

    return await Promise.all(
      activeGoals.map(async (goal) => {
        // Revenue goals track received revenue in their date range automatically;
        // other categories keep the manually maintained currentAmount
        let currentAmount = goal.currentAmount;
        if (goal.category === "revenue") {
          const items = await ctx.db
            .query("revenue")
            .withIndex("by_date", (q) =>
              q.gte("date", goal.startDate).lte("date", goal.endDate)
            )
            .collect();
          currentAmount = items
            .filter((r) => r.status === "received")
            .reduce((sum, r) => sum + r.amount, 0);
        }

        const pct = goal.targetAmount > 0
          ? Math.min(100, Math.round((currentAmount / goal.targetAmount) * 100))
          : 0;
        const daysLeft = Math.max(
          0,
          Math.ceil(
            (new Date(goal.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
          )
        );
        return { ...goal, currentAmount, progressPct: pct, daysLeft };
      })
    );
  },
});

// ── Mutations ────────────────────────────────────────────

export const createGoal = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    targetAmount: v.number(),
    currentAmount: v.optional(v.number()),
    currency: v.optional(v.string()),
    startDate: v.string(),
    endDate: v.string(),
    category: goalCategoryValidator,
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    return await ctx.db.insert("goals", {
      ...args,
      currentAmount: args.currentAmount ?? 0,
      isActive: args.isActive ?? true,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateGoal = mutation({
  args: {
    id: v.id("goals"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    targetAmount: v.optional(v.number()),
    currentAmount: v.optional(v.number()),
    currency: v.optional(v.string()),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
    category: v.optional(goalCategoryValidator),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...rest } = args;
    await ctx.db.patch(id, {
      ...rest,
      updatedAt: new Date().toISOString(),
    });
  },
});

export const deleteGoal = mutation({
  args: { id: v.id("goals") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const addToGoal = mutation({
  args: {
    id: v.id("goals"),
    amount: v.number(),
  },
  handler: async (ctx, args) => {
    const goal = await ctx.db.get(args.id);
    if (!goal) throw new Error("Goal not found");
    await ctx.db.patch(args.id, {
      currentAmount: (goal.currentAmount ?? 0) + args.amount,
      updatedAt: new Date().toISOString(),
    });
  },
});
