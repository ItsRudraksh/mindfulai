"use client";

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useQuery, useMutation, useAction } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { toast } from 'sonner';

type MemoryUpdateTriggerType =
  | 'VOICE_SESSION_ENDED'
  | 'VIDEO_SESSION_ENDED'
  | 'MOOD_ENTRY_CREATED'
  | 'CHAT_SUMMARY_UPDATED'
  | 'JOURNAL_ENTRY_CREATED';

interface MemoryUpdateState {
  triggerType: MemoryUpdateTriggerType | null;
  triggerId: string | null;
  isProcessing: boolean;
}

const initialState: MemoryUpdateState = {
  triggerType: null,
  triggerId: null,
  isProcessing: false,
};

type MemoryUpdateAction =
  | { type: 'SET_TRIGGER'; payload: { triggerType: MemoryUpdateTriggerType; triggerId: string } }
  | { type: 'CLEAR_TRIGGER' }
  | { type: 'SET_PROCESSING'; payload: boolean };

function memoryUpdateReducer(state: MemoryUpdateState, action: MemoryUpdateAction): MemoryUpdateState {
  switch (action.type) {
    case 'SET_TRIGGER':
      return { ...state, ...action.payload, isProcessing: true };
    case 'CLEAR_TRIGGER':
      return { ...state, triggerType: null, triggerId: null, isProcessing: false };
    case 'SET_PROCESSING':
      return { ...state, isProcessing: action.payload };
    default:
      return state;
  }
}

interface GlobalMemoryContextType {
  state: MemoryUpdateState;
  setMemoryUpdateTrigger: (triggerType: MemoryUpdateTriggerType, triggerId: string) => void;
}

const GlobalMemoryContext = createContext<GlobalMemoryContextType | undefined>(undefined);

const STORAGE_KEY = 'mindfulai_memory_update_trigger';

export function GlobalMemoryProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(memoryUpdateReducer, initialState);

  useEffect(() => {
    const savedTrigger = localStorage.getItem(STORAGE_KEY);
    if (savedTrigger) {
      try {
        const { triggerType, triggerId } = JSON.parse(savedTrigger);
        if (triggerType && triggerId) {
          dispatch({ type: 'SET_TRIGGER', payload: { triggerType, triggerId } });
        }
      } catch (error) {
        console.error('Error parsing memory trigger from localStorage', error);
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  const setMemoryUpdateTrigger = (triggerType: MemoryUpdateTriggerType, triggerId: string) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ triggerType, triggerId }));
    dispatch({ type: 'SET_TRIGGER', payload: { triggerType, triggerId } });
  };

  const clearMemoryUpdateTrigger = () => {
    localStorage.removeItem(STORAGE_KEY);
    dispatch({ type: 'CLEAR_TRIGGER' });
  };

  return (
    <GlobalMemoryContext.Provider value={{ state, setMemoryUpdateTrigger }}>
      {children}
      <GlobalMemoryManager state={state} clearTrigger={clearMemoryUpdateTrigger} />
    </GlobalMemoryContext.Provider>
  );
}

export function useGlobalMemory() {
  const context = useContext(GlobalMemoryContext);
  if (context === undefined) {
    throw new Error('useGlobalMemory must be used within a GlobalMemoryProvider');
  }
  return context;
}

function GlobalMemoryManager({ state, clearTrigger }: { state: MemoryUpdateState; clearTrigger: () => void }) {
  const { triggerType, triggerId } = state;
  const user = useQuery(api.users.current);
  const triggerUpdateFromVideo = useAction(api.globalMemory.triggerUpdateGlobalMemoryFromVideoSession);
  const triggerUpdateFromChat = useAction(api.globalMemory.triggerUpdateGlobalMemoryFromChat);

  useEffect(() => {
    if (!triggerType || !triggerId || !user) return;


    const handleVoiceSessionEnded = async (sessionId: Id<"sessions">) => {
      try {
        toast.info("Finalizing your voice session. This may take a moment...");
        toast.success("Session finalization process started. Your memory will be updated shortly.");
      } catch (error) {
        console.error("[GlobalMemoryManager] Error triggering voice session finalization:", error);
        toast.error("An error occurred while starting the session finalization process.");
      } finally {
        clearTrigger();
      }
    };

    const handleVideoSessionEnded = async (sessionId: Id<"sessions">) => {
      try {
        toast.info("Finalizing your video session and updating memory...");
        // The necessary data for video is pushed from the server-side when the session ends.
        // We just need to trigger the final update action.
        await triggerUpdateFromVideo({ userId: user._id, sessionId });
        toast.success("Your video session has been processed and your memory is updated.");
      } catch (error) {
        console.error("[GlobalMemoryManager] Error in video session memory update flow:", error);
        toast.error("An error occurred while finalizing your video session.");
      } finally {
        clearTrigger();
      }
    };

    const handleChatSummaryUpdated = async (conversationId: Id<"chatConversations">) => {
      try {
        toast.info("Updating memory with your latest chat insights...");
        await triggerUpdateFromChat({ userId: user._id, conversationId });
      } catch (error) {
        console.error("[GlobalMemoryManager] Error in chat summary memory update flow:", error);
        toast.error("An error occurred while updating memory from chat.");
      } finally {
        clearTrigger();
      }
    };

    const handleTrigger = async () => {
      switch (triggerType) {
        case 'VOICE_SESSION_ENDED':
          await handleVoiceSessionEnded(triggerId as Id<"sessions">);
          break;
        case 'VIDEO_SESSION_ENDED':
          await handleVideoSessionEnded(triggerId as Id<"sessions">);
          break;
        case 'CHAT_SUMMARY_UPDATED':
          await handleChatSummaryUpdated(triggerId as Id<"chatConversations">);
          break;
        // Add other cases here
        default:
          console.warn(`[GlobalMemoryManager] Unknown memory trigger type: ${triggerType}`);
          clearTrigger();
      }
    };

    handleTrigger();

  }, [triggerType, triggerId, user, clearTrigger]);

  // This is a manager component, it does not render anything.
  return null;
}