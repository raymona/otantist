'use client';

import { useTranslation } from 'react-i18next';

interface SessionBreakScreenProps {
  onDismiss: () => void;
}

export default function SessionBreakScreen({ onDismiss }: SessionBreakScreenProps) {
  const { t } = useTranslation('dashboard');

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="break-title"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-indigo-950/95 p-8 text-center text-white"
    >
      <p className="text-6xl" aria-hidden="true">
        🌿
      </p>
      <h2 id="break-title" className="mt-6 text-2xl font-semibold">
        {t('timer.break_title')}
      </h2>
      <p className="mt-3 max-w-xs text-base text-indigo-200">{t('timer.break_body')}</p>
      <button
        type="button"
        onClick={onDismiss}
        autoFocus
        className="mt-8 rounded-full border border-indigo-400 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-800 focus:ring-2 focus:ring-indigo-400 focus:outline-none"
      >
        {t('timer.break_dismiss')}
      </button>
    </div>
  );
}
