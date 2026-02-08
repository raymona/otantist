'use client';

import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

interface BlockConfirmModalProps {
  isOpen: boolean;
  userName: string;
  isLoading: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export default function BlockConfirmModal({
  isOpen,
  userName,
  isLoading,
  onConfirm,
  onClose,
}: BlockConfirmModalProps) {
  const { t } = useTranslation('dashboard');
  const cancelRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Focus Cancel button when modal opens (prevents accidental confirm)
  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => {
        cancelRef.current?.focus();
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="block-confirm-title"
        className="relative mx-4 w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
      >
        <h3 id="block-confirm-title" className="mb-4 text-lg font-semibold text-gray-900">
          {t('block_modal.title', { name: userName })}
        </h3>

        <p className="mb-3 text-sm text-gray-700">{t('block_modal.description')}</p>

        <ul className="mb-4 space-y-2 text-sm text-gray-600">
          <li className="flex items-start gap-2">
            <span className="mt-0.5 text-gray-400" aria-hidden="true">
              •
            </span>
            {t('block_modal.effect_conversations')}
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 text-gray-400" aria-hidden="true">
              •
            </span>
            {t('block_modal.effect_messages')}
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 text-gray-400" aria-hidden="true">
              •
            </span>
            {t('block_modal.effect_start')}
          </li>
        </ul>

        <p className="mb-6 text-sm text-green-700">{t('block_modal.reversible')}</p>

        <div className="flex justify-end gap-3">
          <button
            ref={cancelRef}
            type="button"
            onClick={onClose}
            className="rounded-md bg-gray-100 px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-200"
          >
            {t('block_modal.cancel')}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t('block_modal.confirm')}
          </button>
        </div>
      </div>
    </div>
  );
}
