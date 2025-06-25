"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star, Heart, ThumbsUp } from 'lucide-react';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { toast } from 'sonner';

interface SessionRatingProps {
  sessionId: Id<"sessions">;
  sessionType: 'video' | 'voice' | 'chat';
  existingRating?: {
    _id: Id<"sessionRatings">;
    rating: number;
    feedback?: string;
  } | null;
  onRatingSubmitted?: () => void;
}

export function SessionRating({ 
  sessionId, 
  sessionType, 
  existingRating, 
  onRatingSubmitted 
}: SessionRatingProps) {
  const [rating, setRating] = useState(existingRating?.rating || 0);
  const [feedback, setFeedback] = useState(existingRating?.feedback || '');
  const [hoveredRating, setHoveredRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(!!existingRating);
  const [showFeedback, setShowFeedback] = useState((existingRating?.rating || 0) < 3);

  const createRatingMutation = useMutation(api.sessionRatings.createSessionRating);

  const handleRatingClick = (selectedRating: number) => {
    setRating(selectedRating);
    setShowFeedback(selectedRating < 3);
    
    // If rating is 3 or higher, auto-submit without feedback
    if (selectedRating >= 3) {
      handleSubmit(selectedRating, '');
    }
  };

  const handleSubmit = async (submitRating?: number, submitFeedback?: string) => {
    const finalRating = submitRating || rating;
    const finalFeedback = submitFeedback !== undefined ? submitFeedback : feedback;

    if (finalRating === 0) {
      toast.error('Please select a rating');
      return;
    }

    if (finalRating < 3 && !finalFeedback.trim()) {
      toast.error('Please provide feedback for ratings below 3 stars');
      return;
    }

    setIsSubmitting(true);

    try {
      await createRatingMutation({
        sessionId,
        rating: finalRating,
        feedback: finalFeedback.trim() || undefined,
      });

      setHasSubmitted(true);
      
      if (finalRating >= 4) {
        toast.success('Thank you for the great rating! 🌟');
      } else if (finalRating === 3) {
        toast.success('Thank you for your feedback!');
      } else {
        toast.success('Thank you for your feedback. We\'ll work to improve your experience.');
      }

      // Call the callback to update parent component state
      onRatingSubmitted?.();
    } catch (error) {
      console.error('Error submitting rating:', error);
      toast.error('Failed to submit rating. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSessionTypeLabel = (type: string) => {
    switch (type) {
      case 'video': return 'Video Therapy Session';
      case 'voice': return 'Voice Therapy Session';
      case 'chat': return 'Chat Therapy Session';
      default: return 'Therapy Session';
    }
  };

  const getRatingMessage = (rating: number) => {
    switch (rating) {
      case 5: return 'Excellent! 🌟';
      case 4: return 'Great! 👍';
      case 3: return 'Good 👌';
      case 2: return 'Could be better 😐';
      case 1: return 'Needs improvement 😞';
      default: return '';
    }
  };

  if (hasSubmitted && !existingRating) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-8"
      >
        <Card className="glass-card floating-card">
          <CardContent className="pt-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="w-16 h-16 bg-green-100 dark:bg-green-950/20 rounded-full flex items-center justify-center mx-auto mb-4"
            >
              {rating >= 4 ? (
                <Heart className="h-8 w-8 text-green-600 fill-green-600" />
              ) : (
                <ThumbsUp className="h-8 w-8 text-green-600" />
              )}
            </motion.div>
            <h3 className="text-lg font-semibold mb-2">Thank you for your feedback!</h3>
            <p className="text-sm text-muted-foreground">
              Your rating helps us improve our therapy sessions.
            </p>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="glass-card floating-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            Rate Your {getSessionTypeLabel(sessionType)}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Star Rating */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              How was your therapy session experience?
            </p>
            
            <div className="flex justify-center gap-2 mb-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <motion.button
                  key={star}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleRatingClick(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="p-1 rounded-full transition-colors duration-200"
                  disabled={isSubmitting}
                >
                  <Star
                    className={`h-8 w-8 transition-colors duration-200 ${
                      star <= (hoveredRating || rating)
                        ? 'text-yellow-400 fill-yellow-400'
                        : 'text-gray-300 hover:text-yellow-300'
                    }`}
                  />
                </motion.button>
              ))}
            </div>

            <AnimatePresence>
              {(hoveredRating || rating) > 0 && (
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="text-sm font-medium text-primary"
                >
                  {getRatingMessage(hoveredRating || rating)}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* Feedback Section */}
          <AnimatePresence>
            {showFeedback && rating > 0 && rating < 3 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    What could we improve? <span className="text-red-500">*</span>
                  </label>
                  <Textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Please share what didn't work well or how we can improve your experience..."
                    className="min-h-[100px] glass-input"
                    disabled={isSubmitting}
                  />
                </div>

                <Button
                  onClick={() => handleSubmit()}
                  disabled={isSubmitting || !feedback.trim()}
                  className="w-full therapeutic-hover ripple-effect"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Update Rating Option */}
          {existingRating && (
            <div className="text-center pt-4 border-t border-border/30">
              <p className="text-xs text-muted-foreground mb-2">
                Current rating: {existingRating.rating}/5 stars
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setHasSubmitted(false);
                  setRating(existingRating.rating);
                  setFeedback(existingRating.feedback || '');
                  setShowFeedback(existingRating.rating < 3);
                }}
                className="therapeutic-hover"
              >
                Update Rating
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}