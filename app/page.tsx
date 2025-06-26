"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { Authenticated, Unauthenticated } from "convex/react";
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import LandingPage from '@/components/landing-page';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const hasCompletedOnboarding = useQuery(api.users.hasCompletedOnboarding);

  return (
    <>
      <Authenticated>
        <RedirectToDashboardOrOnboarding hasCompletedOnboarding={hasCompletedOnboarding} />
      </Authenticated>
      <Unauthenticated>
        <LandingPage />
      </Unauthenticated>
    </>
  );
}

function RedirectToDashboardOrOnboarding({ hasCompletedOnboarding }: { hasCompletedOnboarding?: boolean }) {
  const router = useRouter();

  useEffect(() => {
    if (hasCompletedOnboarding === undefined) {
      // Still loading
      return;
    }
    
    if (hasCompletedOnboarding) {
      router.push('/dashboard');
    } else {
      router.push('/onboarding');
    }
  }, [router, hasCompletedOnboarding]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
        <p className="text-muted-foreground">Loading your experience...</p>
      </div>
    </div>
  );
}