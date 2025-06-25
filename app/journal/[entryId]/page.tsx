"use client";

import { Authenticated, Unauthenticated } from "convex/react";
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import JournalEditor from '@/components/journal/journal-editor';

interface JournalEntryPageProps {
  params: {
    entryId: string;
  };
}

export default function JournalEntryPage({ params }: JournalEntryPageProps) {
  const router = useRouter();

  return (
    <>
      <Authenticated>
        <JournalEditor entryId={params.entryId} />
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