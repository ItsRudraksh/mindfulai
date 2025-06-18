import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import VoiceSession from '@/components/sessions/voice-session';

export default async function VoiceSessionPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/auth/signin');
  }

  return <VoiceSession user={session.user} />;
}