'use client';

import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ApiException } from './api';

// Returns a localized error message from any error type.
// Uses the current i18n language automatically.
export function useApiError() {
  const { i18n } = useTranslation();

  const getErrorMessage = useCallback(
    (error: unknown): string => {
      const lang = (i18n.language as 'fr' | 'en') || 'en';
      if (error instanceof ApiException) {
        return error.getLocalizedMessage(lang);
      }
      if (error instanceof Error) {
        return error.message;
      }
      return lang === 'fr' ? 'Une erreur est survenue' : 'An error occurred';
    },
    [i18n.language]
  );

  return { getErrorMessage };
}
