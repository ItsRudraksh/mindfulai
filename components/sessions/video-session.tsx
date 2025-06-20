"use client";

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Video, ArrowLeft, MoreVertical, Copy } from 'lucide-react';
import Link from 'next/link';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TavusConversation {
  conversation_id: string;
  status: 'active' | 'ended' | 'error';
  participant_count: number;
  created_at: string;
  conversation_url: string;
}

export default function VideoSession() {
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [conversationUrl, setConversationUrl] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [tavusConversation, setTavusConversation] = useState<TavusConversation | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [showEmbeddedVideo, setShowEmbeddedVideo] = useState(false);
  const [stateDescription, setStateDescription] = useState('');
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const user = useQuery(api.users.current);
  const activeSession = useQuery(api.sessions.getActiveSession, { type: "video" });
  const createSession = useMutation(api.sessions.createSession);
  const updateSessionMetadata = useMutation(api.sessions.updateSessionMetadata);
  const endSession = useMutation(api.sessions.endSession);

  useEffect(() => {
    if (isConnected) {
      intervalRef.current = setInterval(() => {
        setSessionDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setShowEmbeddedVideo(false);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (isConnected && tavusConversation?.conversation_id) {
        // Handle cleanup if needed
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [isConnected, tavusConversation]);

  useEffect(() => {
    const checkActiveSession = async () => {
      if (activeSession && activeSession.metadata?.tavusSessionId) {
        try {
          const response = await fetch('/api/tavus/conversation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'status', conversationId: activeSession.metadata.tavusSessionId }),
          });
          const data = await response.json();

          if (data.conversation && data.conversation.status === 'active') {
            setSessionId(activeSession._id);
            setTavusConversation(data.conversation);
            setConversationUrl(data.conversation.conversation_url);
            setConversationId(data.conversation.conversation_id);
            setIsConnected(true);
            setSessionDuration(Math.floor((Date.now() - activeSession.startTime) / 1000));
          } else {
            setSessionId(null);
            setTavusConversation(null);
            setConversationUrl(null);
            setConversationId(null);
            setIsConnected(false);
            setSessionDuration(0);
            setShowEmbeddedVideo(false);
          }
        } catch (tavusError) {
          console.error('Error fetching Tavus conversation status:', tavusError);
          setSessionId(null);
          setTavusConversation(null);
          setConversationUrl(null);
          setConversationId(null);
          setIsConnected(false);
          setSessionDuration(0);
          setShowEmbeddedVideo(false);
        }
      }
    };

    checkActiveSession();
  }, [activeSession]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleConnect = async () => {
    if (!stateDescription.trim()) {
      toast.error('Please describe your current state before starting the session');
      return;
    }

    if (!user) {
      toast.error('User not found');
      return;
    }

    setIsGeneratingLink(true);
    setConversationUrl(null);
    setIsConnected(false);
    setTavusConversation(null);
    setSessionId(null);
    setSessionDuration(0);
    setShowEmbeddedVideo(false);

    try {
      // Get user's first name
      const firstName = user.name?.split(' ')[0] || 'there';
      
      // Create conversational context
      const conversationalContext = `You are about to talk to ${firstName}. ${stateDescription.trim()}`;

      // First create the Tavus conversation with conversational context
      const response = await fetch('/api/tavus/conversation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          action: 'create',
          conversational_context: conversationalContext
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Create session record in Convex
        const newSessionId = await createSession({
          type: "video",
          startTime: Date.now(),
          mood: stateDescription.trim(),
        });

        // Update session with Tavus conversation ID
        await updateSessionMetadata({
          sessionId: newSessionId,
          metadata: {
            tavusSessionId: data.conversation.conversation_id,
          },
        });

        setTavusConversation(data.conversation);
        setConversationUrl(data.conversation.conversation_url);
        setConversationId(data.conversation.conversation_id);
        setSessionId(newSessionId);
        setIsConnected(true);
        setShowEmbeddedVideo(false);
        toast.success('Conversation link generated successfully!');
      } else {
        throw new Error(data.error || 'Failed to generate conversation link');
      }
    } catch (error) {
      console.error('Error generating conversation link:', error);
      toast.error('Failed to generate conversation link. Please try again.');
    } finally {
      setIsGeneratingLink(false);
    }
  };

  const handleDisconnect = async () => {
    if (!tavusConversation?.conversation_id) {
      console.warn('No active Tavus conversation to end.');
      toast.info('No active session to end.');
      return;
    }

    if (!sessionId) {
      console.warn('No Convex session ID to end.');
      toast.error('No corresponding session record found.');
      return;
    }

    try {
      // End Tavus conversation
      const response = await fetch('/api/tavus/conversation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'end',
          conversationId: tavusConversation.conversation_id,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // End session in Convex
        await endSession({
          sessionId: sessionId,
          endTime: Date.now(),
        });

        setIsConnected(false);
        setConversationUrl(null);
        setConversationId(null);
        setTavusConversation(null);
        setSessionId(null);
        setSessionDuration(0);
        setShowEmbeddedVideo(false);
        setStateDescription('');
        if (document.fullscreenElement) {
          document.exitFullscreen();
        }
        toast.success('Video session ended successfully!');
      } else {
        throw new Error('Failed to end session');
      }
    } catch (error) {
      console.error('Error ending video session:', error);
      toast.error('Failed to end session properly.');
      setIsConnected(false);
      setConversationUrl(null);
      setConversationId(null);
      setTavusConversation(null);
      setSessionId(null);
      setSessionDuration(0);
      setShowEmbeddedVideo(false);
      setStateDescription('');
      if (document.fullscreenElement) {
        document.exitFullscreen();
      }
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-background/80 backdrop-blur-sm border-b sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="icon" asChild>
                <Link href="/dashboard">
                  <ArrowLeft className="h-5 w-5" />
                </Link>
              </Button>
              <div>
                <h1 className="text-xl font-semibold">Video Therapy Session</h1>
                <p className="text-sm text-muted-foreground">
                  AI-powered video therapy with personalized context
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {isGeneratingLink && (
                <Badge variant="secondary" className="bg-yellow-100 dark:bg-yellow-950/20 text-yellow-800 dark:text-yellow-200">
                  Generating Link...
                </Badge>
              )}
              {conversationUrl && (
                <Badge variant="secondary" className="bg-blue-100 dark:bg-blue-950/20 text-blue-800 dark:text-blue-200">
                  Link Generated
                </Badge>
              )}
              {isConnected && (
                <Badge variant="secondary" className="bg-green-100 dark:bg-green-950/20 text-green-800 dark:text-green-200">
                  Active
                </Badge>
              )}
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <Card className="overflow-hidden">
              <div className="relative aspect-video bg-gradient-to-br from-blue-900 to-purple-900 flex items-center justify-center">
                {!conversationUrl && !isGeneratingLink ? (
                  <div className="text-center text-white p-8 max-w-2xl">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="w-32 h-32 bg-white/20 rounded-full flex items-center justify-center mb-6 mx-auto"
                    >
                      <Video className="h-16 w-16" />
                    </motion.div>
                    <h3 className="text-2xl font-semibold mb-4">Ready to Start Your Session</h3>
                    <p className="text-white/80 mb-6">
                      Before we begin, please describe your current mental state to help personalize your therapy session.
                    </p>
                    
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 mb-6">
                      <Label htmlFor="stateDescription" className="text-white text-left block mb-3 font-medium">
                        How are you feeling right now? *
                      </Label>
                      <Textarea
                        id="stateDescription"
                        value={stateDescription}
                        onChange={(e) => setStateDescription(e.target.value)}
                        placeholder="Describe your current thoughts, feelings, or what's on your mind today..."
                        className="min-h-[100px] bg-white/20 border-white/30 text-white placeholder:text-white/60 resize-none"
                        required
                      />
                      <p className="text-white/60 text-sm mt-2">
                        This helps our AI therapist understand your current state and provide better support.
                      </p>
                    </div>

                    <Button
                      onClick={handleConnect}
                      size="lg"
                      className="bg-blue-600 hover:bg-blue-700"
                      disabled={isGeneratingLink || !stateDescription.trim()}
                    >
                      <Video className="h-5 w-5 mr-2" />
                      Generate Session Link
                    </Button>
                  </div>
                ) : isGeneratingLink ? (
                  <div className="text-center text-white">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full mb-4 mx-auto"
                    />
                    <h3 className="text-xl font-semibold mb-2">Generating Personalized Session...</h3>
                    <p className="text-white/80">Creating your conversation link with personalized context.</p>
                  </div>
                ) : (
                  <div className="text-center text-white p-4">
                    {showEmbeddedVideo ? (
                      <iframe
                        src={conversationUrl!}
                        title="Tavus Conversation"
                        className="w-full aspect-video rounded-lg mb-6"
                        allow="camera; microphone; display-capture"
                        ref={iframeRef}
                      ></iframe>
                    ) : (
                      <>
                        <h3 className="text-2xl font-semibold mb-4">Your Session is Ready!</h3>
                        <p className="text-white/80 mb-6 max-w-xl break-all">
                          {conversationUrl}
                        </p>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              size="lg"
                              className="bg-green-600 hover:bg-green-700"
                            >
                              Join Session
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="w-56">
                            <DropdownMenuItem onSelect={() => window.open(conversationUrl!, '_blank')}>
                              <Copy className="mr-2 h-4 w-4" />
                              <span>Open in New Tab</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => {
                              setShowEmbeddedVideo(true);
                              setTimeout(() => {
                                if (iframeRef.current) {
                                  iframeRef.current.requestFullscreen().catch(err => {
                                    console.error("Error attempting to enable full-screen mode:", err);
                                  });
                                }
                              }, 100);
                            }}>
                              <Video className="mr-2 h-4 w-4" />
                              <span>Join Here</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </>
                    )}
                    <Button
                      onClick={() => {
                        setConversationUrl(null);
                        setConversationId(null);
                        setTavusConversation(null);
                        setIsConnected(false);
                        setSessionId(null);
                        setSessionDuration(0);
                        setShowEmbeddedVideo(false);
                        setStateDescription('');
                      }}
                      size="lg"
                      variant="outline"
                      className="ml-4 border-white text-white hover:bg-white/20"
                    >
                      Generate New Link
                    </Button>
                    {isConnected && (
                      <Button
                        onClick={handleDisconnect}
                        size="lg"
                        variant="destructive"
                        className="ml-4"
                      >
                        End Session
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Session Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <Badge variant={conversationUrl ? "default" : "secondary"}>
                    {conversationUrl ? "Generated" : "Pending"}
                  </Badge>
                </div>
                {conversationId && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Conversation ID</span>
                    <span className="text-xs font-mono">
                      {conversationId.slice(0, 8)}...
                    </span>
                  </div>
                )}
                {sessionId && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Session ID</span>
                    <span className="text-xs font-mono">
                      {sessionId.slice(0, 8)}...
                    </span>
                  </div>
                )}
                {isConnected && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Duration</span>
                    <span className="font-medium">{formatDuration(sessionDuration)}</span>
                  </div>
                )}
                {stateDescription && (
                  <div>
                    <span className="text-sm text-muted-foreground block mb-1">Current State</span>
                    <p className="text-xs bg-muted p-2 rounded text-muted-foreground">
                      {stateDescription}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                  <Link href="/emergency">
                    Emergency Help
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Session Context</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Your state description helps the AI therapist understand your current mindset and provide more personalized support during the video session.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}