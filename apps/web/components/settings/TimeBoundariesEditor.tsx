'use client';

import { useTranslation } from 'react-i18next';
import type { TimeBoundary } from '@/lib/api';

interface TimeBoundariesEditorProps {
  boundaries: TimeBoundary[];
  onBoundaryChange: (dayOfWeek: number, field: keyof TimeBoundary, value: string | boolean) => void;
}

export default function TimeBoundariesEditor({
  boundaries,
  onBoundaryChange,
}: TimeBoundariesEditorProps) {
  const { t } = useTranslation('settings');

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">{t('time_boundaries_description')}</p>

      <div className="space-y-3">
        {boundaries.map(boundary => (
          <fieldset
            key={boundary.dayOfWeek}
            className={`rounded-lg border p-3 ${
              boundary.isActive ? 'border-gray-300 bg-white' : 'border-gray-200 bg-gray-50'
            }`}
          >
            <legend className="sr-only">{t(`day_${boundary.dayOfWeek}`)}</legend>
            <div className="flex flex-wrap items-center gap-4">
              <label className="flex w-28 items-center gap-2">
                <input
                  type="checkbox"
                  checked={boundary.isActive}
                  onChange={e => onBoundaryChange(boundary.dayOfWeek, 'isActive', e.target.checked)}
                  className="h-4 w-4 rounded text-blue-600"
                />
                <span className="text-sm font-medium text-gray-700">
                  {t(`day_${boundary.dayOfWeek}`)}
                </span>
              </label>

              <div className="flex items-center gap-2">
                <label htmlFor={`start-${boundary.dayOfWeek}`} className="text-xs text-gray-500">
                  {t('start_time')}
                </label>
                <input
                  id={`start-${boundary.dayOfWeek}`}
                  type="time"
                  value={boundary.startTime}
                  onChange={e => onBoundaryChange(boundary.dayOfWeek, 'startTime', e.target.value)}
                  disabled={!boundary.isActive}
                  className="rounded-md border border-gray-300 px-2 py-1 text-sm disabled:opacity-40"
                />
              </div>

              <div className="flex items-center gap-2">
                <label htmlFor={`end-${boundary.dayOfWeek}`} className="text-xs text-gray-500">
                  {t('end_time')}
                </label>
                <input
                  id={`end-${boundary.dayOfWeek}`}
                  type="time"
                  value={boundary.endTime}
                  onChange={e => onBoundaryChange(boundary.dayOfWeek, 'endTime', e.target.value)}
                  disabled={!boundary.isActive}
                  className="rounded-md border border-gray-300 px-2 py-1 text-sm disabled:opacity-40"
                />
              </div>
            </div>
          </fieldset>
        ))}
      </div>
    </div>
  );
}
