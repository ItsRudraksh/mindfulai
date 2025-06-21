"use client";

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { ConversationStatus } from '@/lib/elevenlabs';

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
  conversationData: ConversationStatus | null;
  audioUrl: string | null;
  transcriptSummary: string | null;
  isLoading: boolean;
  error: string | null;
  statusCheckInterval: NodeJS.Timeout | null;
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
  | { type: 'SET_CONVERSATION_DATA'; payload: ConversationStatus | null }
  | { type: 'SET_AUDIO_URL'; payload: string | null }
  | { type: 'SET_TRANSCRIPT_SUMMARY'; payload: string | null }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_STATUS_CHECK_INTERVAL'; payload: NodeJS.Timeout | null }
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
  conversationData: null,
  audioUrl: null,
  transcriptSummary: null,
  isLoading: false,
  error: null,
  statusCheckInterval: null,
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
    case 'SET_CONVERSATION_DATA':
      return { ...state, conversationData: action.payload };
    case 'SET_AUDIO_URL':
      return { ...state, audioUrl: action.payload };
    case 'SET_TRANSCRIPT_SUMMARY':
      return { ...state, transcriptSummary: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_STATUS_CHECK_INTERVAL':
      return { ...state, statusCheckInterval: action.payload };
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
  initiateCall: (phoneNumber: string, stateDescription: string, firstName: string) => Promise<void>;
  endSession: () => Promise<void>;
  restoreSession: () => Promise<void>;
  checkCallStatus: () => Promise<void>;
}

const VoiceSessionContext = createContext<VoiceSessionContextType | undefined>(undefined);

const STORAGE_KEY = 'mindfulai_voice_session';

