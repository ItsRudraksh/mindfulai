import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Onboarding - MindfulAI',
  description: 'Welcome to MindfulAI. Let\'s get you set up.',
};

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
} 