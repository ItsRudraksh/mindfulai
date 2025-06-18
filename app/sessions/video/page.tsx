import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import VideoSession from '@/components/sessions/video-session';

export default async function VideoSessionPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/auth/signin');
  }

  return <VideoSession user={session.user} />;
}