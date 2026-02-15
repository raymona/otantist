'use client';

import { useTranslation } from 'react-i18next';
import { languages, type Language } from '@/lib/i18n';
import { useAuth } from '@/lib/auth-context';
import { usersApi } from '@/lib/api';

export default function LanguageSwitcher() {
  const { i18n, t } = useTranslation();
  const { isAuthenticated } = useAuth();

  const changeLanguage = (lng: Language) => {
    i18n.changeLanguage(lng);
    if (isAuthenticated) {
      usersApi.updateLanguage(lng).catch(() => {
        // Non-critical: language preference will still work locally via localStorage
      });
    }
  };

  return (
    <div role="group" aria-label={t('language')} className="flex items-center gap-2">
      {languages.map(lng => (
        <button
          key={lng}
          onClick={() => changeLanguage(lng)}
          aria-current={i18n.language === lng ? 'true' : undefined}
          aria-label={lng === 'fr' ? t('french') : t('english')}
          className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
            i18n.language === lng
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          {lng.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
