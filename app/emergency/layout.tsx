import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Emergency Resources - MindfulAI',
  description: 'Find immediate help and support in case of a mental health crisis.',
};

export default function EmergencyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
} 