import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Get all LLM usage stats
export const getAllLLMUsage = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("llmUsage").order("desc").collect();
  },
});

// Get LLM usage by model
export const getLLMUsageByModel = query({
  args: { model: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("llmUsage")
      .withIndex("by_model", (q) => q.eq("model", args.model))
      .first();
  },
});

// Get active models only
export const getActiveModels = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("llmUsage")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();
  },
});

// Get total spending across all models
export const getTotalSpending = query({
  args: {},
  handler: async (ctx) => {
    const allModels = await ctx.db.query("llmUsage").collect();
    return {
      totalCost: allModels.reduce((sum, m) => sum + m.totalCost, 0),
      totalInputTokens: allModels.reduce((sum, m) => sum + m.inputTokensUsed, 0),
      totalOutputTokens: allModels.reduce((sum, m) => sum + m.outputTokensUsed, 0),
      totalRequests: allModels.reduce((sum, m) => sum + m.requestsCount, 0),
      modelCount: allModels.length,
    };
  },
});

// Create LLM model entry
export const createLLMModel = mutation({
  args: {
    model: v.string(),
    provider: v.string(),
    costPerInputToken: v.number(),
    costPerOutputToken: v.number(),
    budgetLimit: v.optional(v.number()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    
    // Check if model already exists
    const existing = await ctx.db
      .query("llmUsage")
      .withIndex("by_model", (q) => q.eq("model", args.model))
      .first();
    
    if (existing) {
      throw new Error(`Model ${args.model} already exists`);
    }

    return await ctx.db.insert("llmUsage", {
      ...args,
      inputTokensUsed: 0,
      outputTokensUsed: 0,
      totalCost: 0,
      requestsCount: 0,
      lastUsed: now,
      status: "active",
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Update LLM model (costs, budget, etc)
export const updateLLMModel = mutation({
  args: {
    id: v.id("llmUsage"),
    costPerInputToken: v.optional(v.number()),
    costPerOutputToken: v.optional(v.number()),
    budgetLimit: v.optional(v.number()),
    status: v.optional(v.union(v.literal("active"), v.literal("paused"), v.literal("deprecated"))),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const now = new Date().toISOString();
    
    await ctx.db.patch(id, {
      ...updates,
      updatedAt: now,
    });
    
    return id;
  },
});

// Record usage (called by agents when making LLM calls)
export const recordUsage = mutation({
  args: {
    model: v.string(),
    inputTokens: v.number(),
    outputTokens: v.number(),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    
    const model = await ctx.db
      .query("llmUsage")
      .withIndex("by_model", (q) => q.eq("model", args.model))
      .first();
    
    if (!model) {
      throw new Error(`Model ${args.model} not found`);
    }

    const inputCost = (args.inputTokens / 1000) * model.costPerInputToken;
    const outputCost = (args.outputTokens / 1000) * model.costPerOutputToken;
    const totalCost = inputCost + outputCost;

    await ctx.db.patch(model._id, {
      inputTokensUsed: model.inputTokensUsed + args.inputTokens,
      outputTokensUsed: model.outputTokensUsed + args.outputTokens,
      totalCost: model.totalCost + totalCost,
      requestsCount: model.requestsCount + 1,
      lastUsed: now,
      updatedAt: now,
    });

    return {
      cost: totalCost,
      newTotal: model.totalCost + totalCost,
    };
  },
});

// Delete LLM model
export const deleteLLMModel = mutation({
  args: { id: v.id("llmUsage") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return args.id;
  },
});