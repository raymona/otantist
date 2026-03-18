import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRoute } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ParentStackParamList } from '../../navigation/types';
import { parentApi, type MemberIndicator, type ParentAlert } from '../../lib/api/parent';

type RouteProp = NativeStackScreenProps<ParentStackParamList, 'ParentMemberDetail'>['route'];

const SEVERITY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  info: { bg: '#dbeafe', text: '#1e40af', border: '#bfdbfe' },
  warning: { bg: '#fef3c7', text: '#92400e', border: '#fde68a' },
  urgent: { bg: '#fee2e2', text: '#991b1b', border: '#fecaca' },
};

const SEVERITY_BADGE: Record<string, { bg: string; text: string }> = {
  info: { bg: '#bfdbfe', text: '#1e3a5f' },
  warning: { bg: '#fde68a', text: '#78350f' },
  urgent: { bg: '#fecaca', text: '#7f1d1d' },
};

export function ParentMemberDetailScreen() {
  const { t, i18n } = useTranslation('parent');
  const route = useRoute<RouteProp>();
  const { userId } = route.params;

  const [indicators, setIndicators] = useState<MemberIndicator[]>([]);
  const [alerts, setAlerts] = useState<ParentAlert[]>([]);
  const [loadingIndicators, setLoadingIndicators] = useState(true);
  const [loadingAlerts, setLoadingAlerts] = useState(true);
  const [errorIndicators, setErrorIndicators] = useState('');
  const [errorAlerts, setErrorAlerts] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [acknowledgingId, setAcknowledgingId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setErrorIndicators('');
    setErrorAlerts('');

    const indicatorPromise = parentApi
      .getMemberIndicators(userId)
      .then(setIndicators)
      .catch(() => setErrorIndicators(t('errors.load_indicators')))
      .finally(() => setLoadingIndicators(false));

    const alertPromise = parentApi
      .getMemberAlerts(userId)
      .then(setAlerts)
      .catch(() => setErrorAlerts(t('errors.load_alerts')))
      .finally(() => setLoadingAlerts(false));

    await Promise.all([indicatorPromise, alertPromise]);
  }, [userId, t]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    setLoadingIndicators(true);
    setLoadingAlerts(true);
    await loadData();
    setIsRefreshing(false);
  }, [loadData]);

  const handleAcknowledge = async (alertId: string) => {
    setAcknowledgingId(alertId);
    try {
      const updated = await parentApi.acknowledgeAlert(userId, alertId);
      setAlerts(prev => prev.map(a => (a.id === alertId ? updated : a)));
    } catch {
      // Non-critical — alert stays unacknowledged
    } finally {
      setAcknowledgingId(null);
    }
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString(i18n.language, {
      month: 'short',
      day: 'numeric',
    });

  const formatDateTime = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString(i18n.language, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const renderIndicators = () => {
    if (loadingIndicators) {
      return (
        <View style={styles.loadingSection} accessibilityRole="progressbar">
          <ActivityIndicator size="small" />
        </View>
      );
    }
    if (errorIndicators) {
      return (
        <Text style={styles.errorText} accessibilityRole="alert">
          {errorIndicators}
        </Text>
      );
    }
    if (indicators.length === 0) {
      return <Text style={styles.emptyText}>{t('indicators.no_indicators')}</Text>;
    }

    return (
      <View>
        {/* Column headers */}
        <View style={styles.indicatorHeaderRow}>
          <Text style={[styles.indicatorHeaderCell, { flex: 1 }]}>{t('indicators.date')}</Text>
          <Text style={styles.indicatorHeaderCell}>{t('indicators.energy_avg')}</Text>
          <Text style={styles.indicatorHeaderCell}>{t('indicators.calm_mode_minutes')}</Text>
          <Text style={styles.indicatorHeaderCell}>{t('indicators.messages_sent')}</Text>
          <Text style={styles.indicatorHeaderCell}>{t('indicators.messages_received')}</Text>
        </View>
        {indicators.map((ind, i) => (
          <View key={i} style={styles.indicatorRow}>
            <Text style={[styles.indicatorCell, { flex: 1, color: '#111827' }]}>
              {formatDate(ind.recordedAt)}
            </Text>
            <Text style={styles.indicatorCell}>{ind.socialEnergyAvg || '—'}</Text>
            <Text style={styles.indicatorCell}>{ind.calmModeMinutes}</Text>
            <Text style={styles.indicatorCell}>{ind.messagesSent}</Text>
            <Text style={styles.indicatorCell}>{ind.messagesReceived}</Text>
          </View>
        ))}
      </View>
    );
  };

  const renderAlert = (alert: ParentAlert) => {
    const colors = SEVERITY_COLORS[alert.severity] || SEVERITY_COLORS.info;
    const badgeColors = SEVERITY_BADGE[alert.severity] || SEVERITY_BADGE.info;
    const message = i18n.language === 'fr' ? alert.messageFr : alert.messageEn;

    return (
      <View
        key={alert.id}
        style={[styles.alertCard, { backgroundColor: colors.bg, borderColor: colors.border }]}
      >
        <View style={styles.alertHeader}>
          <View style={[styles.severityBadge, { backgroundColor: badgeColors.bg }]}>
            <Text style={[styles.severityBadgeText, { color: badgeColors.text }]}>
              {t(`alerts.severity_${alert.severity}`)}
            </Text>
          </View>
          <Text style={styles.alertDate}>{formatDateTime(alert.createdAt)}</Text>
        </View>

        <Text style={[styles.alertMessage, { color: colors.text }]}>{message}</Text>

        <View style={styles.alertFooter}>
          {alert.acknowledged ? (
            <View style={styles.acknowledgedRow}>
              <Text style={styles.checkmark}>&#10003;</Text>
              <Text style={styles.acknowledgedText}>{t('alerts.acknowledged')}</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.acknowledgeBtn}
              onPress={() => handleAcknowledge(alert.id)}
              disabled={acknowledgingId === alert.id}
              accessibilityRole="button"
            >
              <Text style={styles.acknowledgeBtnText}>
                {acknowledgingId === alert.id ? t('alerts.acknowledging') : t('alerts.acknowledge')}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const renderAlerts = () => {
    if (loadingAlerts) {
      return (
        <View style={styles.loadingSection} accessibilityRole="progressbar">
          <ActivityIndicator size="small" />
        </View>
      );
    }
    if (errorAlerts) {
      return (
        <Text style={styles.errorText} accessibilityRole="alert">
          {errorAlerts}
        </Text>
      );
    }
    if (alerts.length === 0) {
      return <Text style={styles.emptyText}>{t('alerts.no_alerts')}</Text>;
    }

    return <View style={{ gap: 8 }}>{alerts.map(renderAlert)}</View>;
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
    >
      {/* Activity indicators */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('indicators.title')}</Text>
        {renderIndicators()}
      </View>

      {/* Alerts */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('alerts.title')}</Text>
        {renderAlerts()}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  content: {
    padding: 16,
    paddingBottom: 48,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  loadingSection: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 13,
    color: '#dc2626',
  },
  emptyText: {
    fontSize: 13,
    color: '#6b7280',
  },
  // Indicators table
  indicatorHeaderRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingBottom: 6,
    marginBottom: 4,
  },
  indicatorHeaderCell: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6b7280',
    width: 55,
    textAlign: 'center',
  },
  indicatorRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  indicatorCell: {
    fontSize: 11,
    color: '#374151',
    width: 55,
    textAlign: 'center',
  },
  // Alerts
  alertCard: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  severityBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  alertDate: {
    fontSize: 10,
    color: '#6b7280',
  },
  alertMessage: {
    fontSize: 13,
    lineHeight: 18,
  },
  alertFooter: {
    marginTop: 8,
    alignItems: 'flex-end',
  },
  acknowledgedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  checkmark: {
    color: '#16a34a',
    fontSize: 12,
  },
  acknowledgedText: {
    fontSize: 11,
    color: '#6b7280',
  },
  acknowledgeBtn: {
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  acknowledgeBtnText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
  },
});
