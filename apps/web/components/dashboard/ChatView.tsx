'use client';

import { useState, useEffect, useRef, useCallback, KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { messagingApi } from '@/lib/messaging-api';
import type { Conversation, Message } from '@/lib/types';
import MessageBubble from './MessageBubble';

interface ChatViewProps {
  conversation: Conversation;
  onBack: () => void;
  onConversationUpdated?: () => void;
  onBlockUser?: (userId: string, userName: string) => void;
  onReportUser?: (userId: string, userName: string) => void;
  onReportMessage?: (messageId: string, userId: string, userName: string) => void;
}

export default function ChatView({
  conversation,
  onBack,
  onConversationUpdated,
  onBlockUser,
  onReportUser,
  onReportMessage,
}: ChatViewProps) {
  const { t } = useTranslation('dashboard');
  const [messages, setMessages] = useState<Message[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [inputText, setInputText] = useState('');
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchMessages = useCallback(
    async (before?: string) => {
      setIsLoading(true);
      setError('');
      try {
        const data = await messagingApi.getMessages(conversation.id, 50, before);
        if (before) {
          setMessages(prev => [...data.messages, ...prev]);
        } else {
          setMessages(data.messages);
        }
        setHasMore(data.hasMore);
      } catch {
        setError(t('errors.load_messages'));
      } finally {
        setIsLoading(false);
      }
    },
    [conversation.id, t]
  );

  // Fetch messages on mount / conversation change
  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Scroll to bottom when messages first load or new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages.length]);

  // Mark as read when opening conversation with unread messages
  useEffect(() => {
    if (conversation.unreadCount > 0 && messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg && !lastMsg.isOwnMessage) {
        messagingApi.markAsRead(conversation.id, lastMsg.id).catch(() => {});
        onConversationUpdated?.();
      }
    }
  }, [conversation.id, conversation.unreadCount, messages, onConversationUpdated]);

  const handleLoadMore = () => {
    if (messages.length > 0 && hasMore) {
      fetchMessages(messages[0].id);
    }
  };

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || isSending) return;

    setIsSending(true);
    setError('');

    try {
      const response = await messagingApi.sendMessage(conversation.id, text);
      setMessages(prev => [...prev, response.message]);
      setInputText('');
      onConversationUpdated?.();
    } catch {
      setError(t('errors.send_message'));
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleDelete = async (messageId: string) => {
    try {
      await messagingApi.deleteMessage(messageId);
      setMessages(prev =>
        prev.map(m =>
          m.id === messageId
            ? { ...m, content: '[Message deleted]', messageType: 'system' as const }
            : m
        )
      );
    } catch {
      // Non-critical: delete failure leaves the original message visible
    }
  };

  const otherUser = conversation.otherUser;
  const displayName = otherUser.displayName || otherUser.id.slice(0, 8);
  const energyLevel = otherUser.socialEnergy;
  const energyText = energyLevel ? t(`status_bar.energy_${energyLevel}`) : null;

  return (
    <section className="flex h-full flex-col" aria-label={displayName}>
      {/* Chat header */}
      <header className="flex items-center gap-3 border-b border-gray-200 bg-white px-4 py-3">
        {/* Back button (visible on mobile) */}
        <button
          onClick={onBack}
          aria-label={t('chat.back_to_list')}
          className="p-1 text-gray-500 hover:text-gray-700 md:hidden"
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
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>

        <div className="flex min-w-0 flex-1 items-center gap-2">
          <span
            aria-label={otherUser.isOnline ? t('conversations.online') : t('conversations.offline')}
            className={`h-2.5 w-2.5 flex-shrink-0 rounded-full ${
              otherUser.isOnline ? 'bg-green-500' : 'bg-gray-300'
            }`}
          />
          <span className="truncate font-medium text-gray-900">{displayName}</span>

          {otherUser.calmModeActive && (
            <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs text-purple-700">
              {t('chat.calm_mode_active')}
            </span>
          )}

          {energyText && (
            <span className="text-xs text-gray-500">
              {t('chat.energy_label', { level: energyText })}
            </span>
          )}
        </div>

        {/* Report user button */}
        <button
          onClick={() => onReportUser?.(otherUser.id, displayName)}
          aria-label={t('chat.report_user')}
          className="rounded-md p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-yellow-600"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </button>

        {/* Block user button */}
        <button
          onClick={() => onBlockUser?.(otherUser.id, displayName)}
          aria-label={t('chat.block_user')}
          className="rounded-md p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-red-600"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
            />
          </svg>
        </button>

        <button
          onClick={() => fetchMessages()}
          disabled={isLoading}
          aria-label={t('chat.refresh_messages')}
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
      </header>

      {/* Messages area — role="log" announces new messages to screen readers */}
      <div
        role="log"
        aria-live="polite"
        aria-label={t('conversations.title')}
        className="flex-1 overflow-y-auto px-4 py-4"
      >
        {error && (
          <div
            role="alert"
            className="mb-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {hasMore && (
          <div className="mb-4 text-center">
            <button
              onClick={handleLoadMore}
              disabled={isLoading}
              className="text-sm text-blue-600 hover:text-blue-700 disabled:opacity-50"
            >
              {isLoading ? t('common:loading') : t('chat.load_more')}
            </button>
          </div>
        )}

        {messages.length === 0 && !isLoading ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-gray-500">{t('chat.no_messages')}</p>
          </div>
        ) : (
          messages.map(msg => (
            <MessageBubble
              key={msg.id}
              message={msg}
              onDelete={msg.isOwnMessage ? handleDelete : undefined}
              onReport={
                !msg.isOwnMessage && onReportMessage
                  ? (messageId: string) => onReportMessage(messageId, otherUser.id, displayName)
                  : undefined
              }
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <footer className="border-t border-gray-200 bg-white px-4 py-3">
        <form
          onSubmit={e => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-end gap-2"
        >
          <label htmlFor="message-input" className="sr-only">
            {t('chat.message_input_label')}
          </label>
          <textarea
            id="message-input"
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('chat.placeholder')}
            rows={1}
            className="max-h-32 flex-1 resize-none rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none"
            style={{ minHeight: '38px' }}
          />
          <button
            type="submit"
            disabled={isSending || !inputText.trim()}
            className="flex-shrink-0 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t('chat.send')}
          </button>
        </form>
      </footer>
    </section>
  );
}
