'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useAuthGuard } from '@/lib/use-auth-guard';
import { messagingApi } from '@/lib/messaging-api';
import { safetyApi } from '@/lib/safety-api';
import { useSocket } from '@/lib/use-socket';
import type { Conversation, Message } from '@/lib/types';
import StatusBar from '@/components/dashboard/StatusBar';
import ConversationList from '@/components/dashboard/ConversationList';
import ChatView from '@/components/dashboard/ChatView';
import NewConversationModal from '@/components/dashboard/NewConversationModal';
import BlockConfirmModal from '@/components/dashboard/BlockConfirmModal';
import ReportModal from '@/components/dashboard/ReportModal';
import BlockedUsersModal from '@/components/dashboard/BlockedUsersModal';

export default function DashboardPage() {
  const { t } = useTranslation('dashboard');
  const { isReady, isLoading: authLoading } = useAuthGuard('onboarded');
  const searchParams = useSearchParams();
  const router = useRouter();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [showNewModal, setShowNewModal] = useState(false);
  const [error, setError] = useState('');

  // Lifted message state: messages keyed by conversationId
  const [messagesMap, setMessagesMap] = useState<Record<string, Message[]>>({});
  const [hasMoreMap, setHasMoreMap] = useState<Record<string, boolean>>({});

  // Typing indicators: conversationId → { displayName, timeout }
  const [typingMap, setTypingMap] = useState<Record<string, string>>({});
  const typingTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // Safety modal state
  const [blockTarget, setBlockTarget] = useState<{ userId: string; userName: string } | null>(null);
  const [isBlocking, setIsBlocking] = useState(false);
  const [reportTarget, setReportTarget] = useState<{
    userId: string;
    userName: string;
    messageId?: string;
  } | null>(null);
  const [showBlockedUsers, setShowBlockedUsers] = useState(false);

  // Success toast
  const [toast, setToast] = useState<string | null>(null);

  // Track selected conversation in a ref for socket handlers
  const selectedConvRef = useRef<Conversation | null>(null);
  useEffect(() => {
    selectedConvRef.current = selectedConversation;
  }, [selectedConversation]);

  // Auto-dismiss toast after 5 seconds
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(timer);
  }, [toast]);

  // --- Socket event handlers ---

  const onNewMessage = useCallback(
    (data: { conversationId: string; message: Message; tempId?: string }) => {
      const { conversationId, message, tempId } = data;

      setMessagesMap(prev => {
        const existing = prev[conversationId] || [];

        // Dedup by tempId (optimistic message match)
        if (tempId) {
          const optimisticIdx = existing.findIndex(m => m.id === tempId);
          if (optimisticIdx >= 0) {
            const updated = [...existing];
            updated[optimisticIdx] = message;
            return { ...prev, [conversationId]: updated };
          }
        }

        // Dedup by message id (in case of duplicate delivery)
        if (existing.some(m => m.id === message.id)) {
          return prev;
        }

        return { ...prev, [conversationId]: [...existing, message] };
      });

      // Update conversation list
      setConversations(prev => {
        const updated = prev.map(c => {
          if (c.id !== conversationId) return c;
          return {
            ...c,
            lastMessage: {
              id: message.id,
              content: message.content,
              createdAt: message.createdAt,
              senderId: message.senderId,
              status: message.status,
            },
            updatedAt: message.createdAt,
            unreadCount:
              !message.isOwnMessage && selectedConvRef.current?.id !== conversationId
                ? c.unreadCount + 1
                : c.unreadCount,
          };
        });

        // Bump the updated conversation to top
        const idx = updated.findIndex(c => c.id === conversationId);
        if (idx > 0) {
          const [conv] = updated.splice(idx, 1);
          updated.unshift(conv);
        }

        return updated;
      });
    },
    []
  );

  const onReadReceipt = useCallback(
    (data: { conversationId: string; messageId: string; readAt: string }) => {
      setMessagesMap(prev => {
        const existing = prev[data.conversationId];
        if (!existing) return prev;
        return {
          ...prev,
          [data.conversationId]: existing.map(m =>
            m.id === data.messageId ||
            (m.isOwnMessage && m.status !== 'read' && m.createdAt <= data.readAt)
              ? { ...m, status: 'read' as const, readAt: data.readAt }
              : m
          ),
        };
      });
    },
    []
  );

  const onDelivered = useCallback(
    (data: { conversationId: string; messageId: string; deliveredAt: string }) => {
      setMessagesMap(prev => {
        const existing = prev[data.conversationId];
        if (!existing) return prev;
        return {
          ...prev,
          [data.conversationId]: existing.map(m =>
            m.id === data.messageId
              ? { ...m, status: 'delivered' as const, deliveredAt: data.deliveredAt }
              : m
          ),
        };
      });
    },
    []
  );

  const onTyping = useCallback(
    (data: { conversationId: string; userId: string; displayName: string }) => {
      setTypingMap(prev => ({ ...prev, [data.conversationId]: data.displayName }));

      // Clear previous timer
      if (typingTimersRef.current[data.conversationId]) {
        clearTimeout(typingTimersRef.current[data.conversationId]);
      }

      // Auto-clear typing after 3s
      typingTimersRef.current[data.conversationId] = setTimeout(() => {
        setTypingMap(prev => {
          const next = { ...prev };
          delete next[data.conversationId];
          return next;
        });
      }, 3000);
    },
    []
  );

  const onUserOnline = useCallback((data: { userId: string }) => {
    setConversations(prev =>
      prev.map(c =>
        c.otherUser.id === data.userId
          ? { ...c, otherUser: { ...c.otherUser, isOnline: true, lastSeen: null } }
          : c
      )
    );
    // Update selected conversation too
    setSelectedConversation(prev =>
      prev && prev.otherUser.id === data.userId
        ? { ...prev, otherUser: { ...prev.otherUser, isOnline: true, lastSeen: null } }
        : prev
    );
  }, []);

  const onUserOffline = useCallback((data: { userId: string; lastSeen: string }) => {
    setConversations(prev =>
      prev.map(c =>
        c.otherUser.id === data.userId
          ? { ...c, otherUser: { ...c.otherUser, isOnline: false, lastSeen: data.lastSeen } }
          : c
      )
    );
    setSelectedConversation(prev =>
      prev && prev.otherUser.id === data.userId
        ? { ...prev, otherUser: { ...prev.otherUser, isOnline: false, lastSeen: data.lastSeen } }
        : prev
    );
  }, []);

  const onStateChanged = useCallback(
    (data: { userId: string; socialEnergy?: string | null; calmModeActive?: boolean }) => {
      const updateUser = (user: Conversation['otherUser']) => {
        if (user.id !== data.userId) return user;
        return {
          ...user,
          ...(data.socialEnergy !== undefined ? { socialEnergy: data.socialEnergy as any } : {}),
          ...(data.calmModeActive !== undefined ? { calmModeActive: data.calmModeActive } : {}),
        };
      };

      setConversations(prev => prev.map(c => ({ ...c, otherUser: updateUser(c.otherUser) })));
      setSelectedConversation(prev =>
        prev ? { ...prev, otherUser: updateUser(prev.otherUser) } : prev
      );
    },
    []
  );

  const onConversationUnhidden = useCallback(
    (data: { conversationId: string }) => {
      // A new message arrived and auto-unhid this conversation — reload list
      fetchConversations();
    },
    [fetchConversations]
  );

  const { isConnected, emit } = useSocket({
    onNewMessage,
    onReadReceipt,
    onDelivered,
    onTyping,
    onUserOnline,
    onUserOffline,
    onStateChanged,
    onConversationUnhidden,
  });

  // --- REST fetching ---

  const fetchConversations = useCallback(async () => {
    setIsLoadingConversations(true);
    setError('');
    try {
      const data = await messagingApi.getConversations();
      setConversations(data.conversations);
      return data.conversations;
    } catch {
      setError(t('errors.load_conversations'));
      return [];
    } finally {
      setIsLoadingConversations(false);
    }
  }, [t]);

  // Fetch conversations once auth is resolved, restore selection from URL
  useEffect(() => {
    if (!isReady) return;
    fetchConversations().then(convs => {
      const chatId = searchParams.get('chat');
      if (chatId && !selectedConversation) {
        const match = convs.find(c => c.id === chatId);
        if (match) {
          setSelectedConversation(match);
          setConversations(prev => prev.map(c => (c.id === chatId ? { ...c, unreadCount: 0 } : c)));
        }
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady, fetchConversations]);

  // --- Message loading (REST) ---

  const loadMessages = useCallback(async (conversationId: string, before?: string) => {
    try {
      const data = await messagingApi.getMessages(conversationId, 50, before);
      // API returns messages in desc order (newest first) for pagination;
      // reverse to chronological (oldest first) for display
      const chronological = [...data.messages].reverse();
      setMessagesMap(prev => {
        const existing = prev[conversationId] || [];
        if (before) {
          // Prepend older messages before existing ones
          return { ...prev, [conversationId]: [...chronological, ...existing] };
        }
        return { ...prev, [conversationId]: chronological };
      });
      setHasMoreMap(prev => ({ ...prev, [conversationId]: data.hasMore }));
    } catch {
      // Non-critical: ChatView shows its own error state
    }
  }, []);

  // --- Socket send ---

  const handleSendViaSocket = useCallback(
    (conversationId: string, content: string, tempId: string) => {
      emit('message:send', { conversationId, content, tempId });
    },
    [emit]
  );

  const handleEmitTyping = useCallback(
    (conversationId: string) => {
      emit('message:typing', { conversationId });
    },
    [emit]
  );

  const handleEmitRead = useCallback(
    (conversationId: string, messageId: string) => {
      emit('message:read', { conversationId, messageId });
    },
    [emit]
  );

  // --- UI handlers ---

  const handleSelectConversation = (conv: Conversation) => {
    setSelectedConversation(conv);
    router.replace(`/dashboard?chat=${conv.id}`, { scroll: false });
    // Clear unread count locally for immediate UI feedback
    if (conv.unreadCount > 0) {
      setConversations(prev => prev.map(c => (c.id === conv.id ? { ...c, unreadCount: 0 } : c)));
    }
  };

  const handleBack = () => {
    setSelectedConversation(null);
    router.replace('/dashboard', { scroll: false });
  };

  const handleNewConversationCreated = (conv: Conversation) => {
    setShowNewModal(false);
    setConversations(prev => [conv, ...prev]);
    setSelectedConversation(conv);
    router.replace(`/dashboard?chat=${conv.id}`, { scroll: false });
  };

  const handleConversationUpdated = useCallback(() => {
    fetchConversations();
  }, [fetchConversations]);

  // --- Hide conversation handler ---

  const handleHideConversation = async (conversationId: string) => {
    try {
      await messagingApi.hideConversation(conversationId);
      setSelectedConversation(null);
      router.replace('/dashboard', { scroll: false });
      setToast(t('chat.conversation_hidden'));
      fetchConversations();
    } catch {
      setError(t('errors.hide_conversation'));
    }
  };

  // --- Safety handlers ---

  const handleBlockUser = (userId: string, userName: string) => {
    setBlockTarget({ userId, userName });
  };

  const handleConfirmBlock = async () => {
    if (!blockTarget) return;
    setIsBlocking(true);
    try {
      await safetyApi.blockUser(blockTarget.userId);
      setBlockTarget(null);
      setSelectedConversation(null);
      router.replace('/dashboard', { scroll: false });
      setToast(t('safety.block_success'));
      fetchConversations();
    } catch {
      setError(t('errors.block_user'));
      setBlockTarget(null);
    } finally {
      setIsBlocking(false);
    }
  };

  const handleReportUser = (userId: string, userName: string) => {
    setReportTarget({ userId, userName });
  };

  const handleReportMessage = (messageId: string, userId: string, userName: string) => {
    setReportTarget({ userId, userName, messageId });
  };

  const handleReportSuccess = () => {
    setReportTarget(null);
    setToast(t('safety.report_success'));
  };

  const handleUnblocked = () => {
    setToast(t('safety.unblock_success'));
    fetchConversations();
  };

  // Loading / redirecting
  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50" role="status">
        <p className="text-gray-600">{t('common:loading')}</p>
      </div>
    );
  }

  if (!isReady) {
    return null; // useAuthGuard is redirecting
  }

  // Derive typing conversations set for ConversationList
  const typingConversations = new Set(Object.keys(typingMap));

  return (
    <div className="flex h-screen flex-col bg-gray-50">
      {/* Skip to main content link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-50 focus:bg-blue-600 focus:px-4 focus:py-2 focus:text-white"
      >
        {t('conversations.title')}
      </a>

      <StatusBar onOpenBlockedUsers={() => setShowBlockedUsers(true)} isConnected={isConnected} />

      {/* Success toast */}
      {toast && (
        <div
          role="status"
          className="fixed top-4 right-4 z-50 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 shadow-md"
        >
          {toast}
        </div>
      )}

      {/* Main content */}
      <div id="main-content" className="flex flex-1 overflow-hidden">
        {/* Sidebar — hidden on mobile when a conversation is selected */}
        <aside
          className={`w-full border-r border-gray-200 bg-white md:w-80 md:flex-shrink-0 ${
            selectedConversation ? 'hidden md:block' : 'block'
          }`}
        >
          {error && (
            <div
              role="alert"
              className="border-b border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700"
            >
              {error}
            </div>
          )}
          <ConversationList
            conversations={conversations}
            selectedId={selectedConversation?.id ?? null}
            onSelect={handleSelectConversation}
            onNewConversation={() => setShowNewModal(true)}
            onRefresh={fetchConversations}
            isLoading={isLoadingConversations}
            typingConversations={typingConversations}
          />
        </aside>

        {/* Chat panel — hidden on mobile when no conversation selected */}
        <main className={`flex-1 bg-white ${selectedConversation ? 'block' : 'hidden md:block'}`}>
          {selectedConversation ? (
            <ChatView
              key={selectedConversation.id}
              conversation={selectedConversation}
              messages={messagesMap[selectedConversation.id] || []}
              hasMore={hasMoreMap[selectedConversation.id] ?? false}
              onLoadMessages={loadMessages}
              onBack={handleBack}
              onConversationUpdated={handleConversationUpdated}
              onBlockUser={handleBlockUser}
              onReportUser={handleReportUser}
              onReportMessage={handleReportMessage}
              onHideConversation={handleHideConversation}
              isConnected={isConnected}
              onSendViaSocket={handleSendViaSocket}
              onEmitTyping={handleEmitTyping}
              onEmitRead={handleEmitRead}
              typingUser={
                typingMap[selectedConversation.id]
                  ? { displayName: typingMap[selectedConversation.id] }
                  : null
              }
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <p className="text-sm text-gray-500">{t('conversations.empty_hint')}</p>
            </div>
          )}
        </main>
      </div>

      <NewConversationModal
        isOpen={showNewModal}
        onClose={() => setShowNewModal(false)}
        onCreated={handleNewConversationCreated}
      />

      <BlockConfirmModal
        isOpen={!!blockTarget}
        userName={blockTarget?.userName ?? ''}
        isLoading={isBlocking}
        onConfirm={handleConfirmBlock}
        onClose={() => setBlockTarget(null)}
      />

      <ReportModal
        isOpen={!!reportTarget}
        reportedUserId={reportTarget?.userId}
        reportedMessageId={reportTarget?.messageId}
        userName={reportTarget?.userName ?? ''}
        onSuccess={handleReportSuccess}
        onClose={() => setReportTarget(null)}
      />

      <BlockedUsersModal
        isOpen={showBlockedUsers}
        onClose={() => setShowBlockedUsers(false)}
        onUnblocked={handleUnblocked}
      />
    </div>
  );
}
