"use client";

import { Authenticated, Unauthenticated } from "convex/react";
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import VoiceSession from '@/components/sessions/voice-session';

export default function VoiceSessionPage() {
  const router = useRouter();

  return (
    <>
      <Authenticated>
        <VoiceSession />
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