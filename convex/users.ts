import { v } from "convex/values";
import {
  mutation,
  query,
  internalQuery,
  internalMutation,
} from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const current = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return null;
    }
    return await ctx.db.get(userId);
  },
});

export const createUserProfile = mutation({
  args: {
    name: v.optional(v.string()),
    email: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }

    const existingUser = await ctx.db.get(userId);
    if (existingUser) {
      // Update existing user
      await ctx.db.patch(userId, {
        name: args.name,
        email: args.email,
        updatedAt: Date.now(),
      });
      return userId;
    }

    // This shouldn't happen with Convex Auth, but just in case
    const now = Date.now();
    await ctx.db.patch(userId, {
      name: args.name,
      email: args.email,
      createdAt: now,
      updatedAt: now,
      onboardingComplete: false, // New users need to complete onboarding
      preferences: {
        notifications: true,
        theme: "dark",
        language: "en",
      },
    });

    return userId;
  },
});

export const updateProfile = mutation({
  args: {
    name: v.optional(v.string()),
    preferences: v.optional(
      v.object({
        notifications: v.boolean(),
        theme: v.string(),
        language: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }

    return await ctx.db.patch(userId, {
      ...args,
      updatedAt: Date.now(),
    });
  },
});

export const updateSubscription = mutation({
  args: {
    userId: v.id("users"),
    subscription: v.object({
      plan: v.string(),
      planName: v.string(),
      status: v.string(),
      currentPeriodEnd: v.number(),
      provider: v.optional(v.string()),
      subscriptionId: v.optional(v.string()),
      limits: v.optional(
        v.object({
          videoSessions: v.number(),
          voiceCalls: v.number(),
          chatMessages: v.number(),
        })
      ),
      usage: v.optional(
        v.object({
          videoSessions: v.number(),
          voiceCalls: v.number(),
          chatMessages: v.number(),
          lastResetDate: v.number(),
        })
      ),
    }),
  },
  handler: async (ctx, args) => {
    return await ctx.db.patch(args.userId, {
      subscription: args.subscription,
      updatedAt: Date.now(),
    });
  },
});

// Internal mutation for server-side subscription updates
export const internalUpdateSubscription = internalMutation({
  args: {
    userId: v.id("users"),
    subscription: v.object({
      plan: v.string(),
      planName: v.string(),
      status: v.string(),
      currentPeriodEnd: v.number(),
      provider: v.optional(v.string()),
      subscriptionId: v.optional(v.string()),
      limits: v.optional(
        v.object({
          videoSessions: v.number(),
          voiceCalls: v.number(),
          chatMessages: v.number(),
        })
      ),
      usage: v.optional(
        v.object({
          videoSessions: v.number(),
          voiceCalls: v.number(),
          chatMessages: v.number(),
          lastResetDate: v.number(),
        })
      ),
    }),
  },
  handler: async (ctx, args) => {
    return await ctx.db.patch(args.userId, {
      subscription: args.subscription,
      updatedAt: Date.now(),
    });
  },
});

// New mutation for onboarding
export const updateUserProfileOnboarding = mutation({
  args: {
    dob: v.string(),
    profession: v.string(),
    aboutMe: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }

    // Set up free tier subscription for new users
    const now = Date.now();
    const oneMonthFromNow = now + 30 * 24 * 60 * 60 * 1000;

    return await ctx.db.patch(userId, {
      ...args,
      onboardingComplete: true,
      subscription: {
        plan: "free",
        planName: "The sad one",
        status: "active",
        currentPeriodEnd: oneMonthFromNow,
        provider: "system",
        limits: {
          videoSessions: 2,
          voiceCalls: 3,
          chatMessages: 50,
        },
        usage: {
          videoSessions: 0,
          voiceCalls: 0,
          chatMessages: 0,
          lastResetDate: now,
        },
      },
      updatedAt: now,
    });
  },
});

// Mutation to update global memory
export const updateGlobalMemory = mutation({
  args: {
    globalMemory: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }

    return await ctx.db.patch(userId, {
      globalMemory: args.globalMemory,
      updatedAt: Date.now(),
    });
  },
});

// Query to check if user has completed onboarding
export const hasCompletedOnboarding = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return false;
    }

    const user = await ctx.db.get(userId);
    return !!user?.onboardingComplete;
  },
});

// Internal query to get user by ID
export const getUserById = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});

// Internal mutation to update global memory
export const internalUpdateGlobalMemory = internalMutation({
  args: {
    userId: v.id("users"),
    globalMemory: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.patch(args.userId, {
      globalMemory: args.globalMemory,
      updatedAt: Date.now(),
    });
  },
});

// New mutation to check and increment usage
export const checkAndIncrementUsage = mutation({
  args: {
    type: v.union(
      v.literal("videoSessions"),
      v.literal("voiceCalls"),
      v.literal("chatMessages")
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db.get(userId);
    if (!user || !user.subscription) {
      throw new Error("User subscription not found");
    }

    const subscription = user.subscription;

    // If user is on pro plan, allow unlimited usage
    if (subscription.plan === "pro") {
      return { allowed: true, remaining: -1 }; // -1 indicates unlimited
    }

    // Check if usage needs to be reset (monthly reset)
    const now = Date.now();
    const lastReset = subscription.usage?.lastResetDate || 0;
    const oneMonthAgo = now - 30 * 24 * 60 * 60 * 1000;

    let currentUsage = subscription.usage || {
      videoSessions: 0,
      voiceCalls: 0,
      chatMessages: 0,
      lastResetDate: now,
    };

    // Reset usage if it's been more than a month
    if (lastReset < oneMonthAgo) {
      currentUsage = {
        videoSessions: 0,
        voiceCalls: 0,
        chatMessages: 0,
        lastResetDate: now,
      };
    }

    const limits = subscription.limits || {
      videoSessions: 2,
      voiceCalls: 3,
      chatMessages: 50,
    };

    const currentCount = currentUsage[args.type];
    const limit = limits[args.type];

    // Check if user has reached the limit
    if (currentCount >= limit) {
      return {
        allowed: false,
        remaining: 0,
        limit: limit,
        current: currentCount,
      };
    }

    // Increment usage
    const newUsage = {
      ...currentUsage,
      [args.type]: currentCount + 1,
    };

    // Update user subscription
    await ctx.db.patch(userId, {
      subscription: {
        ...subscription,
        usage: newUsage,
      },
      updatedAt: now,
    });

    return {
      allowed: true,
      remaining: limit - (currentCount + 1),
      limit: limit,
      current: currentCount + 1,
    };
  },
});

// Query to get user's current usage
export const getUserUsage = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return null;
    }

    const user = await ctx.db.get(userId);
    if (!user || !user.subscription) {
      return null;
    }

    const subscription = user.subscription;

    // Check if usage needs to be reset
    const now = Date.now();
    const lastReset = subscription.usage?.lastResetDate || 0;
    const oneMonthAgo = now - 30 * 24 * 60 * 60 * 1000;

    let currentUsage = subscription.usage || {
      videoSessions: 0,
      voiceCalls: 0,
      chatMessages: 0,
      lastResetDate: now,
    };

    // Reset usage if it's been more than a month
    if (lastReset < oneMonthAgo) {
      currentUsage = {
        videoSessions: 0,
        voiceCalls: 0,
        chatMessages: 0,
        lastResetDate: now,
      };
    }

    return {
      plan: subscription.plan,
      planName: subscription.planName,
      status: subscription.status,
      limits: subscription.limits || {
        videoSessions: 2,
        voiceCalls: 3,
        chatMessages: 50,
      },
      usage: currentUsage,
    };
  },
});
