"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Phone, Video, Calendar, Clock, MoreHorizontal, Plus } from 'lucide-react';
import Link from 'next/link';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Authenticated, Unauthenticated } from "convex/react";
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function SessionsPage() {
  const router = useRouter();
  const sessions = useQuery(api.sessions.getUserSessions) || [];

  const voiceSessions = sessions.filter(session => session.type === 'voice');
  const videoSessions = sessions.filter(session => session.type === 'video');

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return `Today, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffInHours < 48) {
      return `Yesterday, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return `${Math.floor(diffInHours / 24)} days ago`;
    }
  };

  const formatDuration = (duration?: number) => {
    if (!duration) return 'N/A';
    const minutes = Math.floor(duration / (1000 * 60));
    return `${minutes} min`;
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

  const SessionCard = ({ session, index }: { session: any; index: number }) => {
    const Icon = session.type === 'voice' ? Phone : Video;
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: index * 0.1 }}
      >
        <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer" onClick={() => router.push(`/sessions/${session._id}`)}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">
                    {session.type === 'voice' ? 'Voice Therapy Session' : 'Video Therapy Session'}
                  </h3>
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>{formatDate(session.startTime)}</span>
                  </div>
                </div>
              </div>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>{formatDuration(session.duration)}</span>
                </div>
                <Badge variant="secondary" className={getStatusColor(session.status)}>
                  {session.status}
                </Badge>
              </div>

              {session.mood && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Initial State:</p>
                  <p className="text-sm bg-muted/50 p-2 rounded text-muted-foreground line-clamp-2">
                    {session.mood}
                  </p>
                </div>
              )}

              {session.notes && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Summary:</p>
                  <p className="text-sm bg-muted/50 p-2 rounded text-muted-foreground line-clamp-2">
                    {session.notes}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  const EmptyState = ({ type }: { type: 'voice' | 'video' }) => {
    const Icon = type === 'voice' ? Phone : Video;
    
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-4">
          <Icon className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">No {type} sessions yet</h3>
        <p className="text-muted-foreground mb-6">
          Start your first {type} therapy session to begin your mental health journey.
        </p>
        <Button asChild>
          <Link href={`/sessions/${type}`}>
            <Plus className="h-4 w-4 mr-2" />
            Start {type} Session
          </Link>
        </Button>
      </div>
    );
  };

  return (
    <>
      <Authenticated>
        <div className="min-h-screen bg-background">
          {/* Header */}
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
                    <h1 className="text-2xl font-bold">My Sessions</h1>
                    <p className="text-sm text-muted-foreground">
                      View and manage your therapy sessions
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" asChild>
                    <Link href="/sessions/voice">
                      <Phone className="h-4 w-4 mr-2" />
                      Voice Session
                    </Link>
                  </Button>
                  <Button asChild>
                    <Link href="/sessions/video">
                      <Video className="h-4 w-4 mr-2" />
                      Video Session
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <div className="container mx-auto px-6 py-8 max-w-6xl">
            <Tabs defaultValue="voice" className="space-y-6">
              <TabsList className="grid w-full grid-cols-2 max-w-md">
                <TabsTrigger value="voice" className="flex items-center space-x-2">
                  <Phone className="h-4 w-4" />
                  <span>Voice Sessions</span>
                </TabsTrigger>
                <TabsTrigger value="video" className="flex items-center space-x-2">
                  <Video className="h-4 w-4" />
                  <span>Video Sessions</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="voice" className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold">Voice Sessions</h2>
                    <p className="text-muted-foreground">
                      {voiceSessions.length} session{voiceSessions.length !== 1 ? 's' : ''} completed
                    </p>
                  </div>
                  <Button asChild>
                    <Link href="/sessions/voice">
                      <Plus className="h-4 w-4 mr-2" />
                      New Voice Session
                    </Link>
                  </Button>
                </div>

                {voiceSessions.length === 0 ? (
                  <EmptyState type="voice" />
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {voiceSessions.map((session, index) => (
                      <SessionCard key={session._id} session={session} index={index} />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="video" className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold">Video Sessions</h2>
                    <p className="text-muted-foreground">
                      {videoSessions.length} session{videoSessions.length !== 1 ? 's' : ''} completed
                    </p>
                  </div>
                  <Button asChild>
                    <Link href="/sessions/video">
                      <Plus className="h-4 w-4 mr-2" />
                      New Video Session
                    </Link>
                  </Button>
                </div>

                {videoSessions.length === 0 ? (
                  <EmptyState type="video" />
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {videoSessions.map((session, index) => (
                      <SessionCard key={session._id} session={session} index={index} />
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </Authenticated>
      <Unauthenticated>
        <RedirectToSignIn />
      </Unauthenticated>
    </>
  );
}

function RedirectToSignIn() {
  const router = useRouter();
  
  useEffect(() => {
    router.push('/auth/signin');
  }, [router]);

  return null;
}