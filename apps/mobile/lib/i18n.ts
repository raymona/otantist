import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { appStorage } from './storage';
import { STORAGE_KEYS } from './constants';

// Import translation files as bundled resources (no HTTP backend in RN)
import commonEn from '../assets/locales/en/common.json';
import authEn from '../assets/locales/en/auth.json';
import onboardingEn from '../assets/locales/en/onboarding.json';
import dashboardEn from '../assets/locales/en/dashboard.json';
import settingsEn from '../assets/locales/en/settings.json';
import parentEn from '../assets/locales/en/parent.json';
import moderationEn from '../assets/locales/en/moderation.json';
import helpEn from '../assets/locales/en/help.json';
import adminEn from '../assets/locales/en/admin.json';

import commonFr from '../assets/locales/fr/common.json';
import authFr from '../assets/locales/fr/auth.json';
import onboardingFr from '../assets/locales/fr/onboarding.json';
import dashboardFr from '../assets/locales/fr/dashboard.json';
import settingsFr from '../assets/locales/fr/settings.json';
import parentFr from '../assets/locales/fr/parent.json';
import moderationFr from '../assets/locales/fr/moderation.json';
import helpFr from '../assets/locales/fr/help.json';
import adminFr from '../assets/locales/fr/admin.json';

export const defaultNS = 'common';
export const languages = ['fr', 'en'] as const;
export type Language = (typeof languages)[number];
export const defaultLanguage: Language = 'fr';

// Language detection plugin that reads from AsyncStorage
const asyncStorageDetector = {
  type: 'languageDetector' as const,
  async: true,
  detect: (callback: (lng: string) => void) => {
    appStorage
      .get(STORAGE_KEYS.LANGUAGE)
      .then(lng => callback(lng || defaultLanguage))
      .catch(() => callback(defaultLanguage));
  },
  init: () => {},
  cacheUserLanguage: (lng: string) => {
    appStorage.set(STORAGE_KEYS.LANGUAGE, lng).catch(() => {});
  },
};

i18n
  .use(asyncStorageDetector)
  .use(initReactI18next)
  .init({
    defaultNS,
    fallbackLng: defaultLanguage,
    supportedLngs: languages,
    ns: [
      'common',
      'auth',
      'onboarding',
      'dashboard',
      'settings',
      'parent',
      'moderation',
      'help',
      'admin',
    ],

    resources: {
      en: {
        common: commonEn,
        auth: authEn,
        onboarding: onboardingEn,
        dashboard: dashboardEn,
        settings: settingsEn,
        parent: parentEn,
        moderation: moderationEn,
        help: helpEn,
        admin: adminEn,
      },
      fr: {
        common: commonFr,
        auth: authFr,
        onboarding: onboardingFr,
        dashboard: dashboardFr,
        settings: settingsFr,
        parent: parentFr,
        moderation: moderationFr,
        help: helpFr,
        admin: adminFr,
      },
    },

    compatibilityJSON: 'v3',

    interpolation: {
      escapeValue: false,
    },

    react: {
      useSuspense: false,
    },
  });

export default i18n;
