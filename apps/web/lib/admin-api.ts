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

  listInviteCodes: () => request<InviteCode[]>('/api/admin/invite-codes', { method: 'GET' }),

  createInviteCode: (code: string, maxUses?: number, expiresAt?: string) =>
    request<InviteCode>('/api/admin/invite-codes', {
      method: 'POST',
      body: { code, ...(maxUses !== undefined && { maxUses }), ...(expiresAt && { expiresAt }) },
    }),
};
