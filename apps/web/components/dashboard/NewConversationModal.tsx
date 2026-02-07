'use client';

import { useState, useEffect, useRef, FormEvent, KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { messagingApi } from '@/lib/messaging-api';
import { useApiError } from '@/lib/use-api-error';
import type { Conversation } from '@/lib/types';

interface NewConversationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (conversation: Conversation) => void;
}

export default function NewConversationModal({
  isOpen,
  onClose,
  onCreated,
}: NewConversationModalProps) {
  const { t } = useTranslation('dashboard');
  const { getErrorMessage } = useApiError();
  const [userId, setUserId] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const firstInputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Focus first input when modal opens
  useEffect(() => {
    if (isOpen) {
      // Small delay to ensure DOM is rendered
      requestAnimationFrame(() => {
        firstInputRef.current?.focus();
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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!userId.trim()) return;

    setIsLoading(true);
    setError('');

    try {
      const conversation = await messagingApi.startConversation(
        userId.trim(),
        message.trim() || undefined
      );
      setUserId('');
      setMessage('');
      onCreated(conversation);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />

      {/* Dialog */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-conversation-title"
        className="relative mx-4 w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
      >
        <h3 id="new-conversation-title" className="mb-4 text-lg font-semibold text-gray-900">
          {t('new_conversation_modal.title')}
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

          <div>
            <label
              htmlFor="new-conv-user-id"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              {t('new_conversation_modal.user_id_label')}
            </label>
            <input
              ref={firstInputRef}
              id="new-conv-user-id"
              type="text"
              value={userId}
              onChange={e => setUserId(e.target.value)}
              placeholder={t('new_conversation_modal.user_id_placeholder')}
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label
              htmlFor="new-conv-message"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              {t('new_conversation_modal.initial_message_label')}
            </label>
            <input
              id="new-conv-message"
              type="text"
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder={t('new_conversation_modal.initial_message_placeholder')}
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md bg-gray-100 px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-200"
            >
              {t('common:cancel')}
            </button>
            <button
              type="submit"
              disabled={isLoading || !userId.trim()}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? t('new_conversation_modal.starting') : t('new_conversation_modal.start')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