export function VoiceSessionProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(voiceSessionReducer, initialState);
  
  const activeSession = useQuery(api.sessions.getActiveSession, { type: "voice" });
  const createSessionMutation = useMutation(api.sessions.createSession);
  const updateSessionMetadata = useMutation(api.sessions.updateSessionMetadata);
  const endSessionMutation = useMutation(api.sessions.endSession);

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
      conversationData: state.conversationData,
      audioUrl: state.audioUrl,
      transcriptSummary: state.transcriptSummary,
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

  // Status checking
  const checkCallStatus = async () => {
    if (!state.conversationId) return;

    try {
      const response = await fetch('/api/elevenlabs/voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'status',
          conversationId: state.conversationId,
        }),
      });

      const data = await response.json();

      if (data.success) {
        const conversationData = data.data;
        dispatch({ type: 'SET_CONVERSATION_DATA', payload: conversationData });
        dispatch({ type: 'SET_CALL_STATUS', payload: conversationData.status });

        // Update session duration from conversation data if available
        if (conversationData.conversation_initiation_client_data?.dynamic_variables?.system__call_duration_secs) {
          dispatch({ 
            type: 'SET_SESSION_DURATION', 
            payload: conversationData.conversation_initiation_client_data.dynamic_variables.system__call_duration_secs 
          });
        }

        // If call is done and successful, fetch audio and summary
        if (conversationData.status === "done" && conversationData.analysis?.call_successful === "success") {
          dispatch({ type: 'SET_TRANSCRIPT_SUMMARY', payload: conversationData.analysis.transcript_summary });
          
          // Fetch audio
          try {
            const audioResponse = await fetch('/api/elevenlabs/voice', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'audio',
                conversationId: state.conversationId,
              }),
            });

            const audioData = await audioResponse.json();
            if (audioData.success) {
              dispatch({ type: 'SET_AUDIO_URL', payload: audioData.audioUrl });
            }
          } catch (audioError) {
            console.error('Error fetching audio:', audioError);
          }

          // Update session in database
          if (state.sessionId) {
            await updateSessionMetadata({
              sessionId: state.sessionId,
              metadata: {
                elevenlabsConversationId: state.conversationId,
                recordingUrl: state.audioUrl || undefined,
              },
            });

            await endSessionMutation({
              sessionId: state.sessionId,
              endTime: Date.now(),
              notes: conversationData.analysis.transcript_summary,
            });
          }

          // Stop status checking
          if (state.statusCheckInterval) {
            clearInterval(state.statusCheckInterval);
            dispatch({ type: 'SET_STATUS_CHECK_INTERVAL', payload: null });
          }
        }

        // If call failed, end session
        if (conversationData.status === "failed") {
          dispatch({ type: 'SET_ERROR', payload: 'Call failed' });
          if (state.sessionId) {
            await endSessionMutation({
              sessionId: state.sessionId,
              endTime: Date.now(),
              notes: 'Call failed',
            });
          }
          
          if (state.statusCheckInterval) {
            clearInterval(state.statusCheckInterval);
            dispatch({ type: 'SET_STATUS_CHECK_INTERVAL', payload: null });
          }
        }
      }
    } catch (error) {
      console.error('Error checking call status:', error);
    }
  };

  // Auto-restore session when activeSession is found
  useEffect(() => {
    if (activeSession && !state.sessionId) {
      restoreSession();
    }
  }, [activeSession, state.sessionId]);

  // Start status checking when conversation is initiated
  useEffect(() => {
    if (state.conversationId && state.callStatus !== "idle" && state.callStatus !== "done" && state.callStatus !== "failed" && !state.statusCheckInterval) {
      const interval = setInterval(checkCallStatus, 3000); // Check every 3 seconds
      dispatch({ type: 'SET_STATUS_CHECK_INTERVAL', payload: interval });
    }

    return () => {
      if (state.statusCheckInterval) {
        clearInterval(state.statusCheckInterval);
      }
    };
  }, [state.conversationId, state.callStatus]);

  const restoreSession = async () => {
    if (!activeSession) return;

    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      if (activeSession.metadata?.elevenlabsConversationId) {
        // Check conversation status
        const response = await fetch('/api/elevenlabs/voice', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            action: 'status', 
            conversationId: activeSession.metadata.elevenlabsConversationId 
          }),
        });
        
        const data = await response.json();
        
        if (data.success) {
          const conversationData = data.data;
          dispatch({ type: 'SET_SESSION_ID', payload: activeSession._id });
          dispatch({ type: 'SET_CONVERSATION_ID', payload: conversationData.conversation_id });
          dispatch({ type: 'SET_CONVERSATION_DATA', payload: conversationData });
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

          // If call is done, get summary and audio
          if (conversationData.status === "done" && conversationData.analysis?.transcript_summary) {
            dispatch({ type: 'SET_TRANSCRIPT_SUMMARY', payload: conversationData.analysis.transcript_summary });
            
            if (activeSession.metadata.recordingUrl) {
              dispatch({ type: 'SET_AUDIO_URL', payload: activeSession.metadata.recordingUrl });
            }
          }
        }
      }
    } catch (error) {
      console.error('Error restoring voice session:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to restore session' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const initiateCall = async (phoneNumber: string, stateDescription: string, firstName: string) => {
    dispatch({ type: 'SET_INITIATING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });
    
    try {
      // Create conversational context
      const conversationalContext = `You are about to talk to ${firstName}. ${stateDescription.trim()}`;

      // Create session record in Convex first
      const newSessionId = await createSessionMutation({
        type: "voice",
        startTime: Date.now(),
        mood: stateDescription.trim(),
      });

      // Initiate ElevenLabs call
      const response = await fetch('/api/elevenlabs/voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'initiate',
          phoneNumber: phoneNumber,
          firstName: firstName,
          conversationContext: conversationalContext,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Update session with ElevenLabs conversation ID
        await updateSessionMetadata({
          sessionId: newSessionId,
          metadata: {
            elevenlabsConversationId: data.data.conversation_id,
          },
        });

        dispatch({ type: 'SET_SESSION_ID', payload: newSessionId });
        dispatch({ type: 'SET_CONVERSATION_ID', payload: data.data.conversation_id });
        dispatch({ type: 'SET_CALL_SID', payload: data.data.callSid });
        dispatch({ type: 'SET_CALL_STATUS', payload: "initiated" });
        dispatch({ type: 'SET_CONNECTED', payload: true });
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

  const endSession = async () => {
    try {
      if (state.sessionId && state.callStatus !== "done") {
        await endSessionMutation({
          sessionId: state.sessionId,
          endTime: Date.now(),
          notes: state.transcriptSummary || 'Session ended manually',
        });
      }
    } catch (error) {
      console.error('Error ending session:', error);
    } finally {
      if (state.statusCheckInterval) {
        clearInterval(state.statusCheckInterval);
      }
      dispatch({ type: 'RESET_SESSION' });
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const contextValue: VoiceSessionContextType = {
    state,
    dispatch,
    initiateCall,
    endSession,
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