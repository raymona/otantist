'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { safetyApi } from '@/lib/safety-api';
import type { BlockedUser } from '@/lib/types';

interface BlockedUsersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUnblocked: () => void;
}

export default function BlockedUsersModal({
  isOpen,
  onClose,
  onUnblocked,
}: BlockedUsersModalProps) {
  const { t } = useTranslation('dashboard');
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [unblockingId, setUnblockingId] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const fetchBlockedUsers = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await safetyApi.getBlockedUsers();
      setBlockedUsers(data);
    } catch {
      setError(t('errors.load_blocked_users'));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  // Fetch blocked users when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchBlockedUsers();
      requestAnimationFrame(() => {
        closeRef.current?.focus();
      });
    }
  }, [isOpen, fetchBlockedUsers]);

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

  const handleUnblock = async (userId: string) => {
    setUnblockingId(userId);
    try {
      await safetyApi.unblockUser(userId);
      setBlockedUsers(prev => prev.filter(u => u.id !== userId));
      onUnblocked();
    } catch {
      setError(t('errors.unblock_user'));
    } finally {
      setUnblockingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="blocked-users-title"
        className="relative mx-4 w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
      >
        <h3 id="blocked-users-title" className="mb-4 text-lg font-semibold text-gray-900">
          {t('blocked_users_modal.title')}
        </h3>

        {error && (
          <div
            role="alert"
            className="mb-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {isLoading ? (
          <p className="py-8 text-center text-sm text-gray-500" role="status">
            {t('common:loading')}
          </p>
        ) : blockedUsers.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-500" role="status">
            {t('blocked_users_modal.empty')}
          </p>
        ) : (
          <ul className="max-h-64 space-y-2 overflow-y-auto">
            {blockedUsers.map(bu => (
              <li
                key={bu.id}
                className="flex items-center justify-between rounded-md border border-gray-200 px-3 py-2"
              >
                <div className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-gray-900">
                    {bu.displayName || bu.id.slice(0, 8)}
                  </span>
                  <span className="text-xs text-gray-500">
                    {t('blocked_users_modal.blocked_on', {
                      date: new Date(bu.blockedAt).toLocaleDateString(),
                    })}
                  </span>
                </div>
                <button
                  onClick={() => handleUnblock(bu.id)}
                  disabled={unblockingId === bu.id}
                  aria-label={`${t('blocked_users_modal.unblock')} ${bu.displayName || bu.id.slice(0, 8)}`}
                  className="ml-3 flex-shrink-0 rounded-md border border-gray-300 px-3 py-1 text-xs text-gray-700 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {unblockingId === bu.id
                    ? t('blocked_users_modal.unblocking')
                    : t('blocked_users_modal.unblock')}
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-4 flex justify-end">
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="rounded-md bg-gray-100 px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-200"
          >
            {t('blocked_users_modal.close')}
          </button>
        </div>
      </div>
    </div>
  );
}
