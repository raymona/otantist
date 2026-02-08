import { request } from './api';
import type { BlockedUser, CreateReportData, ReportResponse } from './types';

export const safetyApi = {
  getBlockedUsers: () => request<BlockedUser[]>('/api/blocked-users', { method: 'GET' }),

  blockUser: (userId: string) =>
    request<BlockedUser>(`/api/blocked-users/${userId}`, { method: 'POST' }),

  unblockUser: (userId: string) =>
    request<void>(`/api/blocked-users/${userId}`, { method: 'DELETE' }),

  submitReport: (data: CreateReportData) =>
    request<ReportResponse>('/api/reports', {
      method: 'POST',
      body: data,
    }),
};
