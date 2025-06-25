import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const createSession = mutation({
  args: {
    type: v.union(v.literal("video"), v.literal("voice"), v.literal("chat")),
    startTime: v.number(),
    mood: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }

    return await ctx.db.insert("sessions", {
      userId,
      ...args,
      status: "active",
      metadata: {},
      autoRefreshAttempts: 0,
    });
  },
});

export const endSession = mutation({
  args: {
    sessionId: v.id("sessions"),
    endTime: v.number(),
    notes: v.optional(v.string()),
    rating: v.optional(v.number()),
    metadata: v.optional(
      v.object({
        tavusSessionId: v.optional(v.string()),
        elevenlabsConversationId: v.optional(v.string()),
        recordingUrl: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }

    const { sessionId, endTime, ...updates } = args;
    const session = await ctx.db.get(sessionId);

    if (!session || session.userId !== userId) {
      throw new Error("Session not found or unauthorized");
    }

    const duration = endTime - session.startTime;

    return await ctx.db.patch(sessionId, {
      ...updates,
      endTime,
      duration,
      status: "completed",
    });
  },
});

export const updateSessionMetadata = mutation({
  args: {
    sessionId: v.id("sessions"),
    metadata: v.object({
      tavusSessionId: v.optional(v.string()),
      recordingUrl: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }

    const session = await ctx.db.get(args.sessionId);
    if (!session || session.userId !== userId) {
      throw new Error("Session not found or unauthorized");
    }

    // Merge new metadata with existing metadata
    const existingMetadata = session.metadata || {};
    const newMetadata = {
      ...existingMetadata,
      ...args.metadata,
    };

    return await ctx.db.patch(args.sessionId, {
      metadata: newMetadata,
    });
  },
});

export const updateElevenLabsSessionIds = mutation({
  args: {
    sessionId: v.id("sessions"),
    elevenlabsConversationId: v.optional(v.string()),
    elevenlabsCallSid: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }

    const session = await ctx.db.get(args.sessionId);
    if (!session || session.userId !== userId) {
      throw new Error("Session not found or unauthorized");
    }

    const updates: {
      elevenlabsConversationId?: string;
      elevenlabsCallSid?: string;
    } = {};
    if (args.elevenlabsConversationId !== undefined) {
      updates.elevenlabsConversationId = args.elevenlabsConversationId;
    }
    if (args.elevenlabsCallSid !== undefined) {
      updates.elevenlabsCallSid = args.elevenlabsCallSid;
    }

    return await ctx.db.patch(args.sessionId, updates);
  },
});

export const getUserSessions = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return [];
    }

    return await ctx.db
      .query("sessions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(20);
  },
});

export const getSessionById = query({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }

    const session = await ctx.db.get(args.sessionId);
    if (!session || session.userId !== userId) {
      throw new Error("Session not found or unauthorized");
    }

    return session;
  },
});

export const updateSessionMood = mutation({
  args: {
    sessionId: v.id("sessions"),
    mood: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }

    const session = await ctx.db.get(args.sessionId);
    if (!session || session.userId !== userId) {
      throw new Error("Session not found or unauthorized");
    }

    return await ctx.db.patch(args.sessionId, {
      mood: args.mood,
    });
  },
});

export const getActiveSession = query({
  args: {
    type: v.union(v.literal("video"), v.literal("voice"), v.literal("chat")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return null;
    }

    return await ctx.db
      .query("sessions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) =>
        q.and(
          q.eq(q.field("type"), args.type),
          q.eq(q.field("status"), "active")
        )
      )
      .first();
  },
});

// New mutation to store complete Tavus conversation data with auto-refresh tracking
export const storeTavusConversationData = mutation({
  args: {
    sessionId: v.id("sessions"),
    tavusConversationData: v.any(),
    isAutoRefresh: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }

    const session = await ctx.db.get(args.sessionId);
    if (!session || session.userId !== userId) {
      throw new Error("Session not found or unauthorized");
    }

    // Extract useful information from Tavus data
    const tavusData = args.tavusConversationData;
    const recordingEvent = tavusData.events?.find((event: any) => 
      event.event_type === "application.recording_ready"
    );
    const transcriptEvent = tavusData.events?.find((event: any) => 
      event.event_type === "application.transcription_ready"
    );
    const perceptionEvent = tavusData.events?.find((event: any) => 
      event.event_type === "application.perception_analysis"
    );

    // Build recording URL if available
    let recordingUrl = "";
    if (recordingEvent?.properties) {
      const { bucket_name, s3_key } = recordingEvent.properties;
      if (bucket_name && s3_key) {
        recordingUrl = `https://${bucket_name}.s3.amazonaws.com/${s3_key}`;
      }
    }

    // Extract notes from transcript and perception analysis
    let sessionNotes = "";
    if (transcriptEvent?.properties?.transcript) {
      const transcript = transcriptEvent.properties.transcript;
      const userMessages = transcript.filter((msg: any) => msg.role === "user");
      sessionNotes += `Transcript Summary: ${userMessages.length} user messages exchanged. `;
    }
    
    if (perceptionEvent?.properties?.analysis) {
      sessionNotes += `Perception Analysis: ${perceptionEvent.properties.analysis.substring(0, 200)}...`;
    }

    // Update session with complete data
    const existingMetadata = session.metadata || {};
    const updatedMetadata = {
      ...existingMetadata,
      tavusConversationData: tavusData,
      recordingUrl: recordingUrl || existingMetadata.recordingUrl,
    };

    // Update auto-refresh tracking if this is an auto-refresh
    const updates: any = {
      metadata: updatedMetadata,
      notes: sessionNotes || session.notes,
      endTime: new Date(tavusData.updated_at).getTime(),
      duration: recordingEvent?.properties?.duration ? 
        recordingEvent.properties.duration * 1000 : // Convert seconds to milliseconds
        session.duration,
      status: "completed",
    };

    if (args.isAutoRefresh) {
      updates.autoRefreshAttempts = (session.autoRefreshAttempts || 0) + 1;
      updates.lastAutoRefresh = Date.now();
    }

    return await ctx.db.patch(args.sessionId, updates);
  },
});

// Check if session can be auto-refreshed
export const canAutoRefreshSession = query({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }

    const session = await ctx.db.get(args.sessionId);
    if (!session || session.userId !== userId) {
      throw new Error("Session not found or unauthorized");
    }

    const attempts = session.autoRefreshAttempts || 0;
    const lastRefresh = session.lastAutoRefresh || 0;
    const now = Date.now();
    const timeSinceLastRefresh = now - lastRefresh;

    // Can refresh if:
    // 1. Less than 3 attempts made
    // 2. At least 30 seconds since last refresh (to avoid spam)
    // 3. Session is video type and has Tavus session ID
    return {
      canRefresh: attempts < 3 && 
                  timeSinceLastRefresh > 30000 && 
                  session.type === "video" && 
                  session.metadata?.tavusSessionId,
      attemptsRemaining: Math.max(0, 3 - attempts),
      timeSinceLastRefresh,
    };
  },
});

// Generate AI summary for session transcript
export const generateAISummary = mutation({
  args: {
    sessionId: v.id("sessions"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }

    const session = await ctx.db.get(args.sessionId);
    if (!session || session.userId !== userId) {
      throw new Error("Session not found or unauthorized");
    }

    // Extract transcript from session data
    const tavusData = session.metadata?.tavusConversationData;
    const transcriptEvent = tavusData?.events?.find((event: any) => 
      event.event_type === "application.transcription_ready"
    );

    if (!transcriptEvent?.properties?.transcript) {
      throw new Error("No transcript available for this session");
    }

    // The AI summary will be generated via API call
    // For now, we'll mark that a summary is being generated
    await ctx.db.patch(args.sessionId, {
      aiSummary: "generating...",
    });

    return { success: true, message: "AI summary generation started" };
  },
});

// Update AI summary after generation
export const updateAISummary = mutation({
  args: {
    sessionId: v.id("sessions"),
    aiSummary: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }

    const session = await ctx.db.get(args.sessionId);
    if (!session || session.userId !== userId) {
      throw new Error("Session not found or unauthorized");
    }

    return await ctx.db.patch(args.sessionId, {
      aiSummary: args.aiSummary,
    });
  },
});