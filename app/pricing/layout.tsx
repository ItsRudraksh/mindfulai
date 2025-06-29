import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pricing - MindfulAI',
  description: 'Choose a plan that works for you and start your journey to better mental health.',
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
} 