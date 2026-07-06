import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAll } from "./utils";

const CLIENT_STAGES = [
  "lead",
  "qualified",
  "proposal",
  "contract",
  "in-production",
  "delivered",
  "paid",
] as const;

const clientStageValidator = v.union(
  v.literal("lead"),
  v.literal("qualified"),
  v.literal("proposal"),
  v.literal("contract"),
  v.literal("in-production"),
  v.literal("delivered"),
  v.literal("paid")
);

// ── Queries ──────────────────────────────────────────────

export const getAllClients = query({
  args: {},
  handler: async (ctx) => {
    return await getAll(ctx, "clients");
  },
});

export const getClientsByStage = query({
  args: { stage: clientStageValidator },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("clients")
      .withIndex("by_stage", (q) => q.eq("stage", args.stage))
      .collect();
  },
});

export const getPipelineMetrics = query({
  args: {},
  handler: async (ctx) => {
    const all = await getAll(ctx, "clients");
    const byStage = Object.fromEntries(
      CLIENT_STAGES.map((stage) => [stage, { count: 0, value: 0 }])
    ) as Record<(typeof CLIENT_STAGES)[number], { count: number; value: number }>;

    const today = new Date(Date.now()).toISOString().slice(0, 10);
    let followUpNeeded = 0;
    for (const c of all) {
      byStage[c.stage].count += 1;
      byStage[c.stage].value += c.value ?? 0;
      if (c.followUpDate && c.followUpDate.slice(0, 10) <= today) followUpNeeded += 1;
    }

    const totalPipeline = CLIENT_STAGES.filter((s) => s !== "paid").reduce(
      (sum, s) => sum + byStage[s].value,
      0
    );

    return {
      byStage,
      totalPipeline,
      totalWon: byStage.paid.value,
      totalClients: all.length,
      followUpNeeded,
    };
  },
});

// ── Mutations ────────────────────────────────────────────

export const createClient = mutation({
  args: {
    name: v.string(),
    company: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    source: v.optional(v.string()),
    stage: clientStageValidator,
    value: v.optional(v.number()),
    projectType: v.optional(v.string()),
    notes: v.optional(v.string()),
    followUpDate: v.optional(v.string()),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    return await ctx.db.insert("clients", {
      ...args,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateClient = mutation({
  args: {
    id: v.id("clients"),
    name: v.optional(v.string()),
    company: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    source: v.optional(v.string()),
    stage: v.optional(clientStageValidator),
    value: v.optional(v.number()),
    projectType: v.optional(v.string()),
    notes: v.optional(v.string()),
    followUpDate: v.optional(v.string()),
    priority: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"))),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const { id, ...rest } = args;
    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("Client not found");
    await ctx.db.patch(id, {
      ...rest,
      updatedAt: new Date().toISOString(),
    });

    // First transition into "paid" books the deal as revenue, unless revenue
    // was already logged for this client (e.g. manually or a prior win)
    if (rest.stage === "paid" && existing.stage !== "paid") {
      const amount = rest.value ?? existing.value;
      if (amount) {
        const alreadyLogged = await ctx.db
          .query("revenue")
          .withIndex("by_client", (q) => q.eq("clientId", id))
          .first();
        if (!alreadyLogged) {
          await ctx.db.insert("revenue", {
            amount,
            description: `Deal won — ${existing.name}`,
            category: "cadcam-design",
            clientId: id,
            date: new Date(Date.now()).toISOString().slice(0, 10),
            status: "received",
            createdAt: new Date().toISOString(),
          });
        }
      }
    }
  },
});

export const deleteClient = mutation({
  args: { id: v.id("clients") },
  handler: async (ctx, args) => {
    // Detach revenue entries so they don't point at a deleted client
    const linked = await ctx.db
      .query("revenue")
      .withIndex("by_client", (q) => q.eq("clientId", args.id))
      .collect();
    for (const r of linked) {
      await ctx.db.patch(r._id, { clientId: undefined });
    }
    await ctx.db.delete(args.id);
  },
});
