import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Voice Session - MindfulAI',
  description: 'Start your voice therapy session.',
};

export default function VoiceSessionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
} 