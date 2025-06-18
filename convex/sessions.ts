import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const createSession = mutation({
  args: {
    userId: v.id("users"),
    type: v.union(v.literal("video"), v.literal("voice"), v.literal("chat")),
    startTime: v.number(),
    mood: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("sessions", {
      ...args,
      status: "active",
    });
  },
});

export const endSession = mutation({
  args: {
    sessionId: v.id("sessions"),
    endTime: v.number(),
    notes: v.optional(v.string()),
    rating: v.optional(v.number()),
    metadata: v.optional(v.object({
      tavusSessionId: v.optional(v.string()),
      elevenlabsConversationId: v.optional(v.string()),
      recordingUrl: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    const { sessionId, endTime, ...updates } = args;
    const session = await ctx.db.get(sessionId);
    
    if (!session) {
      throw new Error("Session not found");
    }

    const duration = endTime - session.startTime;
    
    return await ctx.db.patch(sessionId, {
      ...updates,
      endTime,
      duration,
      status: "completed",
    });
  },
});

export const updateSessionMetadata = mutation({
  args: {
    sessionId: v.id("sessions"),
    metadata: v.object({
      tavusSessionId: v.optional(v.string()),
      elevenlabsConversationId: v.optional(v.string()),
      recordingUrl: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    return await ctx.db.patch(args.sessionId, {
      metadata: args.metadata,
    });
  },
});

export const getUserSessions = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("sessions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(20);
  },
});

export const getSessionById = query({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.sessionId);
  },
});

export const updateSessionMood = mutation({
  args: {
    sessionId: v.id("sessions"),
    mood: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.patch(args.sessionId, {
      mood: args.mood,
    });
  },
});

export const getActiveSession = query({
  args: { 
    userId: v.id("users"),
    type: v.union(v.literal("video"), v.literal("voice"), v.literal("chat"))
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("sessions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.and(
        q.eq(q.field("type"), args.type),
        q.eq(q.field("status"), "active")
      ))
      .first();
  },
});