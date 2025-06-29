import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms and Conditions - MindfulAI',
  description: 'Read our terms and conditions of service.',
};

export default function TermsAndConditionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
} 