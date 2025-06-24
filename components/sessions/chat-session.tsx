"use client";

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Send, Bot, User as UserIcon, ArrowLeft, MoreVertical, Sparkles, 
  Edit3, RotateCcw, Trash2, MessageSquare, Plus, Archive, Star
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import Link from 'next/link';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { toast } from 'sonner';
import { ChatMessage } from '@/lib/ai';
import { Id } from '@/convex/_generated/dataModel';

interface Message {
  _id: Id<"messages">;
  content: string;
  originalContent?: string;
  sender: 'user' | 'ai';
  timestamp: number;
  isEdited?: boolean;
  isRegenerated?: boolean;
  metadata?: {
    flagged?: boolean;
    flagReason?: string;
    aiModel?: string;
  };
}

interface Conversation {
  _id: Id<"chatConversations">;
  title: string;
  status: 'active' | 'completed' | 'archived';
  lastMessageAt?: number;
  messageCount: number;
}

export default function ChatSession() {
  const user = useQuery(api.users.current);
  const conversations = useQuery(api.chatConversations.getUserConversations) || [];
  
  const [currentConversationId, setCurrentConversationId] = useState<Id<"chatConversations"> | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<ChatMessage[]>([]);
  const [editingMessageId, setEditingMessageId] = useState<Id<"messages"> | null>(null);
  const [editContent, setEditContent] = useState('');
  const [showConversationList, setShowConversationList] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Mutations
  const createConversationMutation = useMutation(api.chatConversations.createConversation);
  const createMessageMutation = useMutation(api.messages.createMessage);
  const editMessageMutation = useMutation(api.messages.editMessage);
  const regenerateMessageMutation = useMutation(api.messages.regenerateMessage);
  const deleteMessageMutation = useMutation(api.messages.deleteMessage);
  const deleteMessagesAfterMutation = useMutation(api.messages.deleteMessagesAfter);
  const updateConversationMutation = useMutation(api.chatConversations.updateConversation);

  // Queries
  const conversationMessages = useQuery(
    api.messages.getConversationMessages,
    currentConversationId ? { conversationId: currentConversationId } : "skip"
  );

  // Load messages when conversation changes
  useEffect(() => {
    if (conversationMessages) {
      setMessages(conversationMessages as Message[]);
      
      // Build conversation history for AI context
      const history: ChatMessage[] = conversationMessages
        .slice(-10) // Last 10 messages for context
        .map(msg => ({
          role: msg.sender === 'user' ? 'user' : 'assistant',
          content: msg.content
        }));
      setConversationHistory(history);
    }
  }, [conversationMessages]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize conversation - only once when component mounts
  useEffect(() => {
    if (user && !hasInitialized) {
      setHasInitialized(true);
      
      if (conversations.length === 0) {
        // No conversations exist, create one
        createNewConversation();
      } else {
        // Load the most recent active conversation
        const activeConversation = conversations.find(c => c.status === 'active') || conversations[0];
        setCurrentConversationId(activeConversation._id);
      }
    }
  }, [user, conversations, hasInitialized]);

  const createNewConversation = async () => {
    if (!user) return;
    
    try {
      const conversationId = await createConversationMutation({
        title: `Chat Session - ${new Date().toLocaleDateString()}`,
      });
      setCurrentConversationId(conversationId);
      setMessages([]);
      setConversationHistory([]);
      
      // Add welcome message
      const welcomeMessage = await createMessageMutation({
        conversationId,
        content: `Hello ${user.name?.split(' ')[0] || 'there'}! I'm your AI therapy companion powered by advanced language models. I'm here to listen and support you through whatever you're experiencing today. How are you feeling right now?`,
        sender: 'ai',
        metadata: {
          aiModel: 'system-welcome',
        }
      });
      
      toast.success('New conversation started!');
    } catch (error) {
      console.error('Failed to create conversation:', error);
      toast.error('Failed to create new conversation');
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !currentConversationId) return;

    try {
      // Create user message
      const userMessageId = await createMessageMutation({
        conversationId: currentConversationId,
        content: newMessage,
        sender: 'user',
      });

      const userMessage = newMessage;
      setNewMessage('');
      setIsTyping(true);

      // Update conversation history
      const newHistory: ChatMessage[] = [
        ...conversationHistory,
        { role: 'user', content: userMessage }
      ];

      // Call AI API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          conversationHistory: newHistory,
          userContext: {
            name: user?.name?.split(' ')[0],
            mood: messages.find(m => m.metadata?.flagged)?.metadata?.flagReason,
            previousSessions: conversations.length,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();
      
      if (data.success) {
        // Create AI message
        await createMessageMutation({
          conversationId: currentConversationId,
          content: data.response,
          sender: 'ai',
          metadata: {
            flagged: data.flagged,
            flagReason: data.flagReason,
            aiModel: data.metadata?.aiModel,
          }
        });
      } else {
        throw new Error(data.error || 'Failed to generate response');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message. Please try again.');
    } finally {
      setIsTyping(false);
    }
  };

  const handleEditMessage = async (messageId: Id<"messages">) => {
    if (!editContent.trim()) return;

    try {
      await editMessageMutation({
        messageId,
        newContent: editContent,
      });
      setEditingMessageId(null);
      setEditContent('');
      
      // After editing a user message, regenerate the AI response that follows
      const messageIndex = messages.findIndex(m => m._id === messageId);
      const nextMessage = messages[messageIndex + 1];
      
      if (nextMessage && nextMessage.sender === 'ai') {
        // Find the user message that prompted this AI response
        const userMessage = messages[messageIndex];
        
        if (userMessage && userMessage.sender === 'user') {
          // Get conversation history up to this point
          const historyUpToPoint = messages
            .slice(0, messageIndex)
            .slice(-8) // Keep last 8 messages for context
            .map(msg => ({
              role: msg.sender === 'user' ? 'user' : 'assistant',
              content: msg.content
            })) as ChatMessage[];

          // Call AI API for regeneration with edited content
          const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message: editContent, // Use the edited content
              conversationHistory: historyUpToPoint,
              userContext: {
                name: user?.name?.split(' ')[0],
                previousSessions: conversations.length,
              },
              action: 'regenerate',
            }),
          });

          if (response.ok) {
            const data = await response.json();
            
            if (data.success) {
              await regenerateMessageMutation({
                messageId: nextMessage._id,
                newContent: data.response,
                metadata: {
                  aiModel: data.metadata?.aiModel,
                }
              });
            }
          }
        }
      }
      
      toast.success('Message edited successfully');
    } catch (error) {
      console.error('Error editing message:', error);
      toast.error('Failed to edit message');
    }
  };

  const handleRegenerateMessage = async (messageId: Id<"messages">) => {
    const message = messages.find(m => m._id === messageId);
    if (!message || message.sender !== 'ai') return;

    try {
      setIsTyping(true);
      
      // Find the user message that prompted this AI response
      const messageIndex = messages.findIndex(m => m._id === messageId);
      const userMessage = messages[messageIndex - 1];
      
      if (!userMessage || userMessage.sender !== 'user') {
        throw new Error('Cannot find corresponding user message');
      }

      // Get conversation history up to this point
      const historyUpToPoint = messages
        .slice(0, messageIndex - 1)
        .slice(-8) // Keep last 8 messages for context
        .map(msg => ({
          role: msg.sender === 'user' ? 'user' : 'assistant',
          content: msg.content
        })) as ChatMessage[];

      // Call AI API for regeneration
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          conversationHistory: historyUpToPoint,
          userContext: {
            name: user?.name?.split(' ')[0],
            previousSessions: conversations.length,
          },
          action: 'regenerate',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to regenerate response');
      }

      const data = await response.json();
      
      if (data.success) {
        await regenerateMessageMutation({
          messageId,
          newContent: data.response,
          metadata: {
            aiModel: data.metadata?.aiModel,
          }
        });
        toast.success('Message regenerated successfully');
      } else {
        throw new Error(data.error || 'Failed to regenerate response');
      }
    } catch (error) {
      console.error('Error regenerating message:', error);
      toast.error('Failed to regenerate message');
    } finally {
      setIsTyping(false);
    }
  };

  const handleDeleteMessage = async (messageId: Id<"messages">) => {
    try {
      const message = messages.find(m => m._id === messageId);
      if (!message) return;

      // If it's a user message, delete all messages after it
      if (message.sender === 'user') {
        const messageIndex = messages.findIndex(m => m._id === messageId);
        const messagesToDelete = messages.slice(messageIndex);
        
        // Delete all messages from this point onwards
        await deleteMessagesAfterMutation({ 
          conversationId: currentConversationId!,
          fromTimestamp: message.timestamp 
        });
        
        toast.success(`Deleted ${messagesToDelete.length} message(s)`);
      } else {
        // Just delete the AI message
        await deleteMessageMutation({ messageId });
        toast.success('Message deleted');
      }
    } catch (error) {
      console.error('Error deleting message:', error);
      toast.error('Failed to delete message');
    }
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  const currentConversation = conversations.find(c => c._id === currentConversationId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50/40 via-white/60 to-blue-50/40 dark:from-purple-950/40 dark:via-gray-900/60 dark:to-blue-950/40 backdrop-blur-therapeutic">
      {/* Header */}
      <header className="glass-header sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="icon" asChild className="therapeutic-hover">
                <Link href="/dashboard">
                  <ArrowLeft className="h-5 w-5" />
                </Link>
              </Button>
              <div className="flex items-center space-x-3">
                <Avatar className="therapeutic-hover">
                  <AvatarFallback>
                    <Bot className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="font-semibold flex items-center gap-2">
                    {currentConversation?.title || 'AI Therapy Companion'}
                    <Sparkles className="h-4 w-4 text-purple-500" />
                  </h1>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-gentle-pulse"></div>
                    <span className="text-sm text-muted-foreground">Powered by Claude AI</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowConversationList(!showConversationList)}
                className="therapeutic-hover"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Conversations ({conversations.length})
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={createNewConversation}
                className="therapeutic-hover"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Chat
              </Button>
              <Badge variant="secondary" className="backdrop-blur-subtle">
                <Sparkles className="h-3 w-3 mr-1" />
                AI-Powered
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8 max-w-6xl">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Conversation List Sidebar */}
          <AnimatePresence>
            {showConversationList && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="lg:col-span-1"
              >
                <Card className="glass-card floating-card">
                  <CardHeader>
                    <CardTitle className="text-lg">Your Conversations</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 max-h-[60vh] overflow-y-auto">
                    {conversations.map((conversation) => (
                      <motion.div
                        key={conversation._id}
                        whileHover={{ scale: 1.02 }}
                        className={`p-3 rounded-lg cursor-pointer transition-all therapeutic-hover ${
                          currentConversationId === conversation._id
                            ? 'bg-primary/10 border border-primary/20'
                            : 'bg-muted/30 hover:bg-muted/50'
                        }`}
                        onClick={() => {
                          setCurrentConversationId(conversation._id);
                          setShowConversationList(false);
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-sm truncate">{conversation.title}</h4>
                          <Badge variant="outline" className="text-xs">
                            {conversation.messageCount}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {conversation.lastMessageAt
                            ? new Date(conversation.lastMessageAt).toLocaleDateString()
                            : 'No messages'
                          }
                        </p>
                      </motion.div>
                    ))}
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Chat Container */}
          <div className={showConversationList ? "lg:col-span-3" : "lg:col-span-4"}>
            <Card className="h-[calc(100vh-200px)] flex flex-col glass-card floating-card">
              {/* Messages Area */}
              <CardContent className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map((message, index) => (
                  <motion.div
                    key={message._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex items-start space-x-3 max-w-[80%] ${
                      message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                    }`}>
                      <Avatar className="w-8 h-8 flex-shrink-0">
                        <AvatarFallback className="backdrop-blur-subtle">
                          {message.sender === 'user' ? (
                            <UserIcon className="h-4 w-4" />
                          ) : (
                            <Bot className="h-4 w-4" />
                          )}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="space-y-2">
                        <motion.div 
                          className={`rounded-lg p-4 backdrop-blur-subtle relative group ${
                            message.sender === 'user'
                              ? 'bg-primary/80 text-primary-foreground'
                              : 'bg-muted/80 text-foreground border border-purple-200/30'
                          }`}
                          whileHover={{ scale: 1.01 }}
                          transition={{ duration: 0.2 }}
                        >
                          {editingMessageId === message._id ? (
                            <div className="space-y-2">
                              <Textarea
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                className="min-h-[60px] resize-none bg-white/90 dark:bg-gray-800/90 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
                              />
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleEditMessage(message._id)}
                                  className="therapeutic-hover"
                                >
                                  Save
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setEditingMessageId(null);
                                    setEditContent('');
                                  }}
                                  className="therapeutic-hover"
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                                {message.content}
                              </p>
                              
                              {/* Message Actions */}
                              <div className={`absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity ${
                                message.sender === 'user' ? 'bg-white/20 rounded-full p-1' : ''
                              }`}>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      className={`h-6 w-6 p-0 ${
                                        message.sender === 'user' 
                                          ? 'text-white hover:bg-white/20' 
                                          : 'hover:bg-muted/50'
                                      }`}
                                    >
                                      <MoreVertical className="h-3 w-3" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent className="glass-card">
                                    {message.sender === 'user' && (
                                      <DropdownMenuItem
                                        onClick={() => {
                                          setEditingMessageId(message._id);
                                          setEditContent(message.content);
                                        }}
                                        className="therapeutic-hover"
                                      >
                                        <Edit3 className="h-4 w-4 mr-2" />
                                        Edit
                                      </DropdownMenuItem>
                                    )}
                                    {message.sender === 'ai' && (
                                      <DropdownMenuItem
                                        onClick={() => handleRegenerateMessage(message._id)}
                                        className="therapeutic-hover"
                                      >
                                        <RotateCcw className="h-4 w-4 mr-2" />
                                        Regenerate
                                      </DropdownMenuItem>
                                    )}
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={() => handleDeleteMessage(message._id)}
                                      className="therapeutic-hover text-destructive"
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Delete {message.sender === 'user' ? '& Below' : ''}
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </>
                          )}
                          
                          {/* Message Status Indicators */}
                          <div className="flex items-center justify-between mt-2">
                            <p className="text-xs opacity-70">
                              {formatTimestamp(message.timestamp)}
                              {message.isEdited && (
                                <span className="ml-2 text-xs opacity-60">(edited)</span>
                              )}
                              {message.isRegenerated && (
                                <span className="ml-2 text-xs opacity-60">(regenerated)</span>
                              )}
                            </p>
                            
                            {message.metadata?.flagged && (
                              <Badge variant="outline" className="text-xs">
                                Guided Response
                              </Badge>
                            )}
                          </div>
                        </motion.div>
                      </div>
                    </div>
                  </motion.div>
                ))}

                {isTyping && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-start"
                  >
                    <div className="flex items-start space-x-3">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback>
                          <Bot className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="bg-muted/80 rounded-lg p-4 backdrop-blur-subtle border border-purple-200/30">
                        <div className="flex items-center space-x-2">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                          <span className="text-xs text-muted-foreground">AI is thinking...</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
                <div ref={messagesEndRef} />
              </CardContent>

              {/* Input Area */}
              <div className="border-t border-border/30 p-6 backdrop-blur-subtle">
                <div className="flex space-x-4">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Share what's on your mind..."
                    onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                    className="flex-1 glass-input"
                    disabled={isTyping || !currentConversationId}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || isTyping || !currentConversationId}
                    size="icon"
                    className="therapeutic-hover ripple-effect bg-purple-600 hover:bg-purple-700"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Your conversations are private and secure. This AI focuses exclusively on mental health support.
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}