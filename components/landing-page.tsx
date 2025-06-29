"use client";

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GooeyText } from '@/components/ui/gooey-text';
import { GlowingEffect } from '@/components/ui/glowing-effect';
import { Heart, Video, Phone, MessageCircle, Brain, Shield, Clock, Award } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';
import Image from 'next/image';

export default function LandingPage() {
  const { theme } = useTheme();
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
      description: "Real-time therapy sessions with advanced AI avatars using Tavus technology",
      color: "text-blue-500",
      area: "md:[grid-area:1/1/2/7] xl:[grid-area:1/1/2/5]"
    },
    {
      icon: Phone,
      title: "Voice Conversations",
      description: "Natural voice therapy sessions powered by ElevenLabs conversational AI",
      color: "text-green-500",
      area: "md:[grid-area:1/7/2/13] xl:[grid-area:2/1/3/5]"
    },
    {
      icon: MessageCircle,
      title: "Text Chat Support",
      description: "24/7 text-based therapy with GPT-4 powered intelligent responses",
      color: "text-purple-500",
      area: "md:[grid-area:2/1/3/7] xl:[grid-area:1/5/3/8]"
    },
    {
      icon: Brain,
      title: "Mood Tracking",
      description: "Advanced analytics to track your mental health progress over time",
      color: "text-orange-500",
      area: "md:[grid-area:2/7/3/13] xl:[grid-area:1/8/2/13]"
    },
    {
      icon: Shield,
      title: "Privacy First",
      description: "End-to-end encryption and HIPAA compliant data protection",
      color: "text-red-500",
      area: "md:[grid-area:3/1/4/7] xl:[grid-area:2/8/3/11]"
    },
    {
      icon: Clock,
      title: "Available 24/7",
      description: "Mental health support whenever you need it, day or night",
      color: "text-teal-500",
      area: "md:[grid-area:3/7/4/13] xl:[grid-area:2/11/3/13]"
    }
  ];

  const FeatureCard = ({ feature, index }: { feature: any; index: number }) => {
    return (
      <li className={cn("min-h-[14rem] list-none", feature.area)}>
        <div className="relative h-full rounded-[1.25rem] border-[0.75px] border-border p-2 md:rounded-[1.5rem] md:p-3">
          <GlowingEffect
            spread={40}
            glow={true}
            disabled={false}
            proximity={64}
            inactiveZone={0.01}
            borderWidth={3}
          />
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
            whileHover={{ scale: 1.02 }}
            className="relative flex h-full flex-col justify-between gap-6 overflow-hidden rounded-xl border-[0.75px] bg-background/60 backdrop-blur-therapeutic p-6 shadow-glass dark:shadow-glass-dark md:p-6"
          >
            <div className="relative flex flex-1 flex-col justify-between gap-3">
              <motion.div
                className="w-fit rounded-lg border-[0.75px] border-border bg-muted/50 p-2"
                whileHover={{ rotate: 5 }}
                transition={{ duration: 0.2 }}
              >
                <feature.icon className={`h-6 w-6 ${feature.color}`} />
              </motion.div>
              <div className="space-y-3">
                <h3 className="pt-0.5 text-xl leading-[1.375rem] font-semibold font-sans tracking-[-0.04em] md:text-2xl md:leading-[1.875rem] text-balance text-foreground">
                  {feature.title}
                </h3>
                <p className="[&_b]:md:font-semibold [&_strong]:md:font-semibold font-sans text-sm leading-[1.125rem] md:text-base md:leading-[1.375rem] text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </li>
    );
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
            <Link href="/" className="flex items-center space-x-2">
              <Image
                src={theme === 'dark' ? '/dark-logo.png' : '/light-logo.png'}
                alt="MindfulAI Logo"
                width={150}
                height={40}
                className="h-10 w-auto"
              />
            </Link>
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

      {/* Features Section with Glowing Effect Grid */}
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

        {/* Glowing Effect Grid Layout */}
        <ul className="grid grid-cols-1 grid-rows-none gap-4 md:grid-cols-12 md:grid-rows-3 lg:gap-4 xl:max-h-[34rem] xl:grid-rows-2">
          {features.map((feature, index) => (
            <FeatureCard key={feature.title} feature={feature} index={index} />
          ))}
        </ul>
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
                className="therapeutic-hover p-4 rounded-lg"
              >
                <div className="text-4xl font-bold text-primary mb-2">{stat.number}</div>
                <div className="text-muted-foreground">{stat.label}</div>
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
          className="max-w-3xl mx-auto"
        >
          <h2 className="text-4xl font-bold mb-6">Ready to Transform Your Mental Health?</h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join thousands who have found support, healing, and growth with MindfulAI
          </p>
          <Button size="lg" asChild className="text-lg px-12 py-6 therapeutic-hover ripple-effect">
            <Link href="/auth/signup">Start Free Trial</Link>
          </Button>
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