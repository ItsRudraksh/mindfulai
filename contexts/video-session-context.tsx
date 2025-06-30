"use client";

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { useGlobalMemory } from './global-memory-context';
import { useRouter } from 'next/navigation';

interface TavusConversation {
  conversation_id: string;
  status: 'active' | 'ended' | 'error';
  participant_count: number;
  created_at: string;
  conversation_url: string;
  conversational_context: string;
}

interface VideoSessionState {
  isGeneratingLink: boolean;
  conversationUrl: string | null;
  conversationId: string | null;
  isConnected: boolean;
  tavusConversation: TavusConversation | null;
  sessionId: Id<"sessions"> | null;
  sessionDuration: number;
  showEmbeddedVideo: boolean;
  stateDescription: string;
  isLoading: boolean;
  error: string | null;
}

type VideoSessionAction =
  | { type: 'SET_GENERATING_LINK'; payload: boolean }
  | { type: 'SET_CONVERSATION_URL'; payload: string | null }
  | { type: 'SET_CONVERSATION_ID'; payload: string | null }
  | { type: 'SET_CONNECTED'; payload: boolean }
  | { type: 'SET_TAVUS_CONVERSATION'; payload: TavusConversation | null }
  | { type: 'SET_SESSION_ID'; payload: Id<"sessions"> | null }
  | { type: 'SET_SESSION_DURATION'; payload: number }
  | { type: 'INCREMENT_DURATION' }
  | { type: 'SET_SHOW_EMBEDDED_VIDEO'; payload: boolean }
  | { type: 'SET_STATE_DESCRIPTION'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'RESET_SESSION' }
  | { type: 'RESTORE_FROM_STORAGE'; payload: Partial<VideoSessionState> };

const initialState: VideoSessionState = {
  isGeneratingLink: false,
  conversationUrl: null,
  conversationId: null,
  isConnected: false,
  tavusConversation: null,
  sessionId: null,
  sessionDuration: 0,
  showEmbeddedVideo: false,
  stateDescription: '',
  isLoading: false,
  error: null,
};

function videoSessionReducer(state: VideoSessionState, action: VideoSessionAction): VideoSessionState {
  switch (action.type) {
    case 'SET_GENERATING_LINK':
      return { ...state, isGeneratingLink: action.payload };
    case 'SET_CONVERSATION_URL':
      return { ...state, conversationUrl: action.payload };
    case 'SET_CONVERSATION_ID':
      return { ...state, conversationId: action.payload };
    case 'SET_CONNECTED':
      return { ...state, isConnected: action.payload };
    case 'SET_TAVUS_CONVERSATION':
      return { ...state, tavusConversation: action.payload };
    case 'SET_SESSION_ID':
      return { ...state, sessionId: action.payload };
    case 'SET_SESSION_DURATION':
      return { ...state, sessionDuration: action.payload };
    case 'INCREMENT_DURATION':
      return { ...state, sessionDuration: state.sessionDuration + 1 };
    case 'SET_SHOW_EMBEDDED_VIDEO':
      return { ...state, showEmbeddedVideo: action.payload };
    case 'SET_STATE_DESCRIPTION':
      return { ...state, stateDescription: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'RESET_SESSION':
      return {
        ...initialState,
        stateDescription: '', // Keep state description for potential retry
      };
    case 'RESTORE_FROM_STORAGE':
      return { ...state, ...action.payload };
    default:
      return state;
  }
}

interface VideoSessionContextType {
  state: VideoSessionState;
  dispatch: React.Dispatch<VideoSessionAction>;
  createSession: (stateDescription: string, firstName: string, conversationContext: string) => Promise<void>;
  endSession: () => Promise<void>;
  restoreSession: () => Promise<void>;
}

const VideoSessionContext = createContext<VideoSessionContextType | undefined>(undefined);

const STORAGE_KEY = 'mindfulai_video_session';

export function VideoSessionProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(videoSessionReducer, initialState);
  const { setMemoryUpdateTrigger } = useGlobalMemory();
  const router = useRouter();
  const activeSession = useQuery(api.sessions.getActiveSession, { type: "video" });
  const createSessionMutation = useMutation(api.sessions.createSession);
  const updateSessionMetadata = useMutation(api.sessions.updateSessionMetadata);
  const endSessionMutation = useMutation(api.sessions.endSession);
  const storeTavusConversationDataMutation = useMutation(api.sessions.storeTavusConversationData);

  // Save to localStorage whenever state changes
  useEffect(() => {
    const stateToSave = {
      conversationUrl: state.conversationUrl,
      conversationId: state.conversationId,
      isConnected: state.isConnected,
      tavusConversation: state.tavusConversation,
      sessionId: state.sessionId,
      sessionDuration: state.sessionDuration,
      stateDescription: state.stateDescription,
      showEmbeddedVideo: state.showEmbeddedVideo,
    };

    if (state.sessionId || state.conversationId) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [state]);

  // Restore from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem(STORAGE_KEY);
    if (savedState) {
      try {
        const parsedState = JSON.parse(savedState);
        dispatch({ type: 'RESTORE_FROM_STORAGE', payload: parsedState });
      } catch (error) {
        console.error('Error parsing saved session state:', error);
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  // Duration timer
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (state.isConnected) {
      interval = setInterval(() => {
        dispatch({ type: 'INCREMENT_DURATION' });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [state.isConnected]);

  // Poll Tavus conversation status when connected
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    const conversationId = state.tavusConversation?.conversation_id || state.conversationId;

    async function checkTavusStatus() {
      if (!conversationId) return;
      try {
        const response = await fetch('/api/tavus/conversation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'status',
            conversationId,
          }),
        });
        if (!response.ok) return;
        const data = await response.json();
        if (data.conversation) {
          // If status is not active, end session
          if (data.conversation.status !== 'active') {
            await endSession();
          } else {
            // Optionally update Tavus conversation in state
            dispatch({ type: 'SET_TAVUS_CONVERSATION', payload: data.conversation });
          }
        }
      } catch (err) {
        // Ignore polling errors
      }
    }

    if (state.isConnected && conversationId) {
      checkTavusStatus(); // Initial check
      interval = setInterval(checkTavusStatus, 5000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [state.isConnected, state.tavusConversation, state.conversationId]);

  // Restore session from database if we have sessionId but no conversation details
  const restoreSession = async () => {
    if (!activeSession) return;

    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      if (activeSession.metadata?.tavusSessionId) {
        // Check Tavus conversation status
        const response = await fetch('/api/tavus/conversation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'status',
            conversationId: activeSession.metadata.tavusSessionId
          }),
        });

        const data = await response.json();

        if (data.conversation && data.conversation.status === 'active') {
          dispatch({ type: 'SET_SESSION_ID', payload: activeSession._id });
          dispatch({ type: 'SET_TAVUS_CONVERSATION', payload: data.conversation });
          dispatch({ type: 'SET_CONVERSATION_URL', payload: data.conversation.conversation_url });
          dispatch({ type: 'SET_CONVERSATION_ID', payload: data.conversation.conversation_id });
          dispatch({ type: 'SET_CONNECTED', payload: true });

          // Calculate duration from start time
          const duration = Math.floor((Date.now() - activeSession.startTime) / 1000);
          dispatch({ type: 'SET_SESSION_DURATION', payload: duration });

          // Restore state description from mood if available
          if (activeSession.mood) {
            dispatch({ type: 'SET_STATE_DESCRIPTION', payload: activeSession.mood });
          }
        } else {
          // Session exists in DB but Tavus conversation is not active
          await endSessionMutation({
            sessionId: activeSession._id,
            endTime: Date.now(),
          });
          dispatch({ type: 'RESET_SESSION' });
        }
      }
    } catch (error) {
      console.error('Error restoring session:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to restore session' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Auto-restore session when activeSession is found
  useEffect(() => {
    if (activeSession && !state.sessionId) {
      restoreSession();
    }
  }, [activeSession, state.sessionId]);

  const createSession = async (stateDescription: string, firstName: string, conversationContext: string) => {
    dispatch({ type: 'SET_GENERATING_LINK', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      // Create conversational context
      let enhancedContext = `You are about to talk to ${firstName}. ${stateDescription.trim()}`;
      if (conversationContext) {
        enhancedContext = `${enhancedContext}\n\nHere is some additional context about the user and their past conversations, please use this to have a better and more informed conversation:\n${conversationContext}`;
      }

      // Start Tavus conversation job
      const response = await fetch('/api/tavus/conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          conversational_context: enhancedContext,
          firstName: firstName
        }),
      });

      const data = await response.json();
      if (!data.jobId) {
        throw new Error('No jobId returned');
      }
      // Poll for job result
      let jobResult = null;
      for (let i = 0; i < 60; i++) { // up to 2 minutes
        const pollRes = await fetch(`/api/tavus/conversation?jobId=${data.jobId}`);
        const pollData = await pollRes.json();
        if (pollData.status === 'done') {
          jobResult = pollData;
          break;
        } else if (pollData.status === 'error') {
          throw new Error(pollData.error || 'Failed to create Tavus conversation');
        }
        await new Promise(res => setTimeout(res, 2000));
      }
      if (!jobResult || !jobResult.conversation) {
        throw new Error('Tavus conversation creation timed out');
      }
      // Create session record in Convex
      const newSessionId = await createSessionMutation({
        type: "video",
        startTime: Date.now(),
        mood: stateDescription.trim(),
      });
      // Update session with Tavus conversation ID
      await updateSessionMetadata({
        sessionId: newSessionId,
        metadata: {
          tavusSessionId: jobResult.conversation.conversation_id,
        },
      });
      dispatch({ type: 'SET_TAVUS_CONVERSATION', payload: jobResult.conversation });
      dispatch({ type: 'SET_CONVERSATION_URL', payload: jobResult.conversation.conversation_url });
      dispatch({ type: 'SET_CONVERSATION_ID', payload: jobResult.conversation.conversation_id });
      dispatch({ type: 'SET_SESSION_ID', payload: newSessionId });
      dispatch({ type: 'SET_CONNECTED', payload: true });
      dispatch({ type: 'SET_STATE_DESCRIPTION', payload: stateDescription });
    } catch (error) {
      console.error('Error creating session:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to create session' });
      throw error;
    } finally {
      dispatch({ type: 'SET_GENERATING_LINK', payload: false });
    }
  };

  const endSession = async () => {
    if (!state.tavusConversation?.conversation_id || !state.sessionId) {
      dispatch({ type: 'RESET_SESSION' });
      return;
    }

    try {
      // End Tavus conversation
      const response = await fetch('/api/tavus/conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'end',
          conversationId: state.tavusConversation.conversation_id,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Get complete conversation data with verbose=true
        const statusResponse = await fetch('/api/tavus/conversation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'status',
            conversationId: state.tavusConversation.conversation_id,
          }),
        });

        const statusData = await statusResponse.json();

        if (statusData.conversation) {
          // Store complete Tavus conversation data
          await storeTavusConversationDataMutation({
            sessionId: state.sessionId,
            tavusConversationData: statusData.conversation,
          });
        } else {
          // Fallback to basic session end
          await endSessionMutation({
            sessionId: state.sessionId,
            endTime: Date.now(),
          });
        }
      }
    } catch (error) {
      console.error('Error ending session:', error);
      // Still try to end the session in our database
      if (state.sessionId) {
        await endSessionMutation({
          sessionId: state.sessionId,
          endTime: Date.now(),
        });
      }
    } finally {
      dispatch({ type: 'RESET_SESSION' });
      localStorage.removeItem(STORAGE_KEY);

      // Exit fullscreen if active
      if (document.fullscreenElement) {
        document.exitFullscreen();
      }

      setMemoryUpdateTrigger('VIDEO_SESSION_ENDED', state.sessionId);
      router.push(`/sessions/${state.sessionId}`);
    }
  };

  const contextValue: VideoSessionContextType = {
    state,
    dispatch,
    createSession,
    endSession,
    restoreSession,
  };

  return (
    <VideoSessionContext.Provider value={contextValue}>
      {children}
    </VideoSessionContext.Provider>
  );
}

export function useVideoSession() {
  const context = useContext(VideoSessionContext);
  if (context === undefined) {
    throw new Error('useVideoSession must be used within a VideoSessionProvider');
  }
  return context;
}