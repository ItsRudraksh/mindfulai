import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
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
    subscription: v.object({
      plan: v.string(),
      status: v.string(),
      currentPeriodEnd: v.number(),
    }),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }

    return await ctx.db.patch(userId, {
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

    return await ctx.db.patch(userId, {
      ...args,
      onboardingComplete: true,
      updatedAt: Date.now(),
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