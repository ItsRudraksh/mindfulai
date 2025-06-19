"use client";

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mic, MicOff, Phone, PhoneOff, ArrowLeft, Volume2, VolumeX } from 'lucide-react';
import Link from 'next/link';

export default function VoiceSession() {
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [isConnecting, setIsConnecting] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isConnected) {
      intervalRef.current = setInterval(() => {
        setSessionDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isConnected]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleConnect = async () => {
    setIsConnecting(true);
    // Simulate connection delay
    setTimeout(() => {
      setIsConnected(true);
      setIsConnecting(false);
    }, 2000);
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    setSessionDuration(0);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-background/80 backdrop-blur-sm border-b sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="icon" asChild>
                <Link href="/dashboard">
                  <ArrowLeft className="h-5 w-5" />
                </Link>
              </Button>
              <div>
                <h1 className="text-xl font-semibold">Voice Therapy Session</h1>
                <p className="text-sm text-muted-foreground">
                  AI-powered voice conversation therapy
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {isConnected && (
                <Badge variant="secondary" className="bg-green-100 dark:bg-green-950/20 text-green-800 dark:text-green-200">
                  Connected • {formatDuration(sessionDuration)}
                </Badge>
              )}
              {isConnecting && (
                <Badge variant="secondary" className="bg-yellow-100 dark:bg-yellow-950/20 text-yellow-800 dark:text-yellow-200">
                  Connecting...
                </Badge>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8 max-w-4xl">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Voice Interface */}
          <div className="lg:col-span-2">
            <Card className="h-[500px] flex flex-col">
              <CardHeader className="text-center">
                <CardTitle>AI Voice Companion</CardTitle>
                <p className="text-muted-foreground">
                  {isConnected 
                    ? "You're connected! Start speaking to begin your therapy session."
                    : "Click the connect button to start your voice therapy session."
                  }
                </p>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col items-center justify-center space-y-8">
                {/* Voice Visualization */}
                <div className="relative">
                  <motion.div
                    className={`w-32 h-32 rounded-full flex items-center justify-center ${
                      isConnected ? 'bg-green-100 dark:bg-green-950/20' : 'bg-muted'
                    }`}
                    animate={isConnected ? { scale: [1, 1.1, 1] } : {}}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Phone className={`h-16 w-16 ${
                      isConnected ? 'text-green-600' : 'text-muted-foreground'
                    }`} />
                  </motion.div>
                  
                  {isConnected && (
                    <motion.div
                      className="absolute inset-0 rounded-full border-4 border-green-300"
                      animate={{ scale: [1, 1.5], opacity: [1, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  )}
                </div>

                {/* Connection Status */}
                <div className="text-center">
                  {!isConnected && !isConnecting && (
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Ready to Connect</h3>
                      <p className="text-muted-foreground mb-4">
                        Start a voice conversation with your AI therapy companion
                      </p>
                      <Button onClick={handleConnect} size="lg" className="bg-green-600 hover:bg-green-700">
                        <Phone className="h-5 w-5 mr-2" />
                        Start Voice Session
                      </Button>
                    </div>
                  )}

                  {isConnecting && (
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Connecting...</h3>
                      <p className="text-muted-foreground">
                        Setting up your secure voice connection
                      </p>
                    </div>
                  )}

                  {isConnected && (
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Connected</h3>
                      <p className="text-muted-foreground mb-4">
                        Your AI companion is listening and ready to help
                      </p>
                      <Button 
                        onClick={handleDisconnect} 
                        variant="destructive" 
                        size="lg"
                      >
                        <PhoneOff className="h-5 w-5 mr-2" />
                        End Session
                      </Button>
                    </div>
                  )}
                </div>

                {/* Voice Controls */}
                {isConnected && (
                  <div className="flex space-x-4">
                    <Button
                      variant={isMuted ? "destructive" : "outline"}
                      size="icon"
                      onClick={() => setIsMuted(!isMuted)}
                    >
                      {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                    </Button>
                    <Button
                      variant={!isSpeakerOn ? "destructive" : "outline"}
                      size="icon"
                      onClick={() => setIsSpeakerOn(!isSpeakerOn)}
                    >
                      {isSpeakerOn ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Session Info */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Session Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Duration</span>
                  <span className="font-medium">{formatDuration(sessionDuration)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <Badge variant={isConnected ? "default" : "secondary"}>
                    {isConnected ? "Active" : "Inactive"}
                  </Badge>
                </div>
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

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Voice Tips</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm">
                  <h4 className="font-medium mb-1">For best experience:</h4>
                  <ul className="text-muted-foreground space-y-1">
                    <li>• Use a quiet environment</li>
                    <li>• Speak clearly and naturally</li>
                    <li>• Take pauses when needed</li>
                    <li>• Express your feelings openly</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Emergency</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  If you're in crisis, please reach out for immediate help.
                </p>
                <Button variant="outline" size="sm" asChild className="w-full">
                  <Link href="/emergency">Emergency Resources</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}