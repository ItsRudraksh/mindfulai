"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Heart, ArrowRight, Calendar, Briefcase, User, Loader2, Target } from 'lucide-react';
import { useQuery, useMutation, useAction } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { toast } from 'sonner';
import { Authenticated, Unauthenticated } from "convex/react";
import { addOrUpdateGoal } from '@/convex/goals';

export default function OnboardingPage() {
  const router = useRouter();
  const user = useQuery(api.users.current);
  const hasCompletedOnboarding = useQuery(api.users.hasCompletedOnboarding);
  const updateUserProfileOnboarding = useMutation(api.users.updateUserProfileOnboarding);
  const createInitialGlobalMemory = useAction(api.globalMemory.createInitialGlobalMemory);
  const addGoal = useMutation(api.goals.addOrUpdateGoal);

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    dob: '',
    gender: '',
    profession: '',
    aboutMe: '',
    sessionGoal: '4',
  });

  // Redirect if user has already completed onboarding
  useEffect(() => {
    if (hasCompletedOnboarding) {
      router.push('/dashboard');
    }
  }, [hasCompletedOnboarding, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNext = () => {
    if (step === 1 && !formData.dob) {
      toast.error('Please enter your date of birth');
      return;
    }
    if (step === 1 && !formData.gender) {
      toast.error('Please select your gender');
      return;
    }
    if (step === 2 && !formData.profession) {
      toast.error('Please enter your profession');
      return;
    }
    if (step === 3 && !formData.aboutMe.trim()) {
      toast.error('Please tell us a bit about yourself');
      return;
    }
    setStep(prev => prev + 1);
  };

  const handleBack = () => {
    setStep(prev => prev - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Update user profile with onboarding data
      await updateUserProfileOnboarding({
        dob: formData.dob,
        gender: formData.gender,
        profession: formData.profession,
        aboutMe: formData.aboutMe,
      });

      // Create initial global memory and goal
      if (user) {
        await createInitialGlobalMemory({
          userId: user._id,
          dob: formData.dob,
          gender: formData.gender,
          profession: formData.profession,
          aboutMe: formData.aboutMe,
        });

        // Add or update session goal
        await addGoal({
          title: "Weekly Sessions",
          category: "sessions",
          target: parseInt(formData.sessionGoal, 10),
        });
      }

      toast.success('Profile created successfully!');
      router.push('/dashboard');
    } catch (error) {
      console.error('Error during onboarding:', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkipAndSubmit = async () => {
    // Set a default or skip the goal
    setFormData(prev => ({ ...prev, sessionGoal: '0' })); // '0' or some other indicator of skipping
    // Then submit. We create a new handler to avoid form event issues.
    setIsSubmitting(true);

    try {
      // Update user profile with onboarding data
      await updateUserProfileOnboarding({
        dob: formData.dob,
        gender: formData.gender,
        profession: formData.profession,
        aboutMe: formData.aboutMe,
      });

      // Create initial global memory
      if (user) {
        await createInitialGlobalMemory({
          userId: user._id,
          dob: formData.dob,
          gender: formData.gender,
          profession: formData.profession,
          aboutMe: formData.aboutMe,
        });

        // No goal is set if skipped
      }

      toast.success('Profile created successfully!');
      router.push('/dashboard');
    } catch (error) {
      console.error('Error during onboarding:', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (user === undefined) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <Authenticated>
        <div className="min-h-screen bg-gradient-to-br from-blue-50/40 via-white/60 to-green-50/40 dark:from-blue-950/40 dark:via-gray-900/60 dark:to-green-950/40 backdrop-blur-therapeutic flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="w-full max-w-2xl"
          >
            <div className="text-center mb-8">
              <motion.div
                className="flex items-center justify-center mb-4"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.2 }}
              >
                <Heart className="h-12 w-12 text-primary animate-gentle-pulse" />
              </motion.div>
              <h1 className="text-3xl font-bold mb-2">Welcome to MindfulAI</h1>
              <p className="text-muted-foreground">Let's personalize your experience to better support your mental health journey</p>
            </div>

            <Card className="glass-card floating-card">
              <CardHeader>
                <CardTitle>Complete Your Profile</CardTitle>
                <CardDescription>
                  Step {step} of 4 - {step === 1 ? 'Basic Information' : step === 2 ? 'Professional Background' : step === 3 ? 'About You' : 'Set Your Goals'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Step 1: Date of Birth */}
                  {step === 1 && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-4"
                    >
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Calendar className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-medium">Date of Birth</h3>
                          <p className="text-sm text-muted-foreground">This helps us provide age-appropriate support</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="dob">Date of Birth</Label>
                        <Input
                          id="dob"
                          name="dob"
                          type="date"
                          value={formData.dob}
                          onChange={handleChange}
                          className="glass-input"
                          required
                        />
                        <p className="text-xs text-muted-foreground">Your date of birth is used to provide age-appropriate mental health support.</p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="gender">Gender</Label>
                        <Select name="gender" onValueChange={(value) => handleSelectChange('gender', value)} value={formData.gender}>
                          <SelectTrigger className="w-full glass-input">
                            <SelectValue placeholder="Select your gender" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="non-binary">Non-binary</SelectItem>
                            <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">This helps us tailor our support to your identity.</p>
                      </div>
                    </motion.div>
                  )}

                  {/* Step 2: Profession */}
                  {step === 2 && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-4"
                    >
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Briefcase className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-medium">Professional Background</h3>
                          <p className="text-sm text-muted-foreground">Understanding your work context helps us provide relevant support</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="profession">Profession or Field</Label>
                        <Input
                          id="profession"
                          name="profession"
                          placeholder="e.g., Teacher, Software Engineer, Student, Retired"
                          value={formData.profession}
                          onChange={handleChange}
                          className="glass-input"
                          required
                        />
                        <p className="text-xs text-muted-foreground">Your profession helps us understand potential work-related stressors and coping strategies.</p>
                      </div>
                    </motion.div>
                  )}

                  {/* Step 3: About Me */}
                  {step === 3 && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-4"
                    >
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-medium">Tell Us About Yourself</h3>
                          <p className="text-sm text-muted-foreground">This helps us personalize your mental health support</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="aboutMe">About Me</Label>
                        <Textarea
                          id="aboutMe"
                          name="aboutMe"
                          placeholder="Tell us about yourself, your personality, habits, interests, and what brings you to MindfulAI..."
                          value={formData.aboutMe}
                          onChange={handleChange}
                          className="glass-input min-h-[200px]"
                          required
                        />
                        <p className="text-xs text-muted-foreground">
                          Consider mentioning:
                          <ul className="list-disc list-inside mt-1 space-y-1">
                            <li>Your personality traits</li>
                            <li>Daily habits and routines</li>
                            <li>Interests and hobbies</li>
                            <li>What you hope to gain from using MindfulAI</li>
                            <li>Any specific mental health concerns</li>
                          </ul>
                        </p>
                      </div>
                    </motion.div>
                  )}

                  {/* Step 4: Set Your Goals */}
                  {step === 4 && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-4"
                    >
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Target className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-medium">Set Your Weekly Goal</h3>
                          <p className="text-sm text-muted-foreground">How many sessions would you like to complete each week?</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="sessionGoal">Weekly Session Goal</Label>
                        <Input
                          id="sessionGoal"
                          name="sessionGoal"
                          type="number"
                          min="1"
                          max="14"
                          value={formData.sessionGoal}
                          onChange={handleChange}
                          className="glass-input"
                          required
                        />
                        <p className="text-xs text-muted-foreground">
                          Setting a realistic goal helps you stay motivated. We recommend 2-4 sessions per week.
                        </p>
                      </div>
                    </motion.div>
                  )}

                  {/* Navigation Buttons */}
                  <div className="flex justify-between pt-4">
                    {step > 1 ? (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleBack}
                        className="therapeutic-hover"
                        disabled={isSubmitting}
                      >
                        Back
                      </Button>
                    ) : (
                      <div></div> // Empty div for spacing
                    )}

                    {step < 4 ? (
                      <Button
                        type="button"
                        onClick={handleNext}
                        className="w-32"
                        aria-label="Next step"
                      >
                        Next <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    ) : (
                      <div className="flex gap-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleSkipAndSubmit}
                          className="w-32"
                          disabled={isSubmitting}
                        >
                          Skip & Finish
                        </Button>
                        <Button
                          type="submit"
                          className="w-32"
                          disabled={isSubmitting}
                          aria-label="Submit onboarding form"
                        >
                          {isSubmitting ? <Loader2 className="animate-spin h-4 w-4" /> : 'Finish'}
                        </Button>
                      </div>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>

            <div className="text-center mt-6 text-sm text-muted-foreground">
              <p>Your information is securely stored and used only to personalize your experience.</p>
            </div>
          </motion.div>
        </div>
      </Authenticated>
      <Unauthenticated>
        <RedirectToSignIn />
      </Unauthenticated>
    </>
  );
}

function RedirectToSignIn() {
  const router = useRouter();

  useEffect(() => {
    router.push('/auth/signin');
  }, [router]);

  return null;
}