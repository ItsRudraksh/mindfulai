"use client";

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Download, Calendar, Clock, Phone, Video, MessageCircle, RefreshCw, Eye, FileText, Brain, ExternalLink, Sparkles, Star } from 'lucide-react';
import Link from 'next/link';
import { useQuery, useMutation, useAction } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { toast } from 'sonner';
import { AudioPlayer } from '@/components/ui/audio-player';
import { CustomVideoPlayer } from '@/components/ui/custom-video-player';
import { SessionRating } from '@/components/ui/session-rating';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useParams } from 'next/navigation';
import ReactMarkdown from 'react-markdown';

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
  const [isAutoRefreshing, setIsAutoRefreshing] = useState(false);
  const [isGeneratingAISummary, setIsGeneratingAISummary] = useState(false);
  const [currentRating, setCurrentRating] = useState<any>(null);
  const [done, setDone] = useState(false);

  const { sessionId: routeSessionId } = useParams();
  const sessionId = routeSessionId as Id<"sessions">;
  const session = useQuery(api.sessions.getSessionById, { sessionId });
  const sessionRating = useQuery(api.sessionRatings.getSessionRating, { sessionId });
  const canAutoRefresh = useQuery(api.sessions.canAutoRefreshSession, { sessionId });

  const storeTavusConversationDataMutation = useMutation(api.sessions.storeTavusConversationData);
  const generateAISummaryMutation = useMutation(api.sessions.generateAISummary);
  const updateAISummaryMutation = useMutation(api.sessions.updateAISummary);
  const updateVoiceSessionSummaryMutation = useMutation(api.sessions.updateVoiceSessionSummary);
  const triggerUpdateGlobalMemoryFromVoiceSession = useAction(api.globalMemory.triggerUpdateGlobalMemoryFromVoiceSession);

  // Update local rating state when sessionRating changes
  useEffect(() => {
    setCurrentRating(sessionRating);
  }, [sessionRating]);

  // Auto-refresh logic for video sessions
  useEffect(() => {
    const performAutoRefresh = async () => {
      if (!session || !canAutoRefresh?.canRefresh || isAutoRefreshing) return;

      setIsAutoRefreshing(true);
      try {
        const response = await fetch('/api/tavus/conversation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'status',
            conversationId: session.metadata?.tavusSessionId,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.conversation) {
            await storeTavusConversationDataMutation({
              sessionId: session._id,
              tavusConversationData: data.conversation,
              isAutoRefresh: true,
            });
            toast.success('Session data updated automatically');
          }
        }
      } catch (error) {
        console.error('Auto-refresh error:', error);
      } finally {
        setIsAutoRefreshing(false);
      }
    };

    // Only auto-refresh if we can and should
    if (canAutoRefresh?.canRefresh && session?.type === 'video' && session?.metadata?.tavusSessionId) {
      // Check if we have incomplete data (missing any required events)
      const hasIncompleteData = !canAutoRefresh.hasRequiredEvents;

      if (hasIncompleteData) {
        // Delay auto-refresh by 5 seconds to allow page to load
        const timer = setTimeout(performAutoRefresh, 5000);
        return () => clearTimeout(timer);
      }
    }
  }, [session, canAutoRefresh, isAutoRefreshing, storeTavusConversationDataMutation]);

  // Voice session summary loading
  const fetchConversationDetails = async () => {
    // If we already have a summary from the db, use it.
    if (session?.voiceSessionSummary) {
      setTranscriptSummary(session.voiceSessionSummary);
      return;
    }

    // If we are a voice session, have an ID, but no summary yet, fetch it.
    if (session && session.type === 'voice' && session.elevenlabsConversationId && !session.voiceSessionSummary) {
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
            const summary = data.data.analysis.transcriptSummary;
            setTranscriptSummary(summary);
            await updateVoiceSessionSummaryMutation({
              sessionId: session._id,
              voiceSessionSummary: summary,
            });
            setDone(true);
            toast.success('Voice session summary loaded and saved.');
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
  useEffect(() => {
    fetchConversationDetails();
  }, [session, updateVoiceSessionSummaryMutation, triggerUpdateGlobalMemoryFromVoiceSession]);

  useEffect(() => {
    if (done) {
      triggerUpdateGlobalMemoryFromVoiceSession({ userId: session?.userId, sessionId: session?._id });
    }
  }, [done, session, triggerUpdateGlobalMemoryFromVoiceSession]);

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

  const handleVideoDownload = () => {
    if (!session?.metadata?.recordingUrl) return;

    const link = document.createElement('a');
    link.href = session.metadata.recordingUrl;
    link.download = `therapy-video-session-${new Date(session?.startTime || 0).toISOString().split('T')[0]}.mp4`;
    link.target = '_blank';
    link.click();
  };

  const handleManualRefresh = async () => {
    if (!session?.metadata?.tavusSessionId || isAutoRefreshing) return;

    setIsAutoRefreshing(true);
    try {
      const response = await fetch('/api/tavus/conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'status',
          conversationId: session.metadata.tavusSessionId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.conversation) {
          await storeTavusConversationDataMutation({
            sessionId: session._id,
            tavusConversationData: data.conversation,
            isAutoRefresh: false,
          });
          toast.success('Session data refreshed successfully');
        }
      } else {
        throw new Error('Failed to refresh session data');
      }
    } catch (error) {
      console.error('Manual refresh error:', error);
      toast.error('Failed to refresh session data');
    } finally {
      setIsAutoRefreshing(false);
    }
  };

  const handleGenerateAISummary = async () => {
    if (!session) return;

    const tavusData = session.metadata?.tavusConversationData;
    const transcriptEvent = tavusData?.events?.find((event: any) =>
      event.event_type === "application.transcription_ready"
    );

    if (!transcriptEvent?.properties?.transcript) {
      toast.error('No transcript available for AI summary');
      return;
    }

    setIsGeneratingAISummary(true);
    try {
      // Start the generation process
      await generateAISummaryMutation({ sessionId: session._id });

      // Call the API to generate the summary
      const response = await fetch('/api/sessions/ai-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: transcriptEvent.properties.transcript,
          sessionType: session.type,
          userContext: {
            mood: session.mood,
            duration: session.duration,
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Update the session with the generated summary
          await updateAISummaryMutation({
            sessionId: session._id,
            aiSummary: data.summary,
          });
          toast.success('AI summary generated successfully!');
        } else {
          throw new Error(data.error || 'Failed to generate summary');
        }
      } else {
        throw new Error('Failed to generate AI summary');
      }
    } catch (error) {
      console.error('AI summary generation error:', error);
      toast.error('Failed to generate AI summary');
      // Reset the summary status
      await updateAISummaryMutation({
        sessionId: session._id,
        aiSummary: '',
      });
    } finally {
      setIsGeneratingAISummary(false);
    }
  };

  const handleRatingSubmitted = () => {
    // Update local state to reflect the new rating without page reload
    toast.success('Rating updated successfully!');
    // The rating will be updated via the useQuery hook automatically
  };

  // Extract Tavus conversation data
  const tavusData = session?.metadata?.tavusConversationData;
  const recordingEvent = tavusData?.events?.find((event: any) =>
    event.event_type === "application.recording_ready"
  );
  const transcriptEvent = tavusData?.events?.find((event: any) =>
    event.event_type === "application.transcription_ready"
  );
  const perceptionEvent = tavusData?.events?.find((event: any) =>
    event.event_type === "application.perception_analysis"
  );

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
            <div className="flex items-center space-x-2">
              {isAutoRefreshing && (
                <Badge variant="secondary" className="bg-yellow-100 dark:bg-yellow-950/20 text-yellow-800 dark:text-yellow-200">
                  <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                  Updating...
                </Badge>
              )}
              {canAutoRefresh && canAutoRefresh.attemptsRemaining > 0 && session.type === 'video' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleManualRefresh}
                  disabled={isAutoRefreshing}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh ({canAutoRefresh.attemptsRemaining} left)
                </Button>
              )}
              <Badge variant="secondary" className={getStatusColor(session.status)}>
                {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
              </Badge>
            </div>
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
              </CardContent>
            </Card>

            {/* AI Summary Section */}
            {session.type === 'video' && transcriptEvent?.properties?.transcript && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-purple-500" />
                    AI Session Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {session.aiSummary === 'generating...' || isGeneratingAISummary ? (
                    <div className="flex items-center justify-center h-24">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      <p className="ml-3 text-muted-foreground">Generating AI summary...</p>
                    </div>
                  ) : session.aiSummary ? (
                    <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 p-4 rounded-lg">
                      <div className="prose prose-sm max-w-none dark:prose-invert">
                        <ReactMarkdown>{session.aiSummary}</ReactMarkdown>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Sparkles className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <h3 className="font-medium mb-2">Generate AI Summary</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Get a comprehensive AI-generated summary of your therapy session
                      </p>
                      <Button
                        onClick={handleGenerateAISummary}
                        disabled={isGeneratingAISummary}
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        {isGeneratingAISummary ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-4 w-4 mr-2" />
                            Generate AI Summary
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Tavus Video Session Data */}
            {session.type === 'video' && tavusData && (
              <Card>
                <CardHeader>
                  <CardTitle>Video Session Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="transcript" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="transcript" className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Transcript
                      </TabsTrigger>
                      <TabsTrigger value="perception" className="flex items-center gap-2">
                        <Eye className="h-4 w-4" />
                        Perception
                      </TabsTrigger>
                      <TabsTrigger value="recording" className="flex items-center gap-2">
                        <Video className="h-4 w-4" />
                        Recording
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="transcript" className="space-y-4">
                      {transcriptEvent?.properties?.transcript ? (
                        <div className="space-y-3">
                          {transcriptEvent.properties.transcript
                            .filter((msg: any) => msg.role !== 'system')
                            .map((msg: any, index: number) => (
                              <div
                                key={index}
                                className={`p-3 rounded-lg ${msg.role === 'user'
                                  ? 'bg-blue-50 dark:bg-blue-950/20 ml-8'
                                  : 'bg-green-50 dark:bg-green-950/20 mr-8'
                                  }`}
                              >
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge variant="outline" className="text-xs">
                                    {msg.role === 'user' ? 'You' : 'AI Therapist'}
                                  </Badge>
                                </div>
                                <p className="text-sm">{msg.content}</p>
                              </div>
                            ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground text-center py-8">
                          No transcript available for this session.
                        </p>
                      )}
                    </TabsContent>

                    <TabsContent value="perception" className="space-y-4">
                      {perceptionEvent?.properties?.analysis ? (
                        <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 p-4 rounded-lg">
                          <div className="flex items-center gap-2 mb-3">
                            <Brain className="h-5 w-5 text-purple-600" />
                            <span className="font-medium">AI Perception Analysis</span>
                          </div>
                          <div className="prose prose-sm max-w-none dark:prose-invert">
                            <ReactMarkdown>{perceptionEvent.properties.analysis}</ReactMarkdown>
                          </div>
                        </div>
                      ) : (
                        <p className="text-muted-foreground text-center py-8">
                          No perception analysis available for this session.
                        </p>
                      )}
                    </TabsContent>

                    <TabsContent value="recording" className="space-y-4">
                      {session.metadata?.recordingUrl ? (
                        <div className="space-y-4">
                          {/* Custom Video Player */}
                          <CustomVideoPlayer
                            src={session.metadata.recordingUrl}
                            title="Therapy Session Recording"
                            onDownload={handleVideoDownload}
                            className="aspect-video"
                          />

                          {/* Recording Info */}
                          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                            <div>
                              <h4 className="font-medium">Session Recording</h4>
                              <p className="text-sm text-muted-foreground">
                                Duration: {recordingEvent?.properties?.duration || 'Unknown'} seconds
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={handleVideoDownload}
                              >
                                <Download className="h-4 w-4 mr-2" />
                                Download
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(session.metadata?.recordingUrl, '_blank')}
                              >
                                <ExternalLink className="h-4 w-4 mr-2" />
                                Open
                              </Button>
                            </div>
                          </div>
                        </div>
                      ) : recordingEvent?.properties ? (
                        <div className="text-center py-8">
                          <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Video className="h-8 w-8 text-muted-foreground" />
                          </div>
                          <h3 className="font-medium mb-2">Recording Processing</h3>
                          <p className="text-sm text-muted-foreground mb-4">
                            Duration: {recordingEvent.properties.duration} seconds
                          </p>
                          <p className="text-xs text-muted-foreground mb-4">
                            Recording is being processed and will be available soon.
                          </p>
                          <Button variant="outline" disabled>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Processing...
                          </Button>
                        </div>
                      ) : (
                        <p className="text-muted-foreground text-center py-8">
                          No recording available for this session.
                        </p>
                      )}
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            )}

            {/* Voice Session Summary */}
            {session.type === 'voice' && (
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
                  ) : transcriptSummary || session?.voiceSessionSummary ? (
                    <div className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-950/20 dark:to-green-950/20 p-4 rounded-lg">
                      <p className="text-sm leading-relaxed">{transcriptSummary || session?.voiceSessionSummary}</p>
                    </div>
                  ) : (
                    <div className="text-muted-foreground text-sm">No transcript summary available.</div>
                  )}
                </CardContent>
              </Card>
            )}

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
            {!audioUrl && session.type === 'voice' && (
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
                      Load your voice session recording to listen and download
                    </p>
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
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Session Rating */}
            {session.status === 'completed' && (
              <SessionRating
                sessionId={session._id}
                sessionType={session.type}
                existingRating={currentRating}
                onRatingSubmitted={handleRatingSubmitted}
              />
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
                {currentRating && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Your Rating</span>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3 w-3 ${i < currentRating.rating
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-gray-300'
                            }`}
                        />
                      ))}
                      <span className="text-sm ml-1">({currentRating.rating}/5)</span>
                    </div>
                  </div>
                )}
                {canAutoRefresh && session.type === 'video' && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Auto-refresh</span>
                    <span className="text-xs">
                      {canAutoRefresh.attemptsRemaining}/3 remaining
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
                  {tavusData && (
                    <p className="text-muted-foreground">
                      This session includes AI perception analysis and complete conversation data for comprehensive insights.
                    </p>
                  )}
                  {session.aiSummary && (
                    <p className="text-muted-foreground">
                      AI-generated summary provides therapeutic insights and continuity for future sessions.
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