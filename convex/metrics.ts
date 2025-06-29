import { query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";

// Query to get weekly session progress
export const getWeeklySessionProgress = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return { current: 0, target: 0, percentage: 0 };
    }

    // Get the user's session goal
    const sessionGoal = await ctx.db
      .query("goals")
      .withIndex("by_user_category", (q) =>
        q.eq("userId", userId).eq("category", "sessions")
      )
      .first();

    const target = sessionGoal?.target ?? 4; // Default to 4 sessions if no goal is set

    // Calculate the start of the week (Sunday)
    const now = new Date();
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    startOfWeek.setHours(0, 0, 0, 0);
    const startOfWeekTimestamp = startOfWeek.getTime();

    // Get completed sessions for the current week
    const completedSessions = await ctx.db
      .query("sessions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) =>
        q.and(
          q.eq(q.field("status"), "completed"),
          q.gte(q.field("startTime"), startOfWeekTimestamp)
        )
      )
      .collect();

    const current = completedSessions.length;
    const percentage = target > 0 ? Math.round((current / target) * 100) : 0;

    return {
      current,
      target,
      percentage,
    };
  },
});

// Query to get weekly mood consistency
export const getWeeklyMoodConsistency = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return { consistency: 0, entries: 0 };
    }

    // Calculate the start of the last 7 days
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

    // Get mood entries for the last 7 days
    const moodEntries = await ctx.db
      .query("moodEntries")
      .withIndex("by_user_and_date", (q) =>
        q.eq("userId", userId).gte("timestamp", sevenDaysAgo)
      )
      .collect();

    if (moodEntries.length === 0) {
      return { consistency: 0, entries: 0 };
    }

    const totalIntensity = moodEntries.reduce(
      (sum, entry) => sum + entry.intensity,
      0
    );
    const maxIntensity = moodEntries.length * 10;
    const consistency =
      maxIntensity > 0 ? Math.round((totalIntensity / maxIntensity) * 100) : 0;

    return {
      consistency,
      entries: moodEntries.length,
    };
  },
});
