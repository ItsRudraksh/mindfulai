"use client";

import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Video, Phone, MessageCircle, Calendar, Brain, Heart } from 'lucide-react';
import Link from 'next/link';

export default function QuickActions() {
  const actions = [
    {
      icon: Video,
      title: 'Start Video Session',
      description: 'Connect with AI therapist via video',
      href: '/sessions/video',
      color: 'text-blue-500',
      bg: 'bg-blue-50'
    },
    {
      icon: Phone,
      title: 'Voice Call',
      description: 'Talk with AI companion',
      href: '/sessions/voice',
      color: 'text-green-500',
      bg: 'bg-green-50'
    },
    {
      icon: MessageCircle,
      title: 'Chat Therapy',
      description: 'Text-based therapy session',
      href: '/sessions/chat',
      color: 'text-purple-500',
      bg: 'bg-purple-50'
    },
    {
      icon: Calendar,
      title: 'Schedule Session',
      description: 'Book your next appointment',
      href: '/schedule',
      color: 'text-orange-500',
      bg: 'bg-orange-50'
    },
    {
      icon: Brain,
      title: 'Meditation',
      description: 'Guided mindfulness exercises',
      href: '/meditation',
      color: 'text-indigo-500',
      bg: 'bg-indigo-50'
    },
    {
      icon: Heart,
      title: 'Journal',
      description: 'Write about your thoughts',
      href: '/journal',
      color: 'text-pink-500',
      bg: 'bg-pink-50'
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
    >
      <Card>
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
              >
                <Button
                  variant="ghost"
                  asChild
                  className="h-auto p-4 flex flex-col items-start text-left w-full hover:bg-gray-50"
                >
                  <Link href={action.href}>
                    <div className={`w-10 h-10 rounded-lg ${action.bg} flex items-center justify-center mb-3`}>
                      <action.icon className={`h-5 w-5 ${action.color}`} />
                    </div>
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