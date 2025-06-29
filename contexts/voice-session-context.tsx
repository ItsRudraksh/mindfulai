"use client";

import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { useGlobalMemory } from './global-memory-context';
import { useRouter } from 'next/navigation';

interface VoiceSessionState {
  isInitiating: boolean;
  isConnected: boolean;
  callStatus: "idle" | "initiated" | "in-progress" | "processing" | "done" | "failed";
  conversationId: string | null;
  callSid: string | null;
  sessionId: Id<"sessions"> | null;
  sessionDuration: number;
  phoneNumber: string;
  stateDescription: string;
  isLoading: boolean;
  error: string | null;
  statusCheckInterval: NodeJS.Timeout | null;
  lastStatusCheck: number;
}

type VoiceSessionAction =
  | { type: 'SET_INITIATING'; payload: boolean }
  | { type: 'SET_CONNECTED'; payload: boolean }
  | { type: 'SET_CALL_STATUS'; payload: VoiceSessionState['callStatus'] }
  | { type: 'SET_CONVERSATION_ID'; payload: string | null }
  | { type: 'SET_CALL_SID'; payload: string | null }
  | { type: 'SET_SESSION_ID'; payload: Id<"sessions"> | null }
  | { type: 'SET_SESSION_DURATION'; payload: number }
  | { type: 'INCREMENT_DURATION' }
  | { type: 'SET_PHONE_NUMBER'; payload: string }
  | { type: 'SET_STATE_DESCRIPTION'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_STATUS_CHECK_INTERVAL'; payload: NodeJS.Timeout | null }
  | { type: 'SET_LAST_STATUS_CHECK'; payload: number }
  | { type: 'RESET_SESSION' }
  | { type: 'RESTORE_FROM_STORAGE'; payload: Partial<VoiceSessionState> };

const initialState: VoiceSessionState = {
  isInitiating: false,
  isConnected: false,
  callStatus: "idle",
  conversationId: null,
  callSid: null,
  sessionId: null,
  sessionDuration: 0,
  phoneNumber: '',
  stateDescription: '',
  isLoading: false,
  error: null,
  statusCheckInterval: null,
  lastStatusCheck: 0,
};

function voiceSessionReducer(state: VoiceSessionState, action: VoiceSessionAction): VoiceSessionState {
  switch (action.type) {
    case 'SET_INITIATING':
      return { ...state, isInitiating: action.payload };
    case 'SET_CONNECTED':
      return { ...state, isConnected: action.payload };
    case 'SET_CALL_STATUS':
      return { ...state, callStatus: action.payload };
    case 'SET_CONVERSATION_ID':
      return { ...state, conversationId: action.payload };
    case 'SET_CALL_SID':
      return { ...state, callSid: action.payload };
    case 'SET_SESSION_ID':
      return { ...state, sessionId: action.payload };
    case 'SET_SESSION_DURATION':
      return { ...state, sessionDuration: action.payload };
    case 'INCREMENT_DURATION':
      return { ...state, sessionDuration: state.sessionDuration + 1 };
    case 'SET_PHONE_NUMBER':
      return { ...state, phoneNumber: action.payload };
    case 'SET_STATE_DESCRIPTION':
      return { ...state, stateDescription: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_STATUS_CHECK_INTERVAL':
      return { ...state, statusCheckInterval: action.payload };
    case 'SET_LAST_STATUS_CHECK':
      return { ...state, lastStatusCheck: action.payload };
    case 'RESET_SESSION':
      // Clear interval if exists
      if (state.statusCheckInterval) {
        clearInterval(state.statusCheckInterval);
      }
      return {
        ...initialState,
        phoneNumber: state.phoneNumber, // Keep phone number for convenience
      };
    case 'RESTORE_FROM_STORAGE':
      return { ...state, ...action.payload };
    default:
      return state;
  }
}

interface VoiceSessionContextType {
  state: VoiceSessionState;
  dispatch: React.Dispatch<VoiceSessionAction>;
  initiateCall: (phoneNumber: string, stateDescription: string, firstName: string, conversationContext: string, plan: string) => Promise<void>;
  restoreSession: () => Promise<void>;
  checkCallStatus: (initialConversationId?: string) => Promise<void>;
}

const VoiceSessionContext = createContext<VoiceSessionContextType | undefined>(undefined);

const STORAGE_KEY = 'mindfulai_voice_session';

export function VoiceSessionProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(voiceSessionReducer, initialState);
  const { setMemoryUpdateTrigger } = useGlobalMemory();
  const router = useRouter();

  const activeSession = useQuery(api.sessions.getActiveSession, { type: "voice" });
  const createSessionMutation = useMutation(api.sessions.createSession);
  const endSessionMutation = useMutation(api.sessions.endSession);
  const updateElevenLabsSessionIdsMutation = useMutation(api.sessions.updateElevenLabsSessionIds);

  // Save to localStorage whenever state changes
  useEffect(() => {
    const stateToSave = {
      conversationId: state.conversationId,
      callSid: state.callSid,
      sessionId: state.sessionId,
      sessionDuration: state.sessionDuration,
      phoneNumber: state.phoneNumber,
      stateDescription: state.stateDescription,
      callStatus: state.callStatus,
      isConnected: state.isConnected,
      lastStatusCheck: state.lastStatusCheck,
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
        console.error('Error parsing saved voice session state:', error);
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  // Duration timer
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (state.isConnected && (state.callStatus === "in-progress" || state.callStatus === "processing")) {
      interval = setInterval(() => {
        dispatch({ type: 'INCREMENT_DURATION' });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [state.isConnected, state.callStatus]);

  // Status checking function - now uses conversation ID from database
  const checkCallStatus = useCallback(async (initialConversationId?: string) => {
    // Get conversation ID from active session in database
    const conversationId = initialConversationId || activeSession?.elevenlabsConversationId || state.conversationId;

    if (!conversationId) {
      return;
    }

    dispatch({ type: 'SET_LAST_STATUS_CHECK', payload: Date.now() });

    try {
      const response = await fetch('/api/elevenlabs/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: conversationId,
        }),
      });

      if (!response.ok) {
        throw new Error(`Status check failed: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.data) {
        const conversationData = data.data;

        // Update call status
        dispatch({ type: 'SET_CALL_STATUS', payload: conversationData.status });

        // Update session duration from conversation data if available
        if (conversationData.conversation_initiation_client_data?.dynamic_variables?.system__call_duration_secs) {
          const duration = conversationData.conversation_initiation_client_data.dynamic_variables.system__call_duration_secs;
          dispatch({ type: 'SET_SESSION_DURATION', payload: duration });
        }

        // Handle completed call
        if (conversationData.status === "done") {

          if (state.sessionId || activeSession?._id) {
            const sessionId = state.sessionId || activeSession!._id;

            // End session with summary if available
            const notes = conversationData.analysis?.transcript_summary || 'Call completed';
            await endSessionMutation({
              sessionId: sessionId,
              endTime: Date.now(),
              notes: notes,
            });

            // Redirect to the session page
            setMemoryUpdateTrigger('VOICE_SESSION_ENDED', sessionId);
            router.push(`/sessions/${sessionId}`);
          }

          // Stop status checking by letting the useEffect handle it
          dispatch({ type: 'SET_CONNECTED', payload: false });
        }

        // Handle failed call
        if (conversationData.status === "failed") {
          dispatch({ type: 'SET_ERROR', payload: 'Call failed' });

          if (state.sessionId || activeSession?._id) {
            const sessionId = state.sessionId || activeSession!._id;
            const notes = conversationData.analysis?.transcript_summary || 'Call failed';
            await endSessionMutation({
              sessionId: sessionId,
              endTime: Date.now(),
              notes: notes,
            });
          }
          // Stop status checking by letting the useEffect handle it
          dispatch({ type: 'SET_CONNECTED', payload: false });
        }
      }
    } catch (error) {
      console.error('💥 ElevenLabs conversation status error:', error);
      // Don't set a generic error here, as it might be a temporary network issue
    }
  }, [state.sessionId, activeSession, endSessionMutation]);

  // New useEffect for status polling
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    const currentConversationId = activeSession?.elevenlabsConversationId || state.conversationId;

    // Only start polling if connected and a conversation ID exists, and call is not done/failed
    if (state.isConnected && currentConversationId && state.callStatus !== "done" && state.callStatus !== "failed") {
      // Initial check right after setting up the interval
      checkCallStatus(currentConversationId);

      interval = setInterval(async () => {
        await checkCallStatus(currentConversationId);
      }, 5000); // Poll every 5 seconds
    } else if (interval) { // If conditions are no longer met, clear the interval
      clearInterval(interval);
      dispatch({ type: 'SET_STATUS_CHECK_INTERVAL', payload: null });
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [state.isConnected, state.conversationId, state.callStatus, activeSession, checkCallStatus, dispatch]);

  const restoreSession = async () => {
    if (!activeSession) return;

    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      // Set session ID from database
      dispatch({ type: 'SET_SESSION_ID', payload: activeSession._id });

      if (activeSession.elevenlabsConversationId) {
        // Set conversation ID from database
        dispatch({ type: 'SET_CONVERSATION_ID', payload: activeSession.elevenlabsConversationId });

        // Check conversation status using the stored conversation ID
        const response = await fetch('/api/elevenlabs/status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conversationId: activeSession.elevenlabsConversationId
          }),
        });

        if (response.ok) {
          const data = await response.json();

          if (data.success) {
            const conversationData = data.data;
            dispatch({ type: 'SET_CALL_STATUS', payload: conversationData.status });

            if (conversationData.status === "in-progress" || conversationData.status === "processing") {
              dispatch({ type: 'SET_CONNECTED', payload: true });
            }

            // Calculate duration from start time or use conversation data
            let duration = Math.floor((Date.now() - activeSession.startTime) / 1000);
            if (conversationData.conversation_initiation_client_data?.dynamic_variables?.system__call_duration_secs) {
              duration = conversationData.conversation_initiation_client_data.dynamic_variables.system__call_duration_secs;
            }
            dispatch({ type: 'SET_SESSION_DURATION', payload: duration });

            // Restore state description from mood if available
            if (activeSession.mood) {
              dispatch({ type: 'SET_STATE_DESCRIPTION', payload: activeSession.mood });
            }
          }
        }
      } else {
        // Session exists but no conversation ID yet - might be in process of being created
      }
    } catch (error) {
      console.error('Error restoring voice session:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to restore session' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const initiateCall = async (phoneNumber: string, stateDescription: string, firstName: string, conversationContext: string, plan: string) => {
    dispatch({ type: 'SET_INITIATING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      // 1. Create a new session in Convex
      const sessionId = await createSessionMutation({
        type: "voice",
        startTime: Date.now(),
        mood: stateDescription,
      });
      dispatch({ type: 'SET_SESSION_ID', payload: sessionId });

      // 2. Initiate the call via our API, which calls ElevenLabs
      const response = await fetch('/api/elevenlabs/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone_number: phoneNumber,
          task: stateDescription,
          user_name: firstName,
          conversation_context: conversationContext,
          plan: plan,
        }),
      });

      if (!response.ok) {
        throw new Error(`API call failed: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        const elevenLabsConversationId = data.conversation_id;
        const elevenLabsCallSid = data.callSid;

        // Update local state with ElevenLabs IDs immediately
        dispatch({ type: 'SET_CONVERSATION_ID', payload: elevenLabsConversationId });
        dispatch({ type: 'SET_CALL_SID', payload: elevenLabsCallSid });
        dispatch({ type: 'SET_CALL_STATUS', payload: 'initiated' });
        dispatch({ type: 'SET_CONNECTED', payload: true });

        // Step 3: Update session metadata with ElevenLabs IDs in Convex
        await updateElevenLabsSessionIdsMutation({
          sessionId: sessionId,
          elevenlabsConversationId: elevenLabsConversationId,
          elevenlabsCallSid: elevenLabsCallSid,
        });

        // The useEffect for status polling will now pick this up

        dispatch({ type: 'SET_PHONE_NUMBER', payload: phoneNumber });
        dispatch({ type: 'SET_STATE_DESCRIPTION', payload: stateDescription });
      } else {
        throw new Error(data.error || 'Failed to initiate call');
      }
    } catch (error) {
      console.error('Error initiating call:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to initiate call' });
      throw error;
    } finally {
      dispatch({ type: 'SET_INITIATING', payload: false });
    }
  };

  const contextValue: VoiceSessionContextType = {
    state,
    dispatch,
    initiateCall,
    restoreSession,
    checkCallStatus,
  };

  return (
    <VoiceSessionContext.Provider value={contextValue}>
      {children}
    </VoiceSessionContext.Provider>
  );
}

export function useVoiceSession() {
  const context = useContext(VoiceSessionContext);
  if (context === undefined) {
    throw new Error('useVoiceSession must be used within a VoiceSessionProvider');
  }
  return context;
}