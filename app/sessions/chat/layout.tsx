import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Chat Session - MindfulAI',
  description: 'Start your chat therapy session.',
};

export default function ChatSessionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
} 