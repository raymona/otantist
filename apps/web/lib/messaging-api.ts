import { request } from './api';
import type {
  ConversationListResponse,
  Conversation,
  MessageListResponse,
  SendMessageResponse,
  MessageType,
} from './types';

export const messagingApi = {
  getConversations: () =>
    request<ConversationListResponse>('/api/conversations', { method: 'GET' }),

  getConversation: (id: string) =>
    request<Conversation>(`/api/conversations/${id}`, { method: 'GET' }),

  startConversation: (userId: string, message?: string) =>
    request<Conversation>('/api/conversations', {
      method: 'POST',
      body: { userId, message },
    }),

  getMessages: (conversationId: string, limit = 50, before?: string) => {
    const params = new URLSearchParams({ limit: String(limit) });
    if (before) params.set('before', before);
    return request<MessageListResponse>(`/api/conversations/${conversationId}/messages?${params}`, {
      method: 'GET',
    });
  },

  sendMessage: (conversationId: string, content: string, messageType: MessageType = 'text') =>
    request<SendMessageResponse>(`/api/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: { content, messageType },
    }),

  markAsRead: (conversationId: string, messageId: string) =>
    request<void>(`/api/conversations/${conversationId}/read`, {
      method: 'POST',
      body: { messageId },
    }),

  deleteMessage: (messageId: string) =>
    request<void>(`/api/messages/${messageId}`, { method: 'DELETE' }),

  hideConversation: (conversationId: string) =>
    request<void>(`/api/conversations/${conversationId}/hide`, { method: 'POST' }),

  unhideConversation: (conversationId: string) =>
    request<void>(`/api/conversations/${conversationId}/unhide`, { method: 'POST' }),
};
