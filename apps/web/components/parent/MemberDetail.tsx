'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  parentApi,
  type ManagedMember,
  type MemberIndicator,
  type ParentAlert,
} from '@/lib/parent-api';
import AlertItem from './AlertItem';

interface MemberDetailProps {
  member: ManagedMember;
}

export default function MemberDetail({ member }: MemberDetailProps) {
  const { t, i18n } = useTranslation('parent');
  const [indicators, setIndicators] = useState<MemberIndicator[]>([]);
  const [alerts, setAlerts] = useState<ParentAlert[]>([]);
  const [loadingIndicators, setLoadingIndicators] = useState(false);
  const [loadingAlerts, setLoadingAlerts] = useState(false);
  const [errorIndicators, setErrorIndicators] = useState('');
  const [errorAlerts, setErrorAlerts] = useState('');

  const userId = member.member.userId;
  const displayName = member.member.displayName || userId.slice(0, 8);

  // Fetch indicators + alerts when member changes
  useEffect(() => {
    setLoadingIndicators(true);
    setLoadingAlerts(true);
    setErrorIndicators('');
    setErrorAlerts('');

    parentApi
      .getMemberIndicators(userId)
      .then(setIndicators)
      .catch(() => setErrorIndicators(t('errors.load_indicators')))
      .finally(() => setLoadingIndicators(false));

    parentApi
      .getMemberAlerts(userId)
      .then(setAlerts)
      .catch(() => setErrorAlerts(t('errors.load_alerts')))
      .finally(() => setLoadingAlerts(false));
  }, [userId, t]);

  const handleAcknowledge = async (alertId: string) => {
    try {
      const updated = await parentApi.acknowledgeAlert(userId, alertId);
      setAlerts(prev => prev.map(a => (a.id === alertId ? updated : a)));
    } catch {
      // Alert-level error is non-critical; the button resets via AlertItem
    }
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString(i18n.language, {
      month: 'short',
      day: 'numeric',
    });

  return (
    <div>
      <h2 className="mb-6 text-lg font-semibold text-gray-900">{displayName}</h2>

      {/* Activity indicators */}
      <section aria-labelledby="indicators-title" className="mb-8">
        <h3
          id="indicators-title"
          className="mb-3 text-sm font-semibold tracking-wide text-gray-500 uppercase"
        >
          {t('indicators.title')}
        </h3>

        {loadingIndicators && (
          <div role="status" className="py-4 text-center">
            <p className="text-sm text-gray-500">{t('common:loading')}</p>
          </div>
        )}

        {errorIndicators && (
          <p role="alert" className="text-sm text-red-600">
            {errorIndicators}
          </p>
        )}

        {!loadingIndicators && !errorIndicators && indicators.length === 0 && (
          <p className="text-sm text-gray-500">{t('indicators.no_indicators')}</p>
        )}

        {!loadingIndicators && indicators.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="pr-4 pb-2 font-medium text-gray-600">{t('indicators.date')}</th>
                  <th className="pr-4 pb-2 font-medium text-gray-600">
                    {t('indicators.energy_avg')}
                  </th>
                  <th className="pr-4 pb-2 font-medium text-gray-600">
                    {t('indicators.calm_mode_minutes')}
                  </th>
                  <th className="pr-4 pb-2 font-medium text-gray-600">
                    {t('indicators.messages_sent')}
                  </th>
                  <th className="pb-2 font-medium text-gray-600">
                    {t('indicators.messages_received')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {indicators.map((ind, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    <td className="py-2 pr-4 text-gray-900">
                      <time dateTime={ind.recordedAt}>{formatDate(ind.recordedAt)}</time>
                    </td>
                    <td className="py-2 pr-4 text-gray-700">{ind.socialEnergyAvg || '—'}</td>
                    <td className="py-2 pr-4 text-gray-700">{ind.calmModeMinutes}</td>
                    <td className="py-2 pr-4 text-gray-700">{ind.messagesSent}</td>
                    <td className="py-2 text-gray-700">{ind.messagesReceived}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Alerts */}
      <section aria-labelledby="alerts-title">
        <h3
          id="alerts-title"
          className="mb-3 text-sm font-semibold tracking-wide text-gray-500 uppercase"
        >
          {t('alerts.title')}
        </h3>

        {loadingAlerts && (
          <div role="status" className="py-4 text-center">
            <p className="text-sm text-gray-500">{t('common:loading')}</p>
          </div>
        )}

        {errorAlerts && (
          <p role="alert" className="text-sm text-red-600">
            {errorAlerts}
          </p>
        )}

        {!loadingAlerts && !errorAlerts && alerts.length === 0 && (
          <p className="text-sm text-gray-500">{t('alerts.no_alerts')}</p>
        )}

        {!loadingAlerts && alerts.length > 0 && (
          <div className="space-y-3">
            {alerts.map(alert => (
              <AlertItem key={alert.id} alert={alert} onAcknowledge={handleAcknowledge} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
