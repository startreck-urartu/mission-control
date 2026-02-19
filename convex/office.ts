import { v } from "convex/values";
import { query, mutation, internalMutation } from "./_generated/server";

// Queries
export const getAllOfficeDesks = query({
  args: {},
  handler: async (ctx) => {
    const offices = await ctx.db.query("office").collect();
    const enriched = await Promise.all(
      offices.map(async (office) => {
        const member = await ctx.db.get(office.teamMemberId);
        return { ...office, member };
      })
    );
    return enriched;
  },
});

export const getAllOfficeSpaces = query({
  args: {},
  handler: async (ctx) => {
    const offices = await ctx.db.query("office").collect();
    const enriched = await Promise.all(
      offices.map(async (office) => {
        const member = await ctx.db.get(office.teamMemberId);
        return { ...office, member };
      })
    );
    return enriched;
  },
});

export const getOfficeByTeamMember = query({
  args: { teamMemberId: v.id("team") },
  handler: async (ctx, args) => {
    const office = await ctx.db
      .query("office")
      .withIndex("by_team_member", (q) => q.eq("teamMemberId", args.teamMemberId))
      .first();
    
    if (!office) return null;
    
    const member = await ctx.db.get(office.teamMemberId);
    return { ...office, member };
  },
});

export const getActiveDesks = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("office")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
  },
});

// Mutations
export const createOfficeSpace = mutation({
  args: {
    teamMemberId: v.id("team"),
    deskPosition: v.object({ x: v.number(), y: v.number() }),
    deskSize: v.object({ width: v.number(), height: v.number() }),
    deskColor: v.optional(v.string()),
    workspaceId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    const officeId = await ctx.db.insert("office", {
      ...args,
      isActive: true,
      lastHeartbeat: now,
      activity: undefined,
      createdAt: now,
      updatedAt: now,
    });

    return officeId;
  },
});

export const updateOfficeSpace = mutation({
  args: {
    id: v.id("office"),
    deskPosition: v.optional(v.object({ x: v.number(), y: v.number() })),
    deskSize: v.optional(v.object({ width: v.number(), height: v.number() })),
    deskColor: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
    activity: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const now = new Date().toISOString();
    
    await ctx.db.patch(id, {
      ...updates,
      lastHeartbeat: now,
      updatedAt: now,
    });

    return id;
  },
});

export const updateActivity = mutation({
  args: {
    id: v.id("office"),
    activity: v.string(),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    await ctx.db.patch(args.id, {
      activity: args.activity,
      lastHeartbeat: now,
      updatedAt: now,
    });

    // Also update the team member's current task
    const office = await ctx.db.get(args.id);
    if (office) {
      await ctx.db.patch(office.teamMemberId, {
        currentTask: args.activity,
      });
    }

    return args.id;
  },
});

export const deleteOfficeSpace = mutation({
  args: { id: v.id("office") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return args.id;
  },
});

// Internal mutation for OpenClaw integration
export const registerDeskPosition = internalMutation({
  args: {
    teamMemberName: v.string(),
    position: v.object({ x: v.number(), y: v.number() }),
    size: v.optional(v.object({ width: v.number(), height: v.number() })),
    color: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const member = await ctx.db
      .query("team")
      .filter((q) => q.eq(q.field("name"), args.teamMemberName))
      .first();

    if (!member) return null;

    const existing = await ctx.db
      .query("office")
      .withIndex("by_team_member", (q) => q.eq("teamMemberId", member._id))
      .first();

    const now = new Date().toISOString();
    const size = args.size || { width: 120, height: 80 };

    if (existing) {
      await ctx.db.patch(existing._id, {
        deskPosition: args.position,
        deskSize: size,
        deskColor: args.color,
        updatedAt: now,
      });
      return existing._id;
    }

    return await ctx.db.insert("office", {
      teamMemberId: member._id,
      deskPosition: args.position,
      deskSize: size,
      deskColor: args.color,
      isActive: true,
      lastHeartbeat: now,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateDeskHeartbeat = internalMutation({
  args: {
    teamMemberName: v.string(),
    activity: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const member = await ctx.db
      .query("team")
      .filter((q) => q.eq(q.field("name"), args.teamMemberName))
      .first();

    if (!member) return null;

    const office = await ctx.db
      .query("office")
      .withIndex("by_team_member", (q) => q.eq("teamMemberId", member._id))
      .first();

    if (!office) return null;

    const now = new Date().toISOString();
    await ctx.db.patch(office._id, {
      lastHeartbeat: now,
      activity: args.activity,
      isActive: args.isActive ?? true,
      updatedAt: now,
    });

    // Update member status
    await ctx.db.patch(member._id, {
      currentTask: args.activity,
      lastActive: now,
    });

    return office._id;
  },
});
