import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy - MindfulAI',
  description: 'Read our privacy policy to understand how we protect your data.',
};

export default function PrivacyPolicyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
} 