"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
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
  const [showFeedback, setShowFeedback] = useState(existingRating ? existingRating.rating < 3 : false);

  const createSessionRatingMutation = useMutation(api.sessionRatings.createSessionRating);

  const handleRatingClick = (value: number) => {
    setRating(value);
    setShowFeedback(value < 3);
    if (value >= 3) {
      setFeedback(''); // Clear feedback for good ratings
    }
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    if (rating < 3 && !feedback.trim()) {
      toast.error('Please provide feedback for ratings below 3 stars');
      return;
    }

    setIsSubmitting(true);
    try {
      await createSessionRatingMutation({
        sessionId,
        rating,
        feedback: feedback.trim() || undefined,
      });

      toast.success('Thank you for your feedback!');
      onRatingSubmitted?.();
    } catch (error) {
      console.error('Error submitting rating:', error);
      toast.error('Failed to submit rating');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRatingText = (value: number) => {
    switch (value) {
      case 1: return 'Poor';
      case 2: return 'Fair';
      case 3: return 'Good';
      case 4: return 'Very Good';
      case 5: return 'Excellent';
      default: return '';
    }
  };

  const getSessionTypeText = () => {
    switch (sessionType) {
      case 'video': return 'video therapy session';
      case 'voice': return 'voice therapy session';
      case 'chat': return 'chat therapy session';
      default: return 'therapy session';
    }
  };

  return (
    <Card className="glass-card floating-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="h-5 w-5 text-pink-500" />
          Rate Your Session
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          How was your {getSessionTypeText()}? Your feedback helps us improve.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Star Rating */}
        <div className="text-center">
          <div className="flex justify-center space-x-2 mb-3">
            {[1, 2, 3, 4, 5].map((value) => (
              <motion.button
                key={value}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleRatingClick(value)}
                onMouseEnter={() => setHoveredRating(value)}
                onMouseLeave={() => setHoveredRating(0)}
                className="p-1 transition-colors duration-200"
              >
                <Star
                  className={`h-8 w-8 transition-colors duration-200 ${
                    value <= (hoveredRating || rating)
                      ? 'text-yellow-400 fill-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              </motion.button>
            ))}
          </div>
          
          {(hoveredRating || rating) > 0 && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm font-medium text-primary"
            >
              {getRatingText(hoveredRating || rating)}
            </motion.p>
          )}
        </div>

        {/* Feedback Section */}
        {showFeedback && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3"
          >
            <div>
              <label className="text-sm font-medium text-foreground block mb-2">
                {rating < 3 ? 'What could we improve?' : 'Any additional feedback? (optional)'}
              </label>
              <Textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder={
                  rating < 3
                    ? 'Please let us know how we can improve your experience...'
                    : 'Share any thoughts about your session...'
                }
                className="min-h-[100px] glass-input"
                required={rating < 3}
              />
            </div>
          </motion.div>
        )}

        {/* Submit Button */}
        <div className="flex justify-center">
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || rating === 0}
            className="therapeutic-hover ripple-effect"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Submitting...
              </>
            ) : (
              <>
                <ThumbsUp className="h-4 w-4 mr-2" />
                Submit Rating
              </>
            )}
          </Button>
        </div>

        {/* Thank You Message for Good Ratings */}
        {rating >= 3 && !showFeedback && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg"
          >
            <p className="text-sm text-green-700 dark:text-green-300">
              Thank you for the positive feedback! We're glad you had a good experience.
            </p>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}