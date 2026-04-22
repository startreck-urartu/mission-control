import { v } from "convex/values";
import { query, mutation, internalMutation } from "./_generated/server";
import { getAll, getFirstOrNull } from "./utils";

// Shared status validator (v3 — includes "dispatched")
const taskStatusValidator = v.union(
  v.literal("todo"),
  v.literal("in-progress"),
  v.literal("dispatched"),
  v.literal("processing"),
  v.literal("review"),
  v.literal("done"),
  v.literal("agent-reviewed"),
  v.literal("validation-error"),
  v.literal("failed")
);

// Queries
export const getAllTasks = query({
  args: {},
  handler: async (ctx) => {
    return await getAll(ctx, "tasks");
  },
});

export const getTasksByStatus = query({
  args: { status: taskStatusValidator },
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
    status: taskStatusValidator,
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
    status: v.optional(taskStatusValidator),
    priority: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"))),
    assignee: v.optional(v.union(v.literal("human"), v.literal("openclaw"))),
    tags: v.optional(v.array(v.string())),
    dueDate: v.optional(v.string()),
    // Agent workflow fields (v2)
    claimedBy: v.optional(v.string()),
    claimedAt: v.optional(v.string()),
    workflowRunId: v.optional(v.string()),
    lastAgentResult: v.optional(v.string()),
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
    status: taskStatusValidator,
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

// Internal mutation for seeding
export const insertTask = internalMutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    status: taskStatusValidator,
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    assignee: v.union(v.literal("human"), v.literal("openclaw")),
    tags: v.optional(v.array(v.string())),
    dueDate: v.optional(v.string()),
    createdAt: v.string(),
    updatedAt: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("tasks", {
      ...args,
      parentId: undefined,
    });
  },
});

// Get latest completed tasks per agent (for dashboard result previews)
export const getLatestAgentResults = query({
  args: { agentNames: v.array(v.string()) },
  handler: async (ctx, args) => {
    const results: Record<string, {
      taskId: string;
      title: string;
      status: string;
      result: string | null;
      completedAt: string | null;
      claimedAt: string | null;
      priority: string;
      totalTasks: number;
      completedTasks: number;
      failedTasks: number;
    }> = {};

    const allTasks = await ctx.db.query("tasks").collect();

    for (const name of args.agentNames) {
      const nameLower = name.toLowerCase();
      const agentTasks = allTasks.filter(
        (t) =>
          t.claimedBy?.toLowerCase() === nameLower ||
          (t.tags || []).some(
            (tag) =>
              tag.toLowerCase() === nameLower ||
              tag.toLowerCase() === nameLower.replace(" ", "-")
          )
      );

      const completed = agentTasks.filter((t) =>
        ["done", "agent-reviewed"].includes(t.status)
      );
      const failed = agentTasks.filter((t) =>
        ["failed", "validation-error"].includes(t.status)
      );

      const latestWithResult = agentTasks
        .filter((t) => t.lastAgentResult)
        .sort((a, b) =>
          new Date(b.completedAt || b.updatedAt).getTime() -
          new Date(a.completedAt || a.updatedAt).getTime()
        )[0];

      results[name] = {
        taskId: latestWithResult?._id ?? "",
        title: latestWithResult?.title ?? "",
        status: latestWithResult?.status ?? "",
        result: latestWithResult?.lastAgentResult ?? null,
        completedAt: latestWithResult?.completedAt ?? null,
        claimedAt: latestWithResult?.claimedAt ?? null,
        priority: latestWithResult?.priority ?? "medium",
        totalTasks: agentTasks.length,
        completedTasks: completed.length,
        failedTasks: failed.length,
      };
    }

    return results;
  },
});

// Agent workflow support — claim, query, and recovery

export const claimTask = mutation({
  args: {
    id: v.id("tasks"),
    claimedBy: v.string(),
    workflowRunId: v.string(),
  },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.id);
    if (!task) throw new Error("Task not found");
    if (task.status === "processing") throw new Error("Task already claimed");
    if (!["in-progress", "dispatched"].includes(task.status)) {
      throw new Error(`Task cannot be claimed from status: ${task.status}`);
    }

    const now = new Date().toISOString();
    await ctx.db.patch(args.id, {
      status: "processing",
      claimedBy: args.claimedBy,
      claimedAt: now,
      workflowRunId: args.workflowRunId,
      updatedAt: now,
    });

    await ctx.db.insert("activity", {
      type: "task_claimed",
      message: `Task "${task.title}" claimed by ${args.claimedBy}`,
      entityId: args.id,
      entityType: "task",
      metadata: { claimedBy: args.claimedBy, workflowRunId: args.workflowRunId },
      createdAt: now,
    });

    return args.id;
  },
});

