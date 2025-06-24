"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Smile, Meh, Frown, Heart, Zap, Video, Phone, MessageCircle, PenTool, Brain, Wind, ArrowRight, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { generateMoodActivityRecommendations, type MoodRecommendation } from '@/lib/ai';
import { toast } from 'sonner';

interface MoodCheckInProps {
  currentMood: string | null;
  setCurrentMood: (mood: string) => void;
}

const iconMap = {
  Video,
  Phone,
  MessageCircle,
  PenTool,
  Brain,
  Wind,
};

export default function MoodCheckIn({ currentMood, setCurrentMood }: MoodCheckInProps) {
  const [recommendations, setRecommendations] = useState<MoodRecommendation | null>(null);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);

  const moods = [
    { id: 'great', icon: Smile, label: 'Great', color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-950/20' },
    { id: 'good', icon: Smile, label: 'Good', color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950/20' },
    { id: 'okay', icon: Meh, label: 'Okay', color: 'text-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-950/20' },
    { id: 'down', icon: Frown, label: 'Down', color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-950/20' },
    { id: 'struggling', icon: Frown, label: 'Struggling', color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-950/20' },
  ];

  const handleMoodSelection = async (moodId: string) => {
    setCurrentMood(moodId);
    setIsLoadingRecommendations(true);
    
    try {
      const moodRecommendations = await generateMoodActivityRecommendations(moodId, {
        name: 'there', // You can pass user context here
        previousSessions: 0,
      });
      
      setRecommendations(moodRecommendations);
      toast.success('Got personalized recommendations for you!');
    } catch (error) {
      console.error('Error getting mood recommendations:', error);
      toast.error('Failed to get recommendations, but that\'s okay!');
    } finally {
      setIsLoadingRecommendations(false);
    }
  };

  const getIconComponent = (iconName: string) => {
    return iconMap[iconName as keyof typeof iconMap] || MessageCircle;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.1 }}
    >
      <Card className="glass-card floating-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-pink-500 animate-gentle-pulse" />
            Daily Mood Check-in
          </CardTitle>
          <CardDescription>
            How are you feeling right now? I'll suggest the best activities for your current mood.
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
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleMoodSelection(mood.id)}
                disabled={isLoadingRecommendations}
                className={`
                  flex flex-col items-center p-4 rounded-lg border-glass transition-all duration-350 ease-in-out therapeutic-hover ripple-effect
                  ${currentMood === mood.id 
                    ? 'border-primary bg-primary/10 shadow-therapeutic' 
                    : 'border-border hover:border-muted-foreground'
                  }
                  ${isLoadingRecommendations ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                <mood.icon className={`h-8 w-8 mb-2 ${mood.color}`} />
                <span className="text-sm font-medium">{mood.label}</span>
              </motion.button>
            ))}
          </div>
          
          {/* Loading State */}
          {isLoadingRecommendations && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-6"
            >
              <div className="flex items-center justify-center space-x-2 mb-3">
                <Sparkles className="h-5 w-5 text-primary animate-spin" />
                <span className="text-muted-foreground">Getting personalized recommendations...</span>
              </div>
            </motion.div>
          )}

          {/* AI Recommendations */}
          <AnimatePresence>
            {recommendations && !isLoadingRecommendations && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4"
              >
                {/* Encouragement Message */}
                <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-950/20 dark:to-green-950/20 rounded-lg backdrop-blur-subtle">
                  <p className="text-sm text-muted-foreground mb-2">{recommendations.reasoning}</p>
                  <p className="text-sm font-medium text-primary">{recommendations.encouragement}</p>
                </div>

                {/* Top Recommendations */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Recommended for you:</span>
                  </div>
                  
                  {recommendations.topRecommendations.map((activity, index) => {
                    const IconComponent = getIconComponent(activity.icon);
                    
                    return (
                      <motion.div
                        key={activity.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                      >
                        <Button
                          variant="outline"
                          asChild
                          className="w-full h-auto p-4 justify-start therapeutic-hover ripple-effect group"
                        >
                          <Link href={activity.route}>
                            <div className="flex items-center space-x-4 w-full">
                              <motion.div 
                                className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0"
                                whileHover={{ rotate: 5 }}
                                transition={{ duration: 0.2 }}
                              >
                                <IconComponent className="h-6 w-6 text-primary" />
                              </motion.div>
                              
                              <div className="flex-1 text-left">
                                <h4 className="font-semibold text-sm mb-1">{activity.name}</h4>
                                <p className="text-xs text-muted-foreground mb-2">{activity.description}</p>
                                <div className="flex items-center gap-2">
                                  <Badge variant="secondary" className="text-xs">
                                    {activity.estimatedTime}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">
                                    {activity.benefits.slice(0, 2).join(', ')}
                                  </span>
                                </div>
                              </div>
                              
                              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                            </div>
                          </Link>
                        </Button>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Quick Actions */}
                <div className="flex gap-2 justify-center pt-2">
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => setRecommendations(null)}
                    className="calming-hover text-xs"
                  >
                    Choose Different Mood
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Fallback Quick Actions */}
          {currentMood && !recommendations && !isLoadingRecommendations && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <p className="text-muted-foreground mb-4">
                Thanks for sharing! Here are some quick options to support your wellbeing:
              </p>
              <div className="flex gap-2 justify-center">
                <Button size="sm" variant="outline" className="calming-hover" asChild>
                  <Link href="/meditation">
                    <Zap className="h-4 w-4 mr-2" />
                    Quick Meditation
                  </Link>
                </Button>
                <Button size="sm" variant="outline" className="calming-hover" asChild>
                  <Link href="/breathing">
                    Breathing Exercise
                  </Link>
                </Button>
                <Button size="sm" variant="outline" className="calming-hover" asChild>
                  <Link href="/journal">
                    Journal Entry
                  </Link>
                </Button>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}