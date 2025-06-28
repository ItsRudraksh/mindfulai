import { v } from "convex/values";
import { mutation, query, internalQuery } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const createMoodEntry = mutation({
  args: {
    mood: v.string(),
    intensity: v.number(),
    notes: v.optional(v.string()),
    triggers: v.optional(v.array(v.string())),
    activities: v.optional(v.array(v.string())),
    aiInsight: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }

    return await ctx.db.insert("moodEntries", {
      userId,
      ...args,
      timestamp: Date.now(),
    });
  },
});

export const getMoodEntriesForToday = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return [];
    }

    // Get start and end of today in UTC
    const now = new Date();
    const startOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    ).getTime();
    const endOfDay = startOfDay + 24 * 60 * 60 * 1000 - 1;

    return await ctx.db
      .query("moodEntries")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) =>
        q.and(
          q.gte(q.field("timestamp"), startOfDay),
          q.lte(q.field("timestamp"), endOfDay)
        )
      )
      .order("desc")
      .collect();
  },
});

export const getMoodEntriesForDateRange = query({
  args: {
    startDate: v.number(),
    endDate: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return [];
    }

    return await ctx.db
      .query("moodEntries")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) =>
        q.and(
          q.gte(q.field("timestamp"), args.startDate),
          q.lte(q.field("timestamp"), args.endDate)
        )
      )
      .order("desc")
      .collect();
  },
});

export const updateMoodEntry = mutation({
  args: {
    entryId: v.id("moodEntries"),
    mood: v.optional(v.string()),
    intensity: v.optional(v.number()),
    notes: v.optional(v.string()),
    triggers: v.optional(v.array(v.string())),
    activities: v.optional(v.array(v.string())),
    aiInsight: v.optional(v.string()),
    recommendationsUsed: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }

    const { entryId, ...updates } = args;
    const entry = await ctx.db.get(entryId);

    if (!entry || entry.userId !== userId) {
      throw new Error("Mood entry not found or unauthorized");
    }

    return await ctx.db.patch(entryId, updates);
  },
});

export const deleteMoodEntry = mutation({
  args: { entryId: v.id("moodEntries") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }

    const entry = await ctx.db.get(args.entryId);
    if (!entry || entry.userId !== userId) {
      throw new Error("Mood entry not found or unauthorized");
    }

    await ctx.db.delete(args.entryId);
  },
});

export const getUserMoodEntries = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return [];
    }

    const limit = args.limit || 50;
    return await ctx.db
      .query("moodEntries")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(limit);
  },
});

export const internalGetMoodEntriesForToday = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    // Get start and end of today in UTC
    const now = new Date();
    const startOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    ).getTime();
    const endOfDay = startOfDay + 24 * 60 * 60 * 1000 - 1;

    return await ctx.db
      .query("moodEntries")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) =>
        q.and(
          q.gte(q.field("timestamp"), startOfDay),
          q.lte(q.field("timestamp"), endOfDay)
        )
      )
      .order("desc")
      .collect();
  },
});
