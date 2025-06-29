"use client";

import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Video, Phone, MessageCircle, Calendar, Brain, Heart, BookOpen, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export default function QuickActions() {
  const actions = [
    {
      icon: Video,
      title: 'Start Video Session',
      description: 'Connect with AI therapist via video',
      href: '/sessions/video',
      color: 'text-blue-500',
      bg: 'bg-blue-50 dark:bg-blue-950/20'
    },
    {
      icon: Phone,
      title: 'Voice Call',
      description: 'Talk with AI companion',
      href: '/sessions/voice',
      color: 'text-green-500',
      bg: 'bg-green-50 dark:bg-green-950/20'
    },
    {
      icon: MessageCircle,
      title: 'Chat Therapy',
      description: 'Text-based therapy session',
      href: '/sessions/chat',
      color: 'text-purple-500',
      bg: 'bg-purple-50 dark:bg-purple-950/20'
    },
    {
      icon: BookOpen,
      title: 'Journal',
      description: 'Write about your thoughts',
      href: '/journal',
      color: 'text-amber-500',
      bg: 'bg-amber-50 dark:bg-amber-950/20'
    },
    {
      icon: AlertTriangle,
      title: 'Emergency',
      description: 'Seek help immediately',
      href: '/emergency',
      color: 'text-orange-500',
      bg: 'bg-orange-50 dark:bg-orange-950/20'
    },
    {
      icon: Brain,
      title: 'Meditation',
      description: 'Guided mindfulness exercises',
      href: '/meditation',
      color: 'text-indigo-500',
      bg: 'bg-indigo-50 dark:bg-indigo-950/20'
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
    >
      <Card className="glass-card floating-card">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Choose how you'd like to connect with your AI mental health companion today
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {actions.map((action, index) => (
              <motion.div
                key={action.title}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
              >
                <Button
                  variant="ghost"
                  asChild
                  className="h-auto p-4 flex flex-col items-start text-left w-full therapeutic-hover ripple-effect"
                >
                  <Link href={action.href}>
                    <motion.div
                      className={`w-10 h-10 rounded-lg ${action.bg} flex items-center justify-center mb-3`}
                      whileHover={{ rotate: 5 }}
                      transition={{ duration: 0.2 }}
                    >
                      <action.icon className={`h-5 w-5 ${action.color}`} />
                    </motion.div>
                    <div>
                      <h3 className="font-semibold mb-1">{action.title}</h3>
                      <p className="text-sm text-muted-foreground">{action.description}</p>
                    </div>
                  </Link>
                </Button>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}