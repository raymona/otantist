import { request } from '../api';

export interface RegisterData {
  email: string;
  password: string;
  inviteCode: string;
  language: 'fr' | 'en';
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface User {
  id: string;
  accountId: string;
  email: string;
  displayName?: string;
  ageGroup?: string;
  profileVisibility?: string;
  language: 'fr' | 'en';
  emailVerified: boolean;
  legalAccepted: boolean;
  isParent: boolean;
  isModerator: boolean;
  isSuperAdmin: boolean;
  onboardingComplete: boolean;
  onboardingStep?: string | null;
  createdAt?: string;
}

export const authApi = {
  register: (data: RegisterData) =>
    request<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: data,
    }),

  login: (data: LoginData) =>
    request<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: data,
    }),

  refresh: (refreshToken: string) =>
    request<AuthResponse>('/api/auth/refresh', {
      method: 'POST',
      body: { refreshToken },
    }),

  verifyEmail: (token: string) =>
    request<{ message: string }>('/api/auth/verify-email', {
      method: 'POST',
      body: { token },
    }),

  resendVerification: (email: string) =>
    request<{ message: string }>('/api/auth/resend-verification', {
      method: 'POST',
      body: { email },
    }),

  forgotPassword: (email: string) =>
    request<{ message: string }>('/api/auth/forgot-password', {
      method: 'POST',
      body: { email },
    }),

  resetPassword: (token: string, password: string) =>
    request<{ message: string }>('/api/auth/reset-password', {
      method: 'POST',
      body: { token, password },
    }),

  acceptTerms: () =>
    request<{ message: string }>('/api/auth/accept-terms', {
      method: 'POST',
      body: { accepted: true },
    }),
};
