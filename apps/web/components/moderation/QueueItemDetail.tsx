'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { formatRelativeTime } from '@/lib/utils';
import { moderationApi, type ModerationQueueItem, type ResolveData } from '@/lib/moderation-api';

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

export default function QueueItemDetail({ item, onResolved }: QueueItemDetailProps) {
  const { t } = useTranslation('moderation');

  const [action, setAction] = useState<ResolveData['action']>('dismissed');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const isResolved = item.status === 'resolved';

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

  const relatedContent = item.relatedContent as Record<string, unknown> | null | undefined;

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-900">{t('detail.title')}</h3>

      {/* Item metadata */}
      <dl className="mt-4 space-y-2 text-xs">
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

      {/* Related content */}
      {relatedContent && Object.keys(relatedContent).length > 0 && (
        <div className="mt-4 rounded-md border border-gray-200 bg-gray-50 p-3">
          <p className="mb-2 text-xs font-medium text-gray-500">{t('detail.related_content')}</p>
          {item.itemType === 'message' ? (
            <div className="space-y-1 text-xs">
              {'content' in relatedContent && relatedContent.content != null && (
                <div>
                  <span className="font-medium text-gray-500">{t('detail.message_content')}:</span>{' '}
                  <span className="text-gray-700">{String(relatedContent.content)}</span>
                </div>
              )}
              {'senderName' in relatedContent && relatedContent.senderName != null && (
                <div>
                  <span className="font-medium text-gray-500">{t('detail.sender')}:</span>{' '}
                  <span className="text-gray-700">{String(relatedContent.senderName)}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-1 text-xs">
              {'displayName' in relatedContent && relatedContent.displayName != null && (
                <div>
                  <span className="font-medium text-gray-500">{t('detail.user_info')}:</span>{' '}
                  <span className="text-gray-700">{String(relatedContent.displayName)}</span>
                </div>
              )}
            </div>
          )}
          {/* Fallback: show raw JSON for any unrecognized structure */}
          {!relatedContent.content && !relatedContent.senderName && !relatedContent.displayName && (
            <pre className="overflow-x-auto text-[10px] text-gray-500">
              {JSON.stringify(relatedContent, null, 2)}
            </pre>
          )}
        </div>
      )}

      {/* Resolved info */}
      {isResolved && (
        <div className="mt-4 rounded-md border border-green-200 bg-green-50 p-3">
          {item.actionTaken && (
            <div className="text-xs">
              <span className="font-medium text-gray-500">{t('detail.action_taken')}:</span>{' '}
              <span className="font-medium text-green-800">
                {t(`resolve.action_${item.actionTaken}`)}
              </span>
            </div>
          )}
          {item.resolutionNotes && (
            <div className="mt-1 text-xs">
              <span className="font-medium text-gray-500">{t('detail.resolution_notes')}:</span>{' '}
              <span className="text-gray-700">{item.resolutionNotes}</span>
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
        </div>
      )}

      {/* Resolution form */}
      {!isResolved && (
        <div className="mt-6 border-t border-gray-200 pt-4">
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
        </div>
      )}
    </div>
  );
}
