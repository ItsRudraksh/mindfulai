import { type Metadata } from 'next';

type Props = {
  params: { sessionId: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return {
    title: `Session Details - MindfulAI`,
    description: 'Details for your therapy session.',
  };
}

export default function SessionIdLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
} 