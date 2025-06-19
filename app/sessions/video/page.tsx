"use client";

import { Authenticated, Unauthenticated } from "convex/react";
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import VideoSession from '@/components/sessions/video-session';

export default function VideoSessionPage() {
  const router = useRouter();

  return (
    <>
      <Authenticated>
        <VideoSession />
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