import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  StyleSheet,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { adminApi, type AdminUser } from '../../lib/api/admin';

const ROLE_OPTIONS = ['adult', 'moderator', 'super_admin'] as const;

const ROLE_COLORS: Record<string, { bg: string; text: string }> = {
  adult: { bg: '#f3f4f6', text: '#374151' },
  parent_managed: { bg: '#fef3c7', text: '#92400e' },
  moderator: { bg: '#dbeafe', text: '#1e40af' },
  super_admin: { bg: '#f3e8ff', text: '#6b21a8' },
};

const STATUS_COLORS: Record<string, string> = {
  active: '#16a34a',
  pending: '#d97706',
  suspended: '#dc2626',
};

export function AdminUsersScreen() {
  const { t } = useTranslation('admin');

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchUsers = useCallback(
    async (query?: string) => {
      setError('');
      try {
        const data = await adminApi.listUsers(query);
        setUsers(data);
      } catch {
        setError(t('error'));
      }
    },
    [t]
  );

  useEffect(() => {
    setIsLoading(true);
    fetchUsers().finally(() => setIsLoading(false));
  }, [fetchUsers]);

  // Debounced search
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      fetchUsers(search || undefined);
    }, 300);
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [search, fetchUsers]);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchUsers(search || undefined);
    setIsRefreshing(false);
  }, [fetchUsers, search]);

  const handleRoleChange = (user: AdminUser, newRole: string) => {
    Alert.alert(
      t('set_role.confirm_title'),
      t('set_role.confirm_message', {
        name: user.displayName || user.email,
        from: t(`roles.${user.accountType}`),
        to: t(`roles.${newRole}`),
      }),
      [
        { text: t('set_role.cancel'), style: 'cancel' },
        {
          text: t('set_role.confirm'),
          onPress: async () => {
            setSaving(true);
            try {
              const updated = await adminApi.setRole(
                user.accountId,
                newRole as 'adult' | 'moderator' | 'super_admin'
              );
              setUsers(prev => prev.map(u => (u.accountId === updated.accountId ? updated : u)));
              Alert.alert(t('set_role.success'));
            } catch {
              Alert.alert(t('set_role.error'));
            } finally {
              setSaving(false);
            }
          },
        },
      ]
    );
  };

  const renderUser = ({ item: user }: { item: AdminUser }) => {
    const roleColors = ROLE_COLORS[user.accountType] || ROLE_COLORS.adult;
    const statusColor = STATUS_COLORS[user.status] || STATUS_COLORS.pending;
    const isParentManaged = user.accountType === 'parent_managed';

    return (
      <View style={styles.userCard}>
        <View style={styles.userHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.userName}>{user.displayName || '—'}</Text>
            <Text style={styles.userEmail}>{user.email}</Text>
          </View>
          <View style={[styles.roleBadge, { backgroundColor: roleColors.bg }]}>
            <Text style={[styles.roleBadgeText, { color: roleColors.text }]}>
              {t(`roles.${user.accountType}`)}
            </Text>
          </View>
        </View>

        <View style={styles.userMeta}>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>{t('table.status')}:</Text>
            <Text style={[styles.metaValue, { color: statusColor }]}>
              {t(`status.${user.status}`)}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>{t('table.verified')}:</Text>
            <Text style={styles.metaValue}>{user.emailVerified ? t('yes') : t('no')}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>{t('table.created')}:</Text>
            <Text style={styles.metaValue}>{new Date(user.createdAt).toLocaleDateString()}</Text>
          </View>
        </View>

        {!isParentManaged && (
          <View style={styles.actionRow}>
            {ROLE_OPTIONS.filter(r => r !== user.accountType).map(role => {
              const btnKey =
                role === 'super_admin'
                  ? 'to_admin'
                  : role === 'moderator'
                    ? 'to_moderator'
                    : 'to_user';
              const btnColors = ROLE_COLORS[role] || ROLE_COLORS.adult;
              return (
                <TouchableOpacity
                  key={role}
                  style={[styles.roleBtn, { borderColor: btnColors.text + '40' }]}
                  onPress={() => handleRoleChange(user, role)}
                  disabled={saving}
                  accessibilityRole="button"
                >
                  <Text style={[styles.roleBtnText, { color: btnColors.text }]}>
                    {t(`set_role.${btnKey}`)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>
    );
  };

  const renderHeader = () => (
    <View style={styles.searchContainer}>
      <TextInput
        style={styles.searchInput}
        value={search}
        onChangeText={setSearch}
        placeholder={t('search_placeholder')}
        placeholderTextColor="#9ca3af"
        autoCapitalize="none"
        autoCorrect={false}
        accessibilityLabel={t('search_placeholder')}
      />
      {!isLoading && (
        <Text style={styles.countText}>{t('total_users', { count: users.length })}</Text>
      )}
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

  return (
    <FlatList
      data={users}
      keyExtractor={item => item.accountId}
      renderItem={renderUser}
      ListHeaderComponent={renderHeader}
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>{error || t('no_results')}</Text>
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
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6b7280',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
    backgroundColor: '#f9fafb',
  },
  // Search
  searchContainer: {
    marginBottom: 12,
  },
  searchInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
  },
  countText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 8,
  },
  // User card
  userCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 14,
    marginBottom: 8,
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  userEmail: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  // Meta
  userMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 10,
  },
  metaItem: {
    flexDirection: 'row',
    gap: 4,
  },
  metaLabel: {
    fontSize: 11,
    color: '#6b7280',
  },
  metaValue: {
    fontSize: 11,
    color: '#374151',
    fontWeight: '500',
  },
  // Actions
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  roleBtn: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  roleBtnText: {
    fontSize: 11,
    fontWeight: '500',
  },
  // Empty
  emptyContainer: {
    paddingVertical: 48,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
  },
});
