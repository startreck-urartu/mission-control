import { v } from "convex/values";
import { query, mutation, internalMutation } from "./_generated/server";
import { Doc } from "./_generated/dataModel";

// Queries
export const getAllContent = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("content").order("desc").take(100);
  },
});

export const getContentByStage = query({
  args: { stage: v.union(
    v.literal("idea"),
    v.literal("script"),
    v.literal("thumbnail"),
    v.literal("filming"),
    v.literal("editing"),
    v.literal("published")
  )},  handler: async (ctx, args) => {
    return await ctx.db
      .query("content")
      .withIndex("by_stage", (q) => q.eq("stage", args.stage))
      .collect();
  },
});

export const getContentById = query({
  args: { id: v.id("content") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Mutations
export const createContent = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    stage: v.union(
      v.literal("idea"),
      v.literal("script"),
      v.literal("thumbnail"),
      v.literal("filming"),
      v.literal("editing"),
      v.literal("published")
    ),
    contentType: v.union(
      v.literal("video"),
      v.literal("blog"),
      v.literal("social"),
      v.literal("podcast")
    ),
    platform: v.optional(v.string()),
    scriptContent: v.optional(v.string()),
    assignedTo: v.union(v.literal("human"), v.literal("openclaw")),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    const contentId = await ctx.db.insert("content", {
      ...args,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("activity", {
      type: "content_created",
      message: `Content "${args.title}" added to pipeline`,
      entityId: contentId,
      entityType: "content",
      metadata: { stage: args.stage, contentType: args.contentType },
      createdAt: now,
    });

    return contentId;
  },
});

export const updateContent = mutation({
  args: {
    id: v.id("content"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    stage: v.optional(v.union(
      v.literal("idea"),
      v.literal("script"),
      v.literal("thumbnail"),
      v.literal("filming"),
      v.literal("editing"),
      v.literal("published")
    )),
    contentType: v.optional(v.union(
      v.literal("video"),
      v.literal("blog"),
      v.literal("social"),
      v.literal("podcast")
    )),
    platform: v.optional(v.string()),
    scriptContent: v.optional(v.string()),
    thumbnailUrl: v.optional(v.string()),
    videoUrl: v.optional(v.string()),
    publishDate: v.optional(v.string()),
    assignedTo: v.optional(v.union(v.literal("human"), v.literal("openclaw"))),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const content = await ctx.db.get(id);
    if (!content) throw new Error("Content not found");

    const now = new Date().toISOString();
    await ctx.db.patch(id, {
      ...updates,
      updatedAt: now,
    });

    if (updates.stage && updates.stage !== content.stage) {
      await ctx.db.insert("activity", {
        type: "content_stage_changed",
        message: `"${content.title}" moved from ${content.stage} to ${updates.stage}`,
        entityId: id,
        entityType: "content",
        metadata: { oldStage: content.stage, newStage: updates.stage },
        createdAt: now,
      });
    }

    return id;
  },
});

export const advanceStage = mutation({
  args: { id: v.id("content") },
  handler: async (ctx, args) => {
    const content = await ctx.db.get(args.id);
    if (!content) throw new Error("Content not found");

    const stages = ["idea", "script", "thumbnail", "filming", "editing", "published"];
    const currentIndex = stages.indexOf(content.stage);
    const nextStage = stages[currentIndex + 1] as typeof content.stage;

    if (!nextStage) throw new Error("Already at final stage");

    const now = new Date().toISOString();
    await ctx.db.patch(args.id, {
      stage: nextStage,
      updatedAt: now,
    });

    await ctx.db.insert("activity", {
      type: "content_advanced",
      message: `"${content.title}" advanced to ${nextStage}`,
      entityId: args.id,
      entityType: "content",
      metadata: { stage: nextStage },
      createdAt: now,
    });

    return { success: true, newStage: nextStage };
  },
});

export const deleteContent = mutation({
  args: { id: v.id("content") },
  handler: async (ctx, args) => {
    const content = await ctx.db.get(args.id);
    if (!content) throw new Error("Content not found");

    await ctx.db.delete(args.id);

    await ctx.db.insert("activity", {
      type: "content_deleted",
      message: `Content "${content.title}" removed from pipeline`,
      entityId: args.id,
      entityType: "content",
      createdAt: new Date().toISOString(),
    });

    return args.id;
  },
});

// Internal mutation for OpenClaw integration
export const upsertContentFromOpenClaw = internalMutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    stage: v.string(),
    contentType: v.string(),
    platform: v.optional(v.string()),
    scriptContent: v.optional(v.string()),
    assignedTo: v.string(),
    tags: v.optional(v.array(v.string())),
    externalId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    
    const existing = await ctx.db
      .query("content")
      .filter((q) => q.eq(q.field("title"), args.title))
      .first();

    const contentData = {
      title: args.title,
      description: args.description,
      stage: args.stage as Doc<"content">["stage"],
      contentType: args.contentType as Doc<"content">["contentType"],
      platform: args.platform,
      scriptContent: args.scriptContent,
      assignedTo: args.assignedTo as Doc<"content">["assignedTo"],
      tags: args.tags || [],
      updatedAt: now,
    };

    if (existing) {
      await ctx.db.patch(existing._id, contentData);
      return existing._id;
    } else {
      return await ctx.db.insert("content", {
        ...contentData,
        createdAt: now,
      });
    }
  },
});

// Internal mutation for seeding
export const insertContent = internalMutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    stage: v.union(
      v.literal("idea"),
      v.literal("script"),
      v.literal("thumbnail"),
      v.literal("filming"),
      v.literal("editing"),
      v.literal("published")
    ),
    contentType: v.union(
      v.literal("video"),
      v.literal("blog"),
      v.literal("social"),
      v.literal("podcast")
    ),
    platform: v.optional(v.string()),
    scriptContent: v.optional(v.string()),
    thumbnailUrl: v.optional(v.string()),
    videoUrl: v.optional(v.string()),
    publishDate: v.optional(v.string()),
    assignedTo: v.union(v.literal("human"), v.literal("openclaw")),
    tags: v.optional(v.array(v.string())),
    createdAt: v.string(),
    updatedAt: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("content", args);
  },
});
