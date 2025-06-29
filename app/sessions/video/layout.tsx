import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Video Session - MindfulAI',
  description: 'Start your video therapy session.',
};

export default function VideoSessionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
} 