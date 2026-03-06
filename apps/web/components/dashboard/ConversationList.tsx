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
  typingConversations?: Set<string>;
  showHidden: boolean;
  onToggleHidden: () => void;
  onUnhide?: (conversationId: string) => void;
}

export default function ConversationList({
  conversations,
  selectedId,
  onSelect,
  onNewConversation,
  onRefresh,
  isLoading,
  typingConversations,
  showHidden,
  onToggleHidden,
  onUnhide,
}: ConversationListProps) {
  const { t } = useTranslation('dashboard');

  return (
    <section
      className="flex h-full flex-col"
      aria-label={showHidden ? t('conversations.hidden_title') : t('conversations.title')}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
        <h2 className="text-lg font-semibold text-gray-900">
          {showHidden ? t('conversations.hidden_title') : t('conversations.title')}
        </h2>
        <div className="flex gap-2">
          {/* Toggle hidden/active view */}
          <button
            onClick={onToggleHidden}
            aria-label={
              showHidden ? t('conversations.show_active') : t('conversations.show_hidden')
            }
            title={showHidden ? t('conversations.show_active') : t('conversations.show_hidden')}
            className={`rounded-md p-2 transition-colors hover:bg-gray-100 ${
              showHidden ? 'text-blue-600 hover:text-blue-700' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {/* Eye icon */}
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              {showHidden ? (
                /* Eye open icon — currently viewing hidden, click to go back */
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              ) : (
                /* Eye with slash icon — click to view hidden */
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L6.5 6.5m3.378 3.378L6.5 6.5m0 0L3 3m3.5 3.5l10 10m0 0l3.5 3.5m-3.5-3.5l3.5 3.5"
                />
              )}
            </svg>
          </button>
          <button
            onClick={onRefresh}
            disabled={isLoading}
            aria-label={t('conversations.refresh')}
            title={t('conversations.refresh')}
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
          {!showHidden && (
            <button
              onClick={onNewConversation}
              className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-700"
            >
              {t('conversations.new')}
            </button>
          )}
        </div>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center p-6 text-center">
            <p className="text-sm text-gray-500">
              {showHidden ? t('conversations.hidden_empty') : t('conversations.empty')}
            </p>
            {!showHidden && (
              <p className="mt-1 text-xs text-gray-400">{t('conversations.empty_hint')}</p>
            )}
          </div>
        ) : (
          <ul
            role="listbox"
            aria-label={showHidden ? t('conversations.hidden_title') : t('conversations.title')}
          >
            {conversations.map(conv => {
              const displayName = conv.otherUser.displayName || conv.otherUser.id.slice(0, 8);
              const isSelected = selectedId === conv.id;
              const onlineStatus = conv.otherUser.isOnline
                ? t('conversations.online')
                : t('conversations.offline');

              return (
                <li key={conv.id} role="option" aria-selected={isSelected}>
                  <div
                    className={`flex items-center border-b border-gray-100 ${
                      isSelected ? 'border-l-2 border-l-blue-600 bg-blue-50' : ''
                    }`}
                  >
                    <button
                      onClick={() => onSelect(conv)}
                      aria-current={isSelected ? 'true' : undefined}
                      className="min-w-0 flex-1 px-4 py-3 text-left transition-colors hover:bg-gray-50"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex min-w-0 items-center gap-2">
                          {/* Online indicator */}
                          <span
                            aria-label={onlineStatus}
                            title={onlineStatus}
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
                          {!showHidden && conv.unreadCount > 0 && (
                            <span
                              aria-label={t('conversations.unread_other', {
                                count: conv.unreadCount,
                              })}
                              title={t('conversations.unread_other', {
                                count: conv.unreadCount,
                              })}
                              className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-blue-600 px-1.5 text-xs font-bold text-white"
                            >
                              {conv.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>

                      {!showHidden && typingConversations?.has(conv.id) ? (
                        <p className="mt-1 truncate pl-4 text-xs text-blue-500 italic">
                          {t('chat.typing_short')}
                        </p>
                      ) : conv.lastMessage ? (
                        <p className="mt-1 truncate pl-4 text-xs text-gray-500">
                          {conv.lastMessage.content}
                        </p>
                      ) : null}
                    </button>

                    {/* Unhide button for hidden conversations */}
                    {showHidden && onUnhide && (
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          onUnhide(conv.id);
                        }}
                        className="mr-3 flex-shrink-0 rounded-md border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-100"
                      >
                        {t('conversations.unhide')}
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
