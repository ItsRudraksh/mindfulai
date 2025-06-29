import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const createPaymentTransaction = mutation({
  args: {
    provider: v.string(),
    transactionId: v.string(),
    orderId: v.optional(v.string()),
    amount: v.number(),
    currency: v.string(),
    status: v.union(
      v.literal("created"),
      v.literal("authorized"),
      v.literal("captured"),
      v.literal("refunded"),
      v.literal("failed")
    ),
    planName: v.string(),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }

    const now = Date.now();
    return await ctx.db.insert("paymentTransactions", {
      userId,
      ...args,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updatePaymentTransaction = mutation({
  args: {
    transactionId: v.string(),
    status: v.union(
      v.literal("created"),
      v.literal("authorized"),
      v.literal("captured"),
      v.literal("refunded"),
      v.literal("failed")
    ),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }

    const transaction = await ctx.db
      .query("paymentTransactions")
      .withIndex("by_transaction_id", (q) => q.eq("transactionId", args.transactionId))
      .filter((q) => q.eq(q.field("userId"), userId))
      .first();

    if (!transaction) {
      throw new Error("Transaction not found");
    }

    return await ctx.db.patch(transaction._id, {
      status: args.status,
      metadata: args.metadata,
      updatedAt: Date.now(),
    });
  },
});

export const getUserTransactions = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return [];
    }

    const limit = args.limit || 20;
    return await ctx.db
      .query("paymentTransactions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(limit);
  },
});

export const getTransactionByTransactionId = query({
  args: { transactionId: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return null;
    }

    return await ctx.db
      .query("paymentTransactions")
      .withIndex("by_transaction_id", (q) => q.eq("transactionId", args.transactionId))
      .filter((q) => q.eq(q.field("userId"), userId))
      .first();
  },
});

// Internal mutation for webhook updates
export const internalUpdatePaymentTransaction = internalMutation({
  args: {
    transactionId: v.string(),
    status: v.union(
      v.literal("created"),
      v.literal("authorized"),
      v.literal("captured"),
      v.literal("refunded"),
      v.literal("failed")
    ),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const transaction = await ctx.db
      .query("paymentTransactions")
      .withIndex("by_transaction_id", (q) => q.eq("transactionId", args.transactionId))
      .first();

    if (!transaction) {
      throw new Error("Transaction not found");
    }

    return await ctx.db.patch(transaction._id, {
      status: args.status,
      metadata: args.metadata,
      updatedAt: Date.now(),
    });
  },
});