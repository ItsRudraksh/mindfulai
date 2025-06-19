"use client";

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Video, ArrowLeft, MoreVertical, Copy } from 'lucide-react';
import Link from 'next/link';
import { User } from '@/types/user';
import { useConvex } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface VideoSessionProps {
  user: User;
}

interface TavusConversation {
  conversation_id: string;
  status: 'active' | 'ended' | 'error';
  participant_count: number;
  created_at: string;
  conversation_url: string; // Add conversation_url back to interface
}

export default function VideoSession({ user }: VideoSessionProps) {
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [conversationUrl, setConversationUrl] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [tavusConversation, setTavusConversation] = useState<TavusConversation | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [showEmbeddedVideo, setShowEmbeddedVideo] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const convex = useConvex();

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

    // Handle fullscreen exit event
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        // User exited fullscreen, so hide the embedded video
        setShowEmbeddedVideo(false);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (isConnected && tavusConversation?.conversation_id) {
        // Do not end Tavus conversation automatically on unload
        // event.preventDefault();
        // event.returnValue = '';
        // fetch('/api/tavus/conversation', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify({ action: 'end', conversationId: tavusConversation.conversation_id }),
        //   keepalive: true,
        // }).catch(error => console.error('Error ending conversation on unload:', error));
      }
    };

    // Attach event listeners
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Cleanup function for component unmount
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // Do not end Tavus conversation automatically on unmount
      // if (isConnected && tavusConversation?.conversation_id) {
      //   fetch('/api/tavus/conversation', {
      //     method: 'POST',
      //     headers: { 'Content-Type': 'application/json' },
      //     body: JSON.stringify({ action: 'end', conversationId: tavusConversation.conversation_id }),
      //   }).catch(error => console.error('Error ending conversation on unmount:', error));
      // }
      if (intervalRef.current) { // Clear interval on unmount
        clearInterval(intervalRef.current);
      }
      document.removeEventListener('fullscreenchange', handleFullscreenChange); // Cleanup event listener
    };
  }, [isConnected, tavusConversation]);

  useEffect(() => {
    const checkActiveSession = async () => {
      try {
        const activeSession = await convex.query(api.sessions.getActiveSession, {
          userId: user.id as any,
          type: 'video'
        });

        if (activeSession && activeSession.metadata?.tavusSessionId) {
          try {
            // Fetch the actual Tavus conversation status and URL
            const response = await fetch('/api/tavus/conversation', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ action: 'status', conversationId: activeSession.metadata.tavusSessionId }),
            });
            const data = await response.json();

            if (data.conversation && data.conversation.status === 'active') {
              setSessionId(activeSession._id);
              setTavusConversation(data.conversation); // Use the full Tavus conversation object
              setConversationUrl(data.conversation.conversation_url);
              setConversationId(data.conversation.conversation_id);
              setIsConnected(true);
              setSessionDuration(Math.floor((Date.now() - activeSession.startTime) / 1000));
            } else {
              // Tavus conversation is no longer active, or not found. Clear local state.
              console.log("Tavus conversation not active or not found, clearing local state.");
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
            // Clear local state if we can't get Tavus status
            setSessionId(null);
            setTavusConversation(null);
            setConversationUrl(null);
            setConversationId(null);
            setIsConnected(false);
            setSessionDuration(0);
            setShowEmbeddedVideo(false);
          }
        }
      } catch (error) {
        console.error('Error checking active Convex session:', error);
      }
    };

    checkActiveSession();
  }, [user.id, convex]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleConnect = async () => {
    setIsGeneratingLink(true);
    setConversationUrl(null);
    setIsConnected(false);
    setTavusConversation(null);
    setSessionId(null);
    setSessionDuration(0);
    setShowEmbeddedVideo(false);

    try {
      const response = await fetch('/api/tavus/conversation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'create' }),
      });

      const data = await response.json();

      if (data.success) {
        setTavusConversation(data.conversation);
        setConversationUrl(data.conversation.conversation_url);
        setConversationId(data.conversation.conversation_id);
        setSessionId(data.sessionId);
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

    console.log('Attempting to end Tavus conversation with ID:', tavusConversation.conversation_id);
    console.log('Attempting to end Convex session with ID:', sessionId);
    try {
      const response = await fetch('/api/tavus/conversation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'end',
          conversationId: tavusConversation.conversation_id,
          sessionId: sessionId,
        }),
      });

      const data = await response.json();
      console.log('End session API response:', data);

      if (data.success) {
        setIsConnected(false);
        setConversationUrl(null);
        setConversationId(null);
        setTavusConversation(null);
        setSessionId(null);
        setSessionDuration(0);
        setShowEmbeddedVideo(false);
        // Exit fullscreen if active
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
      // Exit fullscreen if active (fallback)
      if (document.fullscreenElement) {
        document.exitFullscreen();
      }
    }
  };

  const handleCopyLink = () => {
    if (conversationUrl) {
      navigator.clipboard.writeText(conversationUrl);
      toast.info('Conversation link copied to clipboard!');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <header className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-50">
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
                  Generate a Tavus conversation link
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {isGeneratingLink && (
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                  Generating Link...
                </Badge>
              )}
              {conversationUrl && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  Link Generated
                </Badge>
              )}
              {isConnected && (
                <Badge variant="secondary" className="bg-green-100 text-green-800">
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
                  <div className="text-center text-white">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="w-32 h-32 bg-white/20 rounded-full flex items-center justify-center mb-6 mx-auto"
                    >
                      <Video className="h-16 w-16" />
                    </motion.div>
                    <h3 className="text-2xl font-semibold mb-4">Ready to Generate Conversation Link</h3>
                    <p className="text-white/80 mb-6 max-w-md">
                      Click the button below to generate a unique video conversation link with Tavus AI.
                    </p>
                    <Button
                      onClick={handleConnect}
                      size="lg"
                      className="bg-blue-600 hover:bg-blue-700"
                      disabled={isGeneratingLink}
                    >
                      <Video className="h-5 w-5 mr-2" />
                      Generate Link
                    </Button>
                  </div>
                ) : isGeneratingLink ? (
                  <div className="text-center text-white">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full mb-4 mx-auto"
                    />
                    <h3 className="text-xl font-semibold mb-2">Generating Link...</h3>
                    <p className="text-white/80">Please wait while we create your conversation link.</p>
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
                        <h3 className="text-2xl font-semibold mb-4">Conversation Link Generated!</h3>
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
                              // Request fullscreen on the iframe after it renders
                              setTimeout(() => {
                                if (iframeRef.current) {
                                  iframeRef.current.requestFullscreen().catch(err => {
                                    console.error("Error attempting to enable full-screen mode:", err);
                                  });
                                }
                              }, 100); // Small delay to ensure iframe is in DOM
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
                <CardTitle className="text-lg">Link Details</CardTitle>
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
                    <span className="text-sm text-muted-foreground">Convex Session ID</span>
                    <span className="text-xs font-mono">
                      {sessionId.slice(0, 8)}...
                    </span>
                  </div>
                )}
                {isConnected && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Connection</span>
                    <Badge variant="default">
                      Active
                    </Badge>
                  </div>
                )}
                {isConnected && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Duration</span>
                    <span className="font-medium">{formatDuration(sessionDuration)}</span>
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
                <CardTitle className="text-lg">Important Note</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  This page now generates a direct Tavus conversation link. You can share this link for a video session.
                  The session will automatically end if you navigate away from this page or close the tab.
                  Session data is now saved to your Convex database for statistics and user data.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}