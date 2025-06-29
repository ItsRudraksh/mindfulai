"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, CreditCard, BarChart2, Settings, Target } from 'lucide-react';
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

export default function ProfilePage() {
  const user = useQuery(api.users.current);
  const sessionGoal = useQuery(api.goals.getGoalsByCategory, { category: 'sessions' });
  const [name, setName] = useState(user?.name || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUpdatingGoal, setIsUpdatingGoal] = useState(false);
  const [weeklySessionGoal, setWeeklySessionGoal] = useState('4');

  const [isProcessingSub, setIsProcessingSub] = useState(false);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [isInvoiceDialogOpen, setIsInvoiceDialogOpen] = useState(false);

  const updateName = useMutation(api.users.updateName);
  const updateStatus = useMutation(api.users.updateSubscriptionStatus);
  const addOrUpdateGoal = useMutation(api.goals.addOrUpdateGoal);

  useEffect(() => {
    if (user && user.name) setName(user.name);
    if (sessionGoal && sessionGoal.length > 0) {
      setWeeklySessionGoal(String(sessionGoal[0].target));
    }
  }, [user, sessionGoal]);

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

  const handleUpdateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingGoal(true);
    try {
      await addOrUpdateGoal({
        title: "Weekly Sessions",
        category: "sessions",
        target: parseInt(weeklySessionGoal, 10)
      });
      toast.success("Goal updated successfully!");
    } catch (error) {
      toast.error("Failed to update goal.");
    } finally {
      setIsUpdatingGoal(false);
    }
  };

  const handleManageSubscription = async (
    action: 'portal' | 'cancel' | 'pause' | 'resume' | 'update' | 'invoices',
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
        } else if (action === 'invoices' && data.data.items) {
          setInvoices(data.data.items);
          setIsInvoiceDialogOpen(true);
          toast.success("Invoices fetched successfully!");
        } else {
          toast.success(`Subscription action '${action}' processed successfully!`);
          if (data.data.status) {
            await updateStatus({ status: data.data.status });
          }
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
              <TabsTrigger value="goals" className="w-full justify-start p-4 data-[state=active]:bg-primary/10 data-[state=active]:shadow-sm">
                <Target className="mr-3" /> Goals
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
                        <div className="flex flex-col gap-4">
                          <Button asChild className="therapeutic-hover">
                            <Link href="/pricing">Upgrade to Pro</Link>
                          </Button>
                          <div className="p-4 bg-muted/30 rounded-lg">
                            <h4 className="font-medium mb-2">Pro Plan Benefits</h4>
                            <ul className="text-sm text-muted-foreground space-y-1">
                              <li>• Unlimited access to all therapy modalities</li>
                              <li>• Priority support and feature access</li>
                              <li>• Advanced analytics and insights</li>
                              <li>• Custom AI personas and preferences (coming soon)</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-between items-center p-4 rounded-lg bg-muted/50">
                          <div>
                            <h3 className="font-semibold">{userSubscription.planName}</h3>
                            <p className="text-sm text-muted-foreground flex items-center gap-2">
                              Status:
                              <Badge
                                variant={userSubscription.status === 'active' ? 'default' :
                                  userSubscription.status === 'paused' ? 'secondary' : 'outline'}
                                className={`capitalize ${userSubscription.status === 'active' ? 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-500/20' :
                                  userSubscription.status === 'paused' ? 'bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 border-amber-500/20' :
                                    'bg-slate-500/10 text-slate-600 hover:bg-slate-500/20 border-slate-500/20'
                                  }`}
                              >
                                {userSubscription.status}
                              </Badge>
                            </p>
                          </div>
                          <p className="text-sm">
                            Renews on: {new Date(userSubscription.currentPeriodEnd).toLocaleDateString()}
                          </p>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          <Button
                            onClick={() => handleManageSubscription('invoices')}
                            disabled={isProcessingSub}
                            className="therapeutic-hover"
                          >
                            View Invoices
                          </Button>
                          <Button
                            onClick={() => handleManageSubscription('portal')}
                            disabled={isProcessingSub}
                            className="therapeutic-hover"
                          >
                            Customer Portal
                          </Button>
                          {userSubscription.status === 'active' && (
                            <Button
                              onClick={() => handleManageSubscription('pause')}
                              disabled={isProcessingSub}
                              variant="secondary"
                              className="therapeutic-hover"
                            >
                              Pause Subscription
                            </Button>
                          )}
                          {userSubscription.status === 'paused' && (
                            <Button
                              onClick={() => handleManageSubscription('resume')}
                              disabled={isProcessingSub}
                              variant="secondary"
                              className="therapeutic-hover"
                            >
                              Resume Subscription
                            </Button>
                          )}
                          <Button
                            onClick={() => handleManageSubscription('cancel')}
                            disabled={isProcessingSub}
                            variant="destructive"
                            className="therapeutic-hover"
                          >
                            Cancel Subscription
                          </Button>
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
                    <CardDescription>
                      {userSubscription?.plan === 'free' ?
                        'Track your usage for the current billing cycle.' :
                        'You have unlimited usage with the Pro plan.'
                      }
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {userSubscription?.plan === 'free' ? (
                      <div className="space-y-4">
                        {usageMetrics.map((metric) => (
                          <div key={metric.name}>
                            <div className="flex justify-between text-sm">
                              <p>{metric.name}</p>
                              <p>{metric.used} / {metric.limit}</p>
                            </div>
                            <Progress value={(metric.used / metric.limit) * 100} className="h-2 mt-1" />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p>You have unlimited access to all features on the Pro plan.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="goals">
                <Card className="glass-card floating-card">
                  <CardHeader>
                    <CardTitle>Goal Management</CardTitle>
                    <CardDescription>Update your weekly goals to stay on track</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleUpdateGoal} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="weeklySessionGoal">Weekly Session Goal</Label>
                        <Input
                          id="weeklySessionGoal"
                          type="number"
                          min="1"
                          max="14"
                          value={weeklySessionGoal}
                          onChange={(e) => setWeeklySessionGoal(e.target.value)}
                          className="glass-input"
                        />
                        <p className="text-xs text-muted-foreground">
                          Set a realistic goal for the number of sessions you want to complete each week.
                        </p>
                      </div>
                      <Button
                        type="submit"
                        disabled={isUpdatingGoal}
                        className="therapeutic-hover"
                      >
                        {isUpdatingGoal ? "Saving..." : "Save Goal"}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>
            </div>
          </Tabs>
        </div>
        <Dialog open={isInvoiceDialogOpen} onOpenChange={setIsInvoiceDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Invoices</DialogTitle>
              <DialogDescription>
                Here are your recent invoices.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {invoices.length > 0 ? (
                invoices.map((invoice) => (
                  <div key={invoice.id} className="flex justify-between items-center">
                    <a href={invoice.invoice_pdf} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                      Invoice #{invoice.invoice_number}
                    </a>
                    <span>₹{invoice.amount / 100}</span>
                  </div>
                ))
              ) : (
                <p>No invoices found.</p>
              )}
            </div>
            <DialogFooter>
              <Button onClick={() => setIsInvoiceDialogOpen(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}