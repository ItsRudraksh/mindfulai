import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const createJournalEntry = mutation({
  args: {
    title: v.optional(v.string()),
    content: v.any(), // TipTap JSON content
    theme: v.optional(
      v.union(v.literal("light"), v.literal("dark"), v.literal("sepia"))
    ),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }

    const now = Date.now();
    return await ctx.db.insert("journalEntries", {
      userId,
      title:
        args.title || `Journal Entry - ${new Date(now).toLocaleDateString()}`,
      content: args.content || { type: "doc", content: [] },
      theme: args.theme || "light",
      tags: args.tags || [],
      isPrivate: true,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateJournalEntry = mutation({
  args: {
    entryId: v.id("journalEntries"),
    title: v.optional(v.string()),
    content: v.optional(v.any()),
    theme: v.optional(
      v.union(v.literal("light"), v.literal("dark"), v.literal("sepia"))
    ),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }

    const { entryId, ...updates } = args;
    const entry = await ctx.db.get(entryId);

    if (!entry || entry.userId !== userId) {
      throw new Error("Journal entry not found or unauthorized");
    }

    return await ctx.db.patch(entryId, {
      ...updates,
      updatedAt: Date.now(),
    });
  },
});

export const getUserJournalEntries = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return [];
    }

    const limit = args.limit || 20;
    return await ctx.db
      .query("journalEntries")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(limit);
  },
});

export const getJournalEntryById = query({
  args: { entryId: v.id("journalEntries") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }

    const entry = await ctx.db.get(args.entryId);
    if (!entry || entry.userId !== userId) {
      throw new Error("Journal entry not found or unauthorized");
    }

    return entry;
  },
});

export const deleteJournalEntry = mutation({
  args: { entryId: v.id("journalEntries") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }

    const entry = await ctx.db.get(args.entryId);
    if (!entry || entry.userId !== userId) {
      throw new Error("Journal entry not found or unauthorized");
    }

    await ctx.db.delete(args.entryId);
  },
});

export const searchJournalEntries = query({
  args: {
    searchTerm: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return [];
    }

    const limit = args.limit || 10;
    const entries = await ctx.db
      .query("journalEntries")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(50); // Get more entries to search through

    // Simple text search in title and content
    return entries
      .filter((entry) => {
        const titleMatch = entry.title
          ?.toLowerCase()
          .includes(args.searchTerm.toLowerCase());
        const contentMatch = JSON.stringify(entry.content)
          .toLowerCase()
          .includes(args.searchTerm.toLowerCase());
        return titleMatch || contentMatch;
      })
      .slice(0, limit);
  },
});