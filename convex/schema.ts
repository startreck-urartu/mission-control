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
      v.literal("dispatched"),
      v.literal("processing"),
      v.literal("review"),
      v.literal("done"),
      v.literal("agent-reviewed"),
      v.literal("validation-error"),
      v.literal("failed")
    ),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    assignee: v.union(v.literal("human"), v.literal("openclaw")),
    tags: v.optional(v.array(v.string())),
    dueDate: v.optional(v.string()),
    // Agent workflow fields (v2)
    claimedBy: v.optional(v.string()),
    claimedAt: v.optional(v.string()),
    workflowRunId: v.optional(v.string()),
    lastAgentResult: v.optional(v.string()),
    // Event-driven dispatch fields (v3)
    callbackChannel: v.optional(v.string()),
    callbackChatId: v.optional(v.string()),
    replyToMessageId: v.optional(v.string()),
    chainNext: v.optional(v.object({
      agent: v.string(),
      promptTemplate: v.string(),
    })),
    chainDepth: v.optional(v.number()),
    dispatchedAt: v.optional(v.string()),
    completedAt: v.optional(v.string()),
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

  // LLM Usage & Costs - Track spending and tokens per model
  llmUsage: defineTable({
    model: v.string(), // e.g., "claude-opus-4.5", "claude-sonet-4", "kimi-k2.5"
    provider: v.string(), // e.g., "anthropic", "openai", "moonshot"
    costPerInputToken: v.number(), // Cost per 1K input tokens
    costPerOutputToken: v.number(), // Cost per 1K output tokens
    inputTokensUsed: v.number(), // Total input tokens consumed
    outputTokensUsed: v.number(), // Total output tokens consumed
    totalCost: v.number(), // Total cost in USD
    budgetLimit: v.optional(v.number()), // Monthly budget limit
    requestsCount: v.number(), // Number of API calls
    lastUsed: v.string(), // ISO timestamp
    status: v.union(v.literal("active"), v.literal("paused"), v.literal("deprecated")),
    description: v.optional(v.string()),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_model", ["model"])
    .index("by_provider", ["provider"])
    .index("by_status", ["status"]),

  // Polymarket Trader - Trading system state (singleton record)
  polymarketTrader: defineTable({
    status: v.union(
      v.literal("running"),
      v.literal("stopped"),
      v.literal("error"),
      v.literal("unknown")
    ),
    strategyName: v.optional(v.string()),
    balance: v.optional(v.number()),
    dailyPnl: v.number(),
    dailyResetDate: v.string(),
    totalTradesToday: v.number(),
    peakEquity: v.number(),
    positions: v.array(v.any()),
    logs: v.optional(v.array(v.any())),
    lastRunAt: v.optional(v.string()),
    lastSyncedAt: v.string(),
    createdAt: v.string(),
    updatedAt: v.string(),
  }).index("by_updated", ["updatedAt"]),

  // Polymarket Trades - Individual trade journal records
  polymarketTrades: defineTable({
    tradeId: v.string(),
    timestampUtc: v.string(),
    marketId: v.string(),
    tokenId: v.string(),
    marketSlug: v.optional(v.string()),
    side: v.union(v.literal("BUY"), v.literal("SELL")),
    price: v.number(),
    size: v.number(),
    orderValue: v.number(),
    signalSide: v.optional(v.string()),
    signalEdge: v.optional(v.number()),
    signalStrength: v.optional(v.string()),
    strategy: v.optional(v.string()),
    mode: v.optional(v.string()),
    pnl: v.optional(v.number()),
    createdAt: v.string(),
  })
    .index("by_trade_id", ["tradeId"])
    .index("by_timestamp", ["timestampUtc"])
    .index("by_strategy", ["strategy"]),

  // Polymarket Signals - POLY-DELTA v2 cross-market arb signal queue
  polymarketSignals: defineTable({
    strategy: v.string(),                    // e.g. "poly-delta-v1"
    mode: v.union(v.literal("paper"), v.literal("live")),
    status: v.union(
      v.literal("pending"),
      v.literal("claimed"),
      v.literal("executed"),
      v.literal("paper-filled"),
      v.literal("expired"),
      v.literal("rejected")
    ),
    eventId: v.string(),
    eventSlug: v.optional(v.string()),
    eventTitle: v.optional(v.string()),
    eventVolume: v.number(),
    endTs: v.optional(v.number()),           // unix sec, event resolution deadline
    scanTs: v.number(),                      // unix sec, when signal was emitted
    sumYesProb: v.number(),
    absDeviationBps: v.number(),
    direction: v.union(v.literal("long_basket"), v.literal("short_basket")),
    nLegs: v.number(),
    totalLegs: v.number(),
    observationCompleteness: v.number(),
    legs: v.array(v.object({
      conditionId: v.string(),
      tokenYes: v.optional(v.string()),
      tokenNo: v.optional(v.string()),
      question: v.optional(v.string()),
      yesPrice: v.number(),
    })),
    claimedBy: v.optional(v.string()),
    claimedAt: v.optional(v.string()),
    rejectReason: v.optional(v.string()),
    paperPnlBps: v.optional(v.number()),
    paperFilledAt: v.optional(v.string()),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_status", ["status"])
    .index("by_event_direction", ["eventId", "direction"])
    .index("by_created", ["createdAt"])
    .index("by_strategy", ["strategy"]),

  // Books Library - Digital library for business literature and skill development
  books: defineTable({
    title: v.string(),
    author: v.optional(v.string()),
    description: v.optional(v.string()),
    category: v.union(
      v.literal("business"),
      v.literal("technical"),
      v.literal("design"),
      v.literal("marketing"),
      v.literal("leadership"),
      v.literal("finance"),
      v.literal("legal"),
      v.literal("personal-development"),
      v.literal("industry-specific"),
      v.literal("reference"),
      v.literal("other")
    ),
    format: v.union(
      v.literal("pdf"),
      v.literal("epub"),
      v.literal("doc"),
      v.literal("docx"),
      v.literal("txt"),
      v.literal("md"),
      v.literal("other")
    ),
    filePath: v.optional(v.string()), // Local file path
    fileSize: v.optional(v.number()), // Size in bytes
    fileUrl: v.optional(v.string()), // External URL if hosted
    thumbnailUrl: v.optional(v.string()), // Book cover image
    status: v.union(
      v.literal("reading"),
      v.literal("completed"),
      v.literal("reference"),
      v.literal("to-read"),
      v.literal("archived")
    ),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    rating: v.optional(v.number()), // 1-5 rating
    notes: v.optional(v.string()), // Personal notes
    tags: v.array(v.string()),
    addedBy: v.id("team"), // Who added the book
    readCount: v.number(), // How many times referenced
    lastAccessed: v.optional(v.string()), // ISO timestamp
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_category", ["category"])
    .index("by_status", ["status"])
    .index("by_priority", ["priority"])
    .index("by_addedBy", ["addedBy"])
    .searchIndex("search_title", {
      searchField: "title",
      filterFields: ["category", "status", "tags"],
    }),

  // CAD Assistant - Threaded chat sessions
  assistantThreads: defineTable({
    title: v.string(),
    createdAt: v.string(),
    updatedAt: v.string(),
  }).index("by_updated", ["updatedAt"]),

  assistantMessages: defineTable({
    threadId: v.id("assistantThreads"),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
    citations: v.optional(
      v.array(
        v.object({
          lessonTitle: v.string(),
          software: v.string(),
          startTs: v.number(),
          videoPath: v.optional(v.string()),
          score: v.number(),
          snippet: v.string(),
        })
      )
    ),
    createdAt: v.string(),
  }).index("by_thread", ["threadId"]),

  // ───────────────────────────────
  // Client Pipeline (CADCAM Designs)
  // ───────────────────────────────
  clients: defineTable({
    name: v.string(),
    company: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    source: v.optional(v.string()), // referral, linkedin, jck, website, etc.
    stage: v.union(
      v.literal("lead"),
      v.literal("qualified"),
      v.literal("proposal"),
      v.literal("contract"),
      v.literal("in-production"),
      v.literal("delivered"),
      v.literal("paid")
    ),
    value: v.optional(v.number()), // estimated deal value in USD
    projectType: v.optional(v.string()), // "cad-design", "prototyping", "full-production"
    notes: v.optional(v.string()),
    followUpDate: v.optional(v.string()),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    tags: v.optional(v.array(v.string())),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_stage", ["stage"])
    .index("by_priority", ["priority"])
    .index("by_follow_up", ["followUpDate"]),

  // ───────────────────────────────
  // Revenue Tracker
  // ───────────────────────────────
  revenue: defineTable({
    amount: v.number(),
    currency: v.optional(v.string()),
    description: v.string(),
    category: v.union(
      v.literal("cadcam-design"),
      v.literal("3dgoldsmith"),
      v.literal("trading"),
      v.literal("consulting"),
      v.literal("other")
    ),
    clientId: v.optional(v.id("clients")),
    date: v.string(), // ISO date
    status: v.union(v.literal("pending"), v.literal("received")),
    createdAt: v.string(),
  })
    .index("by_date", ["date"])
    .index("by_category", ["category"])
    .index("by_status", ["status"])
    .index("by_client", ["clientId"]),

  // ───────────────────────────────
  // Financial Goals
  // ───────────────────────────────
  goals: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    targetAmount: v.number(),
    currentAmount: v.number(),
    currency: v.optional(v.string()),
    startDate: v.string(),
    endDate: v.string(),
    category: v.union(
      v.literal("profit"),
      v.literal("revenue"),
      v.literal("clients"),
      v.literal("trading"),
      v.literal("custom")
    ),
    isActive: v.boolean(),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_active", ["isActive"])
    .index("by_end_date", ["endDate"]),
});
