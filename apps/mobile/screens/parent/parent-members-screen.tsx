import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  StyleSheet,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ParentStackParamList } from '../../navigation/types';
import { parentApi, type ManagedMember } from '../../lib/api/parent';

type NavProp = NativeStackNavigationProp<ParentStackParamList, 'ParentMembers'>;

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  active: { bg: '#dcfce7', text: '#166534' },
  pending: { bg: '#fef3c7', text: '#92400e' },
  suspended: { bg: '#fee2e2', text: '#991b1b' },
};

export function ParentMembersScreen() {
  const { t } = useTranslation('parent');
  const navigation = useNavigation<NavProp>();

  const [members, setMembers] = useState<ManagedMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [generatingCode, setGeneratingCode] = useState(false);

  const fetchMembers = useCallback(async () => {
    setError('');
    try {
      const data = await parentApi.getMembers();
      setMembers(data);
    } catch {
      setError(t('errors.load_members'));
    }
  }, [t]);

  useEffect(() => {
    setIsLoading(true);
    fetchMembers().finally(() => setIsLoading(false));
  }, [fetchMembers]);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchMembers();
    setIsRefreshing(false);
  }, [fetchMembers]);

  const handleGenerateCode = async () => {
    setGeneratingCode(true);
    try {
      const result = await parentApi.generateLinkingCode();
      Alert.alert(
        t('generate_code.title', 'Linking Code'),
        `${result.code}\n\n${t('generate_code.expires', { date: new Date(result.expiresAt).toLocaleDateString() })}`
      );
    } catch {
      Alert.alert(t('generate_code.error', 'Failed to generate code'));
    } finally {
      setGeneratingCode(false);
    }
  };

  const renderMember = ({ item: member }: { item: ManagedMember }) => {
    const statusColors = STATUS_COLORS[member.status] || STATUS_COLORS.pending;
    const displayName = member.member.displayName || member.member.userId.slice(0, 8);

    return (
      <TouchableOpacity
        style={styles.memberCard}
        onPress={() =>
          navigation.navigate('ParentMemberDetail', {
            userId: member.member.userId,
            displayName,
          })
        }
        accessibilityRole="button"
        accessibilityLabel={displayName}
      >
        <View style={styles.memberHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.memberName}>{displayName}</Text>
            <Text style={styles.memberRelation}>
              {t(`member_list.relationship_${member.relationship}`)}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColors.bg }]}>
            <Text style={[styles.statusBadgeText, { color: statusColors.text }]}>
              {t(`member_list.status_${member.status}`)}
            </Text>
          </View>
        </View>
        <Text style={styles.memberDate}>{new Date(member.createdAt).toLocaleDateString()}</Text>
      </TouchableOpacity>
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity
        style={[styles.generateBtn, generatingCode && styles.generateBtnDisabled]}
        onPress={handleGenerateCode}
        disabled={generatingCode}
        accessibilityRole="button"
      >
        <Text style={styles.generateBtnText}>
          {generatingCode ? '...' : t('generate_code.button', 'Generate Linking Code')}
        </Text>
      </TouchableOpacity>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.centered} accessibilityRole="progressbar">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <FlatList
      data={members}
      keyExtractor={item => item.id}
      renderItem={renderMember}
      ListHeaderComponent={renderHeader}
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>{error || t('no_members')}</Text>
          <Text style={styles.emptyHint}>{t('no_members_hint')}</Text>
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
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
    backgroundColor: '#f9fafb',
  },
  // Header
  header: {
    marginBottom: 16,
  },
  generateBtn: {
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  generateBtnDisabled: {
    opacity: 0.5,
  },
  generateBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  // Member card
  memberCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 14,
    marginBottom: 8,
  },
  memberHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  memberName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  memberRelation: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '500',
  },
  memberDate: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 8,
  },
  // Empty
  emptyContainer: {
    paddingVertical: 48,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#374151',
  },
  emptyHint: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 4,
    textAlign: 'center',
  },
});