export const getTasksForAgent = query({
  args: { agentName: v.string() },
  handler: async (ctx, args) => {
    const inProgress = await ctx.db
      .query("tasks")
      .withIndex("by_status", (q) => q.eq("status", "in-progress"))
      .collect();
    const dispatched = await ctx.db
      .query("tasks")
      .withIndex("by_status", (q) => q.eq("status", "dispatched"))
      .collect();
    const tasks = [...inProgress, ...dispatched];
    return tasks.filter((t) =>
      (t.tags || []).some(
        (tag) => tag.toLowerCase() === args.agentName.toLowerCase()
      )
    );
  },
});

export const getStaleTasks = query({
  args: { staleAfterMinutes: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const threshold = args.staleAfterMinutes ?? 30;
    const cutoff = new Date(Date.now() - threshold * 60 * 1000).toISOString();
    const processing = await ctx.db
      .query("tasks")
      .withIndex("by_status", (q) => q.eq("status", "processing"))
      .collect();
    return processing.filter((t) => t.claimedAt && t.claimedAt < cutoff);
  },
});

export const recoverStaleTask = mutation({
  args: {
    id: v.id("tasks"),
    action: v.union(v.literal("fail"), v.literal("retry")),
  },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.id);
    if (!task) throw new Error("Task not found");
    if (task.status !== "processing")
      throw new Error("Task is not in processing");

    const now = new Date().toISOString();
    const newStatus = args.action === "retry" ? "in-progress" : "failed";
    await ctx.db.patch(args.id, {
      status: newStatus as any,
      claimedBy: undefined,
      claimedAt: undefined,
      workflowRunId: undefined,
      updatedAt: now,
    });

    await ctx.db.insert("activity", {
      type: "task_stale_recovery",
      message: `Task "${task.title}" recovered from stale processing → ${newStatus}`,
      entityId: args.id,
      entityType: "task",
      metadata: {
        previousClaimedBy: task.claimedBy,
        action: args.action,
      },
      createdAt: now,
    });

    return args.id;
  },
});

// ============================================================
// v3 Event-driven dispatch support
// ============================================================

// Internal mutation: create a task via the dispatch endpoint
export const createDispatchedTask = internalMutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    agent: v.string(),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    tags: v.optional(v.array(v.string())),
    callbackChannel: v.optional(v.string()),
    callbackChatId: v.optional(v.string()),
    replyToMessageId: v.optional(v.string()),
    chainNext: v.optional(v.object({
      agent: v.string(),
      promptTemplate: v.string(),
    })),
    chainDepth: v.optional(v.number()),
    parentId: v.optional(v.id("tasks")),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    const tags = args.tags || [];
    // Ensure agent name is always in tags
    if (!tags.some((t) => t.toLowerCase() === args.agent.toLowerCase())) {
      tags.unshift(args.agent);
    }

    const taskId = await ctx.db.insert("tasks", {
      title: args.title,
      description: args.description,
      status: "dispatched",
      priority: args.priority,
      assignee: "openclaw",
      tags,
      callbackChannel: args.callbackChannel,
      callbackChatId: args.callbackChatId,
      replyToMessageId: args.replyToMessageId,
      chainNext: args.chainNext,
      chainDepth: args.chainDepth ?? 0,
      dispatchedAt: now,
      createdAt: now,
      updatedAt: now,
      parentId: args.parentId,
    });

    await ctx.db.insert("activity", {
      type: "task_dispatched",
      message: `Task "${args.title}" dispatched to ${args.agent}`,
      entityId: taskId,
      entityType: "task",
      metadata: { agent: args.agent, priority: args.priority },
      createdAt: now,
    });

    return taskId;
  },
});

// Internal mutation: mark a task as completed (called by n8n via /api/tasks/complete)
export const completeTask = internalMutation({
  args: {
    id: v.string(),
    status: v.union(
      v.literal("agent-reviewed"),
      v.literal("validation-error"),
      v.literal("failed")
    ),
    result: v.optional(v.string()),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Convex IDs from external sources come as strings — normalize
    const task = await ctx.db
      .query("tasks")
      .filter((q) => q.eq(q.field("_id"), args.id as any))
      .first();
    if (!task) throw new Error(`Task not found: ${args.id}`);

    const now = new Date().toISOString();
    await ctx.db.patch(task._id, {
      status: args.status as any,
      lastAgentResult: args.result,
      completedAt: now,
      updatedAt: now,
    });

    const statusLabel = args.status === "agent-reviewed" ? "completed" : args.status;
    await ctx.db.insert("activity", {
      type: `task_${statusLabel}`,
      message: `Task "${task.title}" ${statusLabel} by ${task.claimedBy || "agent"}`,
      entityId: task._id,
      entityType: "task",
      metadata: {
        agent: task.claimedBy,
        status: args.status,
        hasResult: !!args.result,
        error: args.error,
      },
      createdAt: now,
    });

    // Log to memories for Mission Control searchability
    await ctx.db.insert("memories", {
      title: `${task.claimedBy || "Agent"} — ${task.title}`,
      content: args.result || args.error || `Task ${statusLabel}`,
      type: "task",
      tags: [
        ...(task.tags || []),
        "n8n",
        args.status,
      ],
      source: `n8n/${task.claimedBy || "agent"}-v3`,
      importance: task.priority === "high" ? "high" : "medium",
      createdAt: now,
      updatedAt: now,
    });

    return {
      _id: task._id,
      title: task.title,
      status: args.status,
      claimedBy: task.claimedBy,
      priority: task.priority,
      callbackChannel: task.callbackChannel,
      callbackChatId: task.callbackChatId,
      replyToMessageId: task.replyToMessageId,
      chainNext: task.chainNext,
      chainDepth: task.chainDepth,
      tags: task.tags,
    };
  },
});

// Query: task metrics for monitoring dashboard
export const getTaskMetrics = query({
  handler: async (ctx) => {
    const allTasks = await ctx.db.query("tasks").collect();
    const now = Date.now();
    const last24h = new Date(now - 24 * 60 * 60 * 1000).toISOString();

    // Group by status
    const byStatus: Record<string, number> = {};
    for (const t of allTasks) {
      byStatus[t.status] = (byStatus[t.status] || 0) + 1;
    }

    // Group by agent (only tasks that have been claimed)
    const byAgent: Record<string, { total: number; succeeded: number; failed: number }> = {};
    for (const t of allTasks) {
      if (!t.claimedBy) continue;
      if (!byAgent[t.claimedBy]) {
        byAgent[t.claimedBy] = { total: 0, succeeded: 0, failed: 0 };
      }
      byAgent[t.claimedBy].total++;
      if (t.status === "agent-reviewed") byAgent[t.claimedBy].succeeded++;
      if (["failed", "validation-error"].includes(t.status)) byAgent[t.claimedBy].failed++;
    }

    // Last 24h metrics
    const recentTasks = allTasks.filter((t) => t.updatedAt > last24h);
    const completedLast24h = recentTasks.filter((t) => t.status === "agent-reviewed").length;
    const failedLast24h = recentTasks.filter((t) =>
      ["failed", "validation-error"].includes(t.status)
    ).length;

    // Average processing time (dispatched/created → completed)
    const completedWithTimes = allTasks.filter(
      (t) => t.status === "agent-reviewed" && t.completedAt && (t.dispatchedAt || t.createdAt)
    );
    let avgProcessingMs = 0;
    if (completedWithTimes.length > 0) {
      const totalMs = completedWithTimes.reduce((sum, t) => {
        const start = new Date(t.dispatchedAt || t.createdAt).getTime();
        const end = new Date(t.completedAt!).getTime();
        return sum + (end - start);
      }, 0);
      avgProcessingMs = totalMs / completedWithTimes.length;
    }

    // Queue depth (tasks waiting to be picked up)
    const queueDepth = allTasks.filter((t) =>
      ["todo", "in-progress", "dispatched"].includes(t.status)
    ).length;

    // Stale count (processing > 30 min)
    const staleCutoff = new Date(now - 30 * 60 * 1000).toISOString();
    const staleCount = allTasks.filter(
      (t) => t.status === "processing" && t.claimedAt && t.claimedAt < staleCutoff
    ).length;

    return {
      total: allTasks.length,
      byStatus,
      byAgent,
      completedLast24h,
      failedLast24h,
      avgProcessingMs: Math.round(avgProcessingMs),
      queueDepth,
      staleCount,
    };
  },
});
