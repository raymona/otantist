'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthGuard } from '@/lib/use-auth-guard';
import { messagingApi } from '@/lib/messaging-api';
import type { Conversation } from '@/lib/types';
import StatusBar from '@/components/dashboard/StatusBar';
import ConversationList from '@/components/dashboard/ConversationList';
import ChatView from '@/components/dashboard/ChatView';
import NewConversationModal from '@/components/dashboard/NewConversationModal';

export default function DashboardPage() {
  const { t } = useTranslation('dashboard');
  const { isReady, isLoading: authLoading } = useAuthGuard('onboarded');

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [showNewModal, setShowNewModal] = useState(false);
  const [error, setError] = useState('');

  const fetchConversations = useCallback(async () => {
    setIsLoadingConversations(true);
    setError('');
    try {
      const data = await messagingApi.getConversations();
      setConversations(data.conversations);
    } catch {
      setError(t('errors.load_conversations'));
    } finally {
      setIsLoadingConversations(false);
    }
  }, [t]);

  // Fetch conversations once auth is resolved
  useEffect(() => {
    if (isReady) {
      fetchConversations();
    }
  }, [isReady, fetchConversations]);

  const handleSelectConversation = (conv: Conversation) => {
    setSelectedConversation(conv);
  };

  const handleBack = () => {
    setSelectedConversation(null);
  };

  const handleNewConversationCreated = (conv: Conversation) => {
    setShowNewModal(false);
    setConversations(prev => [conv, ...prev]);
    setSelectedConversation(conv);
  };

  const handleConversationUpdated = useCallback(() => {
    fetchConversations();
  }, [fetchConversations]);

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

  return (
    <div className="flex h-screen flex-col bg-gray-50">
      {/* Skip to main content link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-50 focus:bg-blue-600 focus:px-4 focus:py-2 focus:text-white"
      >
        {t('conversations.title')}
      </a>

      <StatusBar />

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
          />
        </aside>

        {/* Chat panel — hidden on mobile when no conversation selected */}
        <main className={`flex-1 bg-white ${selectedConversation ? 'block' : 'hidden md:block'}`}>
          {selectedConversation ? (
            <ChatView
              key={selectedConversation.id}
              conversation={selectedConversation}
              onBack={handleBack}
              onConversationUpdated={handleConversationUpdated}
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
    </div>
  );
}
