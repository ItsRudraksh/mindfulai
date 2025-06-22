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
      <body className={`${inter.className} min-h-screen bg-gradient-to-br from-blue-50/30 via-white/50 to-green-50/30 dark:from-blue-950/30 dark:via-gray-900/50 dark:to-green-950/30`}>
        <ConvexProvider>
          <VideoSessionProvider>
            <VoiceSessionProvider>
              <ThemeProvider
                attribute="class"
                defaultTheme="light"
                enableSystem={false}
                disableTransitionOnChange={false}
              >
                <div className="relative min-h-screen backdrop-blur-therapeutic">
                  {children}
                </div>
                <Toaster />
              </ThemeProvider>
            </VoiceSessionProvider>
          </VideoSessionProvider>
        </ConvexProvider>
      </body>
    </html>
  );
}