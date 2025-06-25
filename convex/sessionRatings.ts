import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const createSessionRating = mutation({
  args: {
    sessionId: v.id("sessions"),
    rating: v.number(),
    feedback: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }

    // Verify session ownership
    const session = await ctx.db.get(args.sessionId);
    if (!session || session.userId !== userId) {
      throw new Error("Session not found or unauthorized");
    }

    // Check if rating already exists
    const existingRating = await ctx.db
      .query("sessionRatings")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .first();

    if (existingRating) {
      // Update existing rating
      return await ctx.db.patch(existingRating._id, {
        rating: args.rating,
        feedback: args.feedback,
      });
    } else {
      // Create new rating
      return await ctx.db.insert("sessionRatings", {
        userId,
        sessionId: args.sessionId,
        rating: args.rating,
        feedback: args.feedback,
        createdAt: Date.now(),
        sessionType: session.type,
      });
    }
  },
});

export const getSessionRating = query({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return null;
    }

    return await ctx.db
      .query("sessionRatings")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .filter((q) => q.eq(q.field("userId"), userId))
      .first();
  },
});

export const getUserRatings = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return [];
    }

    const limit = args.limit || 50;
    return await ctx.db
      .query("sessionRatings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(limit);
  },
});