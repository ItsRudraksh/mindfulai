import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import { ConvexProvider } from '@/components/convex-provider';
import { VideoSessionProvider } from '@/contexts/video-session-context';
import { VoiceSessionProvider } from '@/contexts/voice-session-context';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'MindfulAI - Your Mental Health Companion',
  description: 'AI-powered mental health support with video therapy, voice calls, and text chat',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ConvexProvider>
          <VideoSessionProvider>
            <VoiceSessionProvider>
              <ThemeProvider
                attribute="class"
                defaultTheme="dark"
                enableSystem={false}
                disableTransitionOnChange={false}
              >
                {children}
                <Toaster />
              </ThemeProvider>
            </VoiceSessionProvider>
          </VideoSessionProvider>
        </ConvexProvider>
      </body>
    </html>
  );
}