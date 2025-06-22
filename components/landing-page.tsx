"use client";

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GooeyText } from '@/components/ui/gooey-text';
import { GlowingEffect } from '@/components/ui/glowing-effect';
import { Heart, Video, Phone, MessageCircle, Brain, Shield, Clock, Award, Zap, Users } from 'lucide-react';
import Link from 'next/link';

export default function LandingPage() {
  const heroTexts = [
    "Your Personal AI Therapist",
    "Mental Health Companion",
    "Healing Through Technology",
    "Mindful AI Support",
    "Therapeutic Innovation"
  ];

  const features = [
    {
      icon: Video,
      title: "AI Video Therapy",
      description: "Real-time therapy sessions with advanced AI avatars using Tavus technology for personalized mental health support",
      color: "text-blue-500",
      gradient: "from-blue-500/20 to-purple-500/20",
      size: "large" // Takes 2 columns
    },
    {
      icon: Phone,
      title: "Voice Conversations",
      description: "Natural voice therapy sessions powered by ElevenLabs conversational AI",
      color: "text-green-500",
      gradient: "from-green-500/20 to-teal-500/20",
      size: "medium"
    },
    {
      icon: MessageCircle,
      title: "Text Chat Support",
      description: "24/7 text-based therapy with GPT-4 powered intelligent responses",
      color: "text-purple-500",
      gradient: "from-purple-500/20 to-pink-500/20",
      size: "medium"
    },
    {
      icon: Brain,
      title: "Mood Tracking",
      description: "Advanced analytics to track your mental health progress over time with detailed insights",
      color: "text-orange-500",
      gradient: "from-orange-500/20 to-red-500/20",
      size: "large" // Takes 2 columns
    },
    {
      icon: Shield,
      title: "Privacy First",
      description: "End-to-end encryption and HIPAA compliant data protection",
      color: "text-red-500",
      gradient: "from-red-500/20 to-pink-500/20",
      size: "small"
    },
    {
      icon: Clock,
      title: "Available 24/7",
      description: "Mental health support whenever you need it, day or night",
      color: "text-teal-500",
      gradient: "from-teal-500/20 to-blue-500/20",
      size: "small"
    },
    {
      icon: Zap,
      title: "Instant Response",
      description: "Get immediate support and guidance when you need it most",
      color: "text-yellow-500",
      gradient: "from-yellow-500/20 to-orange-500/20",
      size: "small"
    },
    {
      icon: Users,
      title: "Community Support",
      description: "Connect with others on similar mental health journeys in a safe environment",
      color: "text-indigo-500",
      gradient: "from-indigo-500/20 to-purple-500/20",
      size: "small"
    }
  ];

  const getGridClasses = (size: string, index: number) => {
    switch (size) {
      case 'large':
        return 'md:col-span-2 md:row-span-2';
      case 'medium':
        return 'md:col-span-1 md:row-span-2';
      case 'small':
      default:
        return 'md:col-span-1 md:row-span-1';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/40 via-white/60 to-green-50/40 dark:from-blue-950/40 dark:via-gray-900/60 dark:to-green-950/40 backdrop-blur-therapeutic">
      {/* Header */}
      <header className="relative">
        <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center space-x-2 therapeutic-hover"
          >
            <Heart className="h-8 w-8 text-primary animate-gentle-pulse" />
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
              MindfulAI
            </span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-x-4"
          >
            <Button variant="ghost" asChild className="therapeutic-hover">
              <Link href="/auth/signin">Sign In</Link>
            </Button>
            <Button asChild className="therapeutic-hover ripple-effect">
              <Link href="/auth/signup">Get Started</Link>
            </Button>
          </motion.div>
        </nav>
      </header>

      {/* Hero Section with GooeyText */}
      <section className="container mx-auto px-6 py-20">
        <div className="text-center max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Badge variant="secondary" className="mb-4 backdrop-blur-subtle">
              AI-Powered Mental Health Support
            </Badge>
            
            {/* Gooey Text Hero Title */}
            <div className="mb-6 h-32 md:h-40 flex items-center justify-center">
              <GooeyText
                texts={heroTexts}
                morphTime={1.5}
                cooldownTime={2}
                className="w-full"
                textClassName="text-5xl md:text-7xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-green-600 bg-clip-text text-transparent leading-tight"
              />
            </div>
            
            <motion.p 
              className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              Experience breakthrough mental health support with AI-powered video therapy, voice conversations, and intelligent chat support available 24/7.
            </motion.p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Button size="lg" asChild className="text-lg px-8 py-6 therapeutic-hover ripple-effect">
              <Link href="/auth/signup">Start Your Journey</Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="text-lg px-8 py-6 therapeutic-hover">
              <Link href="/emergency">Emergency Resources</Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Features Bento Grid Section */}
      <section className="container mx-auto px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold mb-4">Comprehensive Mental Health Care</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Multiple ways to connect with AI-powered therapy designed for your comfort and privacy
          </p>
        </motion.div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className={`relative group ${getGridClasses(feature.size, index)}`}
            >
              <Card className={`h-full glass-card floating-card therapeutic-hover relative overflow-hidden ${
                feature.size === 'large' ? 'p-8' : feature.size === 'medium' ? 'p-6' : 'p-4'
              }`}>
                {/* Glowing Effect */}
                <GlowingEffect
                  proximity={100}
                  spread={30}
                  blur={2}
                  movementDuration={1.5}
                  className="opacity-60 group-hover:opacity-100 transition-opacity duration-500"
                />
                
                {/* Background Gradient */}
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-lg`} />
                
                <CardHeader className="relative z-10">
                  <motion.div 
                    className={`${
                      feature.size === 'large' ? 'w-16 h-16' : 'w-12 h-12'
                    } rounded-lg bg-muted/50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}
                    whileHover={{ rotate: 5 }}
                    transition={{ duration: 0.2 }}
                  >
                    <feature.icon className={`${
                      feature.size === 'large' ? 'h-8 w-8' : 'h-6 w-6'
                    } ${feature.color} group-hover:scale-110 transition-transform duration-300`} />
                  </motion.div>
                  <CardTitle className={`${
                    feature.size === 'large' ? 'text-2xl' : 'text-xl'
                  } group-hover:text-primary transition-colors duration-300`}>
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative z-10">
                  <CardDescription className={`${
                    feature.size === 'large' ? 'text-base' : 'text-sm'
                  } leading-relaxed group-hover:text-foreground transition-colors duration-300`}>
                    {feature.description}
                  </CardDescription>
                  
                  {/* Call to Action for larger cards */}
                  {feature.size === 'large' && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      whileHover={{ opacity: 1, y: 0 }}
                      className="mt-4 opacity-0 group-hover:opacity-100 transition-all duration-300"
                    >
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="therapeutic-hover"
                        asChild
                      >
                        <Link href={feature.title.includes('Video') ? '/sessions/video' : 
                                   feature.title.includes('Voice') ? '/sessions/voice' :
                                   feature.title.includes('Chat') ? '/sessions/chat' : '/dashboard'}>
                          Try Now
                        </Link>
                      </Button>
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-muted/30 backdrop-blur-therapeutic py-20">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            {[
              { number: "10,000+", label: "Sessions Completed" },
              { number: "98%", label: "User Satisfaction" },
              { number: "24/7", label: "Availability" },
              { number: "100%", label: "Privacy Protected" }
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ scale: 1.05 }}
                className="therapeutic-hover p-4 rounded-lg relative group"
              >
                <GlowingEffect
                  proximity={50}
                  spread={20}
                  blur={1}
                  className="opacity-0 group-hover:opacity-60 transition-opacity duration-500"
                />
                <div className="text-4xl font-bold text-primary mb-2 relative z-10">{stat.number}</div>
                <div className="text-muted-foreground relative z-10">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-6 py-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto relative group"
        >
          <Card className="glass-card floating-card p-12 relative overflow-hidden">
            <GlowingEffect
              proximity={150}
              spread={40}
              blur={3}
              className="opacity-40 group-hover:opacity-80 transition-opacity duration-700"
            />
            <div className="relative z-10">
              <h2 className="text-4xl font-bold mb-6">Ready to Transform Your Mental Health?</h2>
              <p className="text-xl text-muted-foreground mb-8">
                Join thousands who have found support, healing, and growth with MindfulAI
              </p>
              <Button size="lg" asChild className="text-lg px-12 py-6 therapeutic-hover ripple-effect">
                <Link href="/auth/signup">Start Free Trial</Link>
              </Button>
            </div>
          </Card>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="bg-muted/50 backdrop-blur-therapeutic py-12">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <Heart className="h-6 w-6 text-primary" />
              <span className="text-xl font-semibold">MindfulAI</span>
            </div>
            <div className="text-sm text-muted-foreground">
              © 2024 MindfulAI. HIPAA Compliant Mental Health Platform.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}