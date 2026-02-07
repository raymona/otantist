'use client';

import { useTranslation } from 'react-i18next';

export default function StepComplete() {
  const { t } = useTranslation('onboarding');

  return (
    <div className="py-8 text-center">
      <div className="mb-4 text-6xl text-green-500" aria-hidden="true">
        &#10003;
      </div>
      <h2 className="text-2xl font-semibold text-gray-900">{t('complete_title')}</h2>
      <p className="mt-2 text-gray-600">{t('complete_description')}</p>
    </div>
  );
}
