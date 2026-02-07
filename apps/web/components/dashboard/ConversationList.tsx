'use client';

import { useTranslation } from 'react-i18next';
import type { Conversation } from '@/lib/types';
import { formatRelativeTime } from '@/lib/utils';

interface ConversationListProps {
  conversations: Conversation[];
  selectedId: string | null;
  onSelect: (conversation: Conversation) => void;
  onNewConversation: () => void;
  onRefresh: () => void;
  isLoading: boolean;
}

export default function ConversationList({
  conversations,
  selectedId,
  onSelect,
  onNewConversation,
  onRefresh,
  isLoading,
}: ConversationListProps) {
  const { t } = useTranslation('dashboard');

  return (
    <section className="flex h-full flex-col" aria-label={t('conversations.title')}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
        <h2 className="text-lg font-semibold text-gray-900">{t('conversations.title')}</h2>
        <div className="flex gap-2">
          <button
            onClick={onRefresh}
            disabled={isLoading}
            aria-label={t('conversations.refresh')}
            className="rounded-md p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50"
          >
            <svg
              className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
          <button
            onClick={onNewConversation}
            className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-700"
          >
            {t('conversations.new')}
          </button>
        </div>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center p-6 text-center">
            <p className="text-sm text-gray-500">{t('conversations.empty')}</p>
            <p className="mt-1 text-xs text-gray-400">{t('conversations.empty_hint')}</p>
          </div>
        ) : (
          <ul role="listbox" aria-label={t('conversations.title')}>
            {conversations.map(conv => {
              const displayName = conv.otherUser.displayName || conv.otherUser.id.slice(0, 8);
              const isSelected = selectedId === conv.id;
              const onlineStatus = conv.otherUser.isOnline
                ? t('conversations.online')
                : t('conversations.offline');

              return (
                <li key={conv.id} role="option" aria-selected={isSelected}>
                  <button
                    onClick={() => onSelect(conv)}
                    aria-current={isSelected ? 'true' : undefined}
                    className={`w-full border-b border-gray-100 px-4 py-3 text-left transition-colors hover:bg-gray-50 ${
                      isSelected ? 'border-l-2 border-l-blue-600 bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex min-w-0 items-center gap-2">
                        {/* Online indicator */}
                        <span
                          aria-label={onlineStatus}
                          className={`h-2 w-2 flex-shrink-0 rounded-full ${
                            conv.otherUser.isOnline ? 'bg-green-500' : 'bg-gray-300'
                          }`}
                        />
                        <span className="truncate text-sm font-medium text-gray-900">
                          {displayName}
                        </span>
                      </div>

                      <div className="flex flex-shrink-0 items-center gap-2">
                        {conv.lastMessage && (
                          <time
                            dateTime={conv.lastMessage.createdAt}
                            className="text-xs text-gray-500"
                          >
                            {formatRelativeTime(conv.lastMessage.createdAt, t)}
                          </time>
                        )}
                        {conv.unreadCount > 0 && (
                          <span
                            aria-label={t('conversations.unread_other', {
                              count: conv.unreadCount,
                            })}
                            className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-blue-600 px-1.5 text-xs font-bold text-white"
                          >
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>

                    {conv.lastMessage && (
                      <p className="mt-1 truncate pl-4 text-xs text-gray-500">
                        {conv.lastMessage.content}
                      </p>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
