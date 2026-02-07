'use client';

import { useTranslation } from 'react-i18next';
import type { AgeGroup, ProfileVisibility } from '@/lib/api';

interface StepProfileProps {
  displayName: string;
  ageGroup: AgeGroup | '';
  profileVisibility: ProfileVisibility;
  onDisplayNameChange: (v: string) => void;
  onAgeGroupChange: (v: AgeGroup) => void;
  onVisibilityChange: (v: ProfileVisibility) => void;
}

export default function StepProfile({
  displayName,
  ageGroup,
  profileVisibility,
  onDisplayNameChange,
  onAgeGroupChange,
  onVisibilityChange,
}: StepProfileProps) {
  const { t } = useTranslation('onboarding');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">{t('profile_title')}</h2>
        <p className="mt-1 text-sm text-gray-600">{t('profile_description')}</p>
      </div>

      <div>
        <label htmlFor="display-name" className="block text-sm font-medium text-gray-700">
          {t('display_name')}
        </label>
        <input
          id="display-name"
          type="text"
          value={displayName}
          onChange={e => onDisplayNameChange(e.target.value)}
          placeholder={t('display_name_placeholder')}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="age-group" className="block text-sm font-medium text-gray-700">
          {t('age_group')}
        </label>
        <select
          id="age-group"
          value={ageGroup}
          onChange={e => onAgeGroupChange(e.target.value as AgeGroup)}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none"
        >
          <option value="">{t('age_group_placeholder')}</option>
          <option value="age_14_17">{t('age_14_17')}</option>
          <option value="age_18_25">{t('age_18_25')}</option>
          <option value="age_26_40">{t('age_26_40')}</option>
          <option value="age_40_plus">{t('age_40_plus')}</option>
        </select>
      </div>

      <fieldset>
        <legend className="mb-2 block text-sm font-medium text-gray-700">
          {t('profile_visibility')}
        </legend>
        <div className="space-y-2">
          {(['visible', 'limited', 'hidden'] as ProfileVisibility[]).map(v => (
            <label key={v} className="flex cursor-pointer items-start space-x-3">
              <input
                type="radio"
                name="visibility"
                checked={profileVisibility === v}
                onChange={() => onVisibilityChange(v)}
                className="mt-1 h-4 w-4 text-blue-600"
              />
              <div>
                <span className="font-medium text-gray-900">{t(`visibility_${v}`)}</span>
                <p className="text-sm text-gray-500">{t(`visibility_${v}_desc`)}</p>
              </div>
            </label>
          ))}
        </div>
      </fieldset>
    </div>
  );
}
