import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ModerationStackParamList } from '../../navigation/types';
import {
  moderationApi,
  type ModerationQueueItem,
  type ResolveData,
} from '../../lib/api/moderation';

type RouteProp = NativeStackScreenProps<ModerationStackParamList, 'ModerationDetail'>['route'];

const ACTIONS: ResolveData['action'][] = ['dismissed', 'warned', 'removed', 'suspended'];

const PRIORITY_COLORS: Record<string, { bg: string; text: string }> = {
  low: { bg: '#f3f4f6', text: '#374151' },
  medium: { bg: '#fef3c7', text: '#92400e' },
  high: { bg: '#ffedd5', text: '#9a3412' },
  urgent: { bg: '#fee2e2', text: '#991b1b' },
};

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  pending: { bg: '#fef3c7', text: '#92400e' },
  reviewing: { bg: '#dbeafe', text: '#1e40af' },
  resolved: { bg: '#dcfce7', text: '#166534' },
};

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export function ModerationDetailScreen() {
  const { t } = useTranslation('moderation');
  const route = useRoute<RouteProp>();
  const navigation = useNavigation();
  const { itemId } = route.params;

  const [item, setItem] = useState<ModerationQueueItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Resolve form
  const [action, setAction] = useState<ResolveData['action']>('dismissed');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const loadItem = useCallback(async () => {
    setError('');
    try {
      const data = await moderationApi.getQueueItem(itemId);
      setItem(data);
    } catch {
      setError(t('error_loading'));
    } finally {
      setIsLoading(false);
    }
  }, [itemId, t]);

  useEffect(() => {
    loadItem();
  }, [loadItem]);

  const handleResolve = async () => {
    if (!item) return;

    // Confirm destructive actions
    if (action === 'suspended') {
      Alert.alert(t('resolve.title'), t(`resolve.action_${action}`), [
        { text: t('resolve.cancel', 'Cancel'), style: 'cancel' },
        { text: t('resolve.confirm', 'Confirm'), style: 'destructive', onPress: doResolve },
      ]);
      return;
    }
    doResolve();
  };

  const doResolve = async () => {
    if (!item) return;
    setIsSaving(true);
    try {
      const updated = await moderationApi.resolveQueueItem(item.id, {
        action,
        notes: notes || undefined,
      });
      setItem(updated);
      Alert.alert(t('resolve.success'));
    } catch {
      Alert.alert(t('resolve.error'));
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centered} accessibilityRole="progressbar">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error || !item) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText} accessibilityRole="alert">
          {error || 'Item not found'}
        </Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>{t('back')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isResolved = item.status === 'resolved';
  const statusColors = STATUS_COLORS[item.status] || STATUS_COLORS.pending;
  const priorityColors = PRIORITY_COLORS[item.priority] || PRIORITY_COLORS.low;
  const relatedContent = item.relatedContent as Record<string, unknown> | null | undefined;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Metadata */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('detail.title')}</Text>

        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>{t('filter.status')}:</Text>
          <View style={[styles.badge, { backgroundColor: statusColors.bg }]}>
            <Text style={[styles.badgeText, { color: statusColors.text }]}>
              {t(`status.${item.status}`)}
            </Text>
          </View>
        </View>

        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>{t('filter.priority')}:</Text>
          <View style={[styles.badge, { backgroundColor: priorityColors.bg }]}>
            <Text style={[styles.badgeText, { color: priorityColors.text }]}>
              {t(`priority.${item.priority}`)}
            </Text>
          </View>
        </View>

        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>{t('queue.source')}:</Text>
          <Text style={styles.metaValue}>{t(`flagged_by.${item.flaggedBy}`)}</Text>
        </View>

        {item.flagReason ? (
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>{t('queue.flag_reason')}:</Text>
            <Text style={styles.metaValue}>{item.flagReason}</Text>
          </View>
        ) : null}

        {item.aiConfidence != null ? (
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>{t('queue.ai_confidence')}:</Text>
            <Text style={styles.metaValue}>{Math.round(item.aiConfidence * 100)}%</Text>
          </View>
        ) : null}

        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>{t('queue.flagged_at')}:</Text>
          <Text style={styles.metaValue}>{formatTimeAgo(item.createdAt)}</Text>
        </View>
      </View>

      {/* Related content */}
      {relatedContent && Object.keys(relatedContent).length > 0 ? (
        <View style={styles.relatedBox}>
          <Text style={styles.relatedTitle}>{t('detail.related_content')}</Text>
          {item.itemType === 'message' ? (
            <View>
              {'content' in relatedContent && relatedContent.content != null ? (
                <View style={styles.relatedRow}>
                  <Text style={styles.relatedLabel}>{t('detail.message_content')}:</Text>
                  <Text style={styles.relatedValue}>{String(relatedContent.content)}</Text>
                </View>
              ) : null}
              {'senderName' in relatedContent && relatedContent.senderName != null ? (
                <View style={styles.relatedRow}>
                  <Text style={styles.relatedLabel}>{t('detail.sender')}:</Text>
                  <Text style={styles.relatedValue}>{String(relatedContent.senderName)}</Text>
                </View>
              ) : null}
            </View>
          ) : (
            <View>
              {'displayName' in relatedContent && relatedContent.displayName != null ? (
                <View style={styles.relatedRow}>
                  <Text style={styles.relatedLabel}>{t('detail.user_info')}:</Text>
                  <Text style={styles.relatedValue}>{String(relatedContent.displayName)}</Text>
                </View>
              ) : null}
            </View>
          )}
        </View>
      ) : null}

      {/* Resolved info */}
      {isResolved ? (
        <View style={styles.resolvedBox}>
          {item.actionTaken ? (
            <View style={styles.relatedRow}>
              <Text style={styles.relatedLabel}>{t('detail.action_taken')}:</Text>
              <Text style={[styles.relatedValue, { fontWeight: '600', color: '#166534' }]}>
                {t(`resolve.action_${item.actionTaken}`)}
              </Text>
            </View>
          ) : null}
          {item.originalContent ? (
            <View style={styles.relatedRow}>
              <Text style={styles.relatedLabel}>{t('detail.original_content')}:</Text>
              <Text style={[styles.relatedValue, { fontStyle: 'italic' }]}>
                &ldquo;{item.originalContent}&rdquo;
              </Text>
            </View>
          ) : null}
          {item.resolutionNotes ? (
            <View style={styles.relatedRow}>
              <Text style={styles.relatedLabel}>{t('detail.resolution_notes')}:</Text>
              <Text style={styles.relatedValue}>{item.resolutionNotes}</Text>
            </View>
          ) : null}
          {item.resolvedAt ? (
            <View style={styles.relatedRow}>
              <Text style={styles.relatedLabel}>{t('queue.resolved_at')}:</Text>
              <Text style={styles.relatedValue}>{formatTimeAgo(item.resolvedAt)}</Text>
            </View>
          ) : null}
        </View>
      ) : null}

      {/* Resolution form */}
      {!isResolved ? (
        <View style={styles.resolveSection}>
          <Text style={styles.sectionTitle}>{t('resolve.title')}</Text>

          <Text style={styles.fieldLabel}>{t('resolve.action_label')}</Text>
          <View style={styles.actionList}>
            {ACTIONS.map(a => (
              <TouchableOpacity
                key={a}
                style={styles.radioRow}
                onPress={() => setAction(a)}
                accessibilityRole="radio"
                accessibilityState={{ checked: action === a }}
              >
                <View style={[styles.radio, action === a && styles.radioSelected]}>
                  {action === a ? <View style={styles.radioDot} /> : null}
                </View>
                <Text style={styles.radioLabel}>{t(`resolve.action_${a}`)}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.fieldLabel, { marginTop: 16 }]}>{t('resolve.notes_label')}</Text>
          <TextInput
            style={styles.notesInput}
            value={notes}
            onChangeText={setNotes}
            placeholder={t('resolve.notes_placeholder')}
            placeholderTextColor="#9ca3af"
            multiline
            maxLength={1000}
            textAlignVertical="top"
          />

          <TouchableOpacity
            style={[styles.resolveBtn, isSaving && styles.resolveBtnDisabled]}
            onPress={handleResolve}
            disabled={isSaving}
            accessibilityRole="button"
          >
            <Text style={styles.resolveBtnText}>
              {isSaving ? t('resolve.saving') : t('resolve.save')}
            </Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </ScrollView>
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
  errorText: {
    fontSize: 14,
    color: '#dc2626',
    textAlign: 'center',
  },
  backBtn: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  backBtnText: {
    color: '#2563eb',
    fontSize: 14,
  },
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  content: {
    padding: 16,
    paddingBottom: 48,
  },
  // Section
  section: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  // Metadata
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  metaLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
  },
  metaValue: {
    fontSize: 12,
    color: '#374151',
    flex: 1,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '500',
  },
  // Related content
  relatedBox: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 12,
    marginBottom: 12,
  },
  relatedTitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
    marginBottom: 8,
  },
  relatedRow: {
    marginBottom: 4,
  },
  relatedLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
  },
  relatedValue: {
    fontSize: 12,
    color: '#374151',
    marginTop: 1,
  },
  // Resolved box
  resolvedBox: {
    backgroundColor: '#f0fdf4',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    padding: 12,
    marginBottom: 12,
  },
  // Resolve form
  resolveSection: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 16,
    marginTop: 4,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#4b5563',
    marginBottom: 8,
  },
  actionList: {
    gap: 8,
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#d1d5db',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioSelected: {
    borderColor: '#2563eb',
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2563eb',
  },
  radioLabel: {
    fontSize: 13,
    color: '#374151',
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 10,
    fontSize: 13,
    color: '#374151',
    minHeight: 80,
    backgroundColor: '#fff',
  },
  resolveBtn: {
    marginTop: 16,
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  resolveBtnDisabled: {
    opacity: 0.5,
  },
  resolveBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
