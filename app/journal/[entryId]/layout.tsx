import { type Metadata } from 'next';

export const metadata: Metadata = {
  title: `Journal Entry - MindfulAI`,
  description: 'Viewing a specific journal entry on MindfulAI.',
};

export default function JournalEntryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
} 