import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/auth-context';
import { useSocket } from '../../lib/use-socket';
import { messagingApi } from '../../lib/api/messaging';
import { usersApi } from '../../lib/api/users';
import { safetyApi } from '../../lib/api/safety';
import type { Message, ReportReason } from '../../lib/types';
import type { HowToTalkToMe } from '../../lib/api/users';
import type { DashboardScreenProps } from '../../navigation/types';

const REPORT_REASONS: ReportReason[] = [
  'harassment',
  'inappropriate',
  'spam',
  'safety_concern',
  'other',
];

export function ChatScreen({ route, navigation }: DashboardScreenProps<'Chat'>) {
  const { t, i18n } = useTranslation('dashboard');
  const { user } = useAuth();
  const { conversationId, displayName } = route.params;

  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [showHowToTalk, setShowHowToTalk] = useState(false);
  const [howToTalkData, setHowToTalkData] = useState<HowToTalkToMe | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState<ReportReason>('harassment');
  const [reportDescription, setReportDescription] = useState('');
  const [reportMessageId, setReportMessageId] = useState<string | null>(null);

  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout>>(null);
  const lastTypingSentRef = useRef(0);

  // Socket handlers — signatures match SocketEventHandlers in use-socket.ts
  const handleNewMessage = useCallback(
    (data: { conversationId: string; message: any; tempId?: string }) => {
      if (data.conversationId !== conversationId) return;
      const msg = data.message as Message;
      setMessages(prev => {
        // Dedupe: replace optimistic temp message or skip if already present
        if (data.tempId) {
          const hasTempId = prev.some(m => m.id === data.tempId);
          if (hasTempId) {
            return prev.map(m => (m.id === data.tempId ? msg : m));
          }
        }
        const exists = prev.some(m => m.id === msg.id);
        if (exists) return prev;
        return [...prev, msg];
      });
      // Mark as read if it's from the other user
      if (!msg.isOwnMessage) {
        messagingApi.markAsRead(conversationId, msg.id).catch(() => {});
      }
    },
    [conversationId]
  );

  const handleTyping = useCallback(
    (data: { conversationId: string; userId: string; displayName: string }) => {
      if (data.conversationId !== conversationId) return;
      if (data.userId === user?.id) return;
      setOtherUserTyping(true);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => setOtherUserTyping(false), 3000);
    },
    [conversationId, user?.id]
  );

  const handleReadReceipt = useCallback(
    (data: { conversationId: string; messageId: string; readAt: string }) => {
      if (data.conversationId !== conversationId) return;
      setMessages(prev =>
        prev.map(m => (m.id === data.messageId ? { ...m, status: 'read' as const } : m))
      );
    },
    [conversationId]
  );

  const handleDelivered = useCallback(
    (data: { conversationId: string; messageId: string; deliveredAt: string }) => {
      if (data.conversationId !== conversationId) return;
      setMessages(prev =>
        prev.map(m =>
          m.id === data.messageId && m.status !== 'read'
            ? { ...m, status: 'delivered' as const }
            : m
        )
      );
    },
    [conversationId]
  );

  const { socket } = useSocket({
    onNewMessage: handleNewMessage,
    onTyping: handleTyping,
    onReadReceipt: handleReadReceipt,
    onDelivered: handleDelivered,
  });

  // Load initial messages
  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const response = await messagingApi.getMessages(conversationId, 50);
        // API returns desc order, reverse for chronological
        setMessages(response.messages.reverse());
        setHasMore(response.hasMore);
        // Mark latest as read
        if (response.messages.length > 0) {
          const latest = response.messages[0]; // desc order, so first is latest
          if (!latest.isOwnMessage) {
            messagingApi.markAsRead(conversationId, latest.id).catch(() => {});
          }
        }
      } catch {
        // silent
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [conversationId]);

  // Set header title
  useEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerTitle: displayName || t('chat.conversation_title'),
      headerBackTitle: t('chat.back'),
    });
  }, [navigation, displayName, t]);

  const loadMore = async () => {
    if (!hasMore || isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      const oldest = messages[0];
      if (!oldest) return;
      const response = await messagingApi.getMessages(conversationId, 50, oldest.id);
      const olderMessages = response.messages.reverse();
      setMessages(prev => [...olderMessages, ...prev]);
      setHasMore(response.hasMore);
    } catch {
      // silent
    } finally {
      setIsLoadingMore(false);
    }
  };

  const sendMessage = async () => {
    const text = messageText.trim();
    if (!text || isSending) return;

    setIsSending(true);
    setMessageText('');

    // Optimistic message
    const tempId = `temp-${Date.now()}`;
    const optimistic: Message = {
      id: tempId,
      conversationId,
      senderId: user?.id || '',
      messageType: 'text',
      content: text,
      status: 'sent',
      createdAt: new Date().toISOString(),
      isOwnMessage: true,
    };
    setMessages(prev => [...prev, optimistic]);

    try {
      const response = await messagingApi.sendMessage(conversationId, text);
      // Replace temp message with real one
      setMessages(prev => prev.map(m => (m.id === tempId ? response.message : m)));
    } catch {
      // Remove optimistic on failure
      setMessages(prev => prev.filter(m => m.id !== tempId));
      setMessageText(text); // restore text
    } finally {
      setIsSending(false);
    }
  };

  const emitTyping = () => {
    const now = Date.now();
    if (now - lastTypingSentRef.current < 2000) return;
    lastTypingSentRef.current = now;
    socket?.emit('typing', { conversationId });
  };

  const handleDeleteMessage = (messageId: string) => {
    Alert.alert(t('chat.delete_title'), t('chat.delete_confirm'), [
      { text: t('common:cancel'), style: 'cancel' },
      {
        text: t('common:delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            await messagingApi.deleteMessage(messageId);
            setMessages(prev => prev.filter(m => m.id !== messageId));
          } catch {
            // silent
          }
        },
      },
    ]);
  };

  const openHowToTalk = async () => {
    // Find other user's ID from a message
    const otherMsg = messages.find(m => !m.isOwnMessage);
    if (!otherMsg) return;
    try {
      const data = await usersApi.getHowToTalkToMe(otherMsg.senderId);
      setHowToTalkData(data);
      setShowHowToTalk(true);
    } catch {
      // silent
    }
  };

  const submitReport = async () => {
    try {
      const otherMsg = messages.find(m => !m.isOwnMessage);
      await safetyApi.submitReport({
        reportedUserId: otherMsg?.senderId,
        reportedMessageId: reportMessageId || undefined,
        reason: reportReason,
        description: reportDescription || undefined,
      });
      setShowReportModal(false);
      setReportDescription('');
      setReportMessageId(null);
      Alert.alert(t('report_modal.submitted_title'), t('report_modal.submitted_message'));
    } catch {
      // silent
    }
  };

  const handleBlockUser = () => {
    const otherMsg = messages.find(m => !m.isOwnMessage);
    if (!otherMsg) return;
    Alert.alert(t('block_modal.title', { name: displayName || '' }), t('block_modal.description'), [
      { text: t('common:cancel'), style: 'cancel' },
      {
        text: t('block_modal.confirm'),
        style: 'destructive',
        onPress: async () => {
          try {
            await safetyApi.blockUser(otherMsg.senderId);
            navigation.goBack();
          } catch {
            // silent
          }
        },
      },
    ]);
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isSystem = item.messageType === 'system';
    const isOwn = item.isOwnMessage;

    if (isSystem) {
      return (
        <View style={styles.systemMessage}>
          <Text style={styles.systemMessageText}>{item.content}</Text>
        </View>
      );
    }

    return (
      <TouchableOpacity
        onLongPress={() => {
          if (isOwn) {
            handleDeleteMessage(item.id);
          } else {
            setReportMessageId(item.id);
            setShowReportModal(true);
          }
        }}
        style={[styles.messageBubble, isOwn ? styles.ownBubble : styles.otherBubble]}
        accessibilityRole="text"
      >
        <Text style={[styles.messageText, isOwn ? styles.ownMessageText : styles.otherMessageText]}>
          {item.content}
        </Text>
        <View style={styles.messageFooter}>
          <Text style={styles.messageTime}>
            {new Date(item.createdAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
          {isOwn && (
            <Text style={styles.messageStatus}>
              {item.status === 'read' ? '✓✓' : item.status === 'delivered' ? '✓' : '·'}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Options bar */}
      <View style={styles.optionsBar}>
        <TouchableOpacity onPress={openHowToTalk} style={styles.optionButton}>
          <Text style={styles.optionText}>{t('chat.how_to_talk_button')}</Text>
        </TouchableOpacity>
        <View style={styles.optionSpacer} />
        <TouchableOpacity onPress={() => setShowReportModal(true)} style={styles.optionButton}>
          <Text style={styles.optionText}>{t('chat.report_button')}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleBlockUser} style={styles.optionButton}>
          <Text style={[styles.optionText, { color: '#ef4444' }]}>{t('chat.block_button')}</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={item => item.id}
          renderItem={renderMessage}
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          ListHeaderComponent={
            isLoadingMore ? <ActivityIndicator style={{ padding: 12 }} color="#2563eb" /> : null
          }
          ListEmptyComponent={
            <View style={styles.emptyChat}>
              <Text style={styles.emptyChatText}>{t('chat.no_messages')}</Text>
            </View>
          }
          contentContainerStyle={messages.length === 0 && { flex: 1 }}
          style={styles.messageList}
        />
      )}

      {/* Typing indicator */}
      {otherUserTyping && (
        <View style={styles.typingIndicator}>
          <Text style={styles.typingText}>{t('chat.typing_short')}</Text>
        </View>
      )}

      {/* Input */}
      <View style={styles.inputBar}>
        <TextInput
          style={styles.messageInput}
          value={messageText}
          onChangeText={text => {
            setMessageText(text);
            emitTyping();
          }}
          placeholder={t('chat.placeholder')}
          placeholderTextColor="#9ca3af"
          multiline
          maxLength={2000}
          accessibilityLabel={t('chat.placeholder')}
        />
        <TouchableOpacity
          style={[styles.sendButton, !messageText.trim() && styles.sendButtonDisabled]}
          onPress={sendMessage}
          disabled={!messageText.trim() || isSending}
          accessibilityLabel={t('chat.send')}
        >
          <Text style={styles.sendButtonText}>↑</Text>
        </TouchableOpacity>
      </View>

      {/* How to talk to me modal */}
      <Modal
        visible={showHowToTalk}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowHowToTalk(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {t('how_to_talk.title', { name: displayName || '' })}
            </Text>
            <TouchableOpacity onPress={() => setShowHowToTalk(false)}>
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
          </View>
          {howToTalkData && (
            <View style={styles.howToTalkContent}>
              {howToTalkData.preferredTone && (
                <View style={styles.httSection}>
                  <Text style={styles.httLabel}>{t('how_to_talk.preferred_tone')}</Text>
                  <Text style={styles.httValue}>
                    {t(`onboarding:tone_${howToTalkData.preferredTone}`)}
                  </Text>
                </View>
              )}
              {howToTalkData.commModes.length > 0 && (
                <View style={styles.httSection}>
                  <Text style={styles.httLabel}>{t('how_to_talk.comm_modes')}</Text>
                  <Text style={styles.httValue}>
                    {howToTalkData.commModes.map(m => t(`onboarding:comm_mode_${m}`)).join(', ')}
                  </Text>
                </View>
              )}
              {howToTalkData.goodTopics.length > 0 && (
                <View style={styles.httSection}>
                  <Text style={styles.httLabel}>{t('how_to_talk.good_topics')}</Text>
                  <Text style={styles.httValue}>{howToTalkData.goodTopics.join(', ')}</Text>
                </View>
              )}
              {howToTalkData.avoidTopics.length > 0 && (
                <View style={styles.httSection}>
                  <Text style={styles.httLabel}>{t('how_to_talk.avoid_topics')}</Text>
                  <Text style={styles.httValue}>{howToTalkData.avoidTopics.join(', ')}</Text>
                </View>
              )}
              {howToTalkData.interactionTips.length > 0 && (
                <View style={styles.httSection}>
                  <Text style={styles.httLabel}>{t('how_to_talk.interaction_tips')}</Text>
                  <Text style={styles.httValue}>{howToTalkData.interactionTips.join(', ')}</Text>
                </View>
              )}
              <View style={styles.httSection}>
                <Text style={styles.httLabel}>{t('chat.communication_prefs')}</Text>
                {howToTalkData.slowRepliesOk && (
                  <Text style={styles.httValue}>{t('how_to_talk.slow_replies_ok')}</Text>
                )}
                {howToTalkData.oneMessageAtTime && (
                  <Text style={styles.httValue}>{t('how_to_talk.one_message_at_time')}</Text>
                )}
                {howToTalkData.readWithoutReply && (
                  <Text style={styles.httValue}>{t('how_to_talk.read_without_reply')}</Text>
                )}
              </View>
            </View>
          )}
        </View>
      </Modal>

      {/* Report modal */}
      <Modal
        visible={showReportModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowReportModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t('report_modal.title_user')}</Text>
            <TouchableOpacity onPress={() => setShowReportModal(false)}>
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.reportContent}>
            <Text style={styles.reportLabel}>{t('report_modal.reason_label')}</Text>
            {REPORT_REASONS.map(reason => (
              <TouchableOpacity
                key={reason}
                style={[
                  styles.reportReasonRow,
                  reportReason === reason && styles.reportReasonSelected,
                ]}
                onPress={() => setReportReason(reason)}
                accessibilityRole="radio"
                accessibilityState={{ selected: reportReason === reason }}
              >
                <Text style={styles.reportReasonText}>{t(`report_modal.reason_${reason}`)}</Text>
              </TouchableOpacity>
            ))}

            <Text style={[styles.reportLabel, { marginTop: 16 }]}>
              {t('report_modal.description_label')}
            </Text>
            <TextInput
              style={styles.reportInput}
              value={reportDescription}
              onChangeText={setReportDescription}
              multiline
              numberOfLines={4}
              placeholder={t('report_modal.description_placeholder')}
              placeholderTextColor="#9ca3af"
            />

            <TouchableOpacity style={styles.reportSubmitButton} onPress={submitReport}>
              <Text style={styles.reportSubmitText}>{t('report_modal.submit')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#f9fafb' },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionsBar: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  optionButton: { paddingHorizontal: 8, paddingVertical: 4 },
  optionText: { fontSize: 13, color: '#2563eb', fontWeight: '500' },
  optionSpacer: { flex: 1 },
  messageList: { flex: 1, paddingHorizontal: 12 },
  messageBubble: {
    maxWidth: '80%',
    borderRadius: 16,
    padding: 12,
    marginVertical: 4,
  },
  ownBubble: {
    backgroundColor: '#2563eb',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: '#fff',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  messageText: { fontSize: 15, lineHeight: 22 },
  ownMessageText: { color: '#fff' },
  otherMessageText: { color: '#111827' },
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  messageTime: { fontSize: 11, color: '#9ca3af' },
  messageStatus: { fontSize: 12, color: '#93c5fd' },
  systemMessage: {
    alignSelf: 'center',
    backgroundColor: '#fef3c7',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginVertical: 8,
    maxWidth: '80%',
  },
  systemMessageText: {
    fontSize: 13,
    color: '#92400e',
    textAlign: 'center',
  },
  emptyChat: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyChatText: { fontSize: 16, color: '#9ca3af' },
  typingIndicator: {
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  typingText: {
    fontSize: 13,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  inputBar: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    alignItems: 'flex-end',
  },
  messageInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 16,
    maxHeight: 120,
    backgroundColor: '#f9fafb',
    color: '#111827',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: { opacity: 0.5 },
  sendButtonText: { color: '#fff', fontSize: 20, fontWeight: '600' },
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
  modalCloseText: { fontSize: 22, color: '#6b7280', padding: 4 },
  howToTalkContent: { padding: 16 },
  httSection: { marginBottom: 16 },
  httLabel: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 4 },
  httValue: { fontSize: 14, color: '#4b5563' },
  reportContent: { padding: 16 },
  reportLabel: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  reportReasonRow: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    marginBottom: 8,
  },
  reportReasonSelected: {
    borderColor: '#2563eb',
    backgroundColor: '#eff6ff',
  },
  reportReasonText: { fontSize: 14, color: '#374151' },
  reportInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 100,
    textAlignVertical: 'top',
    backgroundColor: '#fff',
    color: '#111827',
  },
  reportSubmitButton: {
    backgroundColor: '#ef4444',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  reportSubmitText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
