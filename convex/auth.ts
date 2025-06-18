import { v } from "convex/values";
import { mutation, action } from "./_generated/server";
import bcrypt from "bcryptjs";
import { api } from "./_generated/api";

export const createOrUpdateUser = mutation({
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
      .withIndex("by_provider", (q) =>
        q.eq("provider", args.provider).eq("providerId", args.providerId)
      )
      .first();

    if (existingUser) {
      // Update existing user
      await ctx.db.patch(existingUser._id, {
        email: args.email,
        name: args.name,
        image: args.image,
        updatedAt: Date.now(),
      });
      return existingUser._id;
    }

    // Create new user
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

export const signUpAction = action({
  args: {
    email: v.string(),
    password: v.string(),
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    provider: v.string(),
    providerId: v.string(),
  },
  handler: async (ctx, args) => {
    const hashedPassword = await bcrypt.hash(args.password, 10);

    // Call the createUser mutation with the hashed password
    return await ctx.runMutation(api.users.createUser, {
      email: args.email,
      hashedPassword,
      name: args.name,
      image: args.image,
      provider: args.provider,
      providerId: args.providerId,
    });
  },
});
