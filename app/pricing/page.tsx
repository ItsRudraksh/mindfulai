"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X, Heart, ArrowLeft, Sparkles, Crown, Zap } from 'lucide-react';
import Link from 'next/link';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { toast } from 'sonner';
import { Authenticated, Unauthenticated } from "convex/react";
import { useRouter } from 'next/navigation';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function PricingPage() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentType, setPaymentType] = useState<'subscription' | 'onetime'>('subscription');
  const user = useQuery(api.users.current);
  const userUsage = useQuery(api.users.getUserUsage);
  const router = useRouter();

  useEffect(() => {
    // Load Razorpay script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const plans = [
    {
      id: 'free',
      name: 'The sad one',
      price: 0,
      period: 'Free Forever',
      description: 'Perfect for getting started with mental health support',
      features: [
        { name: '2 Video Sessions', limit: '30 minutes each', included: true },
        { name: '3 Voice Calls', limit: '10 minutes each', included: true },
        { name: '50 Chat Messages', limit: 'per month', included: true },
        { name: 'Unlimited Meditation', limit: '', included: true },
        { name: 'Unlimited Journaling', limit: '', included: true },
        { name: 'Advanced Mood Analytics', limit: '', included: true },
        { name: 'Weekly Reports & Insights', limit: '', included: false },
        { name: 'Custom AI Personas (coming soon)', limit: '', included: false },
      ],
      buttonText: 'Current Plan',
      buttonVariant: 'outline' as const,
      popular: false,
    },
    {
      id: 'pro',
      name: 'The depressed one',
      price: 350,
      period: '', // This will be dynamic based on the toggle
      description: 'Complete mental health support with unlimited access',
      features: [
        { name: 'Unlimited Video Sessions', limit: '1 hour each', included: true },
        { name: 'Unlimited Voice Calls', limit: '', included: true },
        { name: 'Unlimited Chat Messages', limit: '', included: true },
        { name: 'Unlimited Meditation', limit: '', included: true },
        { name: 'Unlimited Journaling', limit: '', included: true },
        { name: 'Advanced Mood Analytics', limit: '', included: true },
        { name: 'Weekly Reports & Insights', limit: '', included: true },
        { name: 'Personalized Daily Emails', limit: '', included: true },
        { name: 'Custom AI Personas (coming soon)', limit: '', included: true }
      ],
      buttonText: 'Upgrade Now',
      buttonVariant: 'default' as const,
      popular: true,
    },
  ];

  const handleUpgrade = async () => {
    if (!user) {
      toast.error('Please sign in to upgrade');
      return;
    }

    if (userUsage?.plan === 'pro') {
      toast.info('You are already on the pro plan!');
      return;
    }

    setIsProcessing(true);

    try {
      if (paymentType === 'subscription') {
        // Create Razorpay subscription
        const subResponse = await fetch('/api/razorpay/create-subscription', {
          method: 'POST',
        });

        if (!subResponse.ok) {
          throw new Error('Failed to create subscription');
        }

        const subData = await subResponse.json();

        if (!subData.success) {
          throw new Error(subData.error || 'Failed to create subscription');
        }

        // Initialize Razorpay checkout for subscription
        const options = {
          key: subData.keyId,
          subscription_id: subData.subscriptionId,
          name: 'MindfulAI',
          description: 'Pro Subscription - The depressed one',
          handler: async function (response: any) {
            try {
              // Verify payment
              const verifyResponse = await fetch('/api/razorpay/verify-subscription', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  razorpay_subscription_id: response.razorpay_subscription_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  userId: user._id,
                }),
              });

              if (verifyResponse.ok) {
                toast.success('Subscription successful! Welcome to Pro!');
                router.push('/dashboard');
              } else {
                throw new Error('Subscription verification failed');
              }
            } catch (error) {
              console.error('Subscription verification error:', error);
              toast.error('Subscription verification failed. Please contact support.');
            }
          },
          prefill: {
            name: user.name || '',
            email: user.email || '',
          },
          theme: {
            color: '#3b82f6',
          },
          modal: {
            ondismiss: function () {
              setIsProcessing(false);
            }
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      } else { // 'onetime'
        // Create Razorpay order
        const orderResponse = await fetch('/api/razorpay/create-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            planName: 'The depressed one',
          }),
        });

        if (!orderResponse.ok) {
          throw new Error('Failed to create payment order');
        }

        const orderData = await orderResponse.json();

        if (!orderData.success) {
          throw new Error(orderData.error || 'Failed to create order');
        }

        // Initialize Razorpay checkout for one-time payment
        const options = {
          key: orderData.keyId,
          amount: orderData.amount,
          currency: orderData.currency,
          name: 'MindfulAI',
          description: 'Pro Access - One Month',
          order_id: orderData.orderId,
          handler: async function (response: any) {
            try {
              // Verify payment
              const verifyResponse = await fetch('/api/razorpay/verify-payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  userId: user._id,
                }),
              });

              if (verifyResponse.ok) {
                toast.success('Payment successful! Welcome to Pro!');
                router.push('/dashboard');
              } else {
                throw new Error('Payment verification failed');
              }
            } catch (error) {
              console.error('Payment verification error:', error);
              toast.error('Payment verification failed. Please contact support.');
            }
          },
          prefill: {
            name: user.name || '',
            email: user.email || '',
          },
          theme: {
            color: '#3b82f6',
          },
          modal: {
            ondismiss: function () {
              setIsProcessing(false);
            }
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      }
    } catch (error) {
      console.error('Payment initiation error:', error);
      toast.error('Failed to initiate payment. Please try again.');
      setIsProcessing(false);
    }
  };

  const currentPlan = userUsage?.plan || 'free';

  return (
    <>
      <Authenticated>
        <div className="min-h-screen bg-gradient-to-br from-blue-50/40 via-white/60 to-purple-50/40 dark:from-blue-950/40 dark:via-gray-900/60 dark:to-purple-950/40 backdrop-blur-therapeutic">
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
                  <div className="flex items-center space-x-2">
                    <Heart className="h-8 w-8 text-primary animate-gentle-pulse" />
                    <h1 className="text-2xl font-bold">Pricing Plans</h1>
                  </div>
                </div>
                {userUsage && (
                  <Badge variant="secondary" className="backdrop-blur-subtle">
                    Current: {userUsage.planName}
                  </Badge>
                )}
              </div>
            </div>
          </header>

          {/* Main Content */}
          <div className="container mx-auto px-6 py-12 max-w-6xl">
            {/* Header Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl font-bold mb-4">Choose Your Mental Health Journey</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Start with our free plan or unlock unlimited access with our pro subscription
              </p>
            </motion.div>

            {/* Current Usage Display */}
            {userUsage && userUsage.plan === 'free' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="mb-12"
              >
                <Card className="glass-card floating-card bg-gradient-to-r from-orange-50/50 to-red-50/50 dark:from-orange-950/20 dark:to-red-950/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="h-5 w-5 text-orange-500" />
                      Your Current Usage
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">
                          {userUsage.usage.videoSessions}/{userUsage.limits.videoSessions}
                        </div>
                        <div className="text-sm text-muted-foreground">Video Sessions</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">
                          {userUsage.usage.voiceCalls}/{userUsage.limits.voiceCalls}
                        </div>
                        <div className="text-sm text-muted-foreground">Voice Calls</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">
                          {userUsage.usage.chatMessages}/{userUsage.limits.chatMessages}
                        </div>
                        <div className="text-sm text-muted-foreground">Chat Messages</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Pricing Cards */}
            <div className="grid lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {plans.map((plan, index) => (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="relative"
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                      <Badge className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-1">
                        <Crown className="h-3 w-3 mr-1" />
                        Most Popular
                      </Badge>
                    </div>
                  )}

                  <Card className={`h-full glass-card floating-card ${plan.popular ? 'ring-2 ring-purple-500/20 bg-gradient-to-br from-purple-50/30 to-blue-50/30 dark:from-purple-950/20 dark:to-blue-950/20' : ''
                    }`}>
                    <CardHeader className="text-center pb-8">
                      <div className="flex items-center justify-center mb-4">
                        {plan.id === 'free' ? (
                          <Heart className="h-12 w-12 text-blue-500" />
                        ) : (
                          <Crown className="h-12 w-12 text-purple-500" />
                        )}
                      </div>
                      <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                      <div className="mt-4">
                        <span className="text-4xl font-bold">
                          {plan.price > 0 ? `₹${plan.price}` : 'Free'}
                        </span>
                        <span className="text-muted-foreground ml-2">
                          {plan.id === 'pro'
                            ? (paymentType === 'subscription' ? 'per month' : 'for one month')
                            : plan.period
                          }
                        </span>
                      </div>
                      <p className="text-muted-foreground mt-2">{plan.description}</p>
                    </CardHeader>

                    <CardContent className="space-y-6">
                      {plan.id === 'pro' && (
                        <div className="flex justify-center">
                          <ToggleGroup
                            type="single"
                            value={paymentType}
                            onValueChange={(value) => {
                              if (value) setPaymentType(value as 'subscription' | 'onetime');
                            }}
                            className="mb-6"
                          >
                            <ToggleGroupItem value="subscription" aria-label="Toggle subscription">
                              Subscription
                            </ToggleGroupItem>
                            <ToggleGroupItem value="onetime" aria-label="Toggle one-time payment">
                              One-Time
                            </ToggleGroupItem>
                          </ToggleGroup>
                        </div>
                      )}
                      <div className="space-y-3">
                        {plan.features.map((feature, featureIndex) => (
                          <div key={featureIndex} className="flex items-start space-x-3">
                            {feature.included ? (
                              <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                            ) : (
                              <X className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                            )}
                            <div className="flex-1">
                              <span className={feature.included ? 'text-foreground' : 'text-muted-foreground'}>
                                {feature.name}
                              </span>
                              {feature.limit && (
                                <span className="text-sm text-muted-foreground ml-1">
                                  ({feature.limit})
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="pt-6">
                        {currentPlan === plan.id ? (
                          <Button
                            className="w-full therapeutic-hover"
                            variant={plan.buttonVariant}
                            disabled
                          >
                            {plan.buttonText}
                          </Button>
                        ) : (
                          <Button
                            className={`w-full therapeutic-hover ${plan.buttonVariant}`}
                            onClick={handleUpgrade}
                            disabled={isProcessing}
                          >
                            {isProcessing ? 'Processing...' : plan.buttonText}
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </Authenticated>
    </>
  );
}