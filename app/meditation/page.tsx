"use client";

import { Authenticated, Unauthenticated } from "convex/react";
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import MeditationSession from '@/components/meditation/meditation-session';

export default function MeditationPage() {
  const router = useRouter();

  return (
    <>
      <Authenticated>
        <MeditationSession />
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