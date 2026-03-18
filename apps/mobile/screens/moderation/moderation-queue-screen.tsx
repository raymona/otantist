import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ModerationStackParamList } from '../../navigation/types';
import {
  moderationApi,
  type ModerationQueueItem,
  type ModerationStats,
} from '../../lib/api/moderation';

type NavProp = NativeStackNavigationProp<ModerationStackParamList, 'ModerationQueue'>;

const PRIORITY_COLORS: Record<string, { bg: string; text: string }> = {
  low: { bg: '#f3f4f6', text: '#374151' },
  medium: { bg: '#fef3c7', text: '#92400e' },
  high: { bg: '#ffedd5', text: '#9a3412' },
  urgent: { bg: '#fee2e2', text: '#991b1b' },
};

const STATUS_FILTERS = ['', 'pending', 'reviewing', 'resolved'] as const;
const PRIORITY_FILTERS = ['', 'low', 'medium', 'high', 'urgent'] as const;

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `${days}d`;
}

export function ModerationQueueScreen() {
  const { t } = useTranslation('moderation');
  const navigation = useNavigation<NavProp>();

  const [stats, setStats] = useState<ModerationStats | null>(null);
  const [queue, setQueue] = useState<ModerationQueueItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  const loadData = useCallback(
    async (status?: string, priority?: string) => {
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
      }
    },
    [t]
  );

  useEffect(() => {
    setIsLoading(true);
    loadData(statusFilter, priorityFilter).finally(() => setIsLoading(false));
  }, [loadData, statusFilter, priorityFilter]);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadData(statusFilter, priorityFilter);
    setIsRefreshing(false);
  }, [loadData, statusFilter, priorityFilter]);

  const renderStatCards = () => {
    if (!stats) return null;
    const cards = [
      { label: t('stats.pending'), value: stats.pending },
      { label: t('stats.reviewing'), value: stats.reviewing },
      { label: t('stats.resolved_today'), value: stats.resolvedToday },
      { label: t('stats.total_resolved'), value: stats.totalResolved },
    ];
    return (
      <View style={styles.statsRow}>
        {cards.map(card => (
          <View key={card.label} style={styles.statCard}>
            <Text style={styles.statValue}>{card.value}</Text>
            <Text style={styles.statLabel}>{card.label}</Text>
          </View>
        ))}
      </View>
    );
  };

  const renderPriorityBreakdown = () => {
    if (!stats) return null;
    return (
      <View style={styles.priorityRow}>
        {(['low', 'medium', 'high', 'urgent'] as const).map(level => {
          const colors = PRIORITY_COLORS[level];
          return (
            <View key={level} style={[styles.priorityBadge, { backgroundColor: colors.bg }]}>
              <Text style={[styles.priorityBadgeText, { color: colors.text }]}>
                {t(`priority.${level}`)}: {stats.byPriority[level]}
              </Text>
            </View>
          );
        })}
      </View>
    );
  };

  const renderFilters = () => (
    <View style={styles.filterRow}>
      <View style={styles.filterGroup}>
        <Text style={styles.filterLabel}>{t('filter.status')}:</Text>
        <View style={styles.filterChips}>
          {STATUS_FILTERS.map(s => (
            <TouchableOpacity
              key={s || 'all'}
              style={[styles.chip, statusFilter === s && styles.chipActive]}
              onPress={() => setStatusFilter(s)}
              accessibilityRole="button"
              accessibilityState={{ selected: statusFilter === s }}
            >
              <Text style={[styles.chipText, statusFilter === s && styles.chipTextActive]}>
                {s ? t(`status.${s}`) : t('filter.all_statuses')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      <View style={styles.filterGroup}>
        <Text style={styles.filterLabel}>{t('filter.priority')}:</Text>
        <View style={styles.filterChips}>
          {PRIORITY_FILTERS.map(p => (
            <TouchableOpacity
              key={p || 'all'}
              style={[styles.chip, priorityFilter === p && styles.chipActive]}
              onPress={() => setPriorityFilter(p)}
              accessibilityRole="button"
              accessibilityState={{ selected: priorityFilter === p }}
            >
              <Text style={[styles.chipText, priorityFilter === p && styles.chipTextActive]}>
                {p ? t(`priority.${p}`) : t('filter.all_priorities')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  const renderItem = ({ item }: { item: ModerationQueueItem }) => {
    const colors = PRIORITY_COLORS[item.priority] || PRIORITY_COLORS.low;
    return (
      <TouchableOpacity
        style={styles.queueItem}
        onPress={() => navigation.navigate('ModerationDetail', { itemId: item.id })}
        accessibilityRole="button"
        accessibilityLabel={`${t(`item_type.${item.itemType}`)} - ${t(`priority.${item.priority}`)} - ${item.flagReason || ''}`}
      >
        <View style={styles.queueItemHeader}>
          <View style={styles.queueItemLeft}>
            <View style={styles.typeIcon}>
              <Text style={styles.typeIconText}>{item.itemType === 'message' ? 'M' : 'U'}</Text>
            </View>
            <Text style={styles.itemType}>{t(`item_type.${item.itemType}`)}</Text>
            <View style={[styles.priorityTag, { backgroundColor: colors.bg }]}>
              <Text style={[styles.priorityTagText, { color: colors.text }]}>
                {t(`priority.${item.priority}`)}
              </Text>
            </View>
          </View>
          <Text style={styles.timeAgo}>{formatTimeAgo(item.createdAt)}</Text>
        </View>
        {item.flagReason ? (
          <Text style={styles.flagReason} numberOfLines={1}>
            {item.flagReason}
          </Text>
        ) : null}
        <Text style={styles.flaggedBy}>{t(`flagged_by.${item.flaggedBy}`)}</Text>
      </TouchableOpacity>
    );
  };

  const renderHeader = () => (
    <View>
      {renderStatCards()}
      {renderPriorityBreakdown()}
      {renderFilters()}
      <Text style={styles.sectionTitle}>{t('queue.title')}</Text>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.centered} accessibilityRole="progressbar">
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>{t('loading')}</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText} accessibilityRole="alert">
          {error}
        </Text>
        <TouchableOpacity style={styles.retryBtn} onPress={onRefresh}>
          <Text style={styles.retryBtnText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <FlatList
      data={queue}
      keyExtractor={item => item.id}
      renderItem={renderItem}
      ListHeaderComponent={renderHeader}
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>{t('queue.empty')}</Text>
          <Text style={styles.emptyHint}>{t('queue.empty_hint')}</Text>
        </View>
      }
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
      contentContainerStyle={styles.listContent}
    />
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6b7280',
  },
  errorText: {
    fontSize: 14,
    color: '#dc2626',
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: 16,
    backgroundColor: '#2563eb',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
    backgroundColor: '#f9fafb',
  },
  // Stats
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
  },
  statLabel: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 2,
  },
  // Priority breakdown
  priorityRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 16,
  },
  priorityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityBadgeText: {
    fontSize: 11,
    fontWeight: '500',
  },
  // Filters
  filterRow: {
    marginBottom: 16,
    gap: 10,
  },
  filterGroup: {
    gap: 6,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  filterChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  chipActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  chipText: {
    fontSize: 11,
    color: '#374151',
  },
  chipTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  // Queue items
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  queueItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 12,
    marginBottom: 8,
  },
  queueItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  queueItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  typeIcon: {
    width: 20,
    height: 20,
    borderRadius: 4,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeIconText: {
    fontSize: 10,
    color: '#6b7280',
    fontWeight: '600',
  },
  itemType: {
    fontSize: 12,
    fontWeight: '500',
    color: '#111827',
  },
  priorityTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  priorityTagText: {
    fontSize: 10,
    fontWeight: '500',
  },
  timeAgo: {
    fontSize: 10,
    color: '#9ca3af',
  },
  flagReason: {
    fontSize: 12,
    color: '#4b5563',
    marginTop: 4,
  },
  flaggedBy: {
    fontSize: 10,
    color: '#9ca3af',
    marginTop: 4,
  },
  // Empty state
  emptyContainer: {
    paddingVertical: 48,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4b5563',
  },
  emptyHint: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
  },
});
