import { v } from "convex/values";
import { query, mutation, internalMutation } from "./_generated/server";

// Queries
export const getAllTeamMembers = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("team").order("asc", "name").collect();
  },
});

export const getTeamMemberById = query({
  args: { id: v.id("team") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getAgents = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("team")
      .withIndex("by_type", (q) => q.eq("type", "agent"))
      .collect();
  },
});

export const getSubagents = query({
  args: { parentId: v.optional(v.id("team")) },
  handler: async (ctx, args) => {
    if (args.parentId) {
      return await ctx.db
        .query("team")
        .withIndex("by_parent", (q) => q.eq("parentId", args.parentId))
        .collect();
    }
    return await ctx.db
      .query("team")
      .filter((q) => q.neq(q.field("parentId"), undefined))
      .collect();
  },
});

export const getMainAgent = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("team")
      .filter((q) => q.eq(q.field("isMainAgent"), true))
      .first();
  },
});

export const getTeamByStatus = query({
  args: { 
    status: v.union(
      v.literal("online"),
      v.literal("busy"),
      v.literal("away"),
      v.literal("offline")
    ) 
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("team")
      .withIndex("by_status", (q) => q.eq("status", args.status))
      .collect();
  },
});

// Mutations
export const createTeamMember = mutation({
  args: {
    name: v.string(),
    role: v.string(),
    type: v.union(v.literal("human"), v.literal("agent")),
    avatar: v.optional(v.string()),
    status: v.union(
      v.literal("online"),
      v.literal("busy"),
      v.literal("away"),
      v.literal("offline")
    ),
    skills: v.array(v.string()),
    description: v.optional(v.string()),
    email: v.optional(v.string()),
    isMainAgent: v.optional(v.boolean()),
    parentId: v.optional(v.id("team")),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    const memberId = await ctx.db.insert("team", {
      ...args,
      currentTask: undefined,
      createdAt: now,
      lastActive: now,
    });

    await ctx.db.insert("activity", {
      type: "team_member_added",
      message: `${args.name} (${args.role}) added to team`,
      entityId: memberId,
      entityType: "team",
      metadata: { type: args.type, role: args.role },
      createdAt: now,
    });

    return memberId;
  },
});

export const updateTeamMember = mutation({
  args: {
    id: v.id("team"),
    name: v.optional(v.string()),
    role: v.optional(v.string()),
    avatar: v.optional(v.string()),
    status: v.optional(v.union(
      v.literal("online"),
      v.literal("busy"),
      v.literal("away"),
      v.literal("offline")
    )),
    skills: v.optional(v.array(v.string())),
    currentTask: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const now = new Date().toISOString();
    
    await ctx.db.patch(id, {
      ...updates,
      lastActive: now,
    });

    if (updates.status) {
      const member = await ctx.db.get(id);
      await ctx.db.insert("activity", {
        type: "team_status_changed",
        message: `${member?.name} is now ${updates.status}`,
        entityId: id,
        entityType: "team",
        metadata: { status: updates.status },
        createdAt: now,
      });
    }

    return id;
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("team"),
    status: v.union(
      v.literal("online"),
      v.literal("busy"),
      v.literal("away"),
      v.literal("offline")
    ),
    currentTask: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const member = await ctx.db.get(args.id);
    if (!member) throw new Error("Team member not found");

    const now = new Date().toISOString();
    await ctx.db.patch(args.id, {
      status: args.status,
      currentTask: args.currentTask,
      lastActive: now,
    });

    await ctx.db.insert("activity", {
      type: "team_status_updated",
      message: `${member.name} is now ${args.status}${args.currentTask ? ` - ${args.currentTask}` : ""}`,
      entityId: args.id,
      entityType: "team",
      metadata: { status: args.status, currentTask: args.currentTask },
      createdAt: now,
    });

    return args.id;
  },
});

export const deleteTeamMember = mutation({
  args: { id: v.id("team") },
  handler: async (ctx, args) => {
    const member = await ctx.db.get(args.id);
    if (!member) throw new Error("Team member not found");

    await ctx.db.delete(args.id);

    await ctx.db.insert("activity", {
      type: "team_member_removed",
      message: `${member.name} removed from team`,
      entityId: args.id,
      entityType: "team",
      createdAt: new Date().toISOString(),
    });

    return args.id;
  },
});

// Internal mutation for OpenClaw integration
export const registerAgentFromOpenClaw = internalMutation({
  args: {
    name: v.string(),
    role: v.string(),
    skills: v.array(v.string()),
    description: v.optional(v.string()),
    isMainAgent: v.optional(v.boolean()),
    parentName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    
    let parentId: string | undefined = undefined;
    if (args.parentName) {
      const parent = await ctx.db
        .query("team")
        .filter((q) => q.eq(q.field("name"), args.parentName))
        .first();
      if (parent) {
        parentId = parent._id;
      }
    }

    const existing = await ctx.db
      .query("team")
      .filter((q) => q.eq(q.field("name"), args.name))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        role: args.role,
        skills: args.skills,
        description: args.description,
        lastActive: now,
        isMainAgent: args.isMainAgent,
        parentId,
      });
      return existing._id;
    }

    return await ctx.db.insert("team", {
      name: args.name,
      role: args.role,
      type: "agent",
      status: "online",
      skills: args.skills,
      description: args.description,
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(args.name)}`,
      isMainAgent: args.isMainAgent,
      parentId,
      createdAt: now,
      lastActive: now,
    });
  },
});

export const updateAgentHeartbeat = internalMutation({
  args: {
    name: v.string(),
    status: v.union(
      v.literal("online"),
      v.literal("busy"),
      v.literal("away"),
      v.literal("offline")
    ),
    currentTask: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const agent = await ctx.db
      .query("team")
      .filter((q) => q.eq(q.field("name"), args.name))
      .first();

    if (!agent) return null;

    const now = new Date().toISOString();
    await ctx.db.patch(agent._id, {
      status: args.status,
      currentTask: args.currentTask,
      lastActive: now,
    });

    return agent._id;
  },
});

// Internal mutation for seeding
export const insertTeamMember = internalMutation({
  args: {
    name: v.string(),
    role: v.string(),
    type: v.union(v.literal("human"), v.literal("ai")),
    avatar: v.optional(v.string()),
    status: v.union(
      v.literal("online"),
      v.literal("busy"),
      v.literal("away"),
      v.literal("offline")
    ),
    skills: v.array(v.string()),
    description: v.optional(v.string()),
    email: v.optional(v.string()),
    isMainAgent: v.optional(v.boolean()),
    parentId: v.optional(v.id("team")),
    createdAt: v.string(),
    updatedAt: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("team", {
      ...args,
      currentTask: undefined,
      lastActive: args.updatedAt,
    });
  },
});
