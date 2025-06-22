"use client";

import { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Phone, PhoneOff, ArrowLeft, RefreshCw, Activity, Database } from 'lucide-react';
import Link from 'next/link';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { toast } from 'sonner';
import { useVoiceSession } from '@/contexts/voice-session-context';
import { BackgroundGradientAnimation } from '@/components/ui/background-gradient-animation';

export default function VoiceSession() {
  const { state, dispatch, initiateCall, restoreSession, checkCallStatus } = useVoiceSession();
  const user = useQuery(api.users.current);
  const activeSession = useQuery(api.sessions.getActiveSession, { type: "voice" });

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (state.isConnected && (state.callStatus === "initiated" || state.callStatus === "in-progress")) {
        event.preventDefault();
        event.returnValue = 'You have an active voice call. Are you sure you want to leave?';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [state.isConnected, state.callStatus]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatPhoneNumber = (phone: string) => {
    // Remove any non-digit characters except +
    const cleaned = phone.replace(/[^\d+]/g, '');

    // If it doesn't start with +, add it
    if (!cleaned.startsWith('+')) {
      return '+' + cleaned;
    }

    return cleaned;
  };

  const validatePhoneNumber = (phone: string) => {
    const cleaned = formatPhoneNumber(phone);
    // Basic validation: should start with + and have at least 10 digits
    return /^\+\d{10,15}$/.test(cleaned);
  };

  const handleInitiateCall = async () => {
    if (!state.stateDescription.trim()) {
      toast.error('Please describe your current state before starting the call');
      return;
    }

    if (!state.phoneNumber.trim()) {
      toast.error('Please enter your phone number');
      return;
    }

    const formattedPhone = formatPhoneNumber(state.phoneNumber);
    if (!validatePhoneNumber(formattedPhone)) {
      toast.error('Please enter a valid phone number with country code (e.g., +1234567890)');
      return;
    }

    if (!user) {
      toast.error('User not found');
      return;
    }

    try {
      const firstName = user.name?.split(' ')[0] || 'there';
      await initiateCall(formattedPhone, state.stateDescription, firstName);
      toast.success('Call initiated successfully! You should receive a call shortly.');
    } catch (error) {
      toast.error('Failed to initiate call. Please try again.');
    }
  };

  const handleRestore = async () => {
    try {
      await restoreSession();
      toast.success('Session restored successfully!');
    } catch (error) {
      toast.error('Failed to restore session.');
    }
  };

  const handleManualStatusCheck = async () => {
    try {
      await checkCallStatus();
      toast.success('Status updated!');
    } catch (error) {
      toast.error('Failed to check status.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'initiated': return 'bg-yellow-100 dark:bg-yellow-950/20 text-yellow-800 dark:text-yellow-200';
      case 'in-progress': return 'bg-green-100 dark:bg-green-950/20 text-green-800 dark:text-green-200';
      case 'processing': return 'bg-blue-100 dark:bg-blue-950/20 text-blue-800 dark:text-blue-200';
      case 'done': return 'bg-gray-100 dark:bg-gray-950/20 text-gray-800 dark:text-gray-200';
      case 'failed': return 'bg-red-100 dark:bg-red-950/20 text-red-800 dark:text-red-200';
      default: return 'bg-gray-100 dark:bg-gray-950/20 text-gray-800 dark:text-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'initiated': return 'Call Initiated';
      case 'in-progress': return 'Call In Progress';
      case 'processing': return 'Processing Call';
      case 'done': return 'Call Completed';
      case 'failed': return 'Call Failed';
      default: return 'Ready';
    }
  };

  const formatLastStatusCheck = (timestamp: number) => {
    if (!timestamp) return 'Never';
    const now = Date.now();
    const diff = Math.floor((now - timestamp) / 1000);
    if (diff < 60) return `${diff}s ago`;
    return `${Math.floor(diff / 60)}m ago`;
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (state.isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Restoring your voice session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50/40 via-white/60 to-blue-50/40 dark:from-green-950/40 dark:via-gray-900/60 dark:to-blue-950/40 backdrop-blur-therapeutic">
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
                <h1 className="text-xl font-semibold">Voice Therapy Session</h1>
                <p className="text-sm text-muted-foreground">
                  AI-powered voice conversation therapy via phone call
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {state.isInitiating && (
                <Badge variant="secondary" className="bg-yellow-100 dark:bg-yellow-950/20 text-yellow-800 dark:text-yellow-200 backdrop-blur-subtle">
                  Initiating Call...
                </Badge>
              )}
              {state.callStatus !== "idle" && (
                <Badge variant="secondary" className={`backdrop-blur-subtle ${getStatusColor(state.callStatus)}`}>
                  {getStatusText(state.callStatus)}
                  {(state.callStatus === "in-progress" || state.callStatus === "processing") &&
                    ` • ${formatDuration(state.sessionDuration)}`
                  }
                </Badge>
              )}
              {state.conversationId && state.callStatus !== "done" && state.callStatus !== "failed" && (
                <Button variant="outline" size="sm" onClick={handleManualStatusCheck} className="therapeutic-hover">
                  <Activity className="h-4 w-4 mr-2" />
                  Check Status
                </Button>
              )}
              {state.error && (
                <Button variant="outline" size="sm" onClick={handleRestore} className="therapeutic-hover">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Restore
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8 max-w-6xl">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Voice Interface */}
          <div className="lg:col-span-2">
            <Card className="h-[600px] flex flex-col glass-card floating-card overflow-hidden">
              <CardHeader className="text-center relative z-50">
                <CardTitle>AI Voice Companion</CardTitle>
                <p className="text-muted-foreground">
                  {state.callStatus === "idle"
                    ? "Enter your details below to start your voice therapy session."
                    : state.callStatus === "initiated"
                      ? "Your call is being initiated. You should receive a call shortly."
                      : state.callStatus === "in-progress"
                        ? "You're connected! Continue your therapy conversation."
                        : state.callStatus === "processing"
                          ? "Your call is being processed. Please wait..."
                          : state.callStatus === "done"
                            ? "Your therapy session has been completed successfully."
                            : "Call failed. Please try again."
                  }
                </p>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col items-center justify-center space-y-8 relative">
                {/* Background Gradient Animation with Voice-specific colors */}
                <BackgroundGradientAnimation
                  gradientBackgroundStart="rgb(34, 197, 94)"  // Green-500
                  gradientBackgroundEnd="rgb(59, 130, 246)"   // Blue-500
                  firstColor="34, 197, 94"    // Green-500
                  secondColor="16, 185, 129"  // Emerald-500
                  thirdColor="6, 182, 212"    // Cyan-500
                  fourthColor="59, 130, 246"  // Blue-500
                  fifthColor="99, 102, 241"   // Indigo-500
                  pointerColor="34, 197, 94"  // Green-500
                  size="80%"
                  blendingValue="hard-light"
                  className="absolute inset-0"
                >
                  <div className="absolute z-50 inset-0 flex items-center justify-center text-white font-bold px-4 pointer-events-none">
                    {/* Voice Visualization */}
                    <div className="relative pointer-events-auto">
                      <motion.div
                        className={`w-32 h-32 rounded-full flex items-center justify-center backdrop-blur-subtle ${state.callStatus === "in-progress"
                            ? 'bg-green-100/80 dark:bg-green-950/20'
                            : state.callStatus === "initiated" || state.callStatus === "processing"
                              ? 'bg-yellow-100/80 dark:bg-yellow-950/20'
                              : state.callStatus === "done"
                                ? 'bg-blue-100/80 dark:bg-blue-950/20'
                                : state.callStatus === "failed"
                                  ? 'bg-red-100/80 dark:bg-red-950/20'
                                  : 'bg-white/20'
                          }`}
                        animate={
                          state.callStatus === "in-progress"
                            ? { scale: [1, 1.1, 1] }
                            : state.callStatus === "initiated" || state.callStatus === "processing"
                              ? { scale: [1, 1.05, 1] }
                              : {}
                        }
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <Phone className={`h-16 w-16 ${state.callStatus === "in-progress"
                            ? 'text-green-600'
                            : state.callStatus === "initiated" || state.callStatus === "processing"
                              ? 'text-yellow-600'
                              : state.callStatus === "done"
                                ? 'text-blue-600'
                                : state.callStatus === "failed"
                                  ? 'text-red-600'
                                  : 'text-white'
                          }`} />
                      </motion.div>

                      {(state.callStatus === "in-progress" || state.callStatus === "initiated") && (
                        <motion.div
                          className={`absolute inset-0 rounded-full border-4 ${state.callStatus === "in-progress" ? 'border-green-300' : 'border-yellow-300'
                            }`}
                          animate={{ scale: [1, 1.5], opacity: [1, 0] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                      )}
                    </div>
                  </div>

                  {/* Call Setup Form or Status Display */}
                  <div className="absolute z-50 inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-center text-white p-8 max-w-2xl pointer-events-auto">
                      {/* Call Setup Form */}
                      {state.callStatus === "idle" && (
                        <div className="w-full max-w-md space-y-6">
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="phoneNumber" className="text-white text-left block mb-2 font-medium">
                                Your Phone Number *
                              </Label>
                              <Input
                                id="phoneNumber"
                                type="tel"
                                value={state.phoneNumber}
                                onChange={(e) => dispatch({ type: 'SET_PHONE_NUMBER', payload: e.target.value })}
                                placeholder="+1234567890"
                                className="text-center text-lg bg-white/20 border-white/30 text-white placeholder:text-white/60 glass-input"
                                required
                              />
                              <p className="text-white/60 text-xs mt-1">
                                Include country code (e.g., +1 for US, +91 for India)
                              </p>
                            </div>

                            <div>
                              <Label htmlFor="stateDescription" className="text-white text-left block mb-2 font-medium">
                                How are you feeling right now? *
                              </Label>
                              <Textarea
                                id="stateDescription"
                                value={state.stateDescription}
                                onChange={(e) => dispatch({ type: 'SET_STATE_DESCRIPTION', payload: e.target.value })}
                                placeholder="Describe your current thoughts, feelings, or what's on your mind today..."
                                className="min-h-[100px] resize-none bg-white/20 border-white/30 text-white placeholder:text-white/60 glass-input"
                                required
                              />
                              <p className="text-white/60 text-xs mt-1">
                                This helps our AI therapist understand your current state and provide better support.
                              </p>
                            </div>
                          </div>

                          <Button
                            onClick={handleInitiateCall}
                            size="lg"
                            className="w-full bg-green-600 hover:bg-green-700 therapeutic-hover ripple-effect"
                            disabled={state.isInitiating || !state.phoneNumber.trim() || !state.stateDescription.trim()}
                          >
                            <Phone className="h-5 w-5 mr-2" />
                            {state.isInitiating ? 'Initiating Call...' : 'Start Voice Session'}
                          </Button>
                        </div>
                      )}

                      {/* Call Status Display */}
                      {state.callStatus !== "idle" && (
                        <div className="text-center space-y-4">
                          <div>
                            <h3 className="text-lg font-semibold mb-2">{getStatusText(state.callStatus)}</h3>
                            {state.callStatus === "initiated" && (
                              <p className="text-white/80">
                                Please answer your phone when it rings. The AI therapist will begin the conversation.
                              </p>
                            )}
                            {state.callStatus === "in-progress" && (
                              <p className="text-white/80">
                                Your therapy session is active. Speak naturally with the AI companion.
                              </p>
                            )}
                            {state.callStatus === "processing" && (
                              <p className="text-white/80">
                                Your call is being processed. Analysis and summary will be available shortly.
                              </p>
                            )}
                            {state.callStatus === "done" && (
                              <div className="space-y-4">
                                <p className="text-white/80">
                                  Your therapy session has been completed successfully.
                                </p>
                                <Button
                                  variant="outline"
                                  asChild
                                  className="therapeutic-hover border-white text-black dark:text-white hover:bg-white/60 dark:hover:bg-white/20"
                                >
                                  <Link href={`/sessions/${state.sessionId}`}>
                                    View Session Details
                                  </Link>
                                </Button>
                              </div>
                            )}
                            {state.callStatus === "failed" && (
                              <p className="text-red-200">
                                The call could not be completed. Please check your phone number and try again.
                              </p>
                            )}
                          </div>

                          {/* Action Buttons */}
                          <div className="flex gap-4 justify-center">
                            {(state.callStatus === "done" || state.callStatus === "failed") && (
                              <Button
                                onClick={() => dispatch({ type: 'RESET_SESSION' })}
                                size="lg"
                                className="bg-green-600 hover:bg-green-700 therapeutic-hover ripple-effect"
                              >
                                <Phone className="h-5 w-5 mr-2" />
                                Start New Session
                              </Button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </BackgroundGradientAnimation>
              </CardContent>
            </Card>
          </div>

          {/* Session Info */}
          <div className="space-y-6">
            <Card className="glass-card floating-card">
              <CardHeader>
                <CardTitle className="text-lg">Session Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <Badge variant="secondary" className={`backdrop-blur-subtle ${getStatusColor(state.callStatus)}`}>
                    {getStatusText(state.callStatus)}
                  </Badge>
                </div>
                {state.sessionDuration > 0 && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Duration</span>
                    <span className="font-medium">{formatDuration(state.sessionDuration)}</span>
                  </div>
                )}
                {state.phoneNumber && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Phone Number</span>
                    <span className="text-sm font-mono">{state.phoneNumber}</span>
                  </div>
                )}
                {(state.conversationId || activeSession?.elevenlabsConversationId) && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Conversation ID</span>
                    <span className="text-xs font-mono">
                      {(activeSession?.elevenlabsConversationId || state.conversationId)?.slice(0, 8)}...
                    </span>
                  </div>
                )}
                {state.callSid && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Call SID</span>
                    <span className="text-xs font-mono">
                      {state.callSid.slice(0, 8)}...
                    </span>
                  </div>
                )}
                {state.lastStatusCheck > 0 && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Last Check</span>
                    <span className="text-xs">{formatLastStatusCheck(state.lastStatusCheck)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Audio Quality</span>
                  <span className="text-sm">HD Voice</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Encryption</span>
                  <span className="text-sm">End-to-End</span>
                </div>
              </CardContent>
            </Card>

            {state.stateDescription && (
              <Card className="glass-card floating-card">
                <CardHeader>
                  <CardTitle className="text-lg">Current State</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {state.stateDescription}
                  </p>
                </CardContent>
              </Card>
            )}

            <Card className="glass-card floating-card">
              <CardHeader>
                <CardTitle className="text-lg">Voice Tips</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm">
                  <h4 className="font-medium mb-1">For best experience:</h4>
                  <ul className="text-muted-foreground space-y-1">
                    <li>• Ensure good phone signal</li>
                    <li>• Use a quiet environment</li>
                    <li>• Speak clearly and naturally</li>
                    <li>• Take pauses when needed</li>
                    <li>• Express your feelings openly</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card floating-card">
              <CardHeader>
                <CardTitle className="text-lg">Emergency</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  If you're in crisis, please reach out for immediate help.
                </p>
                <Button variant="outline" size="sm" asChild className="w-full therapeutic-hover">
                  <Link href="/emergency">Emergency Resources</Link>
                </Button>
                {state.error && (
                  <Button variant="outline" size="sm" className="w-full mt-2 therapeutic-hover" onClick={handleRestore}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Restore Session
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}