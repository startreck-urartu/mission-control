import { v } from "convex/values";
import { query, mutation, internalMutation } from "./_generated/server";

// Queries
export const getAllMemories = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("memories").order("desc", "createdAt").take(100);
  },
});

export const searchMemories = query({
  args: {
    query: v.string(),
    type: v.optional(v.union(
      v.literal("conversation"),
      v.literal("task"),
      v.literal("decision"),
      v.literal("insight"),
      v.literal("note")
    )),
    importance: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"))),
  },
  handler: async (ctx, args) => {
    // Search using Convex's full-text search
    const results = await ctx.db
      .query("memories")
      .withSearchIndex("search_content", (q) =>
        q.search("content", args.query).eq("type", args.type || "conversation")
      )
      .take(50);

    return results;
  },
});

export const getMemoriesByType = query({
  args: { 
    type: v.union(
      v.literal("conversation"),
      v.literal("task"),
      v.literal("decision"),
      v.literal("insight"),
      v.literal("note")
    ) 
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("memories")
      .withIndex("by_type", (q) => q.eq("type", args.type))
      .order("desc", "createdAt")
      .take(50);
  },
});

export const getMemoryById = query({
  args: { id: v.id("memories") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getRecentMemories = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("memories")
      .order("desc", "createdAt")
      .take(args.limit || 20);
  },
});

// Mutations
export const createMemory = mutation({
  args: {
    title: v.string(),
    content: v.string(),
    type: v.union(
      v.literal("conversation"),
      v.literal("task"),
      v.literal("decision"),
      v.literal("insight"),
      v.literal("note")
    ),
    tags: v.array(v.string()),
    source: v.optional(v.string()),
    importance: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    metadata: v.optional(v.record(v.string(), v.any())),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    const memoryId = await ctx.db.insert("memories", {
      ...args,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("activity", {
      type: "memory_created",
      message: `Memory "${args.title}" archived`,
      entityId: memoryId,
      entityType: "memory",
      metadata: { importance: args.importance, type: args.type },
      createdAt: now,
    });

    return memoryId;
  },
});

export const updateMemory = mutation({
  args: {
    id: v.id("memories"),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    importance: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"))),
    metadata: v.optional(v.record(v.string(), v.any())),
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

export const deleteMemory = mutation({
  args: { id: v.id("memories") },
  handler: async (ctx, args) => {
    const memory = await ctx.db.get(args.id);
    if (!memory) throw new Error("Memory not found");

    await ctx.db.delete(args.id);

    await ctx.db.insert("activity", {
      type: "memory_deleted",
      message: `Memory "${memory.title}" removed`,
      entityId: args.id,
      entityType: "memory",
      createdAt: new Date().toISOString(),
    });

    return args.id;
  },
});

// Internal mutation for OpenClaw integration
export const addConversationFromOpenClaw = internalMutation({
  args: {
    title: v.string(),
    content: v.string(),
    tags: v.optional(v.array(v.string())),
    source: v.optional(v.string()),
    importance: v.optional(v.string()),
    metadata: v.optional(v.record(v.string(), v.any())),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    
    return await ctx.db.insert("memories", {
      title: args.title,
      content: args.content,
      type: "conversation",
      tags: args.tags || ["openclaw"],
      source: args.source || "OpenClaw",
      importance: (args.importance || "medium") as any,
      metadata: args.metadata,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Internal mutation for seeding
export const insertMemory = internalMutation({
  args: {
    title: v.string(),
    content: v.string(),
    type: v.union(
      v.literal("conversation"),
      v.literal("task"),
      v.literal("decision"),
      v.literal("insight"),
      v.literal("note")
    ),
    tags: v.array(v.string()),
    source: v.optional(v.string()),
    importance: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    createdAt: v.string(),
    updatedAt: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("memories", args);
  },
});
