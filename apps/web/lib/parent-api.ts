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

export interface GenerateCodeResponse {
  code: string;
  inviteCode: string;
  expiresAt: string;
}

export interface LinkToParentResponse {
  success: boolean;
}

export const parentApi = {
  generateLinkingCode: (relationship?: 'parent' | 'legal_guardian' | 'other') =>
    request<GenerateCodeResponse>('/api/parent/generate-code', {
      method: 'POST',
      body: relationship ? { relationship } : {},
    }),

  linkToParent: (code: string) =>
    request<LinkToParentResponse>('/api/parent/link', {
      method: 'POST',
      body: { code },
    }),

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
