"use client";

import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, Target, Award } from 'lucide-react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { toast } from 'sonner';

export default function ProgressOverview() {
  const sessionProgress = useQuery(api.metrics.getWeeklySessionProgress);
  const moodConsistency = useQuery(api.metrics.getWeeklyMoodConsistency);
  const addOrUpdateGoal = useMutation(api.goals.addOrUpdateGoal);

  const [isGoalDialogOpen, setIsGoalDialogOpen] = useState(false);
  const [weeklySessionGoal, setWeeklySessionGoal] = useState('4');
  const [isUpdatingGoal, setIsUpdatingGoal] = useState(false);

  const weeklyProgress = sessionProgress?.percentage ?? 0;
  const noGoalSet = sessionProgress?.target === 0;

  const handleSetGoal = async () => {
    setIsUpdatingGoal(true);
    try {
      await addOrUpdateGoal({
        title: "Weekly Sessions",
        category: "sessions",
        target: parseInt(weeklySessionGoal, 10),
      });
      toast.success("Goal set successfully!");
      setIsGoalDialogOpen(false);
    } catch (error) {
      toast.error("Failed to set goal.");
    } finally {
      setIsUpdatingGoal(false);
    }
  };

  if (sessionProgress === undefined || moodConsistency === undefined) {
    return (
      <Card className="glass-card floating-card">
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-52" />
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-10" />
            </div>
            <Skeleton className="h-2 w-full" />
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4 rounded-full" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-4 w-12" />
            </div>
            <div className="flex items-center justify-between p-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4 rounded-full" />
                <Skeleton className="h-4 w-28" />
              </div>
              <Skeleton className="h-4 w-12" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

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
              {noGoalSet ? (
                <Button variant="link" size="sm" onClick={() => setIsGoalDialogOpen(true)}>Set Goal</Button>
              ) : (
                <span className="text-sm font-medium">{sessionProgress.current}/{sessionProgress.target}</span>
              )}
            </motion.div>

            <motion.div
              className="flex items-center justify-between therapeutic-hover p-2 rounded-lg"
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4 text-green-500" />
                <span className="text-sm">Mood Consistency</span>
              </div>
              <span className="text-sm font-medium">{moodConsistency.consistency}%</span>
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
      <Dialog open={isGoalDialogOpen} onOpenChange={setIsGoalDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Set Your Weekly Session Goal</DialogTitle>
            <DialogDescription>
              How many sessions would you like to complete each week to stay on track?
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="weeklySessionGoal">Weekly Sessions</Label>
              <Input
                id="weeklySessionGoal"
                type="number"
                min="1"
                max="14"
                value={weeklySessionGoal}
                onChange={(e) => setWeeklySessionGoal(e.target.value)}
                className="glass-input"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={handleSetGoal}
              disabled={isUpdatingGoal}
              className="therapeutic-hover"
            >
              {isUpdatingGoal ? "Saving..." : "Set Goal"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}