"use client";

import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Video, Phone, MessageCircle, Clock, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Session {
  _id: string;
  type: 'video' | 'voice' | 'chat';
  status: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  mood?: string;
}

interface RecentSessionsProps {
  sessions: Session[];
}

export default function RecentSessions({ sessions }: RecentSessionsProps) {
  const getIcon = (type: string) => {
    switch (type) {
      case 'video': return Video;
      case 'voice': return Phone;
      case 'chat': return MessageCircle;
      default: return MessageCircle;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'video': return 'text-blue-500';
      case 'voice': return 'text-green-500';
      case 'chat': return 'text-purple-500';
      default: return 'text-gray-500';
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return `Today, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffInHours < 48) {
      return `Yesterday, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return `${Math.floor(diffInHours / 24)} days ago, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
  };

  const formatDuration = (duration?: number) => {
    if (!duration) return 'N/A';
    const minutes = Math.floor(duration / (1000 * 60));
    return `${minutes} min`;
  };

  const getSessionTitle = (type: string) => {
    switch (type) {
      case 'video': return 'Video Therapy Session';
      case 'voice': return 'Voice Therapy Session';
      case 'chat': return 'Chat Therapy Session';
      default: return 'Therapy Session';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3 }}
    >
      <Card className="glass-card floating-card">
        <CardHeader>
          <CardTitle>Recent Sessions</CardTitle>
          <CardDescription>
            Your latest therapy sessions and progress
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sessions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No sessions yet. Start your first therapy session!</p>
              </div>
            ) : (
              sessions.slice(0, 3).map((session, index) => {
                const Icon = getIcon(session.type);
                return (
                  <motion.div
                    key={session._id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    whileHover={{ scale: 1.02 }}
                    className="flex items-center justify-between p-4 border border-border/30 rounded-lg therapeutic-hover backdrop-blur-subtle bg-card/50"
                  >
                    <div className="flex items-center space-x-4">
                      <motion.div 
                        className={`w-10 h-10 rounded-lg bg-muted/50 dark:bg-muted/20 flex items-center justify-center`}
                        whileHover={{ rotate: 5 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Icon className={`h-5 w-5 ${getTypeColor(session.type)}`} />
                      </motion.div>
                      <div>
                        <h4 className="font-medium">{getSessionTitle(session.type)}</h4>
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>{formatDate(session.startTime)}</span>
                          <span>•</span>
                          <span>{formatDuration(session.duration)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="backdrop-blur-subtle">
                        {session.mood || session.status}
                      </Badge>
                      <Button variant="ghost" size="icon" className="therapeutic-hover">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}