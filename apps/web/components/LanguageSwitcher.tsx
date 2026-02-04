'use client';

import { useTranslation } from 'react-i18next';
import { languages, type Language } from '@/lib/i18n';

export default function LanguageSwitcher() {
  const { i18n, t } = useTranslation();

  const changeLanguage = (lng: Language) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div className="flex items-center gap-2">
      {languages.map((lng) => (
        <button
          key={lng}
          onClick={() => changeLanguage(lng)}
          className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
            i18n.language === lng
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
          aria-label={lng === 'fr' ? t('french') : t('english')}
        >
          {lng.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
