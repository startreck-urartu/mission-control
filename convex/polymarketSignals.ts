import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

const DEDUP_WINDOW_SECONDS = 72 * 3600;

const directionValidator = v.union(
  v.literal("long_basket"),
  v.literal("short_basket"),
);

const statusValidator = v.union(
  v.literal("pending"),
  v.literal("claimed"),
  v.literal("executed"),
  v.literal("paper-filled"),
  v.literal("expired"),
  v.literal("rejected"),
);

const legValidator = v.object({
  conditionId: v.string(),
  tokenYes: v.optional(v.string()),
  tokenNo: v.optional(v.string()),
  question: v.optional(v.string()),
  yesPrice: v.number(),
});

export const enqueueSignal = mutation({
  args: {
    strategy: v.string(),
    mode: v.union(v.literal("paper"), v.literal("live")),
    eventId: v.string(),
    eventSlug: v.optional(v.string()),
    eventTitle: v.optional(v.string()),
    eventVolume: v.number(),
    endTs: v.optional(v.number()),
    scanTs: v.number(),
    sumYesProb: v.number(),
    absDeviationBps: v.number(),
    direction: directionValidator,
    nLegs: v.number(),
    totalLegs: v.number(),
    observationCompleteness: v.number(),
    legs: v.array(legValidator),
  },
  handler: async (ctx, args) => {
    const cutoff = args.scanTs - DEDUP_WINDOW_SECONDS;
    const recent = await ctx.db
      .query("polymarketSignals")
      .withIndex("by_event_direction", (q) =>
        q.eq("eventId", args.eventId).eq("direction", args.direction),
      )
      .collect();

    const duplicate = recent.find(
      (s) => s.scanTs >= cutoff && s.status !== "rejected" && s.status !== "expired",
    );
    if (duplicate) {
      return { id: duplicate._id, created: false, reason: "dedup-window" };
    }

    const now = new Date().toISOString();
    const id = await ctx.db.insert("polymarketSignals", {
      ...args,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("activity", {
      type: "polymarket_signal_enqueued",
      message: `POLY-DELTA ${args.direction} signal: ${args.eventTitle ?? args.eventId} (${(args.absDeviationBps / 100).toFixed(1)}% dev, ${args.nLegs}/${args.totalLegs} legs)`,
      entityId: id,
      entityType: "polymarketSignal",
      metadata: {
        strategy: args.strategy,
        mode: args.mode,
        direction: args.direction,
        absDeviationBps: args.absDeviationBps,
        eventVolume: args.eventVolume,
      },
      createdAt: now,
    });

    return { id, created: true };
  },
});

export const claimSignal = mutation({
  args: {
    id: v.id("polymarketSignals"),
    claimedBy: v.string(),
  },
  handler: async (ctx, args) => {
    const sig = await ctx.db.get(args.id);
    if (!sig) return { claimed: false, reason: "not-found" };
    if (sig.status !== "pending") {
      return { claimed: false, reason: `status=${sig.status}` };
    }
    const now = new Date().toISOString();
    await ctx.db.patch(args.id, {
      status: "claimed",
      claimedBy: args.claimedBy,
      claimedAt: now,
      updatedAt: now,
    });
    return { claimed: true };
  },
});

export const updateSignalStatus = mutation({
  args: {
    id: v.id("polymarketSignals"),
    status: statusValidator,
    rejectReason: v.optional(v.string()),
    paperPnlBps: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const sig = await ctx.db.get(args.id);
    if (!sig) return { updated: false };
    const now = new Date().toISOString();
    const patch: Record<string, unknown> = {
      status: args.status,
      updatedAt: now,
    };
    if (args.rejectReason !== undefined) patch.rejectReason = args.rejectReason;
    if (args.paperPnlBps !== undefined) patch.paperPnlBps = args.paperPnlBps;
    if (args.status === "paper-filled") patch.paperFilledAt = now;
    await ctx.db.patch(args.id, patch);
    return { updated: true };
  },
});

export const getPendingSignals = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    return await ctx.db
      .query("polymarketSignals")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .order("desc")
      .take(limit);
  },
});

export const getRecentSignals = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 100;
    return await ctx.db
      .query("polymarketSignals")
      .withIndex("by_created")
      .order("desc")
      .take(limit);
  },
});

export const getSignalsReadyForFill = query({
  args: {
    nowTs: v.number(),
    holdSeconds: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const holdSeconds = args.holdSeconds ?? 72 * 3600;
    const limit = args.limit ?? 200;
    const pending = await ctx.db
      .query("polymarketSignals")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .take(limit);
    return pending.filter((s) => {
      const horizonReached = s.scanTs + holdSeconds <= args.nowTs;
      const eventResolved = s.endTs !== undefined && s.endTs !== null && s.endTs <= args.nowTs;
      return horizonReached || eventResolved;
    });
  },
});

export const getSignalsByStrategy = query({
  args: {
    strategy: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 100;
    return await ctx.db
      .query("polymarketSignals")
      .withIndex("by_strategy", (q) => q.eq("strategy", args.strategy))
      .order("desc")
      .take(limit);
  },
});
