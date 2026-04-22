import { v } from "convex/values";
import { query, mutation, internalMutation } from "./_generated/server";

// Queries
export const getEventsByDateRange = query({
  args: {
    startDate: v.string(),
    endDate: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("calendar")
      .withIndex("by_start_date", (q) =>
        q.gte("startDate", args.startDate).lte("startDate", args.endDate)
      )
      .collect();
  },
});

export const getAllEvents = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("calendar").order("asc").take(100);
  },
});

export const getEventById = query({
  args: { id: v.id("calendar") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getCronJobs = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("calendar")
      .withIndex("by_type", (q) => q.eq("type", "cron"))
      .collect();
  },
});

// Mutations
export const createEvent = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    type: v.union(
      v.literal("task"),
      v.literal("cron"),
      v.literal("meeting"),
      v.literal("milestone")
    ),
    startDate: v.string(),
    endDate: v.optional(v.string()),
    allDay: v.optional(v.boolean()),
    recurrence: v.optional(v.string()),
    color: v.optional(v.string()),
    assignedTo: v.optional(v.union(v.literal("human"), v.literal("openclaw"))),
    relatedTaskId: v.optional(v.id("tasks")),
    relatedContentId: v.optional(v.id("content")),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    const eventId = await ctx.db.insert("calendar", {
      ...args,
      createdAt: now,
      updatedAt: now,
    });

    const typeLabel = args.type === "cron" ? "Cron job" : "Event";
    await ctx.db.insert("activity", {
      type: "calendar_event_created",
      message: `${typeLabel} "${args.title}" scheduled`,
      entityId: eventId,
      entityType: "calendar",
      metadata: { type: args.type, startDate: args.startDate },
      createdAt: now,
    });

    return eventId;
  },
});

export const updateEvent = mutation({
  args: {
    id: v.id("calendar"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
    allDay: v.optional(v.boolean()),
    recurrence: v.optional(v.string()),
    color: v.optional(v.string()),
    assignedTo: v.optional(v.union(v.literal("human"), v.literal("openclaw"))),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const event = await ctx.db.get(id);
    if (!event) throw new Error("Event not found");

    const now = new Date().toISOString();
    await ctx.db.patch(id, {
      ...updates,
      updatedAt: now,
    });

    return id;
  },
});

export const deleteEvent = mutation({
  args: { id: v.id("calendar") },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.id);
    if (!event) throw new Error("Event not found");

    await ctx.db.delete(args.id);

    await ctx.db.insert("activity", {
      type: "calendar_event_deleted",
      message: `Event "${event.title}" deleted`,
      entityId: args.id,
      entityType: "calendar",
      createdAt: new Date().toISOString(),
    });

    return args.id;
  },
});

// Internal mutation for OpenClaw integration
export const upsertCronJob = internalMutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    recurrence: v.string(),
    startDate: v.string(),
    color: v.optional(v.string()),
    externalId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    
    const existing = await ctx.db
      .query("calendar")
      .filter((q) => q.eq(q.field("title"), args.title))
      .first();

    const eventData = {
      title: args.title,
      description: args.description,
      type: "cron" as const,
      recurrence: args.recurrence,
      startDate: args.startDate,
      color: args.color || "#8b5cf6",
      assignedTo: "openclaw" as const,
      updatedAt: now,
    };

    if (existing) {
      await ctx.db.patch(existing._id, eventData);
      return existing._id;
    } else {
      return await ctx.db.insert("calendar", {
        ...eventData,
        createdAt: now,
      });
    }
  },
});

// Internal mutation for seeding
export const insertEvent = internalMutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    type: v.union(
      v.literal("task"),
      v.literal("cron"),
      v.literal("meeting"),
      v.literal("milestone")
    ),
    startDate: v.string(),
    endDate: v.optional(v.string()),
    allDay: v.optional(v.boolean()),
    recurrence: v.optional(v.string()),
    color: v.optional(v.string()),
    assignedTo: v.optional(v.union(v.literal("human"), v.literal("openclaw"))),
    createdAt: v.string(),
    updatedAt: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("calendar", {
      ...args,
      relatedTaskId: undefined,
      relatedContentId: undefined,
    });
  },
});
