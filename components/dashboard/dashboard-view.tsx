"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Heart, 
  Video, 
  Phone, 
  MessageCircle, 
  Calendar, 
  TrendingUp, 
  Brain,
  Smile,
  Meh,
  Frown,
  Settings,
  Bell
} from 'lucide-react';
import Link from 'next/link';
import DashboardHeader from './dashboard-header';
import MoodCheckIn from './mood-check-in';
import QuickActions from './quick-actions';
import RecentSessions from './recent-sessions';
import ProgressOverview from './progress-overview';
import { User } from '@/types/user';
import { useConvex } from 'convex/react';
import { api } from '@/convex/_generated/api';

interface DashboardViewProps {
  user: User;
}

export default function DashboardView({ user }: DashboardViewProps) {
  const [currentMood, setCurrentMood] = useState<string | null>(null);
  const [weeklyProgress, setWeeklyProgress] = useState(65);
  const [recentSessions, setRecentSessions] = useState([]);
  const convex = useConvex();

  useEffect(() => {
    // Load user's recent sessions from Convex
    const loadRecentSessions = async () => {
      try {
        const sessions = await convex.query(api.sessions.getUserSessions, {
          userId: user.id as any,
        });
        setRecentSessions(sessions);
      } catch (error) {
        console.error('Error loading sessions:', error);
      }
    };

    loadRecentSessions();
  }, [user.id, convex]);

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader user={user} />
      
      <main className="container mx-auto px-6 py-8 space-y-8">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                Welcome back, {user.name?.split(' ')[0] || 'there'}! 👋
              </h1>
              <p className="text-muted-foreground text-lg">
                How are you feeling today? Let's check in on your mental wellness.
              </p>
            </div>
            <Badge variant="secondary" className="mt-4 md:mt-0">
              Premium Member
            </Badge>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">
            <MoodCheckIn currentMood={currentMood} setCurrentMood={setCurrentMood} />
            <QuickActions />
            <RecentSessions sessions={recentSessions} />
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            <ProgressOverview weeklyProgress={weeklyProgress} />
            
            {/* Upcoming Sessions */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Upcoming Sessions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                    <div>
                      <p className="font-medium">Video Therapy</p>
                      <p className="text-sm text-muted-foreground">Today, 3:00 PM</p>
                    </div>
                    <Badge variant="outline">Scheduled</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                    <div>
                      <p className="font-medium">Voice Session</p>
                      <p className="text-sm text-muted-foreground">Tomorrow, 10:00 AM</p>
                    </div>
                    <Badge variant="outline">Scheduled</Badge>
                  </div>
                  <Button variant="outline" className="w-full">
                    <Calendar className="h-4 w-4 mr-2" />
                    Schedule New Session
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Quick Stats */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    This Week
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Sessions Completed</span>
                    <span className="font-semibold">{recentSessions.length}/4</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Average Mood</span>
                    <div className="flex items-center gap-1">
                      <Smile className="h-4 w-4 text-green-500" />
                      <span className="font-semibold">Good</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Streak</span>
                    <span className="font-semibold">12 days</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Journal Entries</span>
                    <span className="font-semibold">5</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}