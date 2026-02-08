'use client';

import { useState, useEffect, useRef, FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { safetyApi } from '@/lib/safety-api';
import { useApiError } from '@/lib/use-api-error';
import type { ReportReason } from '@/lib/types';

const REPORT_REASONS: ReportReason[] = [
  'harassment',
  'inappropriate',
  'spam',
  'safety_concern',
  'other',
];

interface ReportModalProps {
  isOpen: boolean;
  reportedUserId?: string;
  reportedMessageId?: string;
  userName: string;
  onSuccess: () => void;
  onClose: () => void;
}

export default function ReportModal({
  isOpen,
  reportedUserId,
  reportedMessageId,
  userName,
  onSuccess,
  onClose,
}: ReportModalProps) {
  const { t } = useTranslation('dashboard');
  const { getErrorMessage } = useApiError();
  const [reason, setReason] = useState<ReportReason | ''>('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const firstRadioRef = useRef<HTMLInputElement>(null);

  // Focus first radio when modal opens
  useEffect(() => {
    if (isOpen) {
      setReason('');
      setDescription('');
      setError('');
      requestAnimationFrame(() => {
        firstRadioRef.current?.focus();
      });
    }
  }, [isOpen]);

  // Close on Escape key
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

  // Trap focus within the modal
  useEffect(() => {
    if (!isOpen || !dialogRef.current) return;

    const dialog = dialogRef.current;
    const focusableSelector = 'input, button, textarea, [tabindex]:not([tabindex="-1"])';

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

  const isMessageReport = !!reportedMessageId;
  const title = isMessageReport
    ? t('report_modal.title_message')
    : t('report_modal.title_user', { name: userName });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!reason) return;

    setIsLoading(true);
    setError('');

    try {
      await safetyApi.submitReport({
        reportedUserId,
        reportedMessageId,
        reason,
        description: description.trim() || undefined,
      });
      onSuccess();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-modal-title"
        className="relative mx-4 w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
      >
        <h3 id="report-modal-title" className="mb-4 text-lg font-semibold text-gray-900">
          {title}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div
              role="alert"
              className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          <fieldset>
            <legend className="mb-2 text-sm font-medium text-gray-700">
              {t('report_modal.reason_label')}
            </legend>
            <div className="space-y-2">
              {REPORT_REASONS.map((r, i) => (
                <label key={r} className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    ref={i === 0 ? firstRadioRef : undefined}
                    type="radio"
                    name="report-reason"
                    value={r}
                    checked={reason === r}
                    onChange={() => setReason(r)}
                    className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  {t(`report_modal.reason_${r}`)}
                </label>
              ))}
            </div>
          </fieldset>

          <div>
            <label
              htmlFor="report-description"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              {t('report_modal.description_label')}
            </label>
            <textarea
              id="report-description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder={t('report_modal.description_placeholder')}
              rows={3}
              className="block w-full resize-none rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md bg-gray-100 px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-200"
            >
              {t('report_modal.cancel')}
            </button>
            <button
              type="submit"
              disabled={isLoading || !reason}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? t('report_modal.submitting') : t('report_modal.submit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
