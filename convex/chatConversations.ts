import { v } from "convex/values";
import { mutation, query, internalQuery, action } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { generateConversationSummary, ChatMessage } from "../lib/ai";
import { api } from "./_generated/api";

export const createConversation = mutation({
  args: {
    title: v.optional(v.string()),
    sessionId: v.optional(v.id("sessions")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }

    const now = Date.now();
    const title =
      args.title || `Chat Session - ${new Date(now).toLocaleDateString()}`;

    return await ctx.db.insert("chatConversations", {
      userId,
      sessionId: args.sessionId,
      title,
      status: "active",
      createdAt: now,
      updatedAt: now,
      messageCount: 0,
      rollingSummary: "", // Initialize empty rolling summary
    });
  },
});

export const getUserConversations = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return [];
    }

    return await ctx.db
      .query("chatConversations")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(50);
  },
});

export const getConversationById = query({
  args: { conversationId: v.id("chatConversations") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }

    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation || conversation.userId !== userId) {
      throw new Error("Conversation not found or unauthorized");
    }

    return conversation;
  },
});

export const updateConversation = mutation({
  args: {
    conversationId: v.id("chatConversations"),
    title: v.optional(v.string()),
    status: v.optional(
      v.union(
        v.literal("active"),
        v.literal("completed"),
        v.literal("archived")
      )
    ),
    summary: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }

    const { conversationId, ...updates } = args;
    const conversation = await ctx.db.get(conversationId);

    if (!conversation || conversation.userId !== userId) {
      throw new Error("Conversation not found or unauthorized");
    }

    return await ctx.db.patch(conversationId, {
      ...updates,
      updatedAt: Date.now(),
    });
  },
});

export const updateConversationSummary = mutation({
  args: {
    conversationId: v.id("chatConversations"),
    rollingSummary: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }

    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation || conversation.userId !== userId) {
      throw new Error("Conversation not found or unauthorized");
    }

    return await ctx.db.patch(args.conversationId, {
      rollingSummary: args.rollingSummary,
      updatedAt: Date.now(),
    });
  },
});

export const deleteConversation = mutation({
  args: { conversationId: v.id("chatConversations") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }

    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation || conversation.userId !== userId) {
      throw new Error("Conversation not found or unauthorized");
    }

    // Delete all messages in this conversation
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", args.conversationId)
      )
      .collect();

    for (const message of messages) {
      await ctx.db.delete(message._id);
    }

    // Delete the conversation
    await ctx.db.delete(args.conversationId);
  },
});

export const updateConversationActivity = mutation({
  args: {
    conversationId: v.id("chatConversations"),
    messageCount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }

    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation || conversation.userId !== userId) {
      throw new Error("Conversation not found or unauthorized");
    }

    const now = Date.now();
    const updates: any = {
      lastMessageAt: now,
      updatedAt: now,
    };

    if (args.messageCount !== undefined) {
      updates.messageCount = args.messageCount;
    }

    return await ctx.db.patch(args.conversationId, updates);
  },
});

export const internalGetConversationById = internalQuery({
  args: { conversationId: v.id("chatConversations") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.conversationId);
  },
});

export const summarizeConversation = action({
  args: {
    conversationId: v.id("chatConversations"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const conversation = await ctx.runQuery(
      api.chatConversations.getConversationById,
      {
        conversationId: args.conversationId,
      }
    );

    if (!conversation) {
      throw new Error("Conversation not found");
    }

    const messages = await ctx.runQuery(api.messages.getConversationMessages, {
      conversationId: args.conversationId,
    });

    if (!messages || messages.length === 0) {
      console.log(
        `No messages in conversation ${args.conversationId} to summarize.`
      );
      return;
    }

    const chatMessages: ChatMessage[] = messages.map((msg: any) => ({
      role: msg.sender === "user" ? "user" : "assistant",
      content: msg.content,
    }));

    const summary = await generateConversationSummary(
      chatMessages,
      conversation.rollingSummary ?? undefined
    );

    if (summary && summary !== conversation.rollingSummary) {
      await ctx.runMutation(api.chatConversations.updateConversationSummary, {
        conversationId: args.conversationId,
        rollingSummary: summary,
      });
    }
  },
});
