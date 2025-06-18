import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import ChatSession from '@/components/sessions/chat-session';

export default async function ChatSessionPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/auth/signin');
  }

  return <ChatSession user={session.user} />;
}