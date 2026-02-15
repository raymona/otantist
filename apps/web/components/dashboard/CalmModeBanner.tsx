'use client';

import { useTranslation } from 'react-i18next';

interface CalmModeBannerProps {
  onDeactivate: () => void;
}

export default function CalmModeBanner({ onDeactivate }: CalmModeBannerProps) {
  const { t } = useTranslation('dashboard');

  return (
    <div
      role="status"
      className="flex items-center justify-between border-b border-purple-200 bg-purple-50 px-4 py-2"
    >
      <div className="flex items-center gap-2">
        <svg
          className="h-4 w-4 text-purple-600"
          fill="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
        <p className="text-sm text-purple-700">{t('calm_mode_banner.message')}</p>
      </div>
      <button
        onClick={onDeactivate}
        className="rounded-md border border-purple-300 bg-white px-3 py-1 text-xs font-medium text-purple-700 transition-colors hover:bg-purple-100"
      >
        {t('calm_mode_banner.deactivate')}
      </button>
    </div>
  );
}
