import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Shipping Policy - MindfulAI',
  description: 'Information about our shipping policy.',
};

export default function ShippingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
} 