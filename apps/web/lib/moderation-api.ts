import { request } from './api';

export interface MessageRelatedContent {
  content: string;
  sentAt: string;
  sender: {
    id: string;
    displayName: string | null;
    accountType: string;
    warningCount: number;
  };
  conversation: {
    id: string;
    otherParticipant: {
      id: string;
      displayName: string | null;
      accountType: string;
    };
  };
  surroundingMessages: Array<{
    id: string;
    senderId: string;
    senderName: string | null;
    content: string;
    createdAt: string;
    isFlagged: boolean;
  }>;
  reports: Array<{
    id: string;
    reporterName: string | null;
    reason: string;
    description: string | null;
    createdAt: string;
  }>;
}

export interface UserRelatedContent {
  displayName: string | null;
  email: string;
  accountType: string;
  accountStatus: string;
  warningCount: number;
  memberSince: string;
  reports: Array<{
    id: string;
    reporterName: string | null;
    reason: string;
    description: string | null;
    createdAt: string;
  }>;
  moderationHistory: Array<{
    id: string;
    itemType: string;
    actionTaken: string | null;
    flagReason: string | null;
    createdAt: string;
    resolvedAt: string | null;
  }>;
}

export interface ModerationQueueItem {
  id: string;
  itemType: string; // 'message' | 'user'
  itemId: string;
  flaggedBy: string; // 'user' | 'ai' | 'moderator' | 'system'
  flagReason?: string | null;
  aiConfidence?: number | null;
  status: string; // 'pending' | 'reviewing' | 'resolved'
  priority: string; // 'low' | 'medium' | 'high' | 'urgent'
  actionTaken?: string | null;
  resolutionNotes?: string | null;
  originalContent?: string | null;
  createdAt: string;
  resolvedAt?: string | null;
  reviewerEmail?: string | null;
  relatedContent?: MessageRelatedContent | UserRelatedContent | Record<string, unknown> | null;
}

export interface ModerationStats {
  pending: number;
  reviewing: number;
  resolvedToday: number;
  totalResolved: number;
  byPriority: {
    low: number;
    medium: number;
    high: number;
    urgent: number;
  };
}

export interface ResolveData {
  action: 'dismissed' | 'warned' | 'removed' | 'suspended';
  notes?: string;
}

export const moderationApi = {
  getQueue: (status?: string, priority?: string) => {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    if (priority) params.set('priority', priority);
    const qs = params.toString();
    return request<ModerationQueueItem[]>(`/api/moderation/queue${qs ? `?${qs}` : ''}`, {
      method: 'GET',
    });
  },

  getQueueItem: (id: string) =>
    request<ModerationQueueItem>(`/api/moderation/queue/${id}`, { method: 'GET' }),

  resolveQueueItem: (id: string, data: ResolveData) =>
    request<ModerationQueueItem>(`/api/moderation/queue/${id}/resolve`, {
      method: 'PATCH',
      body: data,
    }),

  getStats: () => request<ModerationStats>('/api/moderation/stats', { method: 'GET' }),
};
