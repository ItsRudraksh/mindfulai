import { type Metadata } from 'next';

export const metadata: Metadata = {
  title: `Session Details - MindfulAI`,
  description: 'Details for your therapy session.',
};

export default function SessionIdLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
} 