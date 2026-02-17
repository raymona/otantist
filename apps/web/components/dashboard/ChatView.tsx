'use client';

import { useState, useEffect, useRef, KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { messagingApi } from '@/lib/messaging-api';
import type { Conversation, Message } from '@/lib/types';
import MessageBubble from './MessageBubble';
import HowToTalkToMeModal from './HowToTalkToMeModal';

interface ChatViewProps {
  conversation: Conversation;
  messages: Message[];
  hasMore: boolean;
  onLoadMessages: (conversationId: string, before?: string) => Promise<void>;
  onBack: () => void;
  onConversationUpdated?: () => void;
  onBlockUser?: (userId: string, userName: string) => void;
  onReportUser?: (userId: string, userName: string) => void;
  onReportMessage?: (messageId: string, userId: string, userName: string) => void;
  onHideConversation?: (conversationId: string) => void;
  isConnected: boolean;
  onSendViaSocket?: (conversationId: string, content: string, tempId: string) => void;
  onEmitTyping?: (conversationId: string) => void;
  onEmitRead?: (conversationId: string, messageId: string) => void;
  typingUser: { displayName: string } | null;
}

export default function ChatView({
  conversation,
  messages,
  hasMore,
  onLoadMessages,
  onBack,
  onConversationUpdated,
  onBlockUser,
  onReportUser,
  onReportMessage,
  onHideConversation,
  isConnected,
  onSendViaSocket,
  onEmitTyping,
  onEmitRead,
  typingUser,
}: ChatViewProps) {
  const { t } = useTranslation('dashboard');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [inputText, setInputText] = useState('');
  const [error, setError] = useState('');
  const [showGuide, setShowGuide] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const guideButtonRef = useRef<HTMLButtonElement>(null);
  const lastTypingEmitRef = useRef<number>(0);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Load messages on mount
  useEffect(() => {
    setIsLoading(true);
    onLoadMessages(conversation.id).finally(() => setIsLoading(false));
  }, [conversation.id, onLoadMessages]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages.length]);

  // Mark as read when opening conversation with unread messages
  const hasMarkedReadRef = useRef(false);
  useEffect(() => {
    hasMarkedReadRef.current = false;
  }, [conversation.id]);

  useEffect(() => {
    if (hasMarkedReadRef.current || messages.length === 0) return;

    // Find the last message from the other user (not our own)
    const lastIncoming = [...messages].reverse().find(m => !m.isOwnMessage);
    if (!lastIncoming) return;

    hasMarkedReadRef.current = true;
    if (isConnected && onEmitRead) {
      onEmitRead(conversation.id, lastIncoming.id);
    } else {
      messagingApi.markAsRead(conversation.id, lastIncoming.id).catch(() => {});
    }
  }, [conversation.id, messages, isConnected, onEmitRead]);

  const handleLoadMore = async () => {
    if (messages.length > 0 && hasMore) {
      setIsLoading(true);
      try {
        await onLoadMessages(conversation.id, messages[0].id);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || isSending) return;

    setError('');

    if (isConnected && onSendViaSocket) {
      // Socket path: emit to server, which echoes back via onNewMessage with tempId for dedup
      const tempId = crypto.randomUUID();
      onSendViaSocket(conversation.id, text, tempId);
      setInputText('');
    } else {
      // REST fallback
      setIsSending(true);
      try {
        await messagingApi.sendMessage(conversation.id, text);
        setInputText('');
        // Reload messages via REST since we don't have socket
        await onLoadMessages(conversation.id);
        onConversationUpdated?.();
      } catch {
        setError(t('errors.send_message'));
      } finally {
        setIsSending(false);
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (value: string) => {
    setInputText(value);

    // Emit typing event (debounced to ~2s)
    if (isConnected && onEmitTyping) {
      const now = Date.now();
      if (now - lastTypingEmitRef.current > 2000) {
        lastTypingEmitRef.current = now;
        onEmitTyping(conversation.id);
      }
    }
  };

  const handleDelete = async (messageId: string) => {
    try {
      await messagingApi.deleteMessage(messageId);
      // Parent controls messages, so we need to reload
      await onLoadMessages(conversation.id);
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
          title={t('chat.back_to_list')}
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
            title={otherUser.isOnline ? t('conversations.online') : t('conversations.offline')}
            className={`h-2.5 w-2.5 flex-shrink-0 rounded-full ${
              otherUser.isOnline ? 'bg-green-500' : 'bg-gray-300'
            }`}
          />
          <span className="truncate font-medium text-gray-900">{displayName}</span>

          <button
            ref={guideButtonRef}
            onClick={() => setShowGuide(true)}
            aria-label={t('chat.view_guide', { name: displayName })}
            title={t('chat.view_guide', { name: displayName })}
            className="flex-shrink-0 rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-blue-600"
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
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </button>

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

        {/* Hide conversation button */}
        {onHideConversation && (
          <button
            onClick={() => onHideConversation(conversation.id)}
            aria-label={t('chat.hide_conversation')}
            title={t('chat.hide_conversation')}
            className="rounded-md p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
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
                d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L6.59 6.59m7.532 7.532l3.29 3.29M3 3l18 18"
              />
            </svg>
          </button>
        )}

        {/* Report user button */}
        <button
          onClick={() => onReportUser?.(otherUser.id, displayName)}
          aria-label={t('chat.report_user')}
          title={t('chat.report_user')}
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
          title={t('chat.block_user')}
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
          onClick={() => {
            setIsLoading(true);
            onLoadMessages(conversation.id).finally(() => setIsLoading(false));
          }}
          disabled={isLoading}
          aria-label={t('chat.refresh_messages')}
          title={t('chat.refresh_messages')}
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
              onDelete={handleDelete}
              onReport={
                !msg.isOwnMessage && onReportMessage
                  ? (messageId: string) => onReportMessage(messageId, otherUser.id, displayName)
                  : undefined
              }
            />
          ))
        )}

        {/* Typing indicator */}
        {typingUser && (
          <div className="mt-2 text-xs text-gray-500" role="status" aria-live="polite">
            {t('chat.typing', { name: typingUser.displayName })}
          </div>
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
            onChange={e => handleInputChange(e.target.value)}
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

      <HowToTalkToMeModal
        isOpen={showGuide}
        userId={otherUser.id}
        userName={displayName}
        onClose={() => {
          setShowGuide(false);
          guideButtonRef.current?.focus();
        }}
      />
    </section>
  );
}
