import type { Metadata } from 'next';
import './globals.css';
import I18nProvider from '@/components/I18nProvider';
import { AuthProvider } from '@/lib/auth-context';
import { SensoryProvider } from '@/lib/sensory-context';

export const metadata: Metadata = {
  title: 'Otantist',
  description: 'Emotionally safe social platform for autistic and neurodivergent individuals',
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
            <SensoryProvider>{children}</SensoryProvider>
          </AuthProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
