"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import DashboardHeader from './dashboard-header';
import MoodCheckIn from './mood-check-in';
import QuickActions from './quick-actions';
import RecentSessions from './recent-sessions';
import ProgressOverview from './progress-overview';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function DashboardView() {
  const [currentMood, setCurrentMood] = useState<string | null>(null);
  const user = useQuery(api.users.current);
  const hasCompletedOnboarding = useQuery(api.users.hasCompletedOnboarding);
  const recentSessions = useQuery(api.sessions.getUserSessions) || [];
  const router = useRouter();

  // Redirect to onboarding if not completed
  useEffect(() => {
    if (hasCompletedOnboarding === false) {
      router.push('/onboarding');
    }
  }, [hasCompletedOnboarding, router]);

  if (hasCompletedOnboarding === false) {
    return null; // Don't render anything while redirecting
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

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
                Welcome back, <span className='capitalize'>{user.name?.split(' ')[0] || 'there'}</span>! 👋
              </h1>
              <p className="text-muted-foreground text-lg">
                How are you feeling today? Let's check in on your mental wellness.
              </p>
            </div>
            {/* Subscription Badge */}
            {user.subscription?.plan === 'pro' ? (
              <Link href="/pricing" tabIndex={0} aria-label="Go to pricing page">
                <Badge variant="secondary" className="mt-4 md:mt-0 cursor-pointer hover:underline">
                  {user.subscription.planName}
                  {user.subscription.planName?.includes('One-Time') && user.subscription.currentPeriodEnd && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      (Expires on {new Date(user.subscription.currentPeriodEnd).toLocaleDateString()})
                    </span>
                  )}
                </Badge>
              </Link>
            ) : (
              <Link href="/pricing" tabIndex={0} aria-label="Go to pricing page">
                <Badge variant="secondary" className="mt-4 md:mt-0 cursor-pointer hover:underline">
                  Free Member
                </Badge>
              </Link>
            )}
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
            <ProgressOverview />

            {/* Upcoming Sessions */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              {/* Upcoming sessions content */}
            </motion.div>

            {/* Quick Stats */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              {/* Quick stats content */}
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}