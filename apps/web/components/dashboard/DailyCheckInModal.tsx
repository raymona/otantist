'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import type { SocialEnergyLevel } from '@/lib/types';
import { stateApi } from '@/lib/state-api';

interface DailyCheckInModalProps {
  onClose: (energy: SocialEnergyLevel | null, activatedCalmMode: boolean) => void;
}

export default function DailyCheckInModal({ onClose }: DailyCheckInModalProps) {
  const { t } = useTranslation('dashboard');
  const [selectedEnergy, setSelectedEnergy] = useState<SocialEnergyLevel | null>(null);
  const [calmModeWanted, setCalmModeWanted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const firstButtonRef = useRef<HTMLButtonElement>(null);

  // Auto-focus first button
  useEffect(() => {
    firstButtonRef.current?.focus();
  }, []);

  // Trap Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleSkip();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  });

  const handleSkip = () => onClose(null, false);

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      if (selectedEnergy) {
        await stateApi.updateSocialEnergy(selectedEnergy);
      }
      if (calmModeWanted) {
        await stateApi.activateCalmMode();
      }
    } catch {
      // Best-effort — don't block the user
    } finally {
      setIsSubmitting(false);
      onClose(selectedEnergy, calmModeWanted);
    }
  };

  const energyOptions: { value: SocialEnergyLevel; emoji: string }[] = [
    { value: 'high', emoji: '🟢' },
    { value: 'medium', emoji: '🟡' },
    { value: 'low', emoji: '🔴' },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="checkin-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
    >
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <h2 id="checkin-title" className="text-lg font-semibold text-gray-900">
          {t('checkin.title')}
        </h2>
        <p className="mt-1 text-sm text-gray-600">{t('checkin.subtitle')}</p>

        {/* Energy selection */}
        <fieldset className="mt-5">
          <legend className="mb-3 text-sm font-medium text-gray-700">
            {t('checkin.energy_question')}
          </legend>
          <div className="flex gap-3">
            {energyOptions.map(({ value, emoji }, i) => (
              <button
                key={value}
                ref={i === 0 ? firstButtonRef : undefined}
                type="button"
                aria-pressed={selectedEnergy === value}
                onClick={() => setSelectedEnergy(prev => (prev === value ? null : value))}
                className={`flex flex-1 flex-col items-center gap-1 rounded-xl border-2 py-3 text-sm transition-all ${
                  selectedEnergy === value
                    ? 'border-blue-500 bg-blue-50 font-medium text-blue-700'
                    : 'border-gray-200 text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="text-2xl" aria-hidden="true">
                  {emoji}
                </span>
                <span>{t(`status_bar.energy_${value}`)}</span>
              </button>
            ))}
          </div>
        </fieldset>

        {/* Calm mode toggle */}
        <div className="mt-4">
          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={calmModeWanted}
              onChange={e => setCalmModeWanted(e.target.checked)}
              className="h-4 w-4 rounded text-purple-600"
            />
            <span className="text-sm text-gray-700">{t('checkin.calm_mode_question')}</span>
          </label>
        </div>

        {/* Actions */}
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={handleSkip}
            className="flex-1 rounded-lg border border-gray-200 py-2 text-sm text-gray-600 hover:bg-gray-50"
          >
            {t('checkin.skip')}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSubmitting}
            aria-busy={isSubmitting}
            className="flex-1 rounded-lg bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? t('checkin.saving') : t('checkin.save')}
          </button>
        </div>
      </div>
    </div>
  );
}
