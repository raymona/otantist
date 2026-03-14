'use client';

import { useState, useRef, useEffect } from 'react';
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
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  // Close menu on click outside or Escape
  useEffect(() => {
    if (!menuOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        menuButtonRef.current &&
        !menuButtonRef.current.contains(e.target as Node)
      ) {
        setMenuOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [menuOpen]);

  const hasActions = onDelete || (!isOwn && onReport);

  return (
    <article
      className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group mb-3`}
      aria-label={isOwn ? t('chat.message_own') : t('chat.message_other')}
    >
      <div className="relative flex max-w-[75%] items-start gap-1">
        <div
          className={`rounded-lg px-4 py-2.5 ${
            isQueued
              ? 'border border-dashed border-gray-300 bg-gray-100 text-gray-500'
              : isOwn
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-900'
          }`}
        >
          <p className="text-base break-words whitespace-pre-wrap">{message.content}</p>

          <div
            className={`mt-1 flex items-center gap-2 text-xs ${
              isOwn && !isQueued ? 'text-blue-200' : 'text-gray-500'
            }`}
          >
            <time dateTime={message.createdAt}>{formatRelativeTime(message.createdAt, t)}</time>

            {isOwn && <span>{t(`chat.message_status.${message.status}`)}</span>}

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
        </div>

        {/* "..." action menu button */}
        {hasActions && (
          <div className="relative flex-shrink-0">
            <button
              ref={menuButtonRef}
              type="button"
              onClick={() => setMenuOpen(prev => !prev)}
              aria-label={t('status_bar.more_options')}
              aria-expanded={menuOpen}
              aria-haspopup="true"
              className={`flex h-7 w-7 items-center justify-center rounded-full text-gray-400 transition-opacity hover:bg-gray-100 hover:text-gray-600 ${
                menuOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 focus:opacity-100'
              }`}
            >
              <span aria-hidden="true" className="text-lg leading-none">
                &#x22EF;
              </span>
            </button>

            {menuOpen && (
              <div
                ref={menuRef}
                role="menu"
                className={`absolute z-50 mt-1 w-44 rounded-lg border border-gray-200 bg-white py-1 shadow-lg ${
                  isOwn ? 'right-0' : 'left-0'
                }`}
              >
                {onDelete && (
                  <button
                    role="menuitem"
                    onClick={() => {
                      setMenuOpen(false);
                      onDelete(message.id);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <svg
                      className="h-4 w-4 flex-shrink-0 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                    {t('chat.delete_for_me')}
                  </button>
                )}
                {!isOwn && onReport && (
                  <button
                    role="menuitem"
                    onClick={() => {
                      setMenuOpen(false);
                      onReport(message.id);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <svg
                      className="h-4 w-4 flex-shrink-0 text-gray-400"
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
            )}
          </div>
        )}
      </div>
    </article>
  );
}
