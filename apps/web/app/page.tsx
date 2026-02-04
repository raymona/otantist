'use client';

import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '@/components/LanguageSwitcher';

export default function Home() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="flex justify-end p-4">
        <LanguageSwitcher />
      </header>
      <main className="flex-1 flex items-center justify-center">
        <div className="text-center p-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {t('app_name')}
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            {t('tagline')}
          </p>
          <div className="flex gap-4 justify-center">
            <a
              href="/login"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              {t('auth:login')}
            </a>
            <a
              href="/register"
              className="px-6 py-3 bg-white text-blue-600 border border-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors"
            >
              {t('auth:register')}
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
