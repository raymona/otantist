'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { useAuthGuard } from '@/lib/use-auth-guard';
import {
  moderationApi,
  type ModerationQueueItem,
  type ModerationStats,
} from '@/lib/moderation-api';
import StatsPanel from '@/components/moderation/StatsPanel';
import QueueList from '@/components/moderation/QueueList';
import QueueItemDetail from '@/components/moderation/QueueItemDetail';

export default function ModerationPage() {
  const { t, ready: i18nReady } = useTranslation('moderation');
  const { isReady, isLoading: authLoading } = useAuthGuard('onboarded');

  const [stats, setStats] = useState<ModerationStats | null>(null);
  const [queue, setQueue] = useState<ModerationQueueItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<ModerationQueueItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  const loadData = useCallback(
    async (status?: string, priority?: string) => {
      setIsLoading(true);
      setError('');
      try {
        const [statsData, queueData] = await Promise.all([
          moderationApi.getStats(),
          moderationApi.getQueue(status || undefined, priority || undefined),
        ]);
        setStats(statsData);
        setQueue(queueData);
      } catch {
        setError(t('error_loading'));
      } finally {
        setIsLoading(false);
      }
    },
    [t]
  );

  // Load data on mount
  useEffect(() => {
    if (!isReady) return;
    loadData(statusFilter, priorityFilter);
  }, [isReady, loadData, statusFilter, priorityFilter]);

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    setSelectedItem(null);
  };

  const handlePriorityFilterChange = (value: string) => {
    setPriorityFilter(value);
    setSelectedItem(null);
  };

  const handleSelectItem = (item: ModerationQueueItem) => {
    setSelectedItem(item);
  };

  const handleResolved = (updated: ModerationQueueItem) => {
    // Update the item in the queue list
    setQueue(prev => prev.map(q => (q.id === updated.id ? updated : q)));
    setSelectedItem(updated);
    // Refresh stats
    moderationApi
      .getStats()
      .then(setStats)
      .catch(() => {});
  };

  if (authLoading || !i18nReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50" role="status">
        <p className="text-gray-600">{t('common:loading')}</p>
      </div>
    );
  }

  if (!isReady) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white px-4 py-3">
        <div className="mx-auto flex max-w-6xl items-center gap-4">
          <Link
            href="/dashboard"
            className="text-sm text-blue-600 transition-colors hover:text-blue-800"
          >
            &larr; {t('back')}
          </Link>
          <h1 className="text-xl font-semibold text-gray-900">{t('title')}</h1>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        {isLoading && (
          <div role="status" className="flex justify-center py-12">
            <p className="text-gray-600">{t('loading')}</p>
          </div>
        )}

        {error && (
          <p role="alert" className="py-12 text-center text-sm text-red-600">
            {error}
          </p>
        )}

        {!isLoading && !error && (
          <div className="space-y-6">
            {/* Stats */}
            {stats && <StatsPanel stats={stats} />}

            {/* Queue + Detail panels */}
            <div className="flex flex-col gap-6 md:flex-row">
              {/* Queue list */}
              <aside className="w-full flex-shrink-0 md:w-80">
                <h2 className="mb-3 text-sm font-semibold text-gray-900">{t('queue.title')}</h2>
                <QueueList
                  items={queue}
                  selectedId={selectedItem?.id ?? null}
                  onSelect={handleSelectItem}
                  statusFilter={statusFilter}
                  priorityFilter={priorityFilter}
                  onStatusChange={handleStatusFilterChange}
                  onPriorityChange={handlePriorityFilterChange}
                />
              </aside>

              {/* Detail panel */}
              <section className="min-w-0 flex-1 rounded-lg border border-gray-200 bg-white p-6">
                {selectedItem ? (
                  <QueueItemDetail
                    key={selectedItem.id}
                    item={selectedItem}
                    onResolved={handleResolved}
                  />
                ) : (
                  <p className="py-8 text-center text-sm text-gray-500">{t('queue.select_item')}</p>
                )}
              </section>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
