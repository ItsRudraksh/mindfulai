import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    email: v.string(),
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    provider: v.string(),
    providerId: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
    subscription: v.optional(v.object({
      plan: v.string(),
      status: v.string(),
      currentPeriodEnd: v.number(),
    })),
    preferences: v.optional(v.object({
      notifications: v.boolean(),
      theme: v.string(),
      language: v.string(),
    })),
  })
    .index("by_email", ["email"])
    .index("by_provider", ["provider", "providerId"]),

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
    metadata: v.optional(v.object({
      tavusSessionId: v.optional(v.string()),
      elevenlabsConversationId: v.optional(v.string()),
      recordingUrl: v.optional(v.string()),
    })),
  })
    .index("by_user", ["userId"])
    .index("by_status", ["status"])
    .index("by_type", ["type"]),

  messages: defineTable({
    sessionId: v.id("sessions"),
    userId: v.id("users"),
    content: v.string(),
    sender: v.union(v.literal("user"), v.literal("ai")),
    timestamp: v.number(),
    metadata: v.optional(v.object({
      mood: v.optional(v.string()),
      sentiment: v.optional(v.string()),
      confidence: v.optional(v.number()),
    })),
  })
    .index("by_session", ["sessionId"])
    .index("by_user", ["userId"])
    .index("by_timestamp", ["timestamp"]),

  moodEntries: defineTable({
    userId: v.id("users"),
    mood: v.string(),
    intensity: v.number(),
    notes: v.optional(v.string()),
    timestamp: v.number(),
    triggers: v.optional(v.array(v.string())),
    activities: v.optional(v.array(v.string())),
  })
    .index("by_user", ["userId"])
    .index("by_timestamp", ["timestamp"]),

  journalEntries: defineTable({
    userId: v.id("users"),
    title: v.optional(v.string()),
    content: v.string(),
    mood: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
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
    milestones: v.optional(v.array(v.object({
      title: v.string(),
      completed: v.boolean(),
      completedAt: v.optional(v.number()),
    }))),
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
  })
    .index("by_user", ["userId"]),
});