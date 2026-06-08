'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { formatRelativeTime } from '@/lib/utils';
import {
  moderationApi,
  type ModerationQueueItem,
  type MessageRelatedContent,
  type UserRelatedContent,
  type ResolveData,
} from '@/lib/moderation-api';

const ACTIONS = ['dismissed', 'warned', 'removed', 'suspended'] as const;

const priorityColors: Record<string, string> = {
  low: 'bg-gray-100 text-gray-700',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800',
};

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  reviewing: 'bg-blue-100 text-blue-800',
  resolved: 'bg-green-100 text-green-800',
};

interface QueueItemDetailProps {
  item: ModerationQueueItem;
  onResolved: (updated: ModerationQueueItem) => void;
}

function isMessageContent(rc: unknown): rc is MessageRelatedContent {
  return rc != null && typeof rc === 'object' && 'sender' in rc && 'conversation' in rc;
}

function isUserContent(rc: unknown): rc is UserRelatedContent {
  return rc != null && typeof rc === 'object' && 'memberSince' in rc && 'accountType' in rc;
}

export default function QueueItemDetail({ item, onResolved }: QueueItemDetailProps) {
  const { t } = useTranslation('moderation');

  const [action, setAction] = useState<ResolveData['action']>('dismissed');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const isResolved = item.status === 'resolved';
  const rc = item.relatedContent;
  const msgContent = isMessageContent(rc) ? rc : null;
  const userContent = isUserContent(rc) ? rc : null;

  const handleResolve = async () => {
    setIsSaving(true);
    setStatus(null);
    try {
      const updated = await moderationApi.resolveQueueItem(item.id, {
        action,
        notes: notes || undefined,
      });
      setStatus({ type: 'success', message: t('resolve.success') });
      onResolved(updated);
    } catch {
      setStatus({ type: 'error', message: t('resolve.error') });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header: badges */}
      <section aria-label={t('detail.title')}>
        <h3 className="text-sm font-semibold text-gray-900">{t('detail.title')}</h3>
        <dl className="mt-3 space-y-2 text-xs">
          <div className="flex gap-2">
            <dt className="font-medium text-gray-500">{t('filter.status')}:</dt>
            <dd>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${statusColors[item.status] || ''}`}
              >
                {t(`status.${item.status}`)}
              </span>
            </dd>
          </div>
          <div className="flex gap-2">
            <dt className="font-medium text-gray-500">{t('filter.priority')}:</dt>
            <dd>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${priorityColors[item.priority] || ''}`}
              >
                {t(`priority.${item.priority}`)}
              </span>
            </dd>
          </div>
          <div className="flex gap-2">
            <dt className="font-medium text-gray-500">{t('queue.source')}:</dt>
            <dd className="text-gray-700">{t(`flagged_by.${item.flaggedBy}`)}</dd>
          </div>
          {item.flagReason && (
            <div className="flex gap-2">
              <dt className="font-medium text-gray-500">{t('queue.flag_reason')}:</dt>
              <dd className="text-gray-700">{item.flagReason}</dd>
            </div>
          )}
          {item.aiConfidence != null && (
            <div className="flex gap-2">
              <dt className="font-medium text-gray-500">{t('queue.ai_confidence')}:</dt>
              <dd className="text-gray-700">{Math.round(item.aiConfidence * 100)}%</dd>
            </div>
          )}
          <div className="flex gap-2">
            <dt className="font-medium text-gray-500">{t('queue.flagged_at')}:</dt>
            <dd className="text-gray-700">
              <time dateTime={item.createdAt}>{formatRelativeTime(item.createdAt, t)}</time>
            </dd>
          </div>
        </dl>
      </section>

      {/* Minor alert banner */}
      {((msgContent && msgContent.sender.accountType === 'parent_managed') ||
        (userContent && userContent.accountType === 'parent_managed')) && (
        <div
          role="alert"
          className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800"
        >
          {t('detail.is_minor')}
        </div>
      )}

      {/* ── MESSAGE-TYPE DETAIL ── */}
      {item.itemType === 'message' && msgContent && (
        <>
          {/* Sender info */}
          <section aria-label={t('detail.sender')}>
            <h4 className="text-xs font-semibold text-gray-900">{t('detail.sender')}</h4>
            <dl className="mt-2 space-y-1 text-xs">
              <div className="flex gap-2">
                <dt className="font-medium text-gray-500">{t('detail.sender')}:</dt>
                <dd className="text-gray-700">{msgContent.sender.displayName || '—'}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="font-medium text-gray-500">{t('detail.account_type')}:</dt>
                <dd className="text-gray-700">
                  {t(`account_type.${msgContent.sender.accountType}`)}
                </dd>
              </div>
              <div className="flex gap-2">
                <dt className="font-medium text-gray-500">{t('detail.warning_count')}:</dt>
                <dd
                  className={
                    msgContent.sender.warningCount > 0
                      ? 'font-medium text-red-600'
                      : 'text-gray-700'
                  }
                >
                  {msgContent.sender.warningCount}
                </dd>
              </div>
              <div className="flex gap-2">
                <dt className="font-medium text-gray-500">{t('detail.other_participant')}:</dt>
                <dd className="text-gray-700">
                  {msgContent.conversation.otherParticipant.displayName || '—'}
                  {msgContent.conversation.otherParticipant.accountType === 'parent_managed' && (
                    <span className="ml-1 text-amber-600">
                      ({t('account_type.parent_managed')})
                    </span>
                  )}
                </dd>
              </div>
            </dl>
          </section>

          {/* Conversation context */}
          <section aria-label={t('detail.conversation_context')}>
            <h4 className="text-xs font-semibold text-gray-900">
              {t('detail.conversation_context')}
            </h4>
            <div className="mt-2 rounded-md border border-gray-200 bg-gray-50 p-3">
              <ol className="space-y-2">
                {msgContent.surroundingMessages.length > 0 &&
                  msgContent.surroundingMessages.map(msg => (
                    <li
                      key={msg.id}
                      className={`rounded px-2 py-1 text-xs ${msg.isFlagged ? 'border border-red-200 bg-red-50' : ''}`}
                    >
                      <span className="font-medium text-gray-600">{msg.senderName || '—'}:</span>{' '}
                      <span className="text-gray-700">{msg.content}</span>
                      <time dateTime={msg.createdAt} className="ml-2 text-[10px] text-gray-400">
                        {formatRelativeTime(msg.createdAt, t)}
                      </time>
                    </li>
                  ))}
                {/* The flagged message itself */}
                <li className="rounded border-2 border-red-300 bg-red-50 px-2 py-1.5 text-xs">
                  <span className="mr-1 rounded bg-red-200 px-1 py-0.5 text-[10px] font-semibold text-red-800">
                    {t('detail.flagged_message')}
                  </span>
                  <span className="font-medium text-gray-600">
                    {msgContent.sender.displayName || '—'}:
                  </span>{' '}
                  <span className="text-gray-900">
                    {item.originalContent || msgContent.content}
                  </span>
                  <time dateTime={msgContent.sentAt} className="ml-2 text-[10px] text-gray-400">
                    {formatRelativeTime(msgContent.sentAt, t)}
                  </time>
                </li>
              </ol>
            </div>
          </section>

          {/* Reports */}
          <section aria-label={t('detail.reports')}>
            <h4 className="text-xs font-semibold text-gray-900">{t('detail.reports')}</h4>
            {msgContent.reports.length > 0 ? (
              <ul className="mt-2 space-y-2">
                {msgContent.reports.map(report => (
                  <li
                    key={report.id}
                    className="rounded-md border border-gray-200 bg-gray-50 p-2 text-xs"
                  >
                    <dl className="space-y-1">
                      <div className="flex gap-2">
                        <dt className="font-medium text-gray-500">{t('detail.reporter')}:</dt>
                        <dd className="text-gray-700">{report.reporterName || '—'}</dd>
                      </div>
                      <div className="flex gap-2">
                        <dt className="font-medium text-gray-500">{t('detail.report_reason')}:</dt>
                        <dd className="text-gray-700">
                          {t(`report_reason.${report.reason}`, report.reason)}
                        </dd>
                      </div>
                      {report.description && (
                        <div className="flex gap-2">
                          <dt className="font-medium text-gray-500">
                            {t('detail.report_description')}:
                          </dt>
                          <dd className="text-gray-700">{report.description}</dd>
                        </div>
                      )}
                      <div className="flex gap-2">
                        <dt className="font-medium text-gray-500">{t('detail.report_date')}:</dt>
                        <dd className="text-gray-700">
                          <time dateTime={report.createdAt}>
                            {formatRelativeTime(report.createdAt, t)}
                          </time>
                        </dd>
                      </div>
                    </dl>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-xs text-gray-400">{t('detail.no_reports')}</p>
            )}
          </section>
        </>
      )}

      {/* ── USER-TYPE DETAIL ── */}
      {item.itemType === 'user' && userContent && (
        <>
          {/* User profile */}
          <section aria-label={t('detail.user_info')}>
            <h4 className="text-xs font-semibold text-gray-900">{t('detail.user_info')}</h4>
            <dl className="mt-2 space-y-1 text-xs">
              <div className="flex gap-2">
                <dt className="font-medium text-gray-500">{t('detail.sender')}:</dt>
                <dd className="text-gray-700">{userContent.displayName || '—'}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="font-medium text-gray-500">{t('detail.email')}:</dt>
                <dd className="text-gray-700">{userContent.email}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="font-medium text-gray-500">{t('detail.account_type')}:</dt>
                <dd className="text-gray-700">{t(`account_type.${userContent.accountType}`)}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="font-medium text-gray-500">{t('detail.account_status')}:</dt>
                <dd className="text-gray-700">{userContent.accountStatus}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="font-medium text-gray-500">{t('detail.warning_count')}:</dt>
                <dd
                  className={
                    userContent.warningCount > 0 ? 'font-medium text-red-600' : 'text-gray-700'
                  }
                >
                  {userContent.warningCount}
                </dd>
              </div>
              <div className="flex gap-2">
                <dt className="font-medium text-gray-500">{t('detail.member_since')}:</dt>
                <dd className="text-gray-700">
                  <time dateTime={userContent.memberSince}>
                    {formatRelativeTime(userContent.memberSince, t)}
                  </time>
                </dd>
              </div>
            </dl>
          </section>

          {/* Reports against user */}
          <section aria-label={t('detail.reports')}>
            <h4 className="text-xs font-semibold text-gray-900">{t('detail.reports')}</h4>
            {userContent.reports.length > 0 ? (
              <ul className="mt-2 space-y-2">
                {userContent.reports.map(report => (
                  <li
                    key={report.id}
                    className="rounded-md border border-gray-200 bg-gray-50 p-2 text-xs"
                  >
                    <dl className="space-y-1">
                      <div className="flex gap-2">
                        <dt className="font-medium text-gray-500">{t('detail.reporter')}:</dt>
                        <dd className="text-gray-700">{report.reporterName || '—'}</dd>
                      </div>
                      <div className="flex gap-2">
                        <dt className="font-medium text-gray-500">{t('detail.report_reason')}:</dt>
                        <dd className="text-gray-700">
                          {t(`report_reason.${report.reason}`, report.reason)}
                        </dd>
                      </div>
                      {report.description && (
                        <div className="flex gap-2">
                          <dt className="font-medium text-gray-500">
                            {t('detail.report_description')}:
                          </dt>
                          <dd className="text-gray-700">{report.description}</dd>
                        </div>
                      )}
                      <div className="flex gap-2">
                        <dt className="font-medium text-gray-500">{t('detail.report_date')}:</dt>
                        <dd className="text-gray-700">
                          <time dateTime={report.createdAt}>
                            {formatRelativeTime(report.createdAt, t)}
                          </time>
                        </dd>
                      </div>
                    </dl>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-xs text-gray-400">{t('detail.no_reports')}</p>
            )}
          </section>

          {/* Moderation history */}
          <section aria-label={t('detail.moderation_history')}>
            <h4 className="text-xs font-semibold text-gray-900">
              {t('detail.moderation_history')}
            </h4>
            {userContent.moderationHistory.length > 0 ? (
              <ul className="mt-2 space-y-1">
                {userContent.moderationHistory.map(h => (
                  <li
                    key={h.id}
                    className="flex items-center gap-2 rounded-md border border-gray-200 bg-gray-50 px-2 py-1.5 text-xs"
                  >
                    <span className="font-medium text-gray-700">
                      {h.actionTaken ? t(`resolve.action_${h.actionTaken}`) : '—'}
                    </span>
                    {h.flagReason && (
                      <span className="truncate text-gray-500">&mdash; {h.flagReason}</span>
                    )}
                    {h.resolvedAt && (
                      <time dateTime={h.resolvedAt} className="ml-auto text-[10px] text-gray-400">
                        {formatRelativeTime(h.resolvedAt, t)}
                      </time>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-xs text-gray-400">{t('detail.no_history')}</p>
            )}
          </section>
        </>
      )}

      {/* Resolved info */}
      {isResolved && (
        <section
          aria-label={t('detail.action_taken')}
          className="rounded-md border border-green-200 bg-green-50 p-3"
        >
          {item.actionTaken && (
            <div className="text-xs">
              <span className="font-medium text-gray-500">{t('detail.action_taken')}:</span>{' '}
              <span className="font-medium text-green-800">
                {t(`resolve.action_${item.actionTaken}`)}
              </span>
            </div>
          )}
          {item.originalContent && (
            <div className="mt-1 text-xs">
              <span className="font-medium text-gray-500">{t('detail.original_content')}:</span>{' '}
              <span className="text-gray-700 italic">&ldquo;{item.originalContent}&rdquo;</span>
            </div>
          )}
          {item.resolutionNotes && (
            <div className="mt-1 text-xs">
              <span className="font-medium text-gray-500">{t('detail.resolution_notes')}:</span>{' '}
              <span className="text-gray-700">{item.resolutionNotes}</span>
            </div>
          )}
          {item.reviewerEmail && (
            <div className="mt-1 text-xs">
              <span className="font-medium text-gray-500">{t('detail.reviewed_by')}:</span>{' '}
              <span className="text-gray-700">{item.reviewerEmail}</span>
            </div>
          )}
          {item.resolvedAt && (
            <div className="mt-1 text-xs">
              <span className="font-medium text-gray-500">{t('queue.resolved_at')}:</span>{' '}
              <time dateTime={item.resolvedAt} className="text-gray-700">
                {formatRelativeTime(item.resolvedAt, t)}
              </time>
            </div>
          )}
        </section>
      )}

      {/* Resolution form */}
      {!isResolved && (
        <section className="border-t border-gray-200 pt-4" aria-label={t('resolve.title')}>
          <h4 className="text-xs font-semibold text-gray-900">{t('resolve.title')}</h4>

          <fieldset className="mt-3">
            <legend className="text-xs font-medium text-gray-600">
              {t('resolve.action_label')}
            </legend>
            <div className="mt-1 space-y-1">
              {ACTIONS.map(a => (
                <label key={a} className="flex cursor-pointer items-center gap-2">
                  <input
                    type="radio"
                    name="resolve-action"
                    value={a}
                    checked={action === a}
                    onChange={() => setAction(a)}
                    className="h-3.5 w-3.5 text-blue-600"
                  />
                  <span className="text-xs text-gray-700">{t(`resolve.action_${a}`)}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="mt-3">
            <label htmlFor="resolve-notes" className="text-xs font-medium text-gray-600">
              {t('resolve.notes_label')}
            </label>
            <textarea
              id="resolve-notes"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              maxLength={1000}
              rows={3}
              placeholder={t('resolve.notes_placeholder')}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-xs text-gray-700 placeholder:text-gray-400"
            />
          </div>

          <div className="mt-3 flex items-center gap-3">
            <button
              onClick={handleResolve}
              disabled={isSaving}
              className="rounded-md bg-blue-600 px-4 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving ? t('resolve.saving') : t('resolve.save')}
            </button>
            {status && (
              <p
                role={status.type === 'error' ? 'alert' : 'status'}
                className={`text-xs ${status.type === 'success' ? 'text-green-600' : 'text-red-600'}`}
              >
                {status.message}
              </p>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
