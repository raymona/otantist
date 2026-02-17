import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpBackend from 'i18next-http-backend';

export const defaultNS = 'common';
export const languages = ['fr', 'en'] as const;
export type Language = (typeof languages)[number];
export const defaultLanguage: Language = 'fr';

i18n
  .use(HttpBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    defaultNS,
    fallbackLng: defaultLanguage,
    supportedLngs: languages,
    ns: ['common', 'auth', 'onboarding', 'dashboard', 'settings', 'parent'],

    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'otantist-language',
    },

    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },

    interpolation: {
      escapeValue: false, // React already escapes values
    },

    react: {
      useSuspense: false, // Disable suspense for SSR compatibility
    },
  });

export default i18n;
