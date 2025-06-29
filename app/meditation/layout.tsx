import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Meditation - MindfulAI',
  description: 'Access guided meditations to find calm and clarity.',
};

export default function MeditationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
} 