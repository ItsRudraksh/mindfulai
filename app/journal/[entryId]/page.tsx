"use client";

import { useState, useEffect } from 'react';
import { Authenticated, Unauthenticated } from "convex/react";
import { useRouter, useParams } from 'next/navigation';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BookOpen, Loader2 } from 'lucide-react';
import JournalEditor from '@/components/journal/journal-editor';

export default function JournalEntryPage() {
  const router = useRouter();
  const params = useParams();
  const entryId = params.entryId as Id<"journalEntries">;

  const journalEntry = useQuery(api.journalEntries.getJournalEntryById, { entryId });

  if (journalEntry === undefined) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50/40 via-white/60 to-orange-50/40 dark:from-amber-950/40 dark:via-gray-900/60 dark:to-orange-950/40 backdrop-blur-therapeutic flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your journal entry...</p>
        </div>
      </div>
    );
  }

  if (journalEntry === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50/40 via-white/60 to-orange-50/40 dark:from-amber-950/40 dark:via-gray-900/60 dark:to-orange-950/40 backdrop-blur-therapeutic flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-semibold mb-2">Journal Entry Not Found</h2>
          <p className="text-muted-foreground mb-6">
            The journal entry you're looking for doesn't exist or you don't have permission to view it.
          </p>
          <Button onClick={() => router.push('/journal')} className="therapeutic-hover">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Journal
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Authenticated>
        <div className="min-h-screen bg-gradient-to-br from-amber-50/40 via-white/60 to-orange-50/40 dark:from-amber-950/40 dark:via-gray-900/60 dark:to-orange-950/40 backdrop-blur-therapeutic">
          {/* Header */}
          <header className="glass-header sticky top-0 z-50">
            <div className="container mx-auto px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Button variant="ghost" size="icon" onClick={() => router.push('/journal')} className="therapeutic-hover">
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                  <div>
                    <h1 className="text-xl font-semibold">Edit Journal Entry</h1>
                    <p className="text-sm text-muted-foreground">
                      Last updated {new Date(journalEntry.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <div className="container mx-auto px-6 py-8 max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <JournalEditor
                entryId={entryId}
                initialContent={journalEntry.content}
                initialTitle={journalEntry.title}
                placeholder="Continue writing your thoughts..."
              />
            </motion.div>
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