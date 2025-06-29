import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,

  users: defineTable({
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
    createdAt: v.optional(v.number()),
    updatedAt: v.optional(v.number()),
    // New fields for onboarding and global memory
    dob: v.optional(v.string()),
    profession: v.optional(v.string()),
    aboutMe: v.optional(v.string()),
    onboardingComplete: v.optional(v.boolean()),
    globalMemory: v.optional(v.string()),
    // Enhanced subscription with usage tracking
    subscription: v.optional(
      v.object({
        plan: v.string(), // "free" or "pro"
        planName: v.string(), // "The sad one" or "The depressed one"
        status: v.optional(
          v.union(
            v.literal("active"),
            v.literal("cancelled"),
            v.literal("expired"),
            v.literal("paused")
          )
        ),
        currentPeriodEnd: v.number(),
        provider: v.optional(v.string()), // "razorpay" or "revenuecat"
        subscriptionId: v.optional(v.string()), // External subscription ID
        // Usage limits for free tier
        limits: v.optional(
          v.object({
            videoSessions: v.number(),
            voiceCalls: v.number(),
            chatMessages: v.number(),
          })
        ),
        // Current usage tracking
        usage: v.object({
          videoSessions: v.number(),
          voiceCalls: v.number(),
          chatMessages: v.number(),
          lastResetDate: v.number(), // When usage was last reset
        }),
      })
    ),
    preferences: v.optional(
      v.object({
        notifications: v.boolean(),
        theme: v.string(),
        language: v.string(),
      })
    ),
  }).index("email", ["email"]),

  sessions: defineTable({
    userId: v.id("users"),
    type: v.union(v.literal("video"), v.literal("voice"), v.literal("chat")),
    status: v.union(
      v.literal("scheduled"),
      v.literal("active"),
      v.literal("completed"),
      v.literal("cancelled")
    ),
    startTime: v.number(),
    endTime: v.optional(v.number()),
    duration: v.optional(v.number()),
    mood: v.optional(v.string()),
    notes: v.optional(v.string()),
    rating: v.optional(v.number()),
    elevenlabsConversationId: v.optional(v.string()),
    elevenlabsCallSid: v.optional(v.string()),
    // Track auto-refresh attempts
    autoRefreshAttempts: v.optional(v.number()),
    lastAutoRefresh: v.optional(v.number()),
    // AI-generated summary
    aiSummary: v.optional(v.string()),
    voiceSessionSummary: v.optional(v.string()),
    metadata: v.optional(
      v.object({
        tavusSessionId: v.optional(v.string()),
        recordingUrl: v.optional(v.string()),
        // Store complete Tavus conversation data
        tavusConversationData: v.optional(v.any()),
      })
    ),
  })
    .index("by_user", ["userId"])
    .index("by_status", ["status"])
    .index("by_type", ["type"]),

  // New table for session ratings and feedback
  sessionRatings: defineTable({
    userId: v.id("users"),
    sessionId: v.id("sessions"),
    rating: v.number(), // 1-5 stars
    feedback: v.optional(v.string()), // Required if rating < 3
    createdAt: v.number(),
    sessionType: v.union(
      v.literal("video"),
      v.literal("voice"),
      v.literal("chat")
    ),
  })
    .index("by_user", ["userId"])
    .index("by_session", ["sessionId"])
    .index("by_rating", ["rating"]),

  chatConversations: defineTable({
    userId: v.id("users"),
    sessionId: v.optional(v.id("sessions")),
    title: v.string(),
    status: v.union(
      v.literal("active"),
      v.literal("completed"),
      v.literal("archived")
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
    lastMessageAt: v.optional(v.number()),
    messageCount: v.number(),
    summary: v.optional(v.string()),
    rollingSummary: v.optional(v.string()), // New field for context management
    tags: v.optional(v.array(v.string())),
  })
    .index("by_user", ["userId"])
    .index("by_status", ["status"])
    .index("by_last_message", ["lastMessageAt"]),

  messages: defineTable({
    sessionId: v.optional(v.id("sessions")),
    conversationId: v.id("chatConversations"),
    userId: v.id("users"),
    content: v.string(),
    originalContent: v.optional(v.string()), // For edited messages
    sender: v.union(v.literal("user"), v.literal("ai")),
    timestamp: v.number(),
    isEdited: v.optional(v.boolean()),
    editedAt: v.optional(v.number()),
    isRegenerated: v.optional(v.boolean()),
    regeneratedAt: v.optional(v.number()),
    parentMessageId: v.optional(v.id("messages")), // For regenerated messages
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
  })
    .index("by_conversation", ["conversationId"])
    .index("by_user", ["userId"])
    .index("by_timestamp", ["timestamp"])
    .index("by_session", ["sessionId"]),

  moodEntries: defineTable({
    userId: v.id("users"),
    mood: v.string(),
    intensity: v.number(),
    notes: v.optional(v.string()),
    timestamp: v.number(),
    triggers: v.optional(v.array(v.string())),
    activities: v.optional(v.array(v.string())),
    aiInsight: v.optional(v.string()), // AI-generated insight for this mood entry
    recommendationsUsed: v.optional(v.array(v.string())), // Track which recommendations user acted on
  })
    .index("by_user", ["userId"])
    .index("by_timestamp", ["timestamp"])
    .index("by_user_and_date", ["userId", "timestamp"]), // For daily mood queries

  journalEntries: defineTable({
    userId: v.id("users"),
    title: v.optional(v.string()),
    content: v.any(),
    mood: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    theme: v.optional(
      v.union(v.literal("light"), v.literal("dark"), v.literal("sepia"))
    ),
    isPrivate: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_created_at", ["createdAt"]),

  goals: defineTable({
    userId: v.id("users"),
    title: v.string(),
    description: v.optional(v.string()),
    category: v.string(),
    targetDate: v.optional(v.number()),
    status: v.union(
      v.literal("active"),
      v.literal("completed"),
      v.literal("paused"),
      v.literal("cancelled")
    ),
    progress: v.number(),
    milestones: v.optional(
      v.array(
        v.object({
          title: v.string(),
          completed: v.boolean(),
          completedAt: v.optional(v.number()),
        })
      )
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_status", ["status"]),

  emergencyContacts: defineTable({
    userId: v.id("users"),
    name: v.string(),
    relationship: v.string(),
    phone: v.string(),
    email: v.optional(v.string()),
    isPrimary: v.boolean(),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),

  // New table for payment transactions
  paymentTransactions: defineTable({
    userId: v.id("users"),
    provider: v.string(), // "razorpay" or "revenuecat"
    transactionId: v.string(), // External transaction ID
    orderId: v.optional(v.string()), // Razorpay order ID
    amount: v.number(),
    currency: v.string(),
    status: v.union(
      v.literal("created"),
      v.literal("authorized"),
      v.literal("captured"),
      v.literal("refunded"),
      v.literal("failed")
    ),
    planName: v.string(), // "The sad one" or "The depressed one"
    metadata: v.optional(v.any()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_transaction_id", ["transactionId"])
    .index("by_status", ["status"]),
});
