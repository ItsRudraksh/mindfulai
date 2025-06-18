"use client";

import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Smile, Meh, Frown, Heart, Zap } from 'lucide-react';
import { useState } from 'react';

interface MoodCheckInProps {
  currentMood: string | null;
  setCurrentMood: (mood: string) => void;
}

export default function MoodCheckIn({ currentMood, setCurrentMood }: MoodCheckInProps) {
  const moods = [
    { id: 'great', icon: Smile, label: 'Great', color: 'text-green-500', bg: 'bg-green-50' },
    { id: 'good', icon: Smile, label: 'Good', color: 'text-blue-500', bg: 'bg-blue-50' },
    { id: 'okay', icon: Meh, label: 'Okay', color: 'text-yellow-500', bg: 'bg-yellow-50' },
    { id: 'down', icon: Frown, label: 'Down', color: 'text-orange-500', bg: 'bg-orange-50' },
    { id: 'struggling', icon: Frown, label: 'Struggling', color: 'text-red-500', bg: 'bg-red-50' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.1 }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-pink-500" />
            Daily Mood Check-in
          </CardTitle>
          <CardDescription>
            How are you feeling right now? Your mood helps us personalize your experience.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-3 mb-6">
            {moods.map((mood, index) => (
              <motion.button
                key={mood.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                onClick={() => setCurrentMood(mood.id)}
                className={`
                  flex flex-col items-center p-4 rounded-lg border-2 transition-all duration-200 hover:scale-105
                  ${currentMood === mood.id 
                    ? 'border-primary bg-primary/10' 
                    : 'border-gray-200 hover:border-gray-300'
                  }
                `}
              >
                <mood.icon className={`h-8 w-8 mb-2 ${mood.color}`} />
                <span className="text-sm font-medium">{mood.label}</span>
              </motion.button>
            ))}
          </div>
          
          {currentMood && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <p className="text-muted-foreground mb-4">
                Thanks for sharing! Based on your mood, here are some personalized recommendations:
              </p>
              <div className="flex gap-2 justify-center">
                <Button size="sm" variant="outline">
                  <Zap className="h-4 w-4 mr-2" />
                  Quick Meditation
                </Button>
                <Button size="sm" variant="outline">
                  Breathing Exercise
                </Button>
                <Button size="sm" variant="outline">
                  Journal Entry
                </Button>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}