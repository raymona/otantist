import type { Metadata } from 'next';
import './globals.css';
import I18nProvider from '@/components/I18nProvider';
import { AuthProvider } from '@/lib/auth-context';
import { SensoryProvider } from '@/lib/sensory-context';
import { SessionTimerProvider } from '@/lib/session-timer-context';
import GlobalSessionTimer from '@/components/GlobalSessionTimer';

export const metadata: Metadata = {
  title: 'Otantist',
  description: 'Emotionally safe social platform for neurodivergent individuals',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className="antialiased">
        <I18nProvider>
          <AuthProvider>
            <SensoryProvider>
              <SessionTimerProvider>
                <GlobalSessionTimer />
                {children}
                {/* Persistent beta badge — remove when launching v1 */}
                <div
                  aria-hidden="true"
                  className="fixed bottom-3 left-3 z-50 rounded-full border border-amber-300 bg-amber-100 px-2.5 py-0.5 text-xs font-bold tracking-wider text-amber-800 opacity-80 select-none"
                >
                  BETA
                </div>
              </SessionTimerProvider>
            </SensoryProvider>
          </AuthProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
