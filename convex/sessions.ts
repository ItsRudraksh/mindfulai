import { v } from "convex/values";
import {
  mutation,
  query,
  internalMutation,
  action,
  internalAction,
  internalQuery,
} from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal, api } from "./_generated/api";
import { elevenLabsClient } from "../lib/elevenlabs";

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

    // Check usage limits for free tier users
    if (args.type === "video" || args.type === "voice") {
      const usageType = args.type === "video" ? "videoSessions" : "voiceCalls";
      const usageCheck = await ctx.runMutation(
        api.users.checkAndIncrementUsage,
        {
          type: usageType,
        }
      );

      if (!usageCheck.allowed) {
        throw new Error(
          `You have reached your ${args.type} limit. Upgrade to pro for unlimited access.`
        );
      }
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

    // After successfully completing a session, update the user's goal progress
    const sessionGoal = await ctx.db
      .query("goals")
      .withIndex("by_user_category", (q) =>
        q.eq("userId", userId).eq("category", "sessions")
      )
      .filter((q) => q.eq(q.field("status"), "active"))
      .first();

    if (sessionGoal) {
      const currentProgress = (sessionGoal.progress || 0) + 1;
      await ctx.db.patch(sessionGoal._id, {
        progress: currentProgress,
      });
    }

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

export const internalGetSessionById = internalQuery({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.sessionId);
  },
});

export const updateSessionMood = mutation({
  args: {
    sessionId: v.id("sessions"),
    mood: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.runQuery(api.users.current);
    if (!user) {
      throw new Error("User not found to trigger summary update.");
    }

    const session = await ctx.runQuery(
      internal.sessions.internalGetSessionById,
      {
        sessionId: args.sessionId,
      }
    );
    if (!session || session.userId !== user._id) {
      throw new Error("Session not found or unauthorized");
    }

    await ctx.scheduler.runAfter(
      0,
      internal.sessions.pollAndFetchVoiceSummary,
      {
        sessionId: args.sessionId,
        userId: user._id,
      }
    );

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
    const recordingEvent = tavusData.events?.find(
      (event: any) => event.event_type === "application.recording_ready"
    );
    const transcriptEvent = tavusData.events?.find(
      (event: any) => event.event_type === "application.transcription_ready"
    );
    const perceptionEvent = tavusData.events?.find(
      (event: any) => event.event_type === "application.perception_analysis"
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

    // Update auto-refresh tracking - FIXED: Always increment attempts for any refresh
    const updates: any = {
      metadata: updatedMetadata,
      notes: sessionNotes || session.notes,
      endTime: new Date(tavusData.updated_at).getTime(),
      duration:
        recordingEvent?.properties?.duration ?
          recordingEvent.properties.duration * 1000 // Convert seconds to milliseconds
        : session.duration,
      status: "completed",
      autoRefreshAttempts: (session.autoRefreshAttempts || 0) + 1, // Always increment
      lastAutoRefresh: Date.now(),
    };

    const result = await ctx.db.patch(args.sessionId, updates);

    // If all data is now present, trigger global memory update
    const hasRequiredEvents =
      tavusData.events?.some(
        (e: any) => e.event_type === "application.recording_ready"
      ) &&
      tavusData.events?.some(
        (e: any) => e.event_type === "application.transcription_ready"
      ) &&
      tavusData.events?.some(
        (e: any) => e.event_type === "application.perception_analysis"
      );

    if (hasRequiredEvents) {
      await ctx.scheduler.runAfter(
        0,
        internal.globalMemory.updateGlobalMemoryFromVideoSession,
        {
          userId: userId,
          sessionId: args.sessionId,
        }
      );
    }

    return result;
  },
});

// Enhanced check if session can be auto-refreshed with better conditions
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

    // Check if session has all required events
    const tavusData = session.metadata?.tavusConversationData;
    const hasRequiredEvents =
      tavusData?.events &&
      tavusData.events.find(
        (e: any) => e.event_type === "application.recording_ready"
      ) &&
      tavusData.events.find(
        (e: any) => e.event_type === "application.transcription_ready"
      ) &&
      tavusData.events.find(
        (e: any) => e.event_type === "application.perception_analysis"
      );

    // Can refresh if:
    // 1. Less than 3 attempts made
    // 2. At least 30 seconds since last refresh (to avoid spam)
    // 3. Session is video type and has Tavus session ID
    // 4. Missing any of the required events
    return {
      canRefresh:
        attempts < 5 &&
        timeSinceLastRefresh > 30000 &&
        session.type === "video" &&
        session.metadata?.tavusSessionId &&
        !hasRequiredEvents, // Only refresh if missing events
      attemptsRemaining: Math.max(0, 5 - attempts),
      timeSinceLastRefresh,
      hasRequiredEvents: !!hasRequiredEvents,
      missingEvents:
        !hasRequiredEvents ?
          [
            !tavusData?.events?.find(
              (e: any) => e.event_type === "application.recording_ready"
            ) && "recording",
            !tavusData?.events?.find(
              (e: any) => e.event_type === "application.transcription_ready"
            ) && "transcript",
            !tavusData?.events?.find(
              (e: any) => e.event_type === "application.perception_analysis"
            ) && "perception",
          ].filter(Boolean)
        : [],
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
    const transcriptEvent = tavusData?.events?.find(
      (event: any) => event.event_type === "application.transcription_ready"
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

export const updateVoiceSessionSummary = mutation({
  args: {
    sessionId: v.id("sessions"),
    voiceSessionSummary: v.string(),
  },
  handler: async (ctx, args) => {
    const { sessionId, voiceSessionSummary } = args;
    const session = await ctx.db.get(sessionId);

    if (!session) {
      throw new Error("Session not found");
    }

    return await ctx.db.patch(sessionId, {
      voiceSessionSummary,
    });
  },
});

export const triggerVoiceSummaryAndMemoryUpdate = action({
  args: {
    sessionId: v.id("sessions"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const session = await ctx.runQuery(
      internal.sessions.internalGetSessionById,
      {
        sessionId: args.sessionId,
      }
    );
    if (!session || session.userId !== identity.subject) {
      throw new Error("Session not found or unauthorized");
    }

    await ctx.scheduler.runAfter(
      0,
      internal.sessions.pollAndFetchVoiceSummary,
      {
        sessionId: args.sessionId,
        userId: session.userId,
      }
    );
  },
});

export const pollAndFetchVoiceSummary = internalAction({
  args: {
    sessionId: v.id("sessions"),
    userId: v.id("users"),
    attempt: v.optional(v.number()),
  },
  handler: async (ctx, { sessionId, userId, attempt = 1 }) => {
    const MAX_ATTEMPTS = 3;
    const DELAY_SECONDS = 40;

    const session = await ctx.runQuery(
      internal.sessions.internalGetSessionById,
      {
        sessionId,
      }
    );
    if (!session) {
      console.error(
        `Session not found while polling for voice summary: ${sessionId}`
      );
      return;
    }

    if (session.voiceSessionSummary) {
      await ctx.runAction(
        internal.globalMemory.updateGlobalMemoryFromVoiceSession,
        {
          userId,
          sessionId,
        }
      );
      return;
    }

    if (attempt > MAX_ATTEMPTS) {
      console.error(
        `Failed to fetch voice summary for session ${sessionId} after ${MAX_ATTEMPTS} attempts.`
      );
      return;
    }

    if (!session.elevenlabsConversationId) {
      console.error(
        `No elevenlabsConversationId for session ${sessionId}. Retrying...`
      );
      await ctx.scheduler.runAfter(
        DELAY_SECONDS * 1000,
        internal.sessions.pollAndFetchVoiceSummary,
        {
          sessionId,
          userId,
          attempt: attempt + 1,
        }
      );
      return;
    }

    try {
      const response = await fetch(
        `https://api.elevenlabs.io/v1/convai/conversations/${session.elevenlabsConversationId}`,
        {
          method: "GET",
          headers: {
            "xi-api-key": process.env.ELEVENLABS_API_KEY!,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          `ElevenLabs API failed with status: ${response.status}`
        );
      }

      const conversation = await response.json();
      const summary = conversation?.analysis?.transcript_summary;

      if (summary) {
        await ctx.runMutation(api.sessions.updateVoiceSessionSummary, {
          sessionId,
          voiceSessionSummary: summary,
        });

        await ctx.runAction(
          internal.globalMemory.updateGlobalMemoryFromVoiceSession,
          {
            userId,
            sessionId,
          }
        );
      } else {
        await ctx.scheduler.runAfter(
          DELAY_SECONDS * 1000,
          internal.sessions.pollAndFetchVoiceSummary,
          {
            sessionId,
            userId,
            attempt: attempt + 1,
          }
        );
      }
    } catch (error) {
      console.error(
        `Error fetching summary from ElevenLabs for session ${sessionId}, retrying...`,
        error
      );
      await ctx.scheduler.runAfter(
        DELAY_SECONDS * 1000,
        internal.sessions.pollAndFetchVoiceSummary,
        {
          sessionId,
          userId,
          attempt: attempt + 1,
        }
      );
    }
  },
});

export const getSessionsForUserInLastWeek = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return await ctx.db
      .query("sessions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.gt(q.field("_creationTime"), oneWeekAgo))
      .collect();
  },
});
