import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Journal - MindfulAI',
  description: 'Reflect on your thoughts and feelings with your private journal.',
};

export default function JournalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
} 