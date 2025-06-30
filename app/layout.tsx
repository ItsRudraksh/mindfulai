import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import { ConvexProvider } from '@/components/convex-provider';
import { VideoSessionProvider } from '@/contexts/video-session-context';
import { VoiceSessionProvider } from '@/contexts/voice-session-context';
import { ChatProvider } from '@/contexts/chat-context';
import { GlobalMemoryProvider } from '@/contexts/global-memory-context';
import { TooltipProvider } from '@/components/ui/tooltip';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { DeveloperNote } from '@/components/dashboard/DeveloperNote';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'MindfulAI - Your Mental Health Companion',
  description: 'AI-powered mental health support with video therapy, voice calls, and text chat',
  icons: {
    icon: [
      {
        media: '(prefers-color-scheme: light)',
        url: '/light-logo.png',
        href: '/light-logo.png',
      },
      {
        media: '(prefers-color-scheme: dark)',
        url: '/dark-logo.png',
        href: '/dark-logo.png',
      },
    ],
    shortcut: ['/light-logo.png'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen flex flex-col bg-gradient-to-br from-blue-50/30 via-white/50 to-green-50/30 dark:from-blue-950/30 dark:via-gray-900/50 dark:to-green-950/30`}>
        <ConvexProvider>
          <GlobalMemoryProvider>
            <ChatProvider>
              <VideoSessionProvider>
                <VoiceSessionProvider>
                  <ThemeProvider
                    attribute="class"
                    defaultTheme="dark"
                    enableSystem={false}
                    disableTransitionOnChange
                  >
                    <TooltipProvider>
                      <main className="relative flex-grow backdrop-blur-therapeutic">
                        {children}
                      </main>
                      <Toaster />
                    </TooltipProvider>
                  </ThemeProvider>
                </VoiceSessionProvider>
              </VideoSessionProvider>
            </ChatProvider>
          </GlobalMemoryProvider>
        </ConvexProvider>
      </body>
    </html>
  );
}