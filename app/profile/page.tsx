"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, CreditCard, BarChart2, Settings } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Progress } from '@/components/ui/progress';

// Placeholder for yearly plan ID
const YEARLY_PLAN_ID = "plan_YOUR_YEARLY_PLAN_ID"; // Replace with your actual yearly plan ID from Razorpay

function SubscriptionTab() {
  const [isProcessing, setIsProcessing] = useState(false);
  const user = useQuery(api.users.current);
  const updateStatus = useMutation(api.users.updateSubscriptionStatus);

  const handleManageSubscription = async (
    action: 'portal' | 'cancel' | 'pause' | 'resume' | 'update',
    newPlanId?: string
  ) => {
    if (!user?.subscription?.subscriptionId) {
      toast.error('No active subscription found.');
      return;
    }

    setIsProcessing(true);
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
      setIsProcessing(false);
    }
  };

  if (!user?.subscription) return <p>No subscription data available.</p>;

  const { status, planName, currentPeriodEnd } = user.subscription;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Subscription Management</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex justify-between items-center p-4 rounded-lg bg-muted/50">
          <div>
            <h3 className="font-semibold">{planName}</h3>
            <p className="text-sm text-muted-foreground">
              Status: <Badge variant={status === 'active' ? 'default' : 'secondary'}>{status}</Badge>
            </p>
          </div>
          <p className="text-sm">
            Renews on: {new Date(currentPeriodEnd).toLocaleDateString()}
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Button onClick={() => handleManageSubscription('portal')} disabled={isProcessing}>
            View Invoices
          </Button>

          {status === 'active' && (
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">Change Plan</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Change Subscription Plan</DialogTitle>
                  <DialogDescription>
                    Select a new plan to switch to at the end of your current billing cycle.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <Button className="w-full" onClick={() => handleManageSubscription('update', YEARLY_PLAN_ID)}>
                    Switch to Yearly Plan
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2 text-center">Note: Replace the plan ID in the code.</p>
                </div>
              </DialogContent>
            </Dialog>
          )}

          {status === 'active' && (
            <Button onClick={() => handleManageSubscription('pause')} variant="outline" disabled={isProcessing}>
              Pause
            </Button>
          )}

          {status === 'paused' && (
            <Button onClick={() => handleManageSubscription('resume')} variant="outline" disabled={isProcessing}>
              Resume
            </Button>
          )}

          {status !== 'cancelled' && (
            <Button onClick={() => handleManageSubscription('cancel')} variant="destructive" disabled={isProcessing}>
              Cancel
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

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
    action: 'portal' | 'cancel' | 'pause' | 'resume'
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
                <Card>
                  <CardHeader>
                    <CardTitle>Profile Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleUpdateName} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" value={user.email || ''} disabled />
                      </div>
                      <Button type="submit" disabled={isUpdating}>
                        {isUpdating ? "Saving..." : "Save Changes"}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="subscription">
                <Card>
                  <CardHeader>
                    <CardTitle>Subscription Management</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {!userSubscription || userSubscription.plan === 'free' ? (
                      <div className="text-center">
                        <p className="mb-4">You are currently on the free plan.</p>
                        <Button asChild>
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
                          <Button onClick={() => handleManageSubscription('portal')} disabled={isProcessingSub}>
                            View Invoices
                          </Button>
                          {userSubscription.status === 'active' && (
                            <Button onClick={() => handleManageSubscription('pause')} variant="outline" disabled={isProcessingSub}>
                              Pause
                            </Button>
                          )}
                          {userSubscription.status === 'paused' && (
                            <Button onClick={() => handleManageSubscription('resume')} variant="outline" disabled={isProcessingSub}>
                              Resume
                            </Button>
                          )}
                          {userSubscription.status !== 'cancelled' && (
                            <Button onClick={() => handleManageSubscription('cancel')} variant="destructive" disabled={isProcessingSub}>
                              Downgrade to Free
                            </Button>
                          )}
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="usage">
                <Card>
                  <CardHeader>
                    <CardTitle>Usage Data</CardTitle>
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
                          <Progress value={(metric.used / metric.limit) * 100} />
                        </div>
                      ))
                    ) : (
                      <p>You are on the pro plan with unlimited usage.</p>
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
