import { type Metadata } from 'next';

type Props = {
  params: { entryId: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return {
    title: `Journal Entry - MindfulAI`,
    description: 'Viewing a specific journal entry on MindfulAI.',
  };
}


export default function JournalEntryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
} 