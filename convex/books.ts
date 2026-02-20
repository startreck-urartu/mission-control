import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Get all books
export const getAllBooks = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("books").order("desc", "updatedAt").collect();
  },
});

// Get books by category
export const getBooksByCategory = query({
  args: { category: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("books")
      .withIndex("by_category", (q) => q.eq("category", args.category))
      .collect();
  },
});

// Get books by status
export const getBooksByStatus = query({
  args: { status: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("books")
      .withIndex("by_status", (q) => q.eq("status", args.status))
      .collect();
  },
});

// Search books
export const searchBooks = query({
  args: { query: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("books")
      .withSearchIndex("search_title", (q) =>
        q.search("title", args.query)
      )
      .collect();
  },
});

// Get library stats
export const getLibraryStats = query({
  args: {},
  handler: async (ctx) => {
    const allBooks = await ctx.db.query("books").collect();
    
    const byCategory: Record<string, number> = {};
    const byStatus: Record<string, number> = {};
    
    allBooks.forEach((book) => {
      byCategory[book.category] = (byCategory[book.category] || 0) + 1;
      byStatus[book.status] = (byStatus[book.status] || 0) + 1;
    });

    return {
      totalBooks: allBooks.length,
      totalSize: allBooks.reduce((sum, b) => sum + (b.fileSize || 0), 0),
      byCategory,
      byStatus,
      currentlyReading: byStatus["reading"] || 0,
      completed: byStatus["completed"] || 0,
      toRead: byStatus["to-read"] || 0,
    };
  },
});

// Create book entry
export const createBook = mutation({
  args: {
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
    filePath: v.optional(v.string()),
    fileSize: v.optional(v.number()),
    fileUrl: v.optional(v.string()),
    thumbnailUrl: v.optional(v.string()),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    notes: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    addedBy: v.id("team"),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    
    return await ctx.db.insert("books", {
      ...args,
      status: "to-read",
      rating: undefined,
      readCount: 0,
      lastAccessed: undefined,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Update book
export const updateBook = mutation({
  args: {
    id: v.id("books"),
    title: v.optional(v.string()),
    author: v.optional(v.string()),
    description: v.optional(v.string()),
    category: v.optional(v.union(
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
    )),
    status: v.optional(v.union(
      v.literal("reading"),
      v.literal("completed"),
      v.literal("reference"),
      v.literal("to-read"),
      v.literal("archived")
    )),
    priority: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"))),
    rating: v.optional(v.number()),
    notes: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    thumbnailUrl: v.optional(v.string()),
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

// Record book access (increment read count)
export const recordAccess = mutation({
  args: { id: v.id("books") },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    const book = await ctx.db.get(args.id);
    
    if (!book) {
      throw new Error("Book not found");
    }

    await ctx.db.patch(args.id, {
      readCount: book.readCount + 1,
      lastAccessed: now,
      updatedAt: now,
    });

    return { readCount: book.readCount + 1 };
  },
});

// Delete book
export const deleteBook = mutation({
  args: { id: v.id("books") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return args.id;
  },
});