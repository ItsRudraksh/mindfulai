import { v } from "convex/values";
import { action, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { updateGlobalMemory } from "./users";
import {
  generateInitialGlobalMemory,
  updateGlobalMemoryWithContext,
} from "../lib/ai";

// Create initial global memory after onboarding
export const createInitialGlobalMemory = action({
  args: {
    userId: v.id("users"),
    dob: v.string(),
    profession: v.string(),
    aboutMe: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      // Get user data
      const user = await ctx.runQuery(internal.users.getUserById, {
        userId: args.userId,
      });
      if (!user) {
        throw new Error("User not found");
      }

      // Generate initial global memory
      const globalMemory = await generateInitialGlobalMemory({
        name: user.name || "User",
        dob: args.dob,
        profession: args.profession,
        aboutMe: args.aboutMe,
      });

      // Save to database
      await ctx.runMutation(internal.users.internalUpdateGlobalMemory, {
        userId: args.userId,
        globalMemory,
      });

      return { success: true, message: "Global memory created successfully" };
    } catch (error) {
      console.error("Error creating initial global memory:", error);
      return { success: false, error: "Failed to create global memory" };
    }
  },
});

// Update global memory from mood entries
export const updateGlobalMemoryFromMood = internalAction({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    try {
      // Get user's global memory
      const user = await ctx.runQuery(internal.users.getUserById, {
        userId: args.userId,
      });
      if (!user || !user.globalMemory) {
        return { success: false, error: "Global memory not found" };
      }

      // Get recent mood entries
      const moodEntries = await ctx.runQuery(
        internal.moodEntries.internalGetMoodEntriesForToday,
        { userId: args.userId }
      );

      if (!moodEntries || moodEntries.length === 0) {
        return { success: false, error: "No mood entries found" };
      }

      // Format mood entries for AI
      const formattedEntries = moodEntries.map((entry: any) => ({
        mood: entry.mood,
        intensity: entry.intensity,
        timestamp: entry.timestamp,
        notes: entry.notes || "",
        aiInsight: entry.aiInsight || "",
      }));

      // Update global memory
      const updatedMemory = await updateGlobalMemoryWithContext(
        user.globalMemory,
        {
          type: "mood_entries",
          data: formattedEntries,
        }
      );

      // Save updated memory
      await ctx.runMutation(internal.users.internalUpdateGlobalMemory, {
        userId: args.userId,
        globalMemory: updatedMemory,
      });

      return { success: true, message: "Global memory updated with mood data" };
    } catch (error) {
      console.error("Error updating global memory from mood:", error);
      return { success: false, error: "Failed to update global memory" };
    }
  },
});

// Update global memory from video session
export const updateGlobalMemoryFromVideoSession = internalAction({
  args: {
    userId: v.id("users"),
    sessionId: v.id("sessions"),
  },
  handler: async (ctx, args) => {
    try {
      // Get user's global memory
      const user = await ctx.runQuery(internal.users.getUserById, {
        userId: args.userId,
      });
      if (!user || !user.globalMemory) {
        return { success: false, error: "Global memory not found" };
      }

      // Get session data
      const session = await ctx.runQuery(
        internal.sessions.internalGetSessionById,
        {
          sessionId: args.sessionId,
        }
      );

      if (!session) {
        return { success: false, error: "Session not found" };
      }

      // Extract transcript from Tavus data
      const tavusData = session.metadata?.tavusConversationData;
      const transcriptEvent = tavusData?.events?.find(
        (event: any) => event.event_type === "application.transcription_ready"
      );

      if (!transcriptEvent?.properties?.transcript) {
        return { success: false, error: "No transcript available" };
      }

      // Format transcript for AI
      const transcript = transcriptEvent.properties.transcript;

      // Update global memory
      const updatedMemory = await updateGlobalMemoryWithContext(
        user.globalMemory,
        {
          type: "video_session",
          data: {
            transcript,
            sessionId: session._id,
            startTime: session.startTime,
            duration: session.duration,
            mood: session.mood,
            aiSummary: session.aiSummary,
          },
        }
      );

      // Save updated memory
      await ctx.runMutation(internal.users.internalUpdateGlobalMemory, {
        userId: args.userId,
        globalMemory: updatedMemory,
      });

      return {
        success: true,
        message: "Global memory updated with video session data",
      };
    } catch (error) {
      console.error("Error updating global memory from video session:", error);
      return { success: false, error: "Failed to update global memory" };
    }
  },
});

// Update global memory from voice session
export const updateGlobalMemoryFromVoiceSession = internalAction({
  args: {
    userId: v.id("users"),
    sessionId: v.id("sessions"),
  },
  handler: async (ctx, args) => {
    try {
      // Get user's global memory
      const user = await ctx.runQuery(internal.users.getUserById, {
        userId: args.userId,
      });
      if (!user || !user.globalMemory) {
        return { success: false, error: "Global memory not found" };
      }

      // Get session data
      const session = await ctx.runQuery(
        internal.sessions.internalGetSessionById,
        {
          sessionId: args.sessionId,
        }
      );

      if (!session) {
        return { success: false, error: "Session not found" };
      }

      // For voice sessions, we use the notes field which contains the transcript summary
      if (!session.voiceSessionSummary) {
        return { success: false, error: "No transcript summary available" };
      }

      // Update global memory
      const updatedMemory = await updateGlobalMemoryWithContext(
        user.globalMemory,
        {
          type: "voice_session",
          data: {
            transcriptSummary: session.voiceSessionSummary,
            sessionId: session._id,
            startTime: session.startTime,
            duration: session.duration,
            mood: session.mood,
          },
        }
      );

      // Save updated memory
      await ctx.runMutation(internal.users.internalUpdateGlobalMemory, {
        userId: args.userId,
        globalMemory: updatedMemory,
      });

      return {
        success: true,
        message: "Global memory updated with voice session data",
      };
    } catch (error) {
      console.error("Error updating global memory from voice session:", error);
      return { success: false, error: "Failed to update global memory" };
    }
  },
});

// Update global memory from journal entries
export const updateGlobalMemoryFromJournal = internalAction({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    try {
      // Get user's global memory
      const user = await ctx.runQuery(internal.users.getUserById, {
        userId: args.userId,
      });
      if (!user || !user.globalMemory) {
        return { success: false, error: "Global memory not found" };
      }

      // Get recent journal entries (last 3)
      const journalEntries = await ctx.runQuery(
        internal.journalEntries.internalGetUserJournalEntries,
        {
          // Assuming getUserJournalEntries is scoped to the user, no need for userId
          userId: args.userId,
          limit: 3,
        }
      );

      if (!journalEntries || journalEntries.length === 0) {
        return { success: false, error: "No journal entries found" };
      }

      // Format journal entries for AI
      const formattedEntries = journalEntries.map((entry: any) => ({
        title: entry.title,
        content: JSON.stringify(entry.content),
        createdAt: entry.createdAt,
        updatedAt: entry.updatedAt,
        tags: entry.tags || [],
      }));

      // Update global memory
      const updatedMemory = await updateGlobalMemoryWithContext(
        user.globalMemory,
        {
          type: "journal_entries",
          data: formattedEntries,
        }
      );

      // Save updated memory
      await ctx.runMutation(internal.users.internalUpdateGlobalMemory, {
        userId: args.userId,
        globalMemory: updatedMemory,
      });

      return {
        success: true,
        message: "Global memory updated with journal data",
      };
    } catch (error) {
      console.error("Error updating global memory from journal:", error);
      return { success: false, error: "Failed to update global memory" };
    }
  },
});

// Update global memory from chat
export const updateGlobalMemoryFromChat = internalAction({
  args: {
    userId: v.id("users"),
    conversationId: v.id("chatConversations"),
  },
  handler: async (ctx, args) => {
    try {
      // Get user's global memory
      const user = await ctx.runQuery(internal.users.getUserById, {
        userId: args.userId,
      });
      if (!user || !user.globalMemory) {
        return { success: false, error: "Global memory not found" };
      }

      // Get conversation data
      const conversation = await ctx.runQuery(
        internal.chatConversations.internalGetConversationById,
        {
          conversationId: args.conversationId,
        }
      );

      if (!conversation || !conversation.rollingSummary) {
        return { success: false, error: "No conversation summary available" };
      }

      // Update global memory
      const updatedMemory = await updateGlobalMemoryWithContext(
        user.globalMemory,
        {
          type: "chat_conversation",
          data: {
            conversationId: conversation._id,
            title: conversation.title,
            rollingSummary: conversation.rollingSummary,
            messageCount: conversation.messageCount,
            createdAt: conversation.createdAt,
            updatedAt: conversation.updatedAt,
          },
        }
      );

      // Save updated memory
      await ctx.runMutation(internal.users.internalUpdateGlobalMemory, {
        userId: args.userId,
        globalMemory: updatedMemory,
      });

      return { success: true, message: "Global memory updated with chat data" };
    } catch (error) {
      console.error("Error updating global memory from chat:", error);
      return { success: false, error: "Failed to update global memory" };
    }
  },
});

// New public action to trigger mood memory update
export const triggerUpdateGlobalMemoryFromMood = action({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    await ctx.runAction(internal.globalMemory.updateGlobalMemoryFromMood, {
      userId: args.userId,
    });
    return { success: true, message: "Mood global memory update triggered" };
  },
});

// New public action to trigger chat memory update
export const triggerUpdateGlobalMemoryFromChat = action({
  args: {
    userId: v.id("users"),
    conversationId: v.id("chatConversations"),
  },
  handler: async (ctx, args) => {
    await ctx.runAction(internal.globalMemory.updateGlobalMemoryFromChat, {
      userId: args.userId,
      conversationId: args.conversationId,
    });
    return { success: true, message: "Chat global memory update triggered" };
  },
});

// New public action to trigger voice session memory update
export const triggerUpdateGlobalMemoryFromVoiceSession = action({
  args: {
    userId: v.id("users"),
    sessionId: v.id("sessions"),
  },
  handler: async (ctx, args) => {
    await ctx.runAction(
      internal.globalMemory.updateGlobalMemoryFromVoiceSession,
      {
        userId: args.userId,
        sessionId: args.sessionId,
      }
    );
    return {
      success: true,
      message: "Voice session global memory update triggered",
    };
  },
});

export const triggerUpdateGlobalMemoryFromVideoSession = action({
  args: {
    userId: v.id("users"),
    sessionId: v.id("sessions"),
  },
  handler: async (ctx, args) => {
    await ctx.runAction(
      internal.globalMemory.updateGlobalMemoryFromVideoSession,
      {
        userId: args.userId,
        sessionId: args.sessionId,
      }
    );
    return {
      success: true,
      message: "Video session global memory update triggered",
    };
  },
});

export const triggerUpdateGlobalMemoryFromJournal = action({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    await ctx.runAction(internal.globalMemory.updateGlobalMemoryFromJournal, {
      userId: args.userId,
    });
    return {
      success: true,
      message: "Journal global memory update triggered",
    };
  },
});
