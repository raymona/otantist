'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ParentAlert } from '@/lib/parent-api';

interface AlertItemProps {
  alert: ParentAlert;
  onAcknowledge: (alertId: string) => Promise<void>;
}

const severityColors: Record<string, string> = {
  info: 'bg-blue-100 text-blue-800 border-blue-200',
  warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  urgent: 'bg-red-100 text-red-800 border-red-200',
};

const severityBadgeColors: Record<string, string> = {
  info: 'bg-blue-200 text-blue-900',
  warning: 'bg-yellow-200 text-yellow-900',
  urgent: 'bg-red-200 text-red-900',
};

export default function AlertItem({ alert, onAcknowledge }: AlertItemProps) {
  const { t, i18n } = useTranslation('parent');
  const [isAcknowledging, setIsAcknowledging] = useState(false);

  const message = i18n.language === 'fr' ? alert.messageFr : alert.messageEn;
  const severityKey = `alerts.severity_${alert.severity}`;
  const dateStr = new Date(alert.createdAt).toLocaleDateString(i18n.language, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const handleAcknowledge = async () => {
    setIsAcknowledging(true);
    try {
      await onAcknowledge(alert.id);
    } finally {
      setIsAcknowledging(false);
    }
  };

  return (
    <article
      className={`rounded-md border p-3 ${severityColors[alert.severity] || 'border-gray-200 bg-gray-50'}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                severityBadgeColors[alert.severity] || 'bg-gray-200 text-gray-800'
              }`}
            >
              {t(severityKey)}
            </span>
            <time className="text-xs text-gray-600" dateTime={alert.createdAt}>
              {dateStr}
            </time>
          </div>
          <p className="text-sm">{message}</p>
        </div>

        <div className="flex-shrink-0">
          {alert.acknowledged ? (
            <div className="flex items-center gap-1 text-xs text-gray-600">
              <span aria-hidden="true" className="text-green-600">
                &#10003;
              </span>
              <span>{t('alerts.acknowledged')}</span>
            </div>
          ) : (
            <button
              onClick={handleAcknowledge}
              disabled={isAcknowledging}
              className="rounded-md bg-white px-3 py-1 text-xs font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 disabled:opacity-50"
            >
              {isAcknowledging ? t('alerts.acknowledging') : t('alerts.acknowledge')}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
