import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { api } from "./_generated/api";

export const createMessage = mutation({
  args: {
    conversationId: v.id("chatConversations"),
    content: v.string(),
    sender: v.union(v.literal("user"), v.literal("ai")),
    metadata: v.optional(
      v.object({
        mood: v.optional(v.string()),
        sentiment: v.optional(v.string()),
        confidence: v.optional(v.number()),
        flagged: v.optional(v.boolean()),
        flagReason: v.optional(v.string()),
        aiModel: v.optional(v.string()),
        tokens: v.optional(v.number()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }

    // Verify conversation ownership
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation || conversation.userId !== userId) {
      throw new Error("Conversation not found or unauthorized");
    }

    // Check usage limits for free tier users (only for user messages)
    if (args.sender === "user") {
      const usageCheck = await ctx.runMutation(api.users.checkAndIncrementUsage, {
        type: "chatMessages",
      });

      if (!usageCheck.allowed) {
        throw new Error("You have reached your chat message limit. Upgrade to pro for unlimited messaging.");
      }
    }

    const messageId = await ctx.db.insert("messages", {
      ...args,
      userId,
      timestamp: Date.now(),
    });

    // Update conversation activity
    const messageCount = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
      .collect()
      .then(messages => messages.length);

    await ctx.db.patch(args.conversationId, {
      lastMessageAt: Date.now(),
      updatedAt: Date.now(),
      messageCount,
    });

    return messageId;
  },
});

export const getConversationMessages = query({
  args: { 
    conversationId: v.id("chatConversations"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }

    // Verify conversation ownership
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation || conversation.userId !== userId) {
      throw new Error("Conversation not found or unauthorized");
    }

    const limit = args.limit || 100;
    return await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
      .order("asc")
      .take(limit);
  },
});

export const editMessage = mutation({
  args: {
    messageId: v.id("messages"),
    newContent: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }

    const message = await ctx.db.get(args.messageId);
    if (!message || message.userId !== userId) {
      throw new Error("Message not found or unauthorized");
    }

    // Only allow editing user messages
    if (message.sender !== "user") {
      throw new Error("Can only edit user messages");
    }

    return await ctx.db.patch(args.messageId, {
      originalContent: message.content,
      content: args.newContent,
      isEdited: true,
      editedAt: Date.now(),
    });
  },
});

export const regenerateMessage = mutation({
  args: {
    messageId: v.id("messages"),
    newContent: v.string(),
    metadata: v.optional(
      v.object({
        aiModel: v.optional(v.string()),
        tokens: v.optional(v.number()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }

    const originalMessage = await ctx.db.get(args.messageId);
    if (!originalMessage || originalMessage.userId !== userId) {
      throw new Error("Message not found or unauthorized");
    }

    // Only allow regenerating AI messages
    if (originalMessage.sender !== "ai") {
      throw new Error("Can only regenerate AI messages");
    }

    return await ctx.db.patch(args.messageId, {
      originalContent: originalMessage.content,
      content: args.newContent,
      isRegenerated: true,
      regeneratedAt: Date.now(),
      metadata: {
        ...originalMessage.metadata,
        ...args.metadata,
      },
    });
  },
});

export const deleteMessage = mutation({
  args: { messageId: v.id("messages") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }

    const message = await ctx.db.get(args.messageId);
    if (!message || message.userId !== userId) {
      throw new Error("Message not found or unauthorized");
    }

    await ctx.db.delete(args.messageId);

    // Update conversation message count
    const messageCount = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) => q.eq("conversationId", message.conversationId))
      .collect()
      .then(messages => messages.length);

    await ctx.db.patch(message.conversationId, {
      messageCount,
      updatedAt: Date.now(),
    });
  },
});

export const deleteMessagesAfter = mutation({
  args: {
    conversationId: v.id("chatConversations"),
    fromTimestamp: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }

    // Verify conversation ownership
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation || conversation.userId !== userId) {
      throw new Error("Conversation not found or unauthorized");
    }

    // Get all messages from the timestamp onwards
    const messagesToDelete = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
      .filter((q) => q.gte(q.field("timestamp"), args.fromTimestamp))
      .collect();

    // Delete all messages
    for (const message of messagesToDelete) {
      await ctx.db.delete(message._id);
    }

    // Update conversation message count
    const remainingMessageCount = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
      .collect()
      .then(messages => messages.length);

    await ctx.db.patch(args.conversationId, {
      messageCount: remainingMessageCount,
      updatedAt: Date.now(),
    });

    return messagesToDelete.length;
  },
});

export const flagMessage = mutation({
  args: {
    messageId: v.id("messages"),
    flagReason: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }

    const message = await ctx.db.get(args.messageId);
    if (!message || message.userId !== userId) {
      throw new Error("Message not found or unauthorized");
    }

    return await ctx.db.patch(args.messageId, {
      metadata: {
        ...message.metadata,
        flagged: true,
        flagReason: args.flagReason,
      },
    });
  },
});