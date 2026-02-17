import { request } from './api';

export interface ManagedMember {
  id: string;
  memberAccountId: string;
  relationship: string;
  status: string;
  consentGivenAt?: string | null;
  createdAt: string;
  member: {
    userId: string;
    displayName: string;
    accountStatus: string;
  };
}

export interface MemberIndicator {
  recordedAt: string;
  socialEnergyAvg?: string | null;
  calmModeMinutes: number;
  messagesSent: number;
  messagesReceived: number;
}

export interface ParentAlert {
  id: string;
  alertType: string;
  severity: string;
  messageFr: string;
  messageEn: string;
  acknowledged: boolean;
  acknowledgedAt?: string | null;
  createdAt: string;
}

export const parentApi = {
  getMembers: () => request<ManagedMember[]>('/api/parent/members', { method: 'GET' }),

  getMemberIndicators: (userId: string) =>
    request<MemberIndicator[]>(`/api/parent/members/${userId}/indicators`, { method: 'GET' }),

  getMemberAlerts: (userId: string) =>
    request<ParentAlert[]>(`/api/parent/members/${userId}/alerts`, { method: 'GET' }),

  acknowledgeAlert: (userId: string, alertId: string) =>
    request<ParentAlert>(`/api/parent/members/${userId}/alerts/${alertId}/acknowledge`, {
      method: 'PATCH',
    }),
};
