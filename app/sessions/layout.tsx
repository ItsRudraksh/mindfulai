import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sessions - MindfulAI',
  description: 'View your past and upcoming therapy sessions.',
};

export default function SessionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
} 