import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Tasks Board - Kanban tasks
  tasks: defineTable({
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
    createdAt: v.string(),
    updatedAt: v.string(),
    parentId: v.optional(v.id("tasks")),
  })
    .index("by_status", ["status"])
    .index("by_assignee", ["assignee"])
    .index("by_priority", ["priority"])
    .index("by_due_date", ["dueDate"]),

  // Content Pipeline - Content creation workflow
  content: defineTable({
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
  })
    .index("by_stage", ["stage"])
    .index("by_content_type", ["contentType"])
    .index("by_assigned", ["assignedTo"]),

  // Calendar - Scheduled tasks and cron jobs
  calendar: defineTable({
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
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_start_date", ["startDate"])
    .index("by_type", ["type"])
    .index("by_assigned", ["assignedTo"]),

  // Memory - Searchable archive
  memories: defineTable({
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
    metadata: v.optional(v.record(v.string(), v.any())),
  })
    .index("by_type", ["type"])
    .index("by_importance", ["importance"])
    .index("by_created", ["createdAt"])
    .searchIndex("search_content", {
      searchField: "content",
      filterFields: ["type", "tags", "importance"],
    }),

  // Team - Agents and their roles
  team: defineTable({
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
    currentTask: v.optional(v.string()),
    description: v.optional(v.string()),
    email: v.optional(v.string()),
    isMainAgent: v.optional(v.boolean()),
    parentId: v.optional(v.id("team")),
    createdAt: v.string(),
    lastActive: v.string(),
  })
    .index("by_status", ["status"])
    .index("by_role", ["role"])
    .index("by_type", ["type"])
    .index("by_parent", ["parentId"]),

  // Office - Agent positions and workspace status
  office: defineTable({
    teamMemberId: v.id("team"),
    deskPosition: v.object({
      x: v.number(),
      y: v.number(),
    }),
    deskSize: v.object({
      width: v.number(),
      height: v.number(),
    }),
    deskColor: v.optional(v.string()),
    workspaceId: v.optional(v.string()),
    isActive: v.boolean(),
    lastHeartbeat: v.string(),
    activity: v.optional(v.string()),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_team_member", ["teamMemberId"])
    .index("by_workspace", ["workspaceId"]),

  // Activity Log - For real-time updates
  activity: defineTable({
    type: v.string(),
    message: v.string(),
    userId: v.optional(v.id("team")),
    entityId: v.optional(v.string()),
    entityType: v.optional(v.string()),
    metadata: v.optional(v.record(v.string(), v.any())),
    createdAt: v.string(),
  }).index("by_created", ["createdAt"]),

  // Settings - Dashboard configuration
  settings: defineTable({
    key: v.string(),
    value: v.any(),
    updatedAt: v.string(),
  }).index("by_key", ["key"]),
});
