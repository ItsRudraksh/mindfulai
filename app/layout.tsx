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
                    defaultTheme="system"
                    enableSystem
                    disableTransitionOnChange
                  >
                    <TooltipProvider>
                      <main className="relative flex-grow backdrop-blur-therapeutic">
                        {children}
                      </main>
                      <Toaster />
                      <footer className="py-4 border-t bg-background/80 backdrop-blur-sm">
                        <div className="container mx-auto flex justify-center items-center space-x-6">
                          <Link href="/privacy-policy" className="text-sm text-muted-foreground hover:text-primary">Privacy Policy</Link>
                          <Link href="/terms-and-conditions" className="text-sm text-muted-foreground hover:text-primary">Terms & Conditions</Link>
                          <Link href="/refund-policy" className="text-sm text-muted-foreground hover:text-primary">Refund Policy</Link>
                          <Link href="/shipping" className="text-sm text-muted-foreground hover:text-primary">Shipping</Link>
                        </div>
                      </footer>
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