'use client';

import { useTranslation } from 'react-i18next';
import type { Message } from '@/lib/types';
import { formatRelativeTime } from '@/lib/utils';

interface MessageBubbleProps {
  message: Message;
  onDelete?: (messageId: string) => void;
  onReport?: (messageId: string) => void;
}

export default function MessageBubble({ message, onDelete, onReport }: MessageBubbleProps) {
  const { t } = useTranslation('dashboard');
  const isOwn = message.isOwnMessage;
  const isQueued = message.status === 'queued';
  const isDeleted = message.messageType === 'system' && message.content === '[Message deleted]';

  return (
    <article
      className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group mb-3`}
      aria-label={isOwn ? t('chat.message_own') : t('chat.message_other')}
    >
      <div
        className={`max-w-[75%] rounded-lg px-4 py-2 ${
          isDeleted
            ? 'bg-gray-100 text-gray-400 italic'
            : isQueued
              ? 'border border-dashed border-gray-300 bg-gray-100 text-gray-500'
              : isOwn
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-900'
        }`}
      >
        <p className="text-sm break-words whitespace-pre-wrap">
          {isDeleted ? t('chat.deleted_message') : message.content}
        </p>

        <div
          className={`mt-1 flex items-center gap-2 text-xs ${
            isOwn && !isQueued && !isDeleted ? 'text-blue-200' : 'text-gray-500'
          }`}
        >
          <time dateTime={message.createdAt}>{formatRelativeTime(message.createdAt, t)}</time>

          {isOwn && !isDeleted && <span>{t(`chat.message_status.${message.status}`)}</span>}

          {isQueued && message.queuedReason && (
            <span className="flex items-center gap-1">
              <svg
                className="h-3 w-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {t(`chat.queued_reason.${message.queuedReason}`, message.queuedReason)}
            </span>
          )}
        </div>

        {/* Delete button: visible on hover AND focus for keyboard users */}
        {isOwn && !isDeleted && onDelete && (
          <button
            onClick={() => onDelete(message.id)}
            className="mt-1 text-xs text-red-400 opacity-0 transition-opacity group-hover:opacity-100 hover:text-red-600 focus:text-red-600 focus:opacity-100"
          >
            {t('chat.delete')}
          </button>
        )}

        {/* Report button on other user's messages */}
        {!isOwn && !isDeleted && onReport && (
          <button
            onClick={() => onReport(message.id)}
            aria-label={t('chat.report_message')}
            className="mt-1 text-xs text-gray-400 opacity-0 transition-opacity group-hover:opacity-100 hover:text-red-600 focus:text-red-600 focus:opacity-100"
          >
            <svg
              className="mr-1 inline-block h-3 w-3"
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
            {t('chat.report_message')}
          </button>
        )}
      </div>
    </article>
  );
}
