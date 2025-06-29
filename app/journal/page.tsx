"use client";

import { Authenticated, Unauthenticated } from "convex/react";
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import JournalList from '@/components/journal/journal-list';

export default function JournalPage() {
  const router = useRouter();

  return (
    <>
      <Authenticated>
        <div className="min-h-screen bg-gradient-to-br from-amber-50/40 via-white/60 to-orange-50/40 dark:from-amber-950/40 dark:via-gray-900/60 dark:to-orange-950/40 backdrop-blur-therapeutic">
          {/* Header */}
          <header className="glass-header sticky top-0 z-50">
            <div className="container mx-auto px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => router.push('/dashboard')}
                    className="p-2 hover:bg-muted/50 rounded-lg transition-colors"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <div>
                    <h1 className="text-xl font-semibold">Journal</h1>
                    <p className="text-sm text-muted-foreground">
                      Document your thoughts and experiences
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <div className="container mx-auto px-6 py-8 max-w-7xl">
            <JournalList />
          </div>
        </div>
      </Authenticated>
      <Unauthenticated>
        <RedirectToSignIn />
      </Unauthenticated>
    </>
  );
}

function RedirectToSignIn() {
  const router = useRouter();

  useEffect(() => {
    router.push('/auth/signin');
  }, [router]);

  return null;
}