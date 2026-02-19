import { v } from "convex/values";
import { query, mutation, internalMutation } from "./_generated/server";
import { getAll, getFirstOrNull } from "./utils";

// Queries
export const getAllTasks = query({
  args: {},
  handler: async (ctx) => {
    return await getAll(ctx, "tasks");
  },
});

export const getTasksByStatus = query({
  args: { status: v.union(
    v.literal("todo"),
    v.literal("in-progress"),
    v.literal("review"),
    v.literal("done")
  ) },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("tasks")
      .withIndex("by_status", (q) => q.eq("status", args.status))
      .collect();
  },
});

export const getTasksByAssignee = query({
  args: { assignee: v.union(v.literal("human"), v.literal("openclaw")) },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("tasks")
      .withIndex("by_assignee", (q) => q.eq("assignee", args.assignee))
      .collect();
  },
});

export const getTaskById = query({
  args: { id: v.id("tasks") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Mutations
export const createTask = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    status: v.union(
      v.literal("todo"),
      v.literal("in-progress"),
      v.literal("review"),
      v.literal("done")
    ),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    assignee: v.union(v.literal("human"), v.literal("openclaw")),
    tags: v.optional(v.array(v.string())),
    dueDate: v.optional(v.string()),
    parentId: v.optional(v.id("tasks")),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    const taskId = await ctx.db.insert("tasks", {
      ...args,
      createdAt: now,
      updatedAt: now,
    });

    // Log activity
    await ctx.db.insert("activity", {
      type: "task_created",
      message: `Task "${args.title}" created and assigned to ${args.assignee}`,
      entityId: taskId,
      entityType: "task",
      metadata: { priority: args.priority, status: args.status },
      createdAt: now,
    });

    return taskId;
  },
});

export const updateTask = mutation({
  args: {
    id: v.id("tasks"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    status: v.optional(v.union(
      v.literal("todo"),
      v.literal("in-progress"),
      v.literal("review"),
      v.literal("done")
    )),
    priority: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"))),
    assignee: v.optional(v.union(v.literal("human"), v.literal("openclaw"))),
    tags: v.optional(v.array(v.string())),
    dueDate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const task = await ctx.db.get(id);
    if (!task) throw new Error("Task not found");

    const now = new Date().toISOString();
    await ctx.db.patch(id, {
      ...updates,
      updatedAt: now,
    });

    // Log activity if status changed
    if (updates.status && updates.status !== task.status) {
      await ctx.db.insert("activity", {
        type: "task_status_changed",
        message: `Task "${task.title}" moved from ${task.status} to ${updates.status}`,
        entityId: id,
        entityType: "task",
        metadata: { oldStatus: task.status, newStatus: updates.status },
        createdAt: now,
      });
    }

    return id;
  },
});

export const deleteTask = mutation({
  args: { id: v.id("tasks") },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.id);
    if (!task) throw new Error("Task not found");

    await ctx.db.delete(args.id);

    // Log activity
    await ctx.db.insert("activity", {
      type: "task_deleted",
      message: `Task "${task.title}" deleted`,
      entityId: args.id,
      entityType: "task",
      createdAt: new Date().toISOString(),
    });

    return args.id;
  },
});

export const moveTask = mutation({
  args: {
    id: v.id("tasks"),
    status: v.union(
      v.literal("todo"),
      v.literal("in-progress"),
      v.literal("review"),
      v.literal("done")
    ),
  },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.id);
    if (!task) throw new Error("Task not found");

    const now = new Date().toISOString();
    await ctx.db.patch(args.id, {
      status: args.status,
      updatedAt: now,
    });

    // Log activity
    await ctx.db.insert("activity", {
      type: "task_moved",
      message: `Task "${task.title}" moved to ${args.status}`,
      entityId: args.id,
      entityType: "task",
      metadata: { status: args.status },
      createdAt: now,
    });

    return args.id;
  },
});

// Internal mutation for OpenClaw integration
export const upsertTaskFromOpenClaw = internalMutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    status: v.string(),
    priority: v.string(),
    assignee: v.string(),
    tags: v.optional(v.array(v.string())),
    dueDate: v.optional(v.string()),
    externalId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    
    // Try to find existing task by externalId or title
    const existing = await ctx.db
      .query("tasks")
      .filter((q) => q.eq(q.field("title"), args.title))
      .first();

    const taskData = {
      title: args.title,
      description: args.description,
      status: args.status as any,
      priority: args.priority as any,
      assignee: args.assignee as any,
      tags: args.tags || [],
      dueDate: args.dueDate,
      updatedAt: now,
    };

    if (existing) {
      await ctx.db.patch(existing._id, taskData);
      return existing._id;
    } else {
      return await ctx.db.insert("tasks", {
        ...taskData,
        createdAt: now,
      });
    }
  },
});
