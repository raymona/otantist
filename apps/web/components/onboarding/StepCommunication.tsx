'use client';

import { useTranslation } from 'react-i18next';
import type { TonePreference } from '@/lib/api';

interface StepCommunicationProps {
  preferredTone: TonePreference | '';
  commModes: string[];
  slowRepliesOk: boolean;
  oneMessageAtTime: boolean;
  readWithoutReply: boolean;
  onToneChange: (v: TonePreference) => void;
  onToggleCommMode: (mode: string) => void;
  onSlowRepliesChange: (v: boolean) => void;
  onOneMessageChange: (v: boolean) => void;
  onReadWithoutReplyChange: (v: boolean) => void;
}

const TONES: TonePreference[] = ['gentle', 'direct', 'enthusiastic', 'formal'];
const COMM_MODES = ['text', 'emoji', 'voice', 'images'];

export default function StepCommunication({
  preferredTone,
  commModes,
  slowRepliesOk,
  oneMessageAtTime,
  readWithoutReply,
  onToneChange,
  onToggleCommMode,
  onSlowRepliesChange,
  onOneMessageChange,
  onReadWithoutReplyChange,
}: StepCommunicationProps) {
  const { t } = useTranslation('onboarding');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">{t('communication_title')}</h2>
        <p className="mt-1 text-sm text-gray-600">{t('communication_description')}</p>
      </div>

      <fieldset>
        <legend className="mb-2 block text-sm font-medium text-gray-700">
          {t('preferred_tone')}
        </legend>
        <div className="grid grid-cols-2 gap-2">
          {TONES.map(tone => (
            <label
              key={tone}
              className={`flex cursor-pointer flex-col rounded-lg border p-3 ${
                preferredTone === tone
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                name="tone"
                checked={preferredTone === tone}
                onChange={() => onToneChange(tone)}
                className="sr-only"
              />
              <span className="font-medium text-gray-900">{t(`tone_${tone}`)}</span>
              <span className="text-xs text-gray-500">{t(`tone_${tone}_desc`)}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <span className="mb-2 block text-sm font-medium text-gray-700">{t('comm_modes')}</span>
        <div className="flex flex-wrap gap-2" role="group" aria-label={t('comm_modes')}>
          {COMM_MODES.map(mode => (
            <button
              key={mode}
              type="button"
              onClick={() => onToggleCommMode(mode)}
              aria-pressed={commModes.includes(mode)}
              className={`rounded-full px-4 py-2 text-sm font-medium ${
                commModes.includes(mode)
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {t(`comm_mode_${mode}`)}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <label className="flex cursor-pointer items-start space-x-3">
          <input
            type="checkbox"
            checked={slowRepliesOk}
            onChange={e => onSlowRepliesChange(e.target.checked)}
            className="mt-1 h-4 w-4 rounded text-blue-600"
          />
          <div>
            <span className="font-medium text-gray-900">{t('slow_replies_ok')}</span>
            <p className="text-sm text-gray-500">{t('slow_replies_ok_desc')}</p>
          </div>
        </label>
        <label className="flex cursor-pointer items-start space-x-3">
          <input
            type="checkbox"
            checked={oneMessageAtTime}
            onChange={e => onOneMessageChange(e.target.checked)}
            className="mt-1 h-4 w-4 rounded text-blue-600"
          />
          <div>
            <span className="font-medium text-gray-900">{t('one_message_at_time')}</span>
            <p className="text-sm text-gray-500">{t('one_message_at_time_desc')}</p>
          </div>
        </label>
        <label className="flex cursor-pointer items-start space-x-3">
          <input
            type="checkbox"
            checked={readWithoutReply}
            onChange={e => onReadWithoutReplyChange(e.target.checked)}
            className="mt-1 h-4 w-4 rounded text-blue-600"
          />
          <div>
            <span className="font-medium text-gray-900">{t('read_without_reply')}</span>
            <p className="text-sm text-gray-500">{t('read_without_reply_desc')}</p>
          </div>
        </label>
      </div>
    </div>
  );
}
