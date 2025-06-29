"use client";

import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Phone, MessageCircle, Globe, Heart, ArrowLeft, Clock } from 'lucide-react';
import Link from 'next/link';

export default function EmergencyResources() {
  const emergencyContacts = [
    {
      name: "National Suicide Prevention Lifeline",
      number: "988",
      description: "24/7 free and confidential support",
      type: "call"
    },
    {
      name: "Crisis Text Line",
      number: "Text HOME to 741741",
      description: "Free, 24/7 crisis support via text",
      type: "text"
    },
    {
      name: "Emergency Services",
      number: "911",
      description: "For immediate life-threatening emergencies",
      type: "emergency"
    }
  ];

  const resources = [
    {
      title: "National Institute of Mental Health",
      description: "Information about mental health conditions and treatments",
      url: "https://www.nimh.nih.gov",
      category: "Information"
    },
    {
      title: "Mental Health America",
      description: "Mental health screening tools and resources",
      url: "https://www.mhanational.org",
      category: "Screening"
    },
    {
      title: "SAMHSA Treatment Locator",
      description: "Find mental health treatment facilities near you",
      url: "https://findtreatment.samhsa.gov",
      category: "Treatment"
    },
    {
      title: "BetterHelp",
      description: "Online counseling and therapy services",
      url: "https://www.betterhelp.com",
      category: "Therapy"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50/40 via-white/60 to-orange-50/40 dark:from-red-950/40 dark:via-gray-900/60 dark:to-orange-950/40 backdrop-blur-therapeutic">
      {/* Header */}
      <header className="glass-header">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="icon" asChild className="therapeutic-hover">
                <Link href="/">
                  <ArrowLeft className="h-5 w-5" />
                </Link>
              </Button>
              <div className="flex items-center space-x-2">
                <Heart className="h-8 w-8 text-red-500 animate-gentle-pulse" />
                <h1 className="text-2xl font-bold text-red-600">Emergency Resources</h1>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Available 24/7</span>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 max-w-4xl">
        {/* Emergency Alert */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Alert className="mb-8 border-red-200 bg-red-50/80 dark:bg-red-950/20 backdrop-blur-subtle">
            <Heart className="h-5 w-5 text-red-600" />
            <AlertDescription className="text-red-800 dark:text-red-200 font-medium">
              If you are in immediate danger or having thoughts of self-harm, please contact emergency services (911)
              or the National Suicide Prevention Lifeline (988) immediately.
            </AlertDescription>
          </Alert>
        </motion.div>

        {/* Emergency Contacts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-8"
        >
          <h2 className="text-3xl font-bold mb-6 text-center">Immediate Help</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {emergencyContacts.map((contact, index) => (
              <motion.div
                key={contact.name}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
              >
                <Card className="h-full glass-card floating-card therapeutic-hover">
                  <CardHeader className="text-center">
                    <motion.div
                      className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 ${contact.type === 'emergency' ? 'bg-red-100 dark:bg-red-950/20' :
                        contact.type === 'text' ? 'bg-blue-100 dark:bg-blue-950/20' : 'bg-green-100 dark:bg-green-950/20'
                        }`}
                      whileHover={{ rotate: 5 }}
                      transition={{ duration: 0.2 }}
                    >
                      {contact.type === 'text' ? (
                        <MessageCircle className={`h-8 w-8 text-blue-600`} />
                      ) : (
                        <Phone className={`h-8 w-8 text-red-600`} />
                      )}
                    </motion.div>
                    <CardTitle className="text-lg">{contact.name}</CardTitle>
                    <CardDescription>{contact.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="text-center">
                    <Button
                      size="lg"
                      className={`w-full text-lg font-bold ripple-effect bg-blue-600 hover:bg-blue-700`}
                      asChild
                    >
                      <a href={`tel:${contact.number.replace(/\D/g, '')}`}>
                        {contact.number}
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Additional Resources */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <h2 className="text-3xl font-bold mb-6 text-center">Additional Resources</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {resources.map((resource, index) => (
              <motion.div
                key={resource.title}
                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
              >
                <Card className="h-full glass-card floating-card therapeutic-hover">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{resource.title}</CardTitle>
                      <span className="text-xs bg-muted/50 px-2 py-1 rounded-full backdrop-blur-subtle">
                        {resource.category}
                      </span>
                    </div>
                    <CardDescription>{resource.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" className="w-full therapeutic-hover" asChild>
                      <a href={resource.url} target="_blank" rel="noopener noreferrer">
                        <Globe className="h-4 w-4 mr-2" />
                        Visit Website
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Safety Plan */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-12"
        >
          <Card className="glass-card floating-card bg-gradient-to-r from-blue-50/50 to-green-50/50 dark:from-blue-950/20 dark:to-green-950/20">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Create Your Safety Plan</CardTitle>
              <CardDescription className="text-lg">
                Having a plan can help you stay safe during a crisis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-6">
                <motion.div whileHover={{ scale: 1.02 }} className="therapeutic-hover p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Warning Signs</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Identify your personal warning signs</li>
                    <li>• Recognize triggers and situations</li>
                    <li>• Note changes in thoughts or feelings</li>
                  </ul>
                </motion.div>
                <motion.div whileHover={{ scale: 1.02 }} className="therapeutic-hover p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Coping Strategies</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Deep breathing exercises</li>
                    <li>• Call a trusted friend or family member</li>
                    <li>• Use grounding techniques</li>
                  </ul>
                </motion.div>
              </div>
              <div className="text-center pt-4">
                <Button size="lg" className="therapeutic-hover ripple-effect">Download Safety Plan Template</Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Return to App */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="text-center mt-12"
        >
          <Button variant="outline" size="lg" asChild className="therapeutic-hover">
            <Link href="/dashboard">
              Return to Dashboard
            </Link>
          </Button>
        </motion.div>
      </main>
    </div>
  );
}