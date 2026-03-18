import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
  Modal,
  TextInput,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/auth-context';
import { messagingApi } from '../../lib/api/messaging';
import { stateApi } from '../../lib/api/state';
import { usersApi } from '../../lib/api/users';
import type { Conversation, UserDirectoryEntry, SocialEnergyLevel } from '../../lib/types';
import type { DashboardScreenProps } from '../../navigation/types';
import { appStorage } from '../../lib/storage';
import { STORAGE_KEYS } from '../../lib/constants';

export function ConversationListScreen({ navigation }: DashboardScreenProps<'ConversationList'>) {
  const { t } = useTranslation('dashboard');
  const { user } = useAuth();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showHidden, setShowHidden] = useState(false);
  const [calmModeActive, setCalmModeActive] = useState(false);
  const [socialEnergy, setSocialEnergy] = useState<SocialEnergyLevel | null>(null);

  // New conversation modal
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [directorySearch, setDirectorySearch] = useState('');
  const [directoryResults, setDirectoryResults] = useState<UserDirectoryEntry[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  // Daily check-in modal
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [checkInEnergy, setCheckInEnergy] = useState<SocialEnergyLevel>('medium');

  const loadConversations = useCallback(async () => {
    try {
      const response = await messagingApi.getConversations({ hidden: showHidden });
      setConversations(response.conversations);
    } catch {
      // Silent fail
    }
  }, [showHidden]);

  const loadState = useCallback(async () => {
    try {
      const state = await stateApi.getCurrent();
      setCalmModeActive(state.calmModeActive);
      setSocialEnergy(state.socialEnergy);
    } catch {
      // Silent fail
    }
  }, []);

  const checkDailyCheckIn = useCallback(async () => {
    if (!user) return;
    const today = new Date().toISOString().split('T')[0];
    const lastCheckIn = await appStorage.get(`${STORAGE_KEYS.DAILY_CHECKIN}_${user.id}`);
    if (lastCheckIn !== today) {
      setShowCheckIn(true);
    }
  }, [user]);

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      await Promise.all([loadConversations(), loadState()]);
      setIsLoading(false);
      await checkDailyCheckIn();
    };
    init();
  }, [loadConversations, loadState, checkDailyCheckIn]);

  const onRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([loadConversations(), loadState()]);
    setIsRefreshing(false);
  };

  const handleCheckIn = async () => {
    if (!user) return;
    try {
      await stateApi.updateSocialEnergy(checkInEnergy);
      setSocialEnergy(checkInEnergy);
      const today = new Date().toISOString().split('T')[0];
      await appStorage.set(`${STORAGE_KEYS.DAILY_CHECKIN}_${user.id}`, today);
    } catch {
      // Silent fail
    }
    setShowCheckIn(false);
  };

  const toggleCalmMode = async () => {
    try {
      if (calmModeActive) {
        await stateApi.deactivateCalmMode();
        setCalmModeActive(false);
      } else {
        await stateApi.activateCalmMode();
        setCalmModeActive(true);
      }
    } catch {
      // Silent fail
    }
  };

  const searchDirectory = async (query: string) => {
    setDirectorySearch(query);
    if (query.length < 2) {
      setDirectoryResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const response = await usersApi.getDirectory(query);
      setDirectoryResults(response.users);
    } catch {
      setDirectoryResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const startConversation = async (userId: string, displayName: string | null) => {
    setIsStarting(true);
    try {
      const conversation = await messagingApi.startConversation(userId);
      setShowNewConversation(false);
      setDirectorySearch('');
      setDirectoryResults([]);
      await loadConversations();
      navigation.navigate('Chat', {
        conversationId: conversation.id,
        displayName: displayName || undefined,
      });
    } catch {
      // Silent fail
    } finally {
      setIsStarting(false);
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return t('just_now');
    if (diffMins < 60) return t('minutes_ago', { count: diffMins });
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return t('hours_ago', { count: diffHours });
    return date.toLocaleDateString();
  };

  const renderConversation = ({ item }: { item: Conversation }) => (
    <TouchableOpacity
      style={styles.conversationItem}
      onPress={() =>
        navigation.navigate('Chat', {
          conversationId: item.id,
          displayName: item.otherUser.displayName || undefined,
        })
      }
      accessibilityRole="button"
      accessibilityLabel={`${item.otherUser.displayName || t('anonymous')}, ${
        item.unreadCount > 0 ? t('unread_messages', { count: item.unreadCount }) : ''
      }`}
    >
      {/* Avatar / Online indicator */}
      <View style={styles.avatarContainer}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(item.otherUser.displayName || '?')[0].toUpperCase()}
          </Text>
        </View>
        {item.otherUser.isOnline && <View style={styles.onlineDot} />}
      </View>

      {/* Content */}
      <View style={styles.conversationContent}>
        <View style={styles.conversationHeader}>
          <Text style={styles.displayName} numberOfLines={1}>
            {item.otherUser.displayName || t('anonymous')}
          </Text>
          {item.lastMessage && (
            <Text style={styles.timeText}>{formatTime(item.lastMessage.createdAt)}</Text>
          )}
        </View>
        <View style={styles.conversationFooter}>
          <Text style={styles.lastMessage} numberOfLines={1}>
            {item.lastMessage?.content || t('no_messages')}
          </Text>
          {item.unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{item.unreadCount}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const energyColors: Record<SocialEnergyLevel, string> = {
    high: '#22c55e',
    medium: '#f59e0b',
    low: '#ef4444',
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <View style={styles.flex}>
      {/* Status bar */}
      <View style={styles.statusBar}>
        {socialEnergy && (
          <View style={styles.energyIndicator}>
            <View style={[styles.energyDot, { backgroundColor: energyColors[socialEnergy] }]} />
            <Text style={styles.energyText}>{t(`energy_${socialEnergy}`)}</Text>
          </View>
        )}
        <TouchableOpacity
          onPress={toggleCalmMode}
          style={[styles.calmButton, calmModeActive && styles.calmButtonActive]}
          accessibilityRole="button"
          accessibilityState={{ selected: calmModeActive }}
        >
          <Text style={[styles.calmButtonText, calmModeActive && styles.calmButtonTextActive]}>
            {t('calm_mode')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Calm mode banner */}
      {calmModeActive && (
        <View style={styles.calmBanner} accessibilityRole="alert">
          <Text style={styles.calmBannerText}>{t('calm_mode_active')}</Text>
        </View>
      )}

      {/* Hidden conversations toggle */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          onPress={() => setShowHidden(!showHidden)}
          style={styles.filterButton}
          accessibilityRole="button"
        >
          <Text style={styles.filterText}>{showHidden ? t('show_active') : t('show_hidden')}</Text>
        </TouchableOpacity>
      </View>

      {/* Conversations list */}
      <FlatList
        data={conversations}
        keyExtractor={item => item.id}
        renderItem={renderConversation}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {showHidden ? t('no_hidden_conversations') : t('no_conversations')}
            </Text>
          </View>
        }
        contentContainerStyle={conversations.length === 0 && styles.emptyList}
      />

      {/* New conversation FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowNewConversation(true)}
        accessibilityRole="button"
        accessibilityLabel={t('new_conversation')}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* New conversation modal */}
      <Modal
        visible={showNewConversation}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowNewConversation(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t('new_conversation')}</Text>
            <TouchableOpacity onPress={() => setShowNewConversation(false)}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.searchInput}
            value={directorySearch}
            onChangeText={searchDirectory}
            placeholder={t('search_users')}
            placeholderTextColor="#9ca3af"
            accessibilityLabel={t('search_users')}
          />

          {isSearching && <ActivityIndicator style={{ marginTop: 16 }} />}

          <FlatList
            data={directoryResults}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.directoryItem}
                onPress={() => startConversation(item.id, item.displayName)}
                disabled={isStarting}
              >
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {(item.displayName || '?')[0].toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.displayName}>{item.displayName || t('anonymous')}</Text>
                  {item.isOnline && <Text style={styles.onlineText}>{t('online')}</Text>}
                </View>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              directorySearch.length >= 2 && !isSearching ? (
                <Text style={styles.emptySearchText}>{t('no_users_found')}</Text>
              ) : null
            }
          />
        </View>
      </Modal>

      {/* Daily check-in modal */}
      <Modal
        visible={showCheckIn}
        animationType="fade"
        transparent
        onRequestClose={() => setShowCheckIn(false)}
      >
        <View style={styles.checkInOverlay}>
          <View style={styles.checkInCard}>
            <Text style={styles.checkInTitle}>{t('daily_checkin_title')}</Text>
            <Text style={styles.checkInDesc}>{t('daily_checkin_message')}</Text>

            <View style={styles.energyOptions}>
              {(['high', 'medium', 'low'] as SocialEnergyLevel[]).map(level => (
                <TouchableOpacity
                  key={level}
                  style={[
                    styles.energyOption,
                    checkInEnergy === level && {
                      borderColor: energyColors[level],
                      backgroundColor: `${energyColors[level]}15`,
                    },
                  ]}
                  onPress={() => setCheckInEnergy(level)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: checkInEnergy === level }}
                >
                  <View
                    style={[styles.energyOptionDot, { backgroundColor: energyColors[level] }]}
                  />
                  <Text style={styles.energyOptionText}>{t(`energy_${level}`)}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.checkInButton} onPress={handleCheckIn}>
              <Text style={styles.checkInButtonText}>{t('daily_checkin_submit')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#f9fafb' },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  energyIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  energyDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  energyText: { fontSize: 13, color: '#4b5563' },
  calmButton: {
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f3f4f6',
  },
  calmButtonActive: { backgroundColor: '#fef3c7' },
  calmButtonText: { fontSize: 13, color: '#4b5563', fontWeight: '500' },
  calmButtonTextActive: { color: '#92400e' },
  calmBanner: {
    backgroundColor: '#fef3c7',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  calmBannerText: {
    fontSize: 13,
    color: '#92400e',
    textAlign: 'center',
  },
  filterRow: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  filterButton: { alignSelf: 'flex-end' },
  filterText: { fontSize: 13, color: '#2563eb', fontWeight: '500' },
  conversationItem: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  avatarContainer: { position: 'relative' },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 18, fontWeight: '600', color: '#4b5563' },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#22c55e',
    borderWidth: 2,
    borderColor: '#fff',
  },
  conversationContent: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  displayName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  timeText: { fontSize: 12, color: '#9ca3af', marginLeft: 8 },
  conversationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  lastMessage: { fontSize: 14, color: '#6b7280', flex: 1 },
  unreadBadge: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    marginLeft: 8,
  },
  unreadText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: { fontSize: 16, color: '#6b7280', textAlign: 'center' },
  emptyList: { flex: 1 },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  fabText: { color: '#fff', fontSize: 28, fontWeight: '300' },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f9fafb',
    paddingTop: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: { fontSize: 18, fontWeight: '600', color: '#111827' },
  modalClose: { fontSize: 22, color: '#6b7280', padding: 4 },
  searchInput: {
    margin: 16,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#111827',
  },
  directoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  onlineText: { fontSize: 12, color: '#22c55e', marginTop: 2 },
  emptySearchText: {
    textAlign: 'center',
    color: '#6b7280',
    padding: 24,
    fontSize: 14,
  },
  checkInOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  checkInCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 360,
  },
  checkInTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  checkInDesc: {
    fontSize: 14,
    color: '#4b5563',
    textAlign: 'center',
    marginBottom: 20,
  },
  energyOptions: { gap: 12, marginBottom: 20 },
  energyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 12,
  },
  energyOptionDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  energyOptionText: { fontSize: 15, color: '#111827', fontWeight: '500' },
  checkInButton: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  checkInButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
