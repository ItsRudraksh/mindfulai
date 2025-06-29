import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Profile - MindfulAI',
  description: 'Manage your account settings and preferences.',
};

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
} 