"use client";

import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, Target, Award } from 'lucide-react';

interface ProgressOverviewProps {
  weeklyProgress: number;
}

export default function ProgressOverview({ weeklyProgress }: ProgressOverviewProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6, delay: 0.3 }}
    >
      <Card className="glass-card floating-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Weekly Progress
          </CardTitle>
          <CardDescription>
            You're making great progress this week!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Weekly Goal</span>
              <span>{weeklyProgress}%</span>
            </div>
            <Progress value={weeklyProgress} className="h-2" />
          </div>

          <div className="space-y-3">
            <motion.div
              className="flex items-center justify-between therapeutic-hover p-2 rounded-lg"
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-blue-500" />
                <span className="text-sm">Sessions Goal</span>
              </div>
              <span className="text-sm font-medium">3/4</span>
            </motion.div>

            <motion.div
              className="flex items-center justify-between therapeutic-hover p-2 rounded-lg"
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4 text-green-500" />
                <span className="text-sm">Mood Consistency</span>
              </div>
              <span className="text-sm font-medium">85%</span>
            </motion.div>
          </div>

          <motion.div
            className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20 p-4 rounded-lg backdrop-blur-subtle"
            whileHover={{ scale: 1.02 }}
          >
            <h4 className="font-medium text-green-800 dark:text-green-200 mb-1">Keep it up!</h4>
            <p className="text-sm text-green-700 dark:text-green-300">
              You're on track to complete your weekly mental health goals.
            </p>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}