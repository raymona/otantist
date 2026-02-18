'use client';

import { useTranslation } from 'react-i18next';
import { formatRelativeTime } from '@/lib/utils';
import type { ModerationQueueItem } from '@/lib/moderation-api';

const priorityColors: Record<string, string> = {
  low: 'bg-gray-100 text-gray-700',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800',
};

interface QueueListProps {
  items: ModerationQueueItem[];
  selectedId: string | null;
  onSelect: (item: ModerationQueueItem) => void;
  statusFilter: string;
  priorityFilter: string;
  onStatusChange: (status: string) => void;
  onPriorityChange: (priority: string) => void;
}

export default function QueueList({
  items,
  selectedId,
  onSelect,
  statusFilter,
  priorityFilter,
  onStatusChange,
  onPriorityChange,
}: QueueListProps) {
  const { t } = useTranslation('moderation');

  return (
    <div>
      {/* Filter controls */}
      <div className="mb-3 flex gap-2">
        <div>
          <label htmlFor="filter-status" className="sr-only">
            {t('filter.status')}
          </label>
          <select
            id="filter-status"
            value={statusFilter}
            onChange={e => onStatusChange(e.target.value)}
            className="rounded-md border border-gray-300 px-2 py-1.5 text-xs text-gray-700"
          >
            <option value="">{t('filter.all_statuses')}</option>
            <option value="pending">{t('status.pending')}</option>
            <option value="reviewing">{t('status.reviewing')}</option>
            <option value="resolved">{t('status.resolved')}</option>
          </select>
        </div>
        <div>
          <label htmlFor="filter-priority" className="sr-only">
            {t('filter.priority')}
          </label>
          <select
            id="filter-priority"
            value={priorityFilter}
            onChange={e => onPriorityChange(e.target.value)}
            className="rounded-md border border-gray-300 px-2 py-1.5 text-xs text-gray-700"
          >
            <option value="">{t('filter.all_priorities')}</option>
            <option value="low">{t('priority.low')}</option>
            <option value="medium">{t('priority.medium')}</option>
            <option value="high">{t('priority.high')}</option>
            <option value="urgent">{t('priority.urgent')}</option>
          </select>
        </div>
      </div>

      {/* Queue list */}
      {items.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-sm font-medium text-gray-600">{t('queue.empty')}</p>
          <p className="mt-1 text-xs text-gray-400">{t('queue.empty_hint')}</p>
        </div>
      ) : (
        <ul role="listbox" aria-label={t('queue.title')} className="space-y-1">
          {items.map(item => (
            <li
              key={item.id}
              role="option"
              aria-selected={item.id === selectedId}
              onClick={() => onSelect(item)}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelect(item);
                }
              }}
              tabIndex={0}
              className={`cursor-pointer rounded-md border p-3 transition-colors ${
                item.id === selectedId
                  ? 'border-blue-400 bg-blue-50'
                  : 'border-gray-200 bg-white hover:bg-gray-50'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    {/* Item type icon */}
                    <span
                      className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded bg-gray-100 text-[10px] text-gray-500"
                      aria-hidden="true"
                    >
                      {item.itemType === 'message' ? 'M' : 'U'}
                    </span>
                    <span className="text-xs font-medium text-gray-900">
                      {t(`item_type.${item.itemType}`)}
                    </span>
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${priorityColors[item.priority]}`}
                    >
                      {t(`priority.${item.priority}`)}
                    </span>
                  </div>
                  {item.flagReason && (
                    <p className="mt-1 truncate text-xs text-gray-600">{item.flagReason}</p>
                  )}
                  <div className="mt-1 flex items-center gap-2 text-[10px] text-gray-400">
                    <span>{t(`flagged_by.${item.flaggedBy}`)}</span>
                    <span aria-hidden="true">&middot;</span>
                    <time dateTime={item.createdAt}>{formatRelativeTime(item.createdAt, t)}</time>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
