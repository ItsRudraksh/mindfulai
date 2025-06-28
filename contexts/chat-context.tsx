"use client";

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useQuery, useMutation, useAction } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { useGlobalMemory } from './global-memory-context';

interface ChatState {
  conversations: any[];
  currentConversationId: Id<"chatConversations"> | null;
  isInitialized: boolean;
  isLoading: boolean;
}

type ChatAction =
  | { type: 'SET_CONVERSATIONS'; payload: any[] }
  | { type: 'SET_CURRENT_CONVERSATION'; payload: Id<"chatConversations"> | null }
  | { type: 'SET_INITIALIZED'; payload: boolean }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'ADD_CONVERSATION'; payload: any }
  | { type: 'RESET' };

const initialState: ChatState = {
  conversations: [],
  currentConversationId: null,
  isInitialized: false,
  isLoading: false,
};

function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'SET_CONVERSATIONS':
      return { ...state, conversations: action.payload };
    case 'SET_CURRENT_CONVERSATION':
      return { ...state, currentConversationId: action.payload };
    case 'SET_INITIALIZED':
      return { ...state, isInitialized: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'ADD_CONVERSATION':
      return {
        ...state,
        conversations: [action.payload, ...state.conversations],
        currentConversationId: action.payload._id
      };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

interface ChatContextType {
  state: ChatState;
  dispatch: React.Dispatch<ChatAction>;
  initializeChat: () => Promise<void>;
  createNewConversation: () => Promise<Id<"chatConversations"> | null>;
  switchConversation: (conversationId: Id<"chatConversations">) => void;
  summarizeCurrentConversation: () => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const { setMemoryUpdateTrigger } = useGlobalMemory();

  const user = useQuery(api.users.current);
  const conversations = useQuery(api.chatConversations.getUserConversations);
  const createConversationMutation = useMutation(api.chatConversations.createConversation);
  const createMessageMutation = useMutation(api.messages.createMessage);
  const summarizeConversationAction = useAction(
    api.chatConversations.summarizeConversation
  );

  // Update conversations when data changes
  useEffect(() => {
    if (conversations !== undefined) {
      dispatch({ type: 'SET_CONVERSATIONS', payload: conversations || [] });
    }
  }, [conversations]);

  // Initialize chat when user is loaded and conversations are available
  useEffect(() => {
    if (user && conversations !== undefined && !state.isInitialized) {
      initializeChat();
    }
  }, [user, conversations, state.isInitialized]);

  // Cleanup effect to summarize conversation when switching or unmounting
  useEffect(() => {
    return () => {
      if (state.currentConversationId) {
        summarizeCurrentConversation();
      }
    };
  }, [state.currentConversationId]);

  const initializeChat = async () => {
    if (!user || state.isInitialized) return;

    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_INITIALIZED', payload: true });

    try {
      const currentConversations = conversations || [];

      if (currentConversations.length === 0) {
        // No conversations exist, create the first one
        await createNewConversation();
      } else {
        // Load the most recent active conversation
        const activeConversation = currentConversations.find(c => c.status === 'active') || currentConversations[0];
        dispatch({ type: 'SET_CURRENT_CONVERSATION', payload: activeConversation._id });
      }
    } catch (error) {
      console.error('Error initializing chat:', error);
      dispatch({ type: 'SET_INITIALIZED', payload: false }); // Allow retry
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const createNewConversation = async (): Promise<Id<"chatConversations"> | null> => {
    if (!user) return null;

    try {
      const now = Date.now();
      const title = `Chat Session - ${new Date(now).toLocaleDateString()}`;


      const conversationId = await createConversationMutation({ title });

      // Add welcome message
      await createMessageMutation({
        conversationId,
        content: `Hello ${user.name?.split(' ')[0] || 'there'}! I'm your AI therapy companion powered by advanced language models. I'm here to listen and support you through whatever you're experiencing today. How are you feeling right now?`,
        sender: 'ai',
        metadata: {
          aiModel: 'system-welcome',
        }
      });

      // Create conversation object for local state
      const newConversation = {
        _id: conversationId,
        title,
        status: 'active',
        createdAt: now,
        updatedAt: now,
        messageCount: 1,
        lastMessageAt: now,
        rollingSummary: "",
      };

      dispatch({ type: 'ADD_CONVERSATION', payload: newConversation });

      return conversationId;
    } catch (error) {
      console.error('❌ Error creating conversation:', error);
      return null;
    }
  };

  const switchConversation = (conversationId: Id<"chatConversations">) => {
    // Summarize current conversation before switching
    if (state.currentConversationId && state.currentConversationId !== conversationId) {
      summarizeCurrentConversation();
    }
    dispatch({ type: 'SET_CURRENT_CONVERSATION', payload: conversationId });
  };

  const summarizeCurrentConversation = async () => {
    if (!state.currentConversationId) return;

    try {
      await summarizeConversationAction({
        conversationId: state.currentConversationId,
      });

      // Trigger global memory update
      setMemoryUpdateTrigger("CHAT_SUMMARY_UPDATED", state.currentConversationId);
    } catch (error) {
      console.error("Error summarizing conversation:", error);
    }
  };

  const contextValue: ChatContextType = {
    state,
    dispatch,
    initializeChat,
    createNewConversation,
    switchConversation,
    summarizeCurrentConversation,
  };

  return (
    <ChatContext.Provider value={contextValue}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}