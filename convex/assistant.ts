import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const listThreads = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("assistantThreads")
      .withIndex("by_updated")
      .order("desc")
      .collect();
  },
});

export const getMessages = query({
  args: { threadId: v.id("assistantThreads") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("assistantMessages")
      .withIndex("by_thread", (q) => q.eq("threadId", args.threadId))
      .collect();
  },
});

export const createThread = mutation({
  args: { title: v.string() },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    return await ctx.db.insert("assistantThreads", {
      title: args.title,
      createdAt: now,
      updatedAt: now,
    });
  },
});

const citationValidator = v.object({
  lessonTitle: v.string(),
  software: v.string(),
  startTs: v.number(),
  videoPath: v.optional(v.string()),
  score: v.number(),
  snippet: v.string(),
});

export const addMessage = mutation({
  args: {
    threadId: v.id("assistantThreads"),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
    citations: v.optional(v.array(citationValidator)),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    const messageId = await ctx.db.insert("assistantMessages", {
      threadId: args.threadId,
      role: args.role,
      content: args.content,
      citations: args.citations,
      createdAt: now,
    });
    await ctx.db.patch(args.threadId, { updatedAt: now });
    return messageId;
  },
});
