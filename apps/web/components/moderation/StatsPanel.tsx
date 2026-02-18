'use client';

import { useTranslation } from 'react-i18next';
import type { ModerationStats } from '@/lib/moderation-api';

const priorityColors: Record<string, string> = {
  low: 'bg-gray-100 text-gray-700',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800',
};

interface StatsPanelProps {
  stats: ModerationStats;
}

export default function StatsPanel({ stats }: StatsPanelProps) {
  const { t } = useTranslation('moderation');

  const cards = [
    { label: t('stats.pending'), value: stats.pending },
    { label: t('stats.reviewing'), value: stats.reviewing },
    { label: t('stats.resolved_today'), value: stats.resolvedToday },
    { label: t('stats.total_resolved'), value: stats.totalResolved },
  ];

  return (
    <section aria-labelledby="moderation-stats">
      <h2 id="moderation-stats" className="sr-only">
        {t('stats.pending')}
      </h2>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {cards.map(card => (
          <div
            key={card.label}
            className="rounded-lg border border-gray-200 bg-white p-4 text-center"
          >
            <p className="text-2xl font-bold text-gray-900">{card.value}</p>
            <p className="mt-1 text-xs text-gray-500">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-lg border border-gray-200 bg-white p-4">
        <p className="mb-2 text-xs font-medium text-gray-500">{t('stats.by_priority')}</p>
        <div className="flex flex-wrap gap-2">
          {(['low', 'medium', 'high', 'urgent'] as const).map(level => (
            <span
              key={level}
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${priorityColors[level]}`}
            >
              {t(`priority.${level}`)}: {stats.byPriority[level]}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
