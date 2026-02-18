import { request } from './api';

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
  createdAt: string;
  resolvedAt?: string | null;
  relatedContent?: Record<string, unknown> | null;
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
