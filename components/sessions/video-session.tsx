"use client";

import { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Video, ArrowLeft, MoreVertical, Copy, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { toast } from 'sonner';
import { useVideoSession } from '@/contexts/video-session-context';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function VideoSession() {
  const { state, dispatch, createSession, endSession, restoreSession } = useVideoSession();
  const user = useQuery(api.users.current);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        dispatch({ type: 'SET_SHOW_EMBEDDED_VIDEO', payload: false });
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (state.isConnected && state.tavusConversation?.conversation_id) {
        event.preventDefault();
        event.returnValue = 'You have an active video session. Are you sure you want to leave?';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [state.isConnected, state.tavusConversation, dispatch]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleConnect = async () => {
    if (!state.stateDescription.trim()) {
      toast.error('Please describe your current state before starting the session');
      return;
    }

    if (!user) {
      toast.error('User not found');
      return;
    }

    try {
      const firstName = user.name?.split(' ')[0] || 'there';
      await createSession(state.stateDescription, firstName);
      toast.success('Session created successfully!');
    } catch (error) {
      toast.error('Failed to create session. Please try again.');
    }
  };

  const handleDisconnect = async () => {
    try {
      await endSession();
      toast.success('Video session ended successfully!');
    } catch (error) {
      toast.error('Failed to end session properly.');
    }
  };

  const handleRestore = async () => {
    try {
      await restoreSession();
      toast.success('Session restored successfully!');
    } catch (error) {
      toast.error('Failed to restore session.');
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (state.isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Restoring your session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/40 via-white/60 to-purple-50/40 dark:from-blue-950/40 dark:via-gray-900/60 dark:to-purple-950/40 backdrop-blur-therapeutic">
      <header className="glass-header sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="icon" asChild className="therapeutic-hover">
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
              {state.isGeneratingLink && (
                <Badge variant="secondary" className="bg-yellow-100 dark:bg-yellow-950/20 text-yellow-800 dark:text-yellow-200 backdrop-blur-subtle">
                  Generating Link...
                </Badge>
              )}
              {state.conversationUrl && (
                <Badge variant="secondary" className="bg-blue-100 dark:bg-blue-950/20 text-blue-800 dark:text-blue-200 backdrop-blur-subtle">
                  Link Generated
                </Badge>
              )}
              {state.isConnected && (
                <Badge variant="secondary" className="bg-green-100 dark:bg-green-950/20 text-green-800 dark:text-green-200 backdrop-blur-subtle">
                  Active • {formatDuration(state.sessionDuration)}
                </Badge>
              )}
              {state.error && (
                <Button variant="outline" size="sm" onClick={handleRestore} className="therapeutic-hover">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Restore
                </Button>
              )}
              <Button variant="ghost" size="icon" className="therapeutic-hover">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <Card className="overflow-hidden glass-card floating-card">
              <div className="relative aspect-video bg-gradient-to-br from-blue-900/80 to-purple-900/80 flex items-center justify-center backdrop-blur-therapeutic">
                {!state.conversationUrl && !state.isGeneratingLink ? (
                  <div className="text-center text-white p-8 max-w-2xl">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="w-32 h-32 bg-white/20 rounded-full flex items-center justify-center mb-6 mx-auto backdrop-blur-subtle"
                    >
                      <Video className="h-16 w-16" />
                    </motion.div>
                    <h3 className="text-2xl font-semibold mb-4">Ready to Start Your Session</h3>
                    <p className="text-white/80 mb-6">
                      Before we begin, please describe your current mental state to help personalize your therapy session.
                    </p>

                    <div className="bg-white/10 backdrop-blur-subtle rounded-lg p-6 mb-6">
                      <Label htmlFor="stateDescription" className="text-white text-left block mb-3 font-medium">
                        How are you feeling right now? *
                      </Label>
                      <Textarea
                        id="stateDescription"
                        value={state.stateDescription}
                        onChange={(e) => dispatch({ type: 'SET_STATE_DESCRIPTION', payload: e.target.value })}
                        placeholder="Describe your current thoughts, feelings, or what's on your mind today..."
                        className="min-h-[100px] bg-white/20 border-white/30 text-white placeholder:text-white/60 resize-none glass-input"
                        required
                      />
                      <p className="text-white/60 text-sm mt-2">
                        This helps our AI therapist understand your current state and provide better support.
                      </p>
                    </div>

                    <Button
                      onClick={handleConnect}
                      size="lg"
                      className="bg-blue-600 hover:bg-blue-700 therapeutic-hover ripple-effect"
                      disabled={state.isGeneratingLink || !state.stateDescription.trim()}
                    >
                      <Video className="h-5 w-5 mr-2" />
                      Generate Session Link
                    </Button>
                  </div>
                ) : state.isGeneratingLink ? (
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
                    {state.showEmbeddedVideo ? (
                      <iframe
                        src={state.conversationUrl!}
                        title="Tavus Conversation"
                        className="w-full aspect-video rounded-lg mb-6"
                        allow="camera; microphone; display-capture"
                        ref={iframeRef}
                      ></iframe>
                    ) : (
                      <>
                        <h3 className="text-2xl font-semibold mb-4">Your Session is Ready!</h3>
                        <p className="text-white/80 mb-6 max-w-xl break-all">
                          {state.conversationUrl}
                        </p>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              size="lg"
                              className="bg-green-600 hover:bg-green-700 therapeutic-hover ripple-effect"
                            >
                              Join Session
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="w-56 glass-card">
                            <DropdownMenuItem onSelect={() => window.open(state.conversationUrl!, '_blank')} className="therapeutic-hover">
                              <Copy className="mr-2 h-4 w-4" />
                              <span>Open in New Tab</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => {
                              dispatch({ type: 'SET_SHOW_EMBEDDED_VIDEO', payload: true });
                              setTimeout(() => {
                                if (iframeRef.current) {
                                  iframeRef.current.requestFullscreen().catch(err => {
                                    console.error("Error attempting to enable full-screen mode:", err);
                                  });
                                }
                              }, 100);
                            }} className="therapeutic-hover">
                              <Video className="mr-2 h-4 w-4" />
                              <span>Join Here</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </>
                    )}
                    <Button
                      onClick={() => {
                        dispatch({ type: 'RESET_SESSION' });
                      }}
                      size="lg"
                      variant="outline"
                          className="ml-4 border-white text-black dark:text-white hover:bg-white/60 dark:hover:bg-white/20 therapeutic-hover"
                    >
                      Generate New Link
                    </Button>
                    {state.isConnected && (
                      <Button
                        onClick={handleDisconnect}
                        size="lg"
                        variant="destructive"
                        className="ml-4 therapeutic-hover"
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
            <Card className="glass-card floating-card">
              <CardHeader>
                <CardTitle className="text-lg">Session Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <Badge variant={state.conversationUrl ? "default" : "secondary"} className="backdrop-blur-subtle">
                    {state.conversationUrl ? "Generated" : "Pending"}
                  </Badge>
                </div>
                {state.isConnected && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Duration</span>
                    <span className="font-medium">{formatDuration(state.sessionDuration)}</span>
                  </div>
                )}
                {state.stateDescription && (
                  <div>
                    <span className="text-sm text-muted-foreground block mb-1">Current State</span>
                    <p className="text-xs bg-muted/30 p-2 rounded text-muted-foreground backdrop-blur-subtle">
                      {state.stateDescription}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="glass-card floating-card">
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" size="sm" className="w-full justify-start therapeutic-hover" asChild>
                  <Link href="/emergency">
                    Emergency Help
                  </Link>
                </Button>
                {state.error && (
                  <Button variant="outline" size="sm" className="w-full justify-start therapeutic-hover" onClick={handleRestore}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Restore Session
                  </Button>
                )}
              </CardContent>
            </Card>

            <Card className="glass-card floating-card">
              <CardHeader>
                <CardTitle className="text-lg">Session Context</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Your state description helps the AI therapist understand your current mindset and provide more personalized support during the video session. Session data is automatically saved and restored.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}