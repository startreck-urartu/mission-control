import { query } from "./_generated/server";
import { v } from "convex/values";

export const getRecentActivity = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("activity")
      .order("desc", "createdAt")
      .take(args.limit || 50);
  },
});

export const getActivityByType = query({
  args: { type: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("activity")
      .filter((q) => q.eq(q.field("type"), args.type))
      .order("desc", "createdAt")
      .take(50);
  },
});
