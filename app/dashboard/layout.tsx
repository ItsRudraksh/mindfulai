import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard - MindfulAI',
  description: 'View your progress, track your mood, and manage your sessions.',
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
} 