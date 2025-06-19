"use client";

import { Authenticated, Unauthenticated } from "convex/react";
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import ChatSession from '@/components/sessions/chat-session';

export default function ChatSessionPage() {
  const router = useRouter();

  return (
    <>
      <Authenticated>
        <ChatSession />
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