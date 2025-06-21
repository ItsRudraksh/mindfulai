"use client";

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Download, Play, Pause, Volume2, Calendar, Clock, Phone, Video, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { toast } from 'sonner';
import { Slider } from "@/components/ui/slider";

interface SessionDetailsPageProps {
  params: {
    sessionId: string;
  };
}

export default function SessionDetailsPage({ params }: SessionDetailsPageProps) {
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [transcriptSummary, setTranscriptSummary] = useState<string | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [audioVolume, setAudioVolume] = useState(1);
  const audioRef = useRef<HTMLAudioElement>(null);

  const sessionId = params.sessionId as Id<"sessions">;
  const session = useQuery(api.sessions.getSessionById, { sessionId });

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = audioVolume;
    }
  }, [audioVolume]);

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
            } else {
              // console.warn('Failed to fetch transcript summary or it was not available.', data);
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
        // Get voice recording
        const audioResponse = await fetch(`/api/elevenlabs/audio?conversationId=${session.elevenlabsConversationId}`, {
          method: 'GET',
          // No body needed for GET request
        });

        if (!audioResponse.ok) {
          throw new Error(`Failed to fetch audio: ${audioResponse.status}`);
        }

        // The audioUrl is now the direct URL to our proxy API
        setAudioUrl(`/api/elevenlabs/audio?conversationId=${session.elevenlabsConversationId}`);
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

  const handlePlayPause = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
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

            {/* Audio Player */}
            {audioUrl && (
              <Card>
                <CardHeader>
                  <CardTitle>Session Recording</CardTitle>
                </CardHeader>
                <CardContent>
                  <audio src={audioUrl} className="w-full mb-3" controls onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)} onEnded={() => setIsPlaying(false)}></audio>
                  <div className="flex justify-end space-x-2">
                    <Button onClick={handlePlayPause} variant="outline">
                      {isPlaying ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
                      {isPlaying ? 'Pause' : 'Play'}
                    </Button>
                    <Button onClick={handleDownload} variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Download Recording
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Metadata Sidebar (or other session related info) */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Session Metadata</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-muted-foreground">
                <p><strong>Type:</strong> {session.type}</p>
                <p><strong>Status:</strong> <Badge variant="secondary" className={getStatusColor(session.status)}>{session.status}</Badge></p>
                {session.metadata?.tavusSessionId && <p><strong>Tavus Session ID:</strong> {session.metadata.tavusSessionId}</p>}
                {session.metadata?.recordingUrl && <p><strong>Recording URL:</strong> <a href={session.metadata.recordingUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Link</a></p>}
                {session.endTime && <p><strong>Ended At:</strong> {formatDate(session.endTime)}</p>}
                {session.rating && <p><strong>Rating:</strong> {session.rating}/5</p>}
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button onClick={handleGetRecording} disabled={isLoadingAudio || audioUrl !== null || session.type !== 'voice'} className="w-full">
                  {isLoadingAudio ? 'Loading Recording...' : 'Get Recording'}
                </Button>
                {audioUrl && ( // Only show controls if audio is loaded
                  <div className="flex space-x-2">
                    <Button onClick={handlePlayPause} variant="outline" className="flex-1">
                      {isPlaying ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
                      {isPlaying ? 'Pause' : 'Play'}
                    </Button>
                    <Button onClick={handleDownload} variant="outline" className="flex-1">
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                )}
                <div className="flex items-center space-x-2 w-full">
                  <Volume2 className="h-5 w-5 text-muted-foreground" />
                  <Slider
                    defaultValue={[100]}
                    max={100}
                    step={1}
                    onValueChange={(value) => setAudioVolume(value[0] / 100)}
                    className="flex-1"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}