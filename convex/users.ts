import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const createUser = mutation({
  args: {
    email: v.string(),
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    provider: v.string(),
    providerId: v.string(),
  },
  handler: async (ctx, args) => {
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (existingUser) {
      return existingUser._id;
    }

    const now = Date.now();
    return await ctx.db.insert("users", {
      ...args,
      createdAt: now,
      updatedAt: now,
      preferences: {
        notifications: true,
        theme: "light",
        language: "en",
      },
    });
  },
});

export const getUserByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
  },
});

export const getUserById = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});

export const updateUser = mutation({
  args: {
    userId: v.id("users"),
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    preferences: v.optional(v.object({
      notifications: v.boolean(),
      theme: v.string(),
      language: v.string(),
    })),
  },
  handler: async (ctx, args) => {
    const { userId, ...updates } = args;
    return await ctx.db.patch(userId, {
      ...updates,
      updatedAt: Date.now(),
    });
  },
});

export const updateSubscription = mutation({
  args: {
    userId: v.id("users"),
    subscription: v.object({
      plan: v.string(),
      status: v.string(),
      currentPeriodEnd: v.number(),
    }),
  },
  handler: async (ctx, args) => {
    const { userId, subscription } = args;
    return await ctx.db.patch(userId, {
      subscription,
      updatedAt: Date.now(),
    });
  },
});