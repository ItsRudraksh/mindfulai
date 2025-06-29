import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Refund Policy - MindfulAI',
  description: 'Information about our refund policy.',
};

export default function RefundPolicyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
} 