// Messaging types

export type MessageType = 'text' | 'emoji' | 'system';
export type MessageStatus = 'queued' | 'sent' | 'delivered' | 'read';
export type ConversationStatus = 'active' | 'blocked' | 'archived';
export type SocialEnergyLevel = 'high' | 'medium' | 'low';

export interface OtherUser {
  id: string;
  displayName: string | null;
  isOnline: boolean;
  lastSeen: string | null;
  socialEnergy: SocialEnergyLevel | null;
  calmModeActive: boolean;
}

export interface LastMessage {
  id: string;
  content: string;
  createdAt: string;
  senderId: string;
  status: MessageStatus;
}

export interface Conversation {
  id: string;
  status: ConversationStatus;
  createdAt: string;
  updatedAt: string;
  otherUser: OtherUser;
  lastMessage: LastMessage | null;
  unreadCount: number;
}

export interface ConversationListResponse {
  conversations: Conversation[];
  total: number;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  messageType: MessageType;
  content: string;
  status: MessageStatus;
  queuedReason?: string | null;
  deliverAt?: string | null;
  createdAt: string;
  deliveredAt?: string | null;
  readAt?: string | null;
  isOwnMessage: boolean;
}

export interface MessageListResponse {
  messages: Message[];
  total: number;
  hasMore: boolean;
}

export interface SendMessageResponse {
  queued: boolean;
  reason?: string;
  deliverAt?: string;
  message: Message;
}

// State types

export interface UserState {
  socialEnergy: SocialEnergyLevel | null;
  energyUpdatedAt: string | null;
  calmModeActive: boolean;
  calmModeStarted: string | null;
  isOnline: boolean;
  lastSeen: string | null;
}

export interface CalmModeResponse {
  active: boolean;
  startedAt: string | null;
  durationMinutes?: number;
}

// Safety types

export interface BlockedUser {
  id: string;
  displayName: string | null;
  blockedAt: string;
}

export type ReportReason = 'harassment' | 'inappropriate' | 'spam' | 'safety_concern' | 'other';

export interface CreateReportData {
  reportedUserId?: string;
  reportedMessageId?: string;
  reason: ReportReason;
  description?: string;
}

export interface ReportResponse {
  id: string;
  reason: ReportReason;
  description?: string | null;
  createdAt: string;
}
