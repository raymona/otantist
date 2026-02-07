'use client';

import { useTranslation } from 'react-i18next';
import type { ColorIntensity } from '@/lib/api';

interface StepSensoryProps {
  enableAnimations: boolean;
  colorIntensity: ColorIntensity;
  soundEnabled: boolean;
  notificationLimit: number;
  notificationGrouped: boolean;
  onAnimationsChange: (v: boolean) => void;
  onColorIntensityChange: (v: ColorIntensity) => void;
  onSoundChange: (v: boolean) => void;
  onNotificationLimitChange: (v: number) => void;
  onNotificationGroupedChange: (v: boolean) => void;
}

const INTENSITIES: ColorIntensity[] = ['standard', 'reduced', 'minimal'];

export default function StepSensory({
  enableAnimations,
  colorIntensity,
  soundEnabled,
  notificationLimit,
  notificationGrouped,
  onAnimationsChange,
  onColorIntensityChange,
  onSoundChange,
  onNotificationLimitChange,
  onNotificationGroupedChange,
}: StepSensoryProps) {
  const { t } = useTranslation('onboarding');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">{t('sensory_title')}</h2>
        <p className="mt-1 text-sm text-gray-600">{t('sensory_description')}</p>
      </div>

      <label className="flex cursor-pointer items-start space-x-3">
        <input
          type="checkbox"
          checked={enableAnimations}
          onChange={e => onAnimationsChange(e.target.checked)}
          className="mt-1 h-4 w-4 rounded text-blue-600"
        />
        <div>
          <span className="font-medium text-gray-900">{t('enable_animations')}</span>
          <p className="text-sm text-gray-500">{t('enable_animations_desc')}</p>
        </div>
      </label>

      <fieldset>
        <legend className="mb-2 block text-sm font-medium text-gray-700">
          {t('color_intensity')}
        </legend>
        <div className="flex gap-2">
          {INTENSITIES.map(intensity => (
            <button
              key={intensity}
              type="button"
              onClick={() => onColorIntensityChange(intensity)}
              aria-pressed={colorIntensity === intensity}
              className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium ${
                colorIntensity === intensity
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {t(`color_${intensity}`)}
            </button>
          ))}
        </div>
      </fieldset>

      <label className="flex cursor-pointer items-start space-x-3">
        <input
          type="checkbox"
          checked={soundEnabled}
          onChange={e => onSoundChange(e.target.checked)}
          className="mt-1 h-4 w-4 rounded text-blue-600"
        />
        <div>
          <span className="font-medium text-gray-900">{t('sound_enabled')}</span>
          <p className="text-sm text-gray-500">{t('sound_enabled_desc')}</p>
        </div>
      </label>

      <div>
        <label htmlFor="notification-limit" className="block text-sm font-medium text-gray-700">
          {t('notification_limit')}
        </label>
        <p id="notification-limit-desc" className="mb-2 text-sm text-gray-500">
          {t('notification_limit_desc')}
        </p>
        <input
          id="notification-limit"
          type="range"
          min="0"
          max="20"
          value={notificationLimit}
          onChange={e => onNotificationLimitChange(Number(e.target.value))}
          aria-describedby="notification-limit-desc"
          aria-valuemin={0}
          aria-valuemax={20}
          aria-valuenow={notificationLimit}
          className="w-full"
        />
        <output className="block text-center text-sm text-gray-600">{notificationLimit}</output>
      </div>

      <label className="flex cursor-pointer items-start space-x-3">
        <input
          type="checkbox"
          checked={notificationGrouped}
          onChange={e => onNotificationGroupedChange(e.target.checked)}
          className="mt-1 h-4 w-4 rounded text-blue-600"
        />
        <div>
          <span className="font-medium text-gray-900">{t('notification_grouped')}</span>
          <p className="text-sm text-gray-500">{t('notification_grouped_desc')}</p>
        </div>
      </label>
    </div>
  );
}
