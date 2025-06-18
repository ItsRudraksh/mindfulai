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
      <Card>
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
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-blue-500" />
                <span className="text-sm">Sessions Goal</span>
              </div>
              <span className="text-sm font-medium">3/4</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4 text-green-500" />
                <span className="text-sm">Mood Consistency</span>
              </div>
              <span className="text-sm font-medium">85%</span>
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-green-800 mb-1">Keep it up!</h4>
            <p className="text-sm text-green-700">
              You're on track to complete your weekly mental health goals.
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}