"use client";

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Brain, ArrowLeft, Play, Pause, RotateCcw, Sparkles, Volume2, VolumeX } from 'lucide-react';
import Link from 'next/link';
import { useQuery, useAction } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { toast } from 'sonner';
import { BackgroundGradientAnimation } from '@/components/ui/background-gradient-animation';

interface MeditationState {
  isGenerating: boolean;
  isPlaying: boolean;
  isPaused: boolean;
  audioUrl: string | null;
  script: string | null;
  duration: number;
  currentTime: number;
  volume: number;
  isMuted: boolean;
  sessionCompleted: boolean;
}

export default function MeditationSession() {
  const [state, setState] = useState<MeditationState>({
    isGenerating: false,
    isPlaying: false,
    isPaused: false,
    audioUrl: null,
    script: null,
    duration: 0,
    currentTime: 0,
    volume: 0.8,
    isMuted: false,
    sessionCompleted: false,
  });

  const [preferences, setPreferences] = useState({
    duration: '5-10 minutes',
    focus: 'stress relief',
    customRequest: '',
  });

  const audioRef = useRef<HTMLAudioElement>(null);
  const user = useQuery(api.users.current);
  const globalMemory = user?.globalMemory;
  const triggerUpdateGlobalMemoryFromMeditation = useAction(api.globalMemory.triggerUpdateGlobalMemoryFromMeditation);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => {
      setState(prev => ({
        ...prev,
        currentTime: audio.currentTime,
        duration: audio.duration || 0,
      }));
    };

    const handleEnded = () => {
      setState(prev => ({
        ...prev,
        isPlaying: false,
        isPaused: false,
        sessionCompleted: true,
      }));
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('loadedmetadata', updateTime);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('loadedmetadata', updateTime);
    };
  }, [state.audioUrl]);

  const generateMeditation = async () => {
    if (!user || !globalMemory) {
      toast.error('User profile not found');
      return;
    }

    setState(prev => ({ ...prev, isGenerating: true }));

    try {
      const response = await fetch('/api/meditation/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          globalMemory,
          preferences: {
            ...preferences,
            userName: user.name?.split(' ')[0] || 'there',
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate meditation');
      }

      const data = await response.json();

      if (data.success) {
        setState(prev => ({
          ...prev,
          script: data.script,
          audioUrl: data.audioUrl,
          sessionCompleted: false,
        }));
        toast.success('Meditation session generated successfully!');
      } else {
        throw new Error(data.error || 'Failed to generate meditation');
      }
    } catch (error) {
      console.error('Error generating meditation:', error);
      toast.error('Failed to generate meditation session');
    } finally {
      setState(prev => ({ ...prev, isGenerating: false }));
    }
  };

  const playPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (state.isPlaying) {
      audio.pause();
      setState(prev => ({ ...prev, isPlaying: false, isPaused: true }));
    } else {
      audio.play();
      setState(prev => ({ ...prev, isPlaying: true, isPaused: false }));
    }
  };

  const restart = () => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.currentTime = 0;
    setState(prev => ({
      ...prev,
      currentTime: 0,
      sessionCompleted: false,
    }));
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;

    const newMuted = !state.isMuted;
    audio.muted = newMuted;
    setState(prev => ({ ...prev, isMuted: newMuted }));
  };

  const handleVolumeChange = (newVolume: number) => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = newVolume;
    setState(prev => ({ ...prev, volume: newVolume }));
  };

  const endSession = async () => {
    if (user) {
      try {
        await triggerUpdateGlobalMemoryFromMeditation({
          userId: user._id,
          meditationData: {
            script: state.script || '',
            duration: Math.floor(state.currentTime),
            preferences,
            completedAt: Date.now(),
          },
        });
        toast.success('Meditation session completed and saved!');
      } catch (error) {
        console.error('Error updating global memory:', error);
      }
    }

    setState({
      isGenerating: false,
      isPlaying: false,
      isPaused: false,
      audioUrl: null,
      script: null,
      duration: 0,
      currentTime: 0,
      volume: 0.8,
      isMuted: false,
      sessionCompleted: false,
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50/40 via-white/60 to-indigo-50/40 dark:from-purple-950/40 dark:via-gray-900/60 dark:to-indigo-950/40 backdrop-blur-therapeutic">
      {/* Header */}
      <header className="glass-header sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="icon" asChild className="therapeutic-hover">
                <Link href="/dashboard">
                  <ArrowLeft className="h-5 w-5" />
                </Link>
              </Button>
              <div>
                <h1 className="text-xl font-semibold">Personalized Meditation</h1>
                <p className="text-sm text-muted-foreground">
                  AI-generated meditation tailored to your needs
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {state.isGenerating && (
                <Badge variant="secondary" className="bg-purple-100 dark:bg-purple-950/20 text-purple-800 dark:text-purple-200 backdrop-blur-subtle">
                  <Sparkles className="h-3 w-3 mr-1 animate-spin" />
                  Generating...
                </Badge>
              )}
              {state.audioUrl && (
                <Badge variant="secondary" className="bg-green-100 dark:bg-green-950/20 text-green-800 dark:text-green-200 backdrop-blur-subtle">
                  Ready
                </Badge>
              )}
              {globalMemory && (
                <Badge variant="outline" className="bg-primary/5">
                  Personalized
                </Badge>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8 max-w-6xl">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Meditation Interface */}
          <div className="lg:col-span-2">
            <Card className="h-auto py-4 flex flex-col glass-card floating-card overflow-hidden relative">
              {/* Background Gradient Animation */}
              <div className="absolute inset-0 z-0">
                <BackgroundGradientAnimation
                  gradientBackgroundStart="rgb(139, 92, 246)"  // Purple-500
                  gradientBackgroundEnd="rgb(99, 102, 241)"    // Indigo-500
                  firstColor="139, 92, 246"    // Purple-500
                  secondColor="124, 58, 237"   // Purple-600
                  thirdColor="99, 102, 241"    // Indigo-500
                  fourthColor="79, 70, 229"    // Indigo-600
                  fifthColor="67, 56, 202"     // Indigo-700
                  pointerColor="139, 92, 246"  // Purple-500
                  size="80%"
                  blendingValue="hard-light"
                />
              </div>

              {/* Content Layer */}
              <div className="relative z-10 flex flex-col h-full">
                <CardHeader className="text-center text-white relative z-20">
                  <CardTitle className='mt-3'>Mindful Meditation</CardTitle>
                  <p className="text-white/80">
                    {!state.audioUrl && !state.isGenerating
                      ? "Set your preferences below to generate a personalized meditation session."
                      : state.isGenerating
                        ? "Creating your personalized meditation experience..."
                        : state.sessionCompleted
                          ? "Meditation session completed. How do you feel?"
                          : "Your personalized meditation is ready. Find a comfortable position and begin."
                    }
                  </p>
                </CardHeader>

                <CardContent className="flex-1 flex flex-col items-center space-y-6 relative z-20">
                  {/* Meditation Visualization */}
                  <div className="relative">
                    <motion.div
                      className={`w-32 h-32 rounded-full flex items-center justify-center backdrop-blur-subtle ${
                        state.isPlaying
                          ? 'bg-green-100/80 dark:bg-green-950/40'
                          : state.sessionCompleted
                            ? 'bg-blue-100/80 dark:bg-blue-950/40'
                            : state.audioUrl
                              ? 'bg-purple-100/80 dark:bg-purple-950/40'
                              : 'bg-white/20'
                      }`}
                      animate={
                        state.isPlaying
                          ? { scale: [1, 1.1, 1] }
                          : {}
                      }
                      transition={{ duration: 3, repeat: Infinity }}
                    >
                      <Brain className={`h-16 w-16 ${
                        state.isPlaying
                          ? 'text-green-600'
                          : state.sessionCompleted
                            ? 'text-blue-600'
                            : state.audioUrl
                              ? 'text-purple-600'
                              : 'text-white'
                      }`} />
                    </motion.div>

                    {state.isPlaying && (
                      <motion.div
                        className="absolute inset-0 rounded-full border-4 border-green-300/60"
                        animate={{ scale: [1, 1.5], opacity: [1, 0] }}
                        transition={{ duration: 3, repeat: Infinity }}
                      />
                    )}
                  </div>

                  {/* Preferences Form or Player Controls */}
                  {!state.audioUrl && !state.isGenerating && (
                    <div className="w-full max-w-md space-y-6 text-white">
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="duration" className="text-white text-left block mb-2 font-medium">
                            Preferred Duration
                          </Label>
                          <select
                            id="duration"
                            value={preferences.duration}
                            onChange={(e) => setPreferences(prev => ({ ...prev, duration: e.target.value }))}
                            className="w-full p-3 rounded-lg bg-white/20 border-white/30 text-white glass-input"
                          >
                            <option value="3-5 minutes" className="text-black">3-5 minutes</option>
                            <option value="5-10 minutes" className="text-black">5-10 minutes</option>
                            <option value="10-15 minutes" className="text-black">10-15 minutes</option>
                            <option value="15-20 minutes" className="text-black">15-20 minutes</option>
                          </select>
                        </div>

                        <div>
                          <Label htmlFor="focus" className="text-white text-left block mb-2 font-medium">
                            Focus Area
                          </Label>
                          <select
                            id="focus"
                            value={preferences.focus}
                            onChange={(e) => setPreferences(prev => ({ ...prev, focus: e.target.value }))}
                            className="w-full p-3 rounded-lg bg-white/20 border-white/30 text-white glass-input"
                          >
                            <option value="stress relief" className="text-black">Stress Relief</option>
                            <option value="anxiety reduction" className="text-black">Anxiety Reduction</option>
                            <option value="better sleep" className="text-black">Better Sleep</option>
                            <option value="focus and concentration" className="text-black">Focus & Concentration</option>
                            <option value="emotional balance" className="text-black">Emotional Balance</option>
                            <option value="self-compassion" className="text-black">Self-Compassion</option>
                            <option value="mindfulness" className="text-black">General Mindfulness</option>
                          </select>
                        </div>

                        <div>
                          <Label htmlFor="customRequest" className="text-white text-left block mb-2 font-medium">
                            Special Request (Optional)
                          </Label>
                          <Textarea
                            id="customRequest"
                            value={preferences.customRequest}
                            onChange={(e) => setPreferences(prev => ({ ...prev, customRequest: e.target.value }))}
                            placeholder="Any specific guidance or focus you'd like for today's meditation..."
                            className="min-h-[80px] resize-none bg-white/20 border-white/30 text-white placeholder:text-white/60 glass-input"
                          />
                        </div>
                      </div>

                      <Button
                        onClick={generateMeditation}
                        size="lg"
                        className="w-full bg-purple-600 hover:bg-purple-700 therapeutic-hover ripple-effect"
                        disabled={state.isGenerating}
                      >
                        <Sparkles className="h-5 w-5 mr-2" />
                        {state.isGenerating ? 'Creating Your Meditation...' : 'Generate Personalized Meditation'}
                      </Button>
                    </div>
                  )}

                  {/* Loading State */}
                  {state.isGenerating && (
                    <div className="text-center space-y-4 text-white">
                      <div className="flex items-center justify-center space-x-2 mb-3">
                        <Sparkles className="h-5 w-5 text-purple-300 animate-spin" />
                        <span className="text-white/80">Crafting your personalized meditation experience...</span>
                      </div>
                      <p className="text-sm text-white/60">This may take a moment as we generate your custom audio.</p>
                    </div>
                  )}

                  {/* Audio Player Controls */}
                  {state.audioUrl && (
                    <div className="w-full max-w-md space-y-6 text-white">
                      {/* Progress Bar */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm text-white/80">
                          <span>{formatTime(state.currentTime)}</span>
                          <span>{formatTime(state.duration)}</span>
                        </div>
                        <div className="w-full bg-white/20 rounded-full h-2">
                          <div
                            className="bg-white h-2 rounded-full transition-all duration-300"
                            style={{ width: `${(state.currentTime / state.duration) * 100 || 0}%` }}
                          />
                        </div>
                      </div>

                      {/* Player Controls */}
                      <div className="flex items-center justify-center space-x-4">
                        <Button
                          onClick={restart}
                          variant="outline"
                          size="icon"
                          className="border-white/30 text-white hover:bg-white/20"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>

                        <Button
                          onClick={playPause}
                          size="lg"
                          className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                        >
                          {state.isPlaying ? (
                            <Pause className="h-6 w-6" />
                          ) : (
                            <Play className="h-6 w-6" />
                          )}
                        </Button>

                        <Button
                          onClick={toggleMute}
                          variant="outline"
                          size="icon"
                          className="border-white/30 text-white hover:bg-white/20"
                        >
                          {state.isMuted ? (
                            <VolumeX className="h-4 w-4" />
                          ) : (
                            <Volume2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>

                      {/* Volume Control */}
                      <div className="flex items-center space-x-3">
                        <Volume2 className="h-4 w-4 text-white/60" />
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.1"
                          value={state.volume}
                          onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                          className="flex-1 h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>

                      {/* Session Completed Actions */}
                      {state.sessionCompleted && (
                        <div className="flex gap-3 justify-center pt-4">
                          <Button
                            onClick={restart}
                            variant="outline"
                            className="border-white/30 text-white hover:bg-white/20"
                          >
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Replay
                          </Button>
                          <Button
                            onClick={() => {
                              setState(prev => ({ ...prev, audioUrl: null, script: null, sessionCompleted: false }));
                            }}
                            variant="outline"
                            className="border-white/30 text-white hover:bg-white/20"
                          >
                            <Sparkles className="h-4 w-4 mr-2" />
                            New Session
                          </Button>
                          <Button
                            onClick={endSession}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            Complete Session
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Hidden Audio Element */}
                  {state.audioUrl && (
                    <audio
                      ref={audioRef}
                      src={state.audioUrl}
                      preload="metadata"
                      className="hidden"
                    />
                  )}
                </CardContent>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Session Info */}
            <Card className="glass-card floating-card">
              <CardHeader>
                <CardTitle className="text-lg">Session Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Duration</span>
                  <span className="text-sm">{preferences.duration}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Focus</span>
                  <span className="text-sm capitalize">{preferences.focus}</span>
                </div>
                {state.audioUrl && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <Badge variant="secondary" className="text-xs">
                      {state.isPlaying ? 'Playing' : state.sessionCompleted ? 'Completed' : 'Ready'}
                    </Badge>
                  </div>
                )}
                {globalMemory && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Personalization</span>
                    <Badge variant="outline" className="bg-primary/5 text-xs">
                      AI Customized
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Meditation Script Preview */}
            {state.script && (
              <Card className="glass-card floating-card">
                <CardHeader>
                  <CardTitle className="text-lg">Meditation Script</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="max-h-60 overflow-y-auto">
                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                      {state.script.substring(0, 300)}...
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Meditation Tips */}
            <Card className="glass-card floating-card">
              <CardHeader>
                <CardTitle className="text-lg">Meditation Tips</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm">
                  <h4 className="font-medium mb-2">For best experience:</h4>
                  <ul className="text-muted-foreground space-y-1">
                    <li>• Find a quiet, comfortable space</li>
                    <li>• Sit or lie down comfortably</li>
                    <li>• Use headphones if possible</li>
                    <li>• Close your eyes and breathe naturally</li>
                    <li>• Don't worry about "doing it right"</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}