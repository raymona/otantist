import { request } from './api';

export interface AdminUser {
  accountId: string;
  email: string;
  displayName: string | null;
  accountType: string;
  status: string;
  emailVerified: boolean;
  onboardingComplete: boolean;
  createdAt: string;
}

export interface InviteCode {
  id: string;
  code: string;
  maxUses: number;
  currentUses: number;
  expiresAt: string | null;
  createdAt: string;
}

export interface InviteRequest {
  id: string;
  name: string;
  email: string;
  context: string;
  message: string | null;
  language: string;
  status: string;
  createdAt: string;
  reviewedAt: string | null;
  inviteCode?: string | null;
}

export const adminApi = {
  listUsers: (search?: string) => {
    const params = search ? `?search=${encodeURIComponent(search)}` : '';
    return request<AdminUser[]>(`/api/admin/users${params}`, { method: 'GET' });
  },

  setRole: (accountId: string, role: 'adult' | 'moderator' | 'super_admin') =>
    request<AdminUser>('/api/admin/users/set-role', {
      method: 'PATCH',
      body: { accountId, role },
    }),

  deleteUser: (accountId: string) =>
    request<{ deleted: true }>(`/api/admin/users/${accountId}`, { method: 'DELETE' }),

  listInviteCodes: () => request<InviteCode[]>('/api/admin/invite-codes', { method: 'GET' }),

  createInviteCode: (code: string, maxUses?: number, expiresAt?: string) =>
    request<InviteCode>('/api/admin/invite-codes', {
      method: 'POST',
      body: { code, ...(maxUses !== undefined && { maxUses }), ...(expiresAt && { expiresAt }) },
    }),

  listInviteRequests: (status?: string) => {
    const params = status ? `?status=${encodeURIComponent(status)}` : '';
    return request<InviteRequest[]>(`/api/invite-request${params}`, { method: 'GET' });
  },

  countPendingRequests: () =>
    request<{ count: number }>('/api/invite-request/count', { method: 'GET' }),

  reviewInviteRequest: (requestId: string, decision: 'approved' | 'rejected') =>
    request<InviteRequest>('/api/invite-request/review', {
      method: 'POST',
      body: { requestId, decision },
    }),
};
