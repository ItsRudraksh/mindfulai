"use client";

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';

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
  initiateCall: (phoneNumber: string, stateDescription: string, firstName: string) => Promise<void>;
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
  const checkCallStatus = async () => {
    // Get conversation ID from active session in database
    const conversationId = activeSession?.metadata?.elevenlabsConversationId || state.conversationId;
    
    if (!conversationId) {
      console.log('No conversation ID available for status check');
      return;
    }

    console.log('Checking call status for conversation:', conversationId);
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
      console.log('Status check response:', data);

      if (data.success && data.data) {
        const conversationData = data.data;
        const newStatus = conversationData.status;
        
        console.log('Current status:', state.callStatus, '-> New status:', newStatus);
        
        // Update call status
        dispatch({ type: 'SET_CALL_STATUS', payload: newStatus });

        // Update session duration from conversation data if available
        if (conversationData.conversation_initiation_client_data?.dynamic_variables?.system__call_duration_secs) {
          const duration = conversationData.conversation_initiation_client_data.dynamic_variables.system__call_duration_secs;
          dispatch({ type: 'SET_SESSION_DURATION', payload: duration });
        }

        // Handle completed call
        if (newStatus === "done") {
          console.log('Call completed, processing final data...');
          
          if (state.sessionId || activeSession?._id) {
            const sessionId = state.sessionId || activeSession!._id;
            
            // End session with summary if available
            const notes = conversationData.analysis?.transcript_summary || 'Call completed';
            await endSessionMutation({
              sessionId: sessionId,
              endTime: Date.now(),
              notes: notes,
            });

            console.log('Session ended successfully');
          }

          // Stop status checking
          if (state.statusCheckInterval) {
            clearInterval(state.statusCheckInterval);
            dispatch({ type: 'SET_STATUS_CHECK_INTERVAL', payload: null });
          }

          dispatch({ type: 'SET_CONNECTED', payload: false });
        }

        // Handle failed call
        if (newStatus === "failed") {
          console.log('Call failed');
          dispatch({ type: 'SET_ERROR', payload: 'Call failed' });
          
          if (state.sessionId || activeSession?._id) {
            const sessionId = state.sessionId || activeSession!._id;
            await endSessionMutation({
              sessionId: sessionId,
              endTime: Date.now(),
              notes: 'Call failed',
            });
          }
          
          if (state.statusCheckInterval) {
            clearInterval(state.statusCheckInterval);
            dispatch({ type: 'SET_STATUS_CHECK_INTERVAL', payload: null });
          }

          dispatch({ type: 'SET_CONNECTED', payload: false });
        }

        // Update connection status for active calls
        if (newStatus === "in-progress" || newStatus === "processing") {
          dispatch({ type: 'SET_CONNECTED', payload: true });
        }
      } else {
        console.error('Invalid status response:', data);
      }
    } catch (error) {
      console.error('Error checking call status:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to check call status' });
    }
  };

  // Auto-restore session when activeSession is found
  useEffect(() => {
    if (activeSession && !state.sessionId) {
      restoreSession();
    }
  }, [activeSession, state.sessionId]);

  // Start status checking when we have an active session with conversation ID
  useEffect(() => {
    const conversationId = activeSession?.metadata?.elevenlabsConversationId || state.conversationId;
    const shouldStartChecking = conversationId && 
                               activeSession?.status === "active" &&
                               state.callStatus !== "done" && 
                               state.callStatus !== "failed" && 
                               !state.statusCheckInterval;
    
    if (shouldStartChecking) {
      console.log('Starting status check interval for conversation:', conversationId);
      
      // Check immediately
      checkCallStatus();
      
      // Then check every 5 seconds
      const interval = setInterval(checkCallStatus, 5000);
      dispatch({ type: 'SET_STATUS_CHECK_INTERVAL', payload: interval });
    }

    return () => {
      if (state.statusCheckInterval) {
        clearInterval(state.statusCheckInterval);
      }
    };
  }, [activeSession?.metadata?.elevenlabsConversationId, activeSession?.status, state.conversationId, state.callStatus]);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (state.statusCheckInterval) {
        clearInterval(state.statusCheckInterval);
      }
    };
  }, []);

  const restoreSession = async () => {
    if (!activeSession) return;

    console.log('Restoring voice session:', activeSession._id);
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      // Set session ID from database
      dispatch({ type: 'SET_SESSION_ID', payload: activeSession._id });
      
      if (activeSession.metadata?.elevenlabsConversationId) {
        // Set conversation ID from database
        dispatch({ type: 'SET_CONVERSATION_ID', payload: activeSession.metadata.elevenlabsConversationId });
        
        // Check conversation status using the stored conversation ID
        const response = await fetch('/api/elevenlabs/status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            conversationId: activeSession.metadata.elevenlabsConversationId 
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

            console.log('Voice session restored successfully');
          }
        }
      } else {
        // Session exists but no conversation ID yet - might be in process of being created
        console.log('Session found but no conversation ID yet');
      }
    } catch (error) {
      console.error('Error restoring voice session:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to restore session' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const initiateCall = async (phoneNumber: string, stateDescription: string, firstName: string) => {
    console.log('Initiating call to:', phoneNumber);
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

      console.log('Created session:', newSessionId);
      dispatch({ type: 'SET_SESSION_ID', payload: newSessionId });

      // Initiate ElevenLabs call
      const response = await fetch('/api/elevenlabs/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: phoneNumber,
          firstName: firstName,
          conversationContext: conversationalContext,
        }),
      });

      if (!response.ok) {
        throw new Error(`Call initiation failed: ${response.status}`);
      }

      const data = await response.json();
      console.log('Call initiation response:', data);

      if (data.success) {
        // IMMEDIATELY store the conversation ID in the database
        await updateSessionMetadata({
          sessionId: newSessionId,
          metadata: {
            elevenlabsConversationId: data.conversation_id,
          },
        });

        console.log('Stored conversation ID in database:', data.conversation_id);

        // Update local state
        dispatch({ type: 'SET_CONVERSATION_ID', payload: data.conversation_id });
        dispatch({ type: 'SET_CALL_SID', payload: data.callSid });
        dispatch({ type: 'SET_CALL_STATUS', payload: "initiated" });
        dispatch({ type: 'SET_CONNECTED', payload: true });
        dispatch({ type: 'SET_PHONE_NUMBER', payload: phoneNumber });
        dispatch({ type: 'SET_STATE_DESCRIPTION', payload: stateDescription });

        console.log('Call initiated successfully, conversation ID stored in DB:', data.conversation_id);
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