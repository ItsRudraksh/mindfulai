"use client";

import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Video, Phone, MessageCircle, Clock, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function RecentSessions() {
  const sessions = [
    {
      id: 1,
      type: 'video',
      title: 'Video Therapy Session',
      date: 'Yesterday, 3:00 PM',
      duration: '45 min',
      mood: 'Better',
      status: 'completed'
    },
    {
      id: 2,
      type: 'chat',
      title: 'Evening Chat Support',
      date: '2 days ago, 8:30 PM',
      duration: '25 min',
      mood: 'Calm',
      status: 'completed'
    },
    {
      id: 3,
      type: 'voice',
      title: 'Morning Voice Call',
      date: '3 days ago, 9:00 AM',
      duration: '30 min',
      mood: 'Energized',
      status: 'completed'
    }
  ];

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3 }}
    >
      <Card>
        <CardHeader>
          <CardTitle>Recent Sessions</CardTitle>
          <CardDescription>
            Your latest therapy sessions and progress
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sessions.map((session, index) => {
              const Icon = getIcon(session.type);
              return (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className={`w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center`}>
                      <Icon className={`h-5 w-5 ${getTypeColor(session.type)}`} />
                    </div>
                    <div>
                      <h4 className="font-medium">{session.title}</h4>
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{session.date}</span>
                        <span>•</span>
                        <span>{session.duration}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">{session.mood}</Badge>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}