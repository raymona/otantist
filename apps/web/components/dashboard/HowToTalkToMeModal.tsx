'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { usersApi, type HowToTalkToMe } from '@/lib/api';

interface HowToTalkToMeModalProps {
  isOpen: boolean;
  userId: string;
  userName: string;
  onClose: () => void;
}

export default function HowToTalkToMeModal({
  isOpen,
  userId,
  userName,
  onClose,
}: HowToTalkToMeModalProps) {
  const { t } = useTranslation(['dashboard', 'onboarding']);
  const [data, setData] = useState<HowToTalkToMe | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Fetch data when modal opens
  useEffect(() => {
    if (!isOpen) return;

    setIsLoading(true);
    setError('');
    setData(null);

    usersApi
      .getHowToTalkToMe(userId)
      .then(setData)
      .catch(() => setError(t('dashboard:how_to_talk.error')))
      .finally(() => setIsLoading(false));
  }, [isOpen, userId, t]);

  // Focus close button on open
  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => {
        closeButtonRef.current?.focus();
      });
    }
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Focus trap
  useEffect(() => {
    if (!isOpen || !dialogRef.current) return;

    const dialog = dialogRef.current;
    const focusableSelector = 'button, [tabindex]:not([tabindex="-1"])';

    const handleTab = (e: globalThis.KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const focusable = dialog.querySelectorAll<HTMLElement>(focusableSelector);
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleTab);
    return () => document.removeEventListener('keydown', handleTab);
  }, [isOpen]);

  if (!isOpen) return null;

  const boolLabel = (val?: boolean | null) => {
    if (val === true) return t('dashboard:how_to_talk.yes');
    if (val === false) return t('dashboard:how_to_talk.no');
    return '—';
  };

  const hasNoData =
    data &&
    !data.preferredTone &&
    data.commModes.length === 0 &&
    data.slowRepliesOk == null &&
    data.oneMessageAtTime == null &&
    data.readWithoutReply == null &&
    data.goodTopics.length === 0 &&
    data.avoidTopics.length === 0 &&
    data.interactionTips.length === 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />

      {/* Dialog */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="how-to-talk-title"
        className="relative mx-4 max-h-[80vh] w-full max-w-md overflow-y-auto rounded-lg bg-white p-6 shadow-xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 id="how-to-talk-title" className="text-lg font-semibold text-gray-900">
            {t('dashboard:how_to_talk.title', { name: userName })}
          </h3>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            aria-label={t('dashboard:how_to_talk.close')}
            className="rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {isLoading && (
          <div role="status" className="py-8 text-center">
            <p className="text-sm text-gray-500">{t('dashboard:how_to_talk.loading')}</p>
          </div>
        )}

        {error && (
          <div role="alert" className="py-8 text-center">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {data && hasNoData && (
          <p className="py-8 text-center text-sm text-gray-500">
            {t('dashboard:how_to_talk.no_data')}
          </p>
        )}

        {data && !hasNoData && (
          <div className="space-y-5">
            {/* Preferred tone */}
            {data.preferredTone && (
              <div>
                <h4 className="mb-1 text-sm font-medium text-gray-700">
                  {t('dashboard:how_to_talk.preferred_tone')}
                </h4>
                <span className="inline-block rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-800">
                  {t(`onboarding:tone_${data.preferredTone}`)}
                </span>
              </div>
            )}

            {/* Communication modes */}
            {data.commModes.length > 0 && (
              <div>
                <h4 className="mb-1 text-sm font-medium text-gray-700">
                  {t('dashboard:how_to_talk.comm_modes')}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {data.commModes.map(mode => (
                    <span
                      key={mode}
                      className="inline-block rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700"
                    >
                      {t(`onboarding:comm_mode_${mode}`)}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Preferences checklist */}
            {(data.slowRepliesOk != null ||
              data.oneMessageAtTime != null ||
              data.readWithoutReply != null) && (
              <div>
                <h4 className="mb-2 text-sm font-medium text-gray-700">
                  {t('dashboard:how_to_talk.preferences')}
                </h4>
                <ul className="space-y-1.5 text-sm text-gray-600">
                  {data.slowRepliesOk != null && (
                    <li className="flex items-center gap-2">
                      <span
                        aria-hidden="true"
                        className={data.slowRepliesOk ? 'text-green-600' : 'text-gray-400'}
                      >
                        {data.slowRepliesOk ? '\u2713' : '\u2717'}
                      </span>
                      {t('dashboard:how_to_talk.slow_replies_ok')}:{' '}
                      <strong>{boolLabel(data.slowRepliesOk)}</strong>
                    </li>
                  )}
                  {data.oneMessageAtTime != null && (
                    <li className="flex items-center gap-2">
                      <span
                        aria-hidden="true"
                        className={data.oneMessageAtTime ? 'text-green-600' : 'text-gray-400'}
                      >
                        {data.oneMessageAtTime ? '\u2713' : '\u2717'}
                      </span>
                      {t('dashboard:how_to_talk.one_message_at_time')}:{' '}
                      <strong>{boolLabel(data.oneMessageAtTime)}</strong>
                    </li>
                  )}
                  {data.readWithoutReply != null && (
                    <li className="flex items-center gap-2">
                      <span
                        aria-hidden="true"
                        className={data.readWithoutReply ? 'text-green-600' : 'text-gray-400'}
                      >
                        {data.readWithoutReply ? '\u2713' : '\u2717'}
                      </span>
                      {t('dashboard:how_to_talk.read_without_reply')}:{' '}
                      <strong>{boolLabel(data.readWithoutReply)}</strong>
                    </li>
                  )}
                </ul>
              </div>
            )}

            {/* Good topics */}
            {data.goodTopics.length > 0 && (
              <div>
                <h4 className="mb-1 text-sm font-medium text-gray-700">
                  {t('dashboard:how_to_talk.good_topics')}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {data.goodTopics.map((topic, i) => (
                    <span
                      key={i}
                      className="inline-block rounded-full bg-green-100 px-3 py-1 text-sm text-green-800"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Avoid topics */}
            {data.avoidTopics.length > 0 && (
              <div>
                <h4 className="mb-1 text-sm font-medium text-gray-700">
                  {t('dashboard:how_to_talk.avoid_topics')}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {data.avoidTopics.map((topic, i) => (
                    <span
                      key={i}
                      className="inline-block rounded-full bg-red-100 px-3 py-1 text-sm text-red-800"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Interaction tips */}
            {data.interactionTips.length > 0 && (
              <div>
                <h4 className="mb-1 text-sm font-medium text-gray-700">
                  {t('dashboard:how_to_talk.interaction_tips')}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {data.interactionTips.map((tip, i) => (
                    <span
                      key={i}
                      className="inline-block rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-800"
                    >
                      {tip}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
