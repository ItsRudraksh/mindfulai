"use client";

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Video, VideoOff, Mic, MicOff, ArrowLeft, Settings, MoreVertical } from 'lucide-react';
import Link from 'next/link';
import { User } from '@/types/user';
import { useConvex } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { toast } from 'sonner';

interface VideoSessionProps {
  user: User;
}

interface TavusConversation {
  conversation_id: string;
  status: 'active' | 'ended' | 'error';
  participant_count: number;
  created_at: string;
}

export default function VideoSession({ user }: VideoSessionProps) {
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [isConnecting, setIsConnecting] = useState(false);
  const [tavusConversation, setTavusConversation] = useState<TavusConversation | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
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

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isConnected]);

  useEffect(() => {
    // Check for existing active session
    const checkActiveSession = async () => {
      try {
        const activeSession = await convex.query(api.sessions.getActiveSession, {
          userId: user.id as any,
          type: 'video'
        });

        if (activeSession && activeSession.metadata?.tavusSessionId) {
          setSessionId(activeSession._id);
          setTavusConversation({
            conversation_id: activeSession.metadata.tavusSessionId,
            status: 'active',
            participant_count: 1,
            created_at: new Date(activeSession.startTime).toISOString()
          });
          setIsConnected(true);
          setSessionDuration(Math.floor((Date.now() - activeSession.startTime) / 1000));
        }
      } catch (error) {
        console.error('Error checking active session:', error);
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
    setIsConnecting(true);
    
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
        setSessionId(data.sessionId);
        setIsConnected(true);
        toast.success('Video session started successfully!');
      } else {
        throw new Error(data.error || 'Failed to start session');
      }
    } catch (error) {
      console.error('Error starting video session:', error);
      toast.error('Failed to start video session. Please try again.');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!tavusConversation) return;

    try {
      const response = await fetch('/api/tavus/conversation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          action: 'end',
          conversationId: tavusConversation.conversation_id 
        }),
      });

      const data = await response.json();

      if (data.success) {
        setIsConnected(false);
        setSessionDuration(0);
        setTavusConversation(null);
        setSessionId(null);
        toast.success('Video session ended successfully!');
      } else {
        throw new Error('Failed to end session');
      }
    } catch (error) {
      console.error('Error ending video session:', error);
      toast.error('Failed to end session properly.');
      // Still disconnect locally
      setIsConnected(false);
      setSessionDuration(0);
      setTavusConversation(null);
      setSessionId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
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
                  Face-to-face AI therapy with Tavus technology
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {isConnected && tavusConversation && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  Live • {formatDuration(sessionDuration)}
                </Badge>
              )}
              {isConnecting && (
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                  Connecting...
                </Badge>
              )}
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Video Interface */}
      <div className="container mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Main Video Area */}
          <div className="lg:col-span-3">
            <Card className="overflow-hidden">
              <div className="relative aspect-video bg-gradient-to-br from-blue-900 to-purple-900">
                {/* AI Therapist Video */}
                <div className="absolute inset-0 flex items-center justify-center">
                  {!isConnected && !isConnecting ? (
                    <div className="text-center text-white">
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="w-32 h-32 bg-white/20 rounded-full flex items-center justify-center mb-6 mx-auto"
                      >
                        <Video className="h-16 w-16" />
                      </motion.div>
                      <h3 className="text-2xl font-semibold mb-4">Ready to Start</h3>
                      <p className="text-white/80 mb-6 max-w-md">
                        Connect with your AI therapy companion powered by Tavus technology
                      </p>
                      <Button 
                        onClick={handleConnect} 
                        size="lg" 
                        className="bg-blue-600 hover:bg-blue-700"
                        disabled={isConnecting}
                      >
                        <Video className="h-5 w-5 mr-2" />
                        Start Video Session
                      </Button>
                    </div>
                  ) : isConnecting ? (
                    <div className="text-center text-white">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full mb-4 mx-auto"
                      />
                      <h3 className="text-xl font-semibold mb-2">Connecting to Tavus...</h3>
                      <p className="text-white/80">Setting up your secure video session</p>
                    </div>
                  ) : (
                    <div className="text-center text-white">
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="w-48 h-48 bg-white/20 rounded-full flex items-center justify-center mb-6 mx-auto"
                      >
                        <div className="text-center">
                          <div className="w-24 h-24 bg-white/30 rounded-full flex items-center justify-center mb-4 mx-auto">
                            <span className="text-4xl">🤖</span>
                          </div>
                          <p className="text-lg font-medium">AI Therapist</p>
                          <p className="text-sm text-white/70">Powered by Tavus</p>
                        </div>
                      </motion.div>
                      <h3 className="text-xl font-semibold mb-2">Session Active</h3>
                      <p className="text-white/80">Your AI companion is ready to help</p>
                    </div>
                  )}
                </div>

                {/* User Video (Picture-in-Picture) */}
                {isConnected && (
                  <div className="absolute bottom-4 right-4 w-48 h-36 bg-gray-800 rounded-lg overflow-hidden border-2 border-white/20">
                    <div className="w-full h-full flex items-center justify-center">
                      {isVideoOn ? (
                        <div className="text-center text-white">
                          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-2 mx-auto">
                            <span className="text-2xl">👤</span>
                          </div>
                          <p className="text-sm">{user.name?.split(' ')[0] || 'You'}</p>
                        </div>
                      ) : (
                        <div className="text-center text-white/60">
                          <VideoOff className="h-8 w-8 mx-auto mb-2" />
                          <p className="text-xs">Video Off</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Video Controls */}
                {isConnected && (
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                    <div className="flex space-x-4 bg-black/50 backdrop-blur-sm rounded-full px-6 py-3">
                      <Button
                        variant={isMuted ? "destructive" : "secondary"}
                        size="icon"
                        onClick={() => setIsMuted(!isMuted)}
                        className="rounded-full"
                      >
                        {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                      </Button>
                      <Button
                        variant={!isVideoOn ? "destructive" : "secondary"}
                        size="icon"
                        onClick={() => setIsVideoOn(!isVideoOn)}
                        className="rounded-full"
                      >
                        {isVideoOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={handleDisconnect}
                        className="rounded-full"
                      >
                        <ArrowLeft className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Session Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Session Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Duration</span>
                  <span className="font-medium">{formatDuration(sessionDuration)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Quality</span>
                  <Badge variant="outline">HD 1080p</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Connection</span>
                  <Badge variant={isConnected ? "default" : "secondary"}>
                    {isConnected ? "Secure" : "Disconnected"}
                  </Badge>
                </div>
                {tavusConversation && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Session ID</span>
                    <span className="text-xs font-mono">
                      {tavusConversation.conversation_id.slice(0, 8)}...
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
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Settings className="h-4 w-4 mr-2" />
                  Video Settings
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                  <Link href="/emergency">
                    Emergency Help
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Session Notes */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Session Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Your session is powered by Tavus AI technology and securely recorded for your personal review. 
                  All data is encrypted and private.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}