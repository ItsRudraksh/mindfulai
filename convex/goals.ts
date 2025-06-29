import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getGoalsByCategory = query({
  args: {
    category: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    return await ctx.db
      .query("goals")
      .withIndex("by_user_category", (q) =>
        q.eq("userId", userId).eq("category", args.category)
      )
      .collect();
  },
});

export const addOrUpdateGoal = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    category: v.string(),
    target: v.optional(v.number()),
    targetDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const existingGoal = await ctx.db
      .query("goals")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("category"), args.category))
      .first();

    const now = Date.now();

    if (existingGoal) {
      // Update existing goal
      await ctx.db.patch(existingGoal._id, {
        ...args,
        updatedAt: now,
      });
      return existingGoal._id;
    } else {
      // Create new goal
      return await ctx.db.insert("goals", {
        userId,
        ...args,
        status: "active",
        progress: 0,
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});
