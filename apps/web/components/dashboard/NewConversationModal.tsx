'use client';

import { useState, useEffect, useRef, useCallback, FormEvent, KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { usersApi } from '@/lib/api';
import { messagingApi } from '@/lib/messaging-api';
import { useApiError } from '@/lib/use-api-error';
import type { Conversation, UserDirectoryEntry } from '@/lib/types';

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
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState<UserDirectoryEntry[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserDirectoryEntry | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const listboxRef = useRef<HTMLUListElement>(null);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setSearch('');
      setUsers([]);
      setSelectedUser(null);
      setMessage('');
      setError('');
      setActiveIndex(-1);
      // Load initial directory
      fetchUsers('');
      requestAnimationFrame(() => {
        searchInputRef.current?.focus();
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

  const fetchUsers = useCallback(async (query: string) => {
    setIsSearching(true);
    try {
      const result = await usersApi.getDirectory(query || undefined);
      setUsers(result.users);
      setActiveIndex(-1);
    } catch {
      setUsers([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    if (!isOpen) return;

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      fetchUsers(search);
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [search, isOpen, fetchUsers]);

  // Scroll active item into view
  useEffect(() => {
    if (activeIndex >= 0 && listboxRef.current) {
      const activeEl = listboxRef.current.children[activeIndex] as HTMLElement | undefined;
      activeEl?.scrollIntoView({ block: 'nearest' });
    }
  }, [activeIndex]);

  if (!isOpen) return null;

  const handleSelectUser = (user: UserDirectoryEntry) => {
    setSelectedUser(user);
    setError('');
  };

  const handleDeselectUser = () => {
    setSelectedUser(null);
    requestAnimationFrame(() => {
      searchInputRef.current?.focus();
    });
  };

  const handleSearchKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (users.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => (prev < users.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => (prev > 0 ? prev - 1 : users.length - 1));
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      handleSelectUser(users[activeIndex]);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    setIsLoading(true);
    setError('');

    try {
      const conversation = await messagingApi.startConversation(
        selectedUser.id,
        message.trim() || undefined
      );
      onCreated(conversation);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const energyLabel = (level: string | null) => {
    if (!level) return null;
    return t(`status_bar.energy_${level}`);
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

          {/* User selection */}
          {selectedUser ? (
            <div className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-block h-2 w-2 rounded-full ${selectedUser.isOnline ? 'bg-green-500' : 'bg-gray-400'}`}
                    aria-hidden="true"
                  />
                  <span className="text-sm font-medium text-gray-900">
                    {selectedUser.displayName || selectedUser.id}
                  </span>
                  {selectedUser.socialEnergy && (
                    <span className="text-xs text-gray-500">
                      {energyLabel(selectedUser.socialEnergy)}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleDeselectUser}
                  className="text-sm text-blue-600 hover:text-blue-800"
                  aria-label={t('common:cancel')}
                  title={t('common:cancel')}
                >
                  &times;
                </button>
              </div>
            </div>
          ) : (
            <div>
              <label
                htmlFor="new-conv-search"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                {t('new_conversation_modal.select_user')}
              </label>
              <input
                ref={searchInputRef}
                id="new-conv-search"
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder={t('new_conversation_modal.search_placeholder')}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none"
                role="combobox"
                aria-expanded={users.length > 0}
                aria-controls="user-directory-list"
                aria-activedescendant={activeIndex >= 0 ? `user-option-${activeIndex}` : undefined}
                autoComplete="off"
              />

              {/* Results list */}
              <div className="mt-2 max-h-48 overflow-y-auto rounded-md border border-gray-200">
                {isSearching ? (
                  <p role="status" className="px-3 py-4 text-center text-sm text-gray-500">
                    {t('new_conversation_modal.loading')}
                  </p>
                ) : users.length === 0 ? (
                  <p className="px-3 py-4 text-center text-sm text-gray-500">
                    {t('new_conversation_modal.no_results')}
                  </p>
                ) : (
                  <ul
                    ref={listboxRef}
                    id="user-directory-list"
                    role="listbox"
                    aria-label={t('new_conversation_modal.select_user')}
                  >
                    {users.map((user, index) => (
                      <li
                        key={user.id}
                        id={`user-option-${index}`}
                        role="option"
                        aria-selected={activeIndex === index}
                        onClick={() => handleSelectUser(user)}
                        onMouseEnter={() => setActiveIndex(index)}
                        className={`flex cursor-pointer items-center gap-2 px-3 py-2 text-sm ${
                          activeIndex === index ? 'bg-blue-50' : 'hover:bg-gray-50'
                        }`}
                      >
                        <span
                          className={`inline-block h-2 w-2 flex-shrink-0 rounded-full ${user.isOnline ? 'bg-green-500' : 'bg-gray-400'}`}
                          aria-hidden="true"
                        />
                        <span className="flex-1 truncate font-medium text-gray-900">
                          {user.displayName || user.id}
                        </span>
                        <span className="flex-shrink-0 text-xs text-gray-500">
                          {user.isOnline
                            ? t('new_conversation_modal.online')
                            : t('new_conversation_modal.offline')}
                        </span>
                        {user.socialEnergy && (
                          <span className="flex-shrink-0 text-xs text-gray-400">
                            {energyLabel(user.socialEnergy)}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          {/* First message */}
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
              disabled={isLoading || !selectedUser}
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
