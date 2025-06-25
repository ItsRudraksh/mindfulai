import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const createJournalEntry = mutation({
  args: {
    title: v.optional(v.string()),
    content: v.string(),
    plainTextContent: v.optional(v.string()),
    mood: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    isPrivate: v.optional(v.boolean()),
    images: v.optional(v.array(v.string())),
    font: v.optional(v.string()),
    theme: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }

    const now = Date.now();
    const wordCount = args.plainTextContent ? args.plainTextContent.split(/\s+/).length : 0;
    const readingTime = Math.ceil(wordCount / 200); // Average reading speed

    return await ctx.db.insert("journalEntries", {
      userId,
      ...args,
      isPrivate: args.isPrivate ?? true,
      createdAt: now,
      updatedAt: now,
      wordCount,
      readingTime,
    });
  },
});

export const updateJournalEntry = mutation({
  args: {
    entryId: v.id("journalEntries"),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    plainTextContent: v.optional(v.string()),
    mood: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    isPrivate: v.optional(v.boolean()),
    images: v.optional(v.array(v.string())),
    font: v.optional(v.string()),
    theme: v.optional(v.string()),
    isFavorite: v.optional(v.boolean()),
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

    const wordCount = args.plainTextContent ? args.plainTextContent.split(/\s+/).length : entry.wordCount;
    const readingTime = wordCount ? Math.ceil(wordCount / 200) : entry.readingTime;

    return await ctx.db.patch(entryId, {
      ...updates,
      updatedAt: Date.now(),
      wordCount,
      readingTime,
    });
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

export const getUserJournalEntries = query({
  args: {
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return [];
    }

    const limit = args.limit || 20;
    const offset = args.offset || 0;

    const entries = await ctx.db
      .query("journalEntries")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();

    return entries.slice(offset, offset + limit);
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

export const searchJournalEntries = query({
  args: {
    searchTerm: v.string(),
    tags: v.optional(v.array(v.string())),
    mood: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return [];
    }

    const limit = args.limit || 20;
    let entries = await ctx.db
      .query("journalEntries")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(100); // Get more entries for filtering

    // Filter by search term
    if (args.searchTerm) {
      const searchLower = args.searchTerm.toLowerCase();
      entries = entries.filter(entry => 
        entry.title?.toLowerCase().includes(searchLower) ||
        entry.plainTextContent?.toLowerCase().includes(searchLower)
      );
    }

    // Filter by tags
    if (args.tags && args.tags.length > 0) {
      entries = entries.filter(entry => 
        entry.tags?.some(tag => args.tags!.includes(tag))
      );
    }

    // Filter by mood
    if (args.mood) {
      entries = entries.filter(entry => entry.mood === args.mood);
    }

    return entries.slice(0, limit);
  },
});

export const getJournalStats = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return null;
    }

    const entries = await ctx.db
      .query("journalEntries")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const totalEntries = entries.length;
    const totalWords = entries.reduce((sum, entry) => sum + (entry.wordCount || 0), 0);
    const totalReadingTime = entries.reduce((sum, entry) => sum + (entry.readingTime || 0), 0);
    
    // Get entries from last 30 days
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    const recentEntries = entries.filter(entry => entry.createdAt > thirtyDaysAgo);
    
    // Get most used tags
    const tagCounts: Record<string, number> = {};
    entries.forEach(entry => {
      entry.tags?.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });
    
    const topTags = Object.entries(tagCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([tag, count]) => ({ tag, count }));

    // Get mood distribution
    const moodCounts: Record<string, number> = {};
    entries.forEach(entry => {
      if (entry.mood) {
        moodCounts[entry.mood] = (moodCounts[entry.mood] || 0) + 1;
      }
    });

    return {
      totalEntries,
      totalWords,
      totalReadingTime,
      recentEntries: recentEntries.length,
      topTags,
      moodDistribution: moodCounts,
      averageWordsPerEntry: totalEntries > 0 ? Math.round(totalWords / totalEntries) : 0,
      longestStreak: calculateStreak(entries),
    };
  },
});

function calculateStreak(entries: any[]): number {
  if (entries.length === 0) return 0;

  const sortedEntries = entries.sort((a, b) => b.createdAt - a.createdAt);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  let streak = 0;
  let currentDate = new Date(today);
  
  for (const entry of sortedEntries) {
    const entryDate = new Date(entry.createdAt);
    entryDate.setHours(0, 0, 0, 0);
    
    if (entryDate.getTime() === currentDate.getTime()) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else if (entryDate.getTime() < currentDate.getTime()) {
      break;
    }
  }
  
  return streak;
}