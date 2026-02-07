'use client';

import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useAuthGuard } from '@/lib/use-auth-guard';

export default function Home() {
  const { t } = useTranslation();
  const { isReady, isLoading } = useAuthGuard('guest');

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50" role="status">
        <p className="text-gray-600">{t('common:loading')}</p>
      </div>
    );
  }

  // Authenticated users are being redirected by useAuthGuard
  if (!isReady) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <header className="flex items-center justify-end gap-4 p-4">
        <LanguageSwitcher />
      </header>
      <main className="flex flex-1 items-center justify-center">
        <div className="p-8 text-center">
          <h1 className="mb-4 text-4xl font-bold text-gray-900">{t('app_name')}</h1>
          <p className="mb-8 text-lg text-gray-600">{t('tagline')}</p>
          <nav className="flex justify-center gap-4" aria-label={t('app_name')}>
            <a
              href="/login"
              className="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-700"
            >
              {t('auth:login')}
            </a>
            <a
              href="/register"
              className="rounded-lg border border-blue-600 bg-white px-6 py-3 font-medium text-blue-600 transition-colors hover:bg-blue-50"
            >
              {t('auth:register')}
            </a>
          </nav>
        </div>
      </main>
    </div>
  );
}
