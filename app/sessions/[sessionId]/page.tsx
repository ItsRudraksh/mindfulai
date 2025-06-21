"use client";

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Download, Calendar, Clock, Phone, Video, MessageCircle, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { toast } from 'sonner';
import { AudioPlayer } from '@/components/ui/audio-player';

interface SessionDetailsPageProps {
  params: {
    sessionId: string;
  };
}

export default function SessionDetailsPage({ params }: SessionDetailsPageProps) {
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [transcriptSummary, setTranscriptSummary] = useState<string | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);

  const sessionId = params.sessionId as Id<"sessions">;
  const session = useQuery(api.sessions.getSessionById, { sessionId });

  useEffect(() => {
    const fetchConversationDetails = async () => {
      if (session && session.type === 'voice' && session.elevenlabsConversationId && !transcriptSummary) {
        setIsLoadingSummary(true);
        try {
          const response = await fetch('/api/elevenlabs/details', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              conversationId: session.elevenlabsConversationId,
            }),
          });

          if (response.ok) {
            const data = await response.json();
            if (data.success && data.data.analysis?.transcriptSummary) {
              setTranscriptSummary(data.data.analysis.transcriptSummary);
            }
          } else {
            throw new Error(`Failed to fetch conversation details: ${response.status}`);
          }
        } catch (error) {
          console.error('Error fetching conversation details:', error);
          toast.error('Failed to load session summary.');
        } finally {
          setIsLoadingSummary(false);
        }
      }
    };
    fetchConversationDetails();
  }, [session, transcriptSummary]);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (duration?: number) => {
    if (!duration) return 'N/A';
    const minutes = Math.floor(duration / (1000 * 60));
    const seconds = Math.floor((duration % (1000 * 60)) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getSessionIcon = (type: string) => {
    switch (type) {
      case 'video': return Video;
      case 'voice': return Phone;
      case 'chat': return MessageCircle;
      default: return MessageCircle;
    }
  };

  const getSessionTitle = (type: string) => {
    switch (type) {
      case 'video': return 'Video Therapy Session';
      case 'voice': return 'Voice Therapy Session';
      case 'chat': return 'Chat Therapy Session';
      default: return 'Therapy Session';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 dark:bg-green-950/20 text-green-800 dark:text-green-200';
      case 'completed': return 'bg-blue-100 dark:bg-blue-950/20 text-blue-800 dark:text-blue-200';
      case 'cancelled': return 'bg-red-100 dark:bg-red-950/20 text-red-800 dark:text-red-200';
      case 'scheduled': return 'bg-yellow-100 dark:bg-yellow-950/20 text-yellow-800 dark:text-yellow-200';
      default: return 'bg-gray-100 dark:bg-gray-950/20 text-gray-800 dark:text-gray-200';
    }
  };

  const handleGetRecording = async () => {
    if (!session) return;

    setIsLoadingAudio(true);

    try {
      if (session.type === 'voice' && session.elevenlabsConversationId) {
        // Set the audio URL to our proxy API endpoint
        const audioApiUrl = `/api/elevenlabs/audio?conversationId=${session.elevenlabsConversationId}`;
        setAudioUrl(audioApiUrl);
        toast.success('Recording loaded successfully!');

      } else if (session.type === 'video' && session.metadata?.tavusSessionId) {
        // For video sessions, we would implement video recording retrieval here
        toast.info('Video recording retrieval will be implemented soon');
      } else {
        toast.error('No recording available for this session');
      }
    } catch (error) {
      console.error('Error loading recording:', error);
      toast.error('Failed to load recording');
    } finally {
      setIsLoadingAudio(false);
    }
  };

  const handleDownload = () => {
    if (!audioUrl) return;

    const link = document.createElement('a');
    link.href = audioUrl;
    link.download = `therapy-session-${session?.type}-${new Date(session?.startTime || 0).toISOString().split('T')[0]}.mp3`;
    link.click();
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  const SessionIcon = getSessionIcon(session.type);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-background/80 backdrop-blur-sm border-b sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="icon" asChild>
                <Link href="/sessions">
                  <ArrowLeft className="h-5 w-5" />
                </Link>
              </Button>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center">
                  <SessionIcon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold">{getSessionTitle(session.type)}</h1>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(session.startTime)}
                  </p>
                </div>
              </div>
            </div>
            <Badge variant="secondary" className={getStatusColor(session.status)}>
              {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
            </Badge>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8 max-w-6xl">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Session Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Session Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Session Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Date & Time</p>
                      <p className="font-medium">{formatDate(session.startTime)}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Duration</p>
                      <p className="font-medium">{formatDuration(session.duration)}</p>
                    </div>
                  </div>
                </div>

                {session.mood && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Initial State</p>
                    <div className="bg-muted/50 p-3 rounded-lg">
                      <p className="text-sm leading-relaxed">{session.mood}</p>
                    </div>
                  </div>
                )}

                {session.notes && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Session Notes</p>
                    <div className="bg-muted/50 p-3 rounded-lg">
                      <p className="text-sm leading-relaxed">{session.notes}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Transcript Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Session Summary</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingSummary ? (
                  <div className="flex items-center justify-center h-24">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <p className="ml-3 text-muted-foreground">Loading summary...</p>
                  </div>
                ) : transcriptSummary ? (
                  <div className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-950/20 dark:to-green-950/20 p-4 rounded-lg">
                    <p className="text-sm leading-relaxed">{transcriptSummary}</p>
                  </div>
                ) : (
                  <div className="text-muted-foreground text-sm">No transcript summary available.</div>
                )}
              </CardContent>
            </Card>

            {/* Custom Audio Player */}
            {audioUrl && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <AudioPlayer
                  src={audioUrl}
                  title="Therapy Session Recording"
                  onDownload={handleDownload}
                  className="shadow-lg"
                />
              </motion.div>
            )}

            {/* Recording Section - Show when no audio loaded */}
            {!audioUrl && (
              <Card>
                <CardHeader>
                  <CardTitle>Session Recording</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Phone className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground mb-4">
                      {session.type === 'voice' 
                        ? 'Load your voice session recording to listen and download'
                        : session.type === 'video'
                        ? 'Video recording retrieval coming soon'
                        : 'No recording available for chat sessions'
                      }
                    </p>
                    {session.type === 'voice' && (
                      <Button
                        onClick={handleGetRecording}
                        disabled={isLoadingAudio}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        {isLoadingAudio ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Loading...
                          </>
                        ) : (
                          'Get Recording'
                        )}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Session Metadata */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Session Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Type</span>
                  <Badge variant="outline">{session.type}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <Badge variant="secondary" className={getStatusColor(session.status)}>
                    {session.status}
                  </Badge>
                </div>
                {session.rating && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Rating</span>
                    <span className="text-sm font-medium">{session.rating}/5</span>
                  </div>
                )}
                {session.elevenlabsConversationId && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Conversation ID</span>
                    <span className="text-xs font-mono">
                      {session.elevenlabsConversationId.slice(0, 8)}...
                    </span>
                  </div>
                )}
                {session.metadata?.tavusSessionId && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Tavus Session ID</span>
                    <span className="text-xs font-mono">
                      {session.metadata.tavusSessionId.slice(0, 8)}...
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                  <Link href={`/sessions/${session.type}`}>
                    <SessionIcon className="h-4 w-4 mr-2" />
                    Start New {session.type} Session
                  </Link>
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                  <Link href="/sessions">
                    View All Sessions
                  </Link>
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                  <Link href="/emergency">
                    Emergency Resources
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Session Tips */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Session Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm space-y-2">
                  <p className="text-muted-foreground">
                    Regular therapy sessions help build emotional resilience and provide consistent support for your mental health journey.
                  </p>
                  {session.type === 'voice' && (
                    <p className="text-muted-foreground">
                      Voice sessions allow for natural conversation flow and can be more comfortable for some users.
                    </p>
                  )}
                  {session.type === 'video' && (
                    <p className="text-muted-foreground">
                      Video sessions provide visual cues and can create a more personal therapeutic connection.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}