import React, { useState, useEffect, useCallback } from 'react';
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
import { adminApi, type InviteCode } from '../../lib/api/admin';

export function AdminInviteCodesScreen() {
  const { t } = useTranslation('admin');

  const [codes, setCodes] = useState<InviteCode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');

  // Create form
  const [newCode, setNewCode] = useState('');
  const [newMaxUses, setNewMaxUses] = useState('1');
  const [creating, setCreating] = useState(false);
  const [copiedId, setCopiedId] = useState('');

  const fetchCodes = useCallback(async () => {
    setError('');
    try {
      const data = await adminApi.listInviteCodes();
      setCodes(data);
    } catch {
      setError(t('invite_codes.error_loading'));
    }
  }, [t]);

  useEffect(() => {
    setIsLoading(true);
    fetchCodes().finally(() => setIsLoading(false));
  }, [fetchCodes]);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchCodes();
    setIsRefreshing(false);
  }, [fetchCodes]);

  const handleCreate = async () => {
    const code = newCode.trim();
    if (!code) return;

    setCreating(true);
    try {
      const created = await adminApi.createInviteCode(code, parseInt(newMaxUses) || 1);
      setCodes(prev => [created, ...prev]);
      setNewCode('');
      setNewMaxUses('1');
      Alert.alert(t('invite_codes.success'));
    } catch {
      Alert.alert(t('invite_codes.error'));
    } finally {
      setCreating(false);
    }
  };

  const handleCopy = (code: InviteCode) => {
    Alert.alert(t('invite_codes.code'), code.code);
  };

  const renderCreateForm = () => (
    <View style={styles.createForm}>
      <Text style={styles.formTitle}>{t('invite_codes.create_new')}</Text>

      <View style={styles.formRow}>
        <View style={styles.codeInputContainer}>
          <Text style={styles.inputLabel}>{t('invite_codes.code')}</Text>
          <TextInput
            style={styles.input}
            value={newCode}
            onChangeText={text => setNewCode(text.toUpperCase())}
            placeholder="BETA2026"
            placeholderTextColor="#9ca3af"
            autoCapitalize="characters"
            autoCorrect={false}
          />
        </View>
        <View style={styles.maxUsesContainer}>
          <Text style={styles.inputLabel}>{t('invite_codes.max_uses')}</Text>
          <TextInput
            style={styles.input}
            value={newMaxUses}
            onChangeText={setNewMaxUses}
            keyboardType="number-pad"
            placeholder="1"
            placeholderTextColor="#9ca3af"
          />
        </View>
      </View>

      <TouchableOpacity
        style={[styles.createBtn, (!newCode.trim() || creating) && styles.createBtnDisabled]}
        onPress={handleCreate}
        disabled={!newCode.trim() || creating}
        accessibilityRole="button"
      >
        <Text style={styles.createBtnText}>{creating ? '...' : t('invite_codes.create')}</Text>
      </TouchableOpacity>
    </View>
  );

  const renderCode = ({ item: code }: { item: InviteCode }) => {
    const isExhausted = code.currentUses >= code.maxUses;
    const isExpired = code.expiresAt && new Date(code.expiresAt) < new Date();

    return (
      <View style={[styles.codeCard, (isExhausted || isExpired) && styles.codeCardDimmed]}>
        <View style={styles.codeHeader}>
          <Text style={styles.codeText}>{code.code}</Text>
          <TouchableOpacity
            onPress={() => handleCopy(code)}
            accessibilityRole="button"
            accessibilityLabel={`${t('invite_codes.copy')} ${code.code}`}
          >
            <Text style={styles.copyBtn}>
              {copiedId === code.id ? t('invite_codes.copied') : t('invite_codes.copy')}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.codeMeta}>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>{t('invite_codes.uses')}:</Text>
            <Text style={[styles.metaValue, isExhausted && { color: '#dc2626' }]}>
              {code.currentUses}/{code.maxUses}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>{t('invite_codes.expires_at')}:</Text>
            <Text style={[styles.metaValue, isExpired && { color: '#dc2626' }]}>
              {code.expiresAt
                ? new Date(code.expiresAt).toLocaleDateString()
                : t('invite_codes.no_expiry')}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>{t('invite_codes.created')}:</Text>
            <Text style={styles.metaValue}>{new Date(code.createdAt).toLocaleDateString()}</Text>
          </View>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.centered} accessibilityRole="progressbar">
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>{t('invite_codes.loading')}</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={codes}
      keyExtractor={item => item.id}
      renderItem={renderCode}
      ListHeaderComponent={renderCreateForm}
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>{error || t('invite_codes.none')}</Text>
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
  // Create form
  createForm: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 14,
    marginBottom: 16,
  },
  formTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  formRow: {
    flexDirection: 'row',
    gap: 10,
  },
  codeInputContainer: {
    flex: 1,
  },
  maxUsesContainer: {
    width: 80,
  },
  inputLabel: {
    fontSize: 11,
    color: '#6b7280',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#fff',
  },
  createBtn: {
    marginTop: 12,
    backgroundColor: '#16a34a',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  createBtnDisabled: {
    opacity: 0.5,
  },
  createBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  // Code card
  codeCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 14,
    marginBottom: 8,
  },
  codeCardDimmed: {
    opacity: 0.6,
  },
  codeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  codeText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    fontFamily: 'monospace',
  },
  copyBtn: {
    fontSize: 12,
    color: '#2563eb',
    fontWeight: '500',
  },
  // Meta
  codeMeta: {
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
