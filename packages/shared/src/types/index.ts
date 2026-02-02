// ===========================================
// Otantist Shared Types
// ===========================================

// Account types
export type AccountType = 'adult' | 'parent_managed';
export type AccountStatus = 'pending' | 'active' | 'suspended';
export type LanguageCode = 'fr' | 'en';

// User types
export type AgeGroup = '14-17' | '18-25' | '26-40' | '40+';
export type ProfileVisibility = 'visible' | 'limited' | 'hidden';

// Preferences
export type TonePreference = 'gentle' | 'direct' | 'enthusiastic' | 'formal';
export type ColorIntensity = 'standard' | 'reduced' | 'minimal';
export type SocialEnergyLevel = 'high' | 'medium' | 'low';

// Messaging
export type MessageType = 'text' | 'emoji' | 'system';
export type MessageStatus = 'queued' | 'sent' | 'delivered' | 'read';
export type ConversationStatus = 'active' | 'blocked' | 'archived';

// Moderation
export type FlagSource = 'user' | 'ai' | 'moderator' | 'system';
export type ModerationStatus = 'pending' | 'reviewing' | 'resolved';
export type ModerationPriority = 'low' | 'medium' | 'high' | 'urgent';
export type ModerationAction = 'dismissed' | 'warned' | 'removed' | 'suspended';
export type ReportReason = 'harassment' | 'inappropriate' | 'spam' | 'safety_concern' | 'other';

// Parent Dashboard
export type AlertType = 'flagged_message' | 'stress_indicator' | 'prolonged_calm_mode' | 'inactivity';
export type AlertSeverity = 'info' | 'warning' | 'urgent';
export type ParentRelationship = 'parent' | 'legal_guardian' | 'other';
export type RelationshipStatus = 'pending' | 'active' | 'ended';

// ===========================================
// API Response Types
// ===========================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// ===========================================
// User Types
// ===========================================

export interface User {
  id: string;
  accountId: string;
  displayName: string | null;
  ageGroup: AgeGroup | null;
  profileVisibility: ProfileVisibility;
  onboardingComplete: boolean;
  onboardingStep: string | null;
}

export interface UserPublicProfile {
  id: string;
  displayName: string | null;
  ageGroup: AgeGroup | null;
}

export interface HowToTalkToMe {
  preferredTone: TonePreference | null;
  commModes: string[];
  goodTopics: string[];
  avoidTopics: string[];
  interactionTips: string[];
  timeBoundaries: {
    dayOfWeek: number;
    availableStart: string;
    availableEnd: string;
  }[];
}

// ===========================================
// Messaging Types
// ===========================================

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  messageType: MessageType;
  content: string;
  status: MessageStatus;
  queuedReason: string | null;
  deliverAt: string | null;
  createdAt: string;
  deliveredAt: string | null;
  readAt: string | null;
}

export interface Conversation {
  id: string;
  otherUser: UserPublicProfile;
  lastMessage: Message | null;
  unreadCount: number;
  status: ConversationStatus;
}

// ===========================================
// Real-time Event Types
// ===========================================

export interface SocketEvents {
  // Client -> Server
  join: { userId: string };
  typing: { conversationId: string };
  markRead: { conversationId: string; messageId: string };
  presence: { status: 'online' | 'away' };

  // Server -> Client
  newMessage: { message: Message; conversation: Conversation };
  messageStatus: { messageId: string; status: MessageStatus };
  userTyping: { conversationId: string; userId: string };
  presenceChange: { userId: string; status: 'online' | 'away'; lastSeen: string };
  calmModeAlert: { userId: string; activated: boolean };
}
