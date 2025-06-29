"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, CreditCard, BarChart2, Settings } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";

// Placeholder for yearly plan ID
const YEARLY_PLAN_ID = "plan_YOUR_YEARLY_PLAN_ID"; // Replace with your actual yearly plan ID from Razorpay

export default function ProfilePage() {
  const user = useQuery(api.users.current);
  const [name, setName] = useState(user?.name || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isProcessingSub, setIsProcessingSub] = useState(false);

  const updateName = useMutation(api.users.updateName);
  const updateStatus = useMutation(api.users.updateSubscriptionStatus);

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Name cannot be empty.");
      return;
    }
    setIsUpdating(true);
    try {
      await updateName({ name });
      toast.success("Profile updated successfully!");
    } catch (error) {
      toast.error("Failed to update profile.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleManageSubscription = async (
    action: 'portal' | 'cancel' | 'pause' | 'resume' | 'update',
    newPlanId?: string
  ) => {
    if (!user?.subscription?.subscriptionId) {
      toast.error('No active subscription found.');
      return;
    }

    setIsProcessingSub(true);
    try {
      const response = await fetch('/api/razorpay/manage-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription_id: user.subscription.subscriptionId,
          action: action,
          new_plan_id: newPlanId,
        }),
      });

      if (!response.ok) throw new Error(`Failed to ${action} subscription`);

      const data = await response.json();
      if (data.success) {
        if (action === 'portal' && data.portal_url) {
          window.open(data.portal_url, '_blank');
        } else {
          toast.success(`Subscription action '${action}' processed successfully!`);
          await updateStatus({ status: data.data.status });
        }
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setIsProcessingSub(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  const userSubscription = user.subscription;

  const usageMetrics = userSubscription && userSubscription.plan === 'free' ? [
    {
      name: "Video Sessions",
      used: userSubscription.usage?.videoSessions || 0,
      limit: userSubscription.limits?.videoSessions || 2,
    },
    {
      name: "Voice Calls",
      used: userSubscription.usage?.voiceCalls || 0,
      limit: userSubscription.limits?.voiceCalls || 3,
    },
    {
      name: "Chat Messages",
      used: userSubscription.usage?.chatMessages || 0,
      limit: userSubscription.limits?.chatMessages || 50,
    },
  ] : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50/40 via-white/60 to-blue-50/40 dark:from-gray-950/40 dark:via-gray-900/60 dark:to-blue-950/40 backdrop-blur-lg">
      <div className="container mx-auto px-6 py-12 max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold mb-2">Account Settings</h1>
          <p className="text-muted-foreground">Manage your profile, subscription, and usage data.</p>
        </motion.div>

        <div className="mt-8">
          <Tabs defaultValue="profile" className="flex flex-col md:flex-row gap-8">
            <TabsList className="flex flex-col h-auto bg-transparent p-0 w-full md:w-1/4">
              <TabsTrigger value="profile" className="w-full justify-start p-4 data-[state=active]:bg-primary/10 data-[state=active]:shadow-sm">
                <User className="mr-3" /> Profile Information
              </TabsTrigger>
              <TabsTrigger value="subscription" className="w-full justify-start p-4 data-[state=active]:bg-primary/10 data-[state=active]:shadow-sm">
                <CreditCard className="mr-3" /> Subscription
              </TabsTrigger>
              <TabsTrigger value="usage" className="w-full justify-start p-4 data-[state=active]:bg-primary/10 data-[state=active]:shadow-sm">
                <BarChart2 className="mr-3" /> Usage Data
              </TabsTrigger>
            </TabsList>

            <div className="flex-1">
              <TabsContent value="profile">
                <Card className="glass-card floating-card">
                  <CardHeader>
                    <CardTitle>Profile Information</CardTitle>
                    <CardDescription>Update your personal details</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleUpdateName} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input 
                          id="name" 
                          value={name} 
                          onChange={(e) => setName(e.target.value)} 
                          className="glass-input"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input 
                          id="email" 
                          value={user.email || ''} 
                          disabled 
                          className="glass-input"
                        />
                      </div>
                      <Button 
                        type="submit" 
                        disabled={isUpdating}
                        className="therapeutic-hover"
                      >
                        {isUpdating ? "Saving..." : "Save Changes"}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="subscription">
                <Card className="glass-card floating-card">
                  <CardHeader>
                    <CardTitle>Subscription Management</CardTitle>
                    <CardDescription>Manage your subscription plan and billing</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {!userSubscription || userSubscription.plan === 'free' ? (
                      <div className="text-center">
                        <p className="mb-4">You are currently on the free plan.</p>
                        <Button asChild className="therapeutic-hover">
                          <Link href="/pricing">Upgrade to Pro</Link>
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-between items-center p-4 rounded-lg bg-muted/50">
                          <div>
                            <h3 className="font-semibold">{userSubscription.planName}</h3>
                            <p className="text-sm text-muted-foreground">
                              Status: <Badge variant={userSubscription.status === 'active' ? 'default' : 'secondary'}>{userSubscription.status}</Badge>
                            </p>
                          </div>
                          <p className="text-sm">
                            Renews on: {new Date(userSubscription.currentPeriodEnd).toLocaleDateString()}
                          </p>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          <Button 
                            onClick={() => handleManageSubscription('portal')} 
                            disabled={isProcessingSub}
                            className="therapeutic-hover"
                          >
                            View Invoices
                          </Button>
                          
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                disabled={isProcessingSub || userSubscription.status !== 'active'}
                                className="therapeutic-hover"
                              >
                                Change Plan
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="glass-card">
                              <DialogHeader>
                                <DialogTitle>Change Subscription Plan</DialogTitle>
                                <DialogDescription>
                                  Select a new plan to switch to at the end of your current billing cycle.
                                </DialogDescription>
                              </DialogHeader>
                              <div className="py-4">
                                <Button 
                                  className="w-full therapeutic-hover" 
                                  onClick={() => handleManageSubscription('update', YEARLY_PLAN_ID)}
                                >
                                  Switch to Yearly Plan
                                </Button>
                                <p className="text-xs text-muted-foreground mt-2 text-center">Save 20% with annual billing</p>
                              </div>
                              <DialogFooter>
                                <Button variant="outline" className="therapeutic-hover">Cancel</Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                          
                          {userSubscription.status === 'active' && (
                            <Button 
                              onClick={() => handleManageSubscription('pause')} 
                              variant="outline" 
                              disabled={isProcessingSub}
                              className="therapeutic-hover"
                            >
                              Pause Subscription
                            </Button>
                          )}
                          
                          {userSubscription.status === 'paused' && (
                            <Button 
                              onClick={() => handleManageSubscription('resume')} 
                              variant="outline" 
                              disabled={isProcessingSub}
                              className="therapeutic-hover"
                            >
                              Resume Subscription
                            </Button>
                          )}
                          
                          {userSubscription.status !== 'cancelled' && (
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button 
                                  variant="destructive" 
                                  disabled={isProcessingSub}
                                  className="therapeutic-hover"
                                >
                                  Cancel Subscription
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="glass-card">
                                <DialogHeader>
                                  <DialogTitle>Cancel Your Subscription</DialogTitle>
                                  <DialogDescription>
                                    Are you sure you want to cancel your subscription? You'll lose access to premium features at the end of your current billing period.
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="py-4">
                                  <p className="text-sm text-muted-foreground mb-4">
                                    Your subscription will remain active until {new Date(userSubscription.currentPeriodEnd).toLocaleDateString()}, after which you'll be downgraded to the free plan.
                                  </p>
                                </div>
                                <DialogFooter>
                                  <Button 
                                    variant="outline" 
                                    className="therapeutic-hover"
                                  >
                                    Keep Subscription
                                  </Button>
                                  <Button 
                                    variant="destructive" 
                                    onClick={() => handleManageSubscription('cancel')}
                                    className="therapeutic-hover"
                                  >
                                    Confirm Cancellation
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          )}
                        </div>
                        
                        <div className="mt-4 p-4 bg-muted/30 rounded-lg">
                          <h4 className="font-medium mb-2">Subscription Benefits</h4>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            <li>• Unlimited access to all therapy modalities</li>
                            <li>• Priority support and feature access</li>
                            <li>• Advanced analytics and insights</li>
                            <li>• Custom AI personas and preferences</li>
                          </ul>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="usage">
                <Card className="glass-card floating-card">
                  <CardHeader>
                    <CardTitle>Usage Data</CardTitle>
                    <CardDescription>Track your platform usage and limits</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {userSubscription?.plan === 'free' ? (
                      usageMetrics.map((metric) => (
                        <div key={metric.name}>
                          <div className="flex justify-between items-center mb-2">
                            <p className="font-medium">{metric.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {metric.used} / {metric.limit}
                            </p>
                          </div>
                          <Progress 
                            value={(metric.used / metric.limit) * 100} 
                            className="h-2"
                          />
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-6">
                        <Badge variant="default" className="mb-4 px-3 py-1">
                          Unlimited Access
                        </Badge>
                        <p className="text-muted-foreground">
                          You're on the pro plan with unlimited usage of all features.
                        </p>
                        <div className="grid grid-cols-3 gap-4 mt-6">
                          <div className="text-center p-4 bg-muted/30 rounded-lg">
                            <h4 className="font-medium">Video Sessions</h4>
                            <p className="text-2xl font-bold text-primary mt-2">Unlimited</p>
                          </div>
                          <div className="text-center p-4 bg-muted/30 rounded-lg">
                            <h4 className="font-medium">Voice Calls</h4>
                            <p className="text-2xl font-bold text-primary mt-2">Unlimited</p>
                          </div>
                          <div className="text-center p-4 bg-muted/30 rounded-lg">
                            <h4 className="font-medium">Chat Messages</h4>
                            <p className="text-2xl font-bold text-primary mt-2">Unlimited</p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {userSubscription?.plan === 'free' && (
                      <div className="text-center mt-6">
                        <p className="text-sm text-muted-foreground mb-4">
                          Upgrade to Pro for unlimited access to all features
                        </p>
                        <Button asChild className="therapeutic-hover">
                          <Link href="/pricing">Upgrade Now</Link>
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
}