import { STORAGE_KEYS } from './constants';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface ApiError {
  code: string;
  message: string;
  message_en?: string;
  message_fr?: string;
  statusCode?: number;
}

export class ApiException extends Error {
  code: string;
  message_en: string;
  message_fr: string;
  statusCode: number;

  constructor(error: ApiError, statusCode: number = 400) {
    super(error.message || error.message_en || 'An error occurred');
    this.code = error.code || 'UNKNOWN_ERROR';
    this.message_en = error.message_en || error.message || 'An error occurred';
    this.message_fr = error.message_fr || error.message || 'Une erreur est survenue';
    this.statusCode = error.statusCode || statusCode;
  }

  getLocalizedMessage(language: 'fr' | 'en'): string {
    return language === 'fr' ? this.message_fr : this.message_en;
  }
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
}

// Track whether a token refresh is already in progress to avoid concurrent refreshes
let refreshPromise: Promise<boolean> | null = null;

async function tryRefreshToken(): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  if (!refreshToken) return false;

  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) return false;

    const data = await response.json();
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, data.accessToken);
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, data.refreshToken);
    return true;
  } catch {
    return false;
  }
}

export async function request<T>(
  endpoint: string,
  options: RequestOptions = {},
  _isRetry = false
): Promise<T> {
  const { body, headers: customHeaders, ...rest } = options;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...customHeaders,
  };

  // Inject auth token if available (client-side only)
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    if (token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }
  }

  const config: RequestInit = {
    ...rest,
    headers,
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

  // On 401, attempt token refresh and retry once
  if (response.status === 401 && !_isRetry && typeof window !== 'undefined') {
    // Deduplicate concurrent refresh attempts
    if (!refreshPromise) {
      refreshPromise = tryRefreshToken().finally(() => {
        refreshPromise = null;
      });
    }
    const refreshed = await refreshPromise;
    if (refreshed) {
      return request<T>(endpoint, options, true);
    }
    // Refresh failed — clear auth state so user gets redirected to login
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  }

  if (!response.ok) {
    let errorData: ApiError;
    try {
      errorData = await response.json();
    } catch {
      errorData = {
        code: 'NETWORK_ERROR',
        message: 'Network error occurred',
        message_en: 'A network error occurred',
        message_fr: 'Une erreur réseau est survenue',
      };
    }
    throw new ApiException(errorData, response.status);
  }

  // Handle empty responses (204 No Content)
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

// Auth types
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
  onboardingComplete: boolean;
  onboardingStep?: string | null;
  createdAt?: string;
}

// Auth API
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

// Users API
export const usersApi = {
  getMe: () => request<User>('/api/users/me', { method: 'GET' }),

  updateProfile: (data: UpdateProfileData) =>
    request<User>('/api/users/me', {
      method: 'PATCH',
      body: data,
    }),

  getOnboardingStatus: () =>
    request<OnboardingStatus>('/api/users/me/onboarding-status', {
      method: 'GET',
    }),

  getDirectory: (search?: string) => {
    const params = search ? `?search=${encodeURIComponent(search)}` : '';
    return request<import('./types').UserDirectoryResponse>(`/api/users/directory${params}`, {
      method: 'GET',
    });
  },
};

// Profile types
export type AgeGroup = 'age_14_17' | 'age_18_25' | 'age_26_40' | 'age_40_plus';
export type ProfileVisibility = 'visible' | 'limited' | 'hidden';

export interface UpdateProfileData {
  displayName?: string;
  ageGroup?: AgeGroup;
  profileVisibility?: ProfileVisibility;
}

export interface OnboardingStatus {
  complete: boolean;
  currentStep?: string | null;
  steps: {
    emailVerified: boolean;
    legalAccepted: boolean;
    basicProfile: boolean;
    communicationPrefs: boolean;
    sensoryPrefs: boolean;
    conversationStarters: boolean;
  };
}

// Preferences types
export type TonePreference = 'gentle' | 'direct' | 'enthusiastic' | 'formal';
export type ColorIntensity = 'standard' | 'reduced' | 'minimal';

export interface CommunicationPrefs {
  commModes: string[];
  preferredTone?: TonePreference | null;
  slowRepliesOk?: boolean | null;
  oneMessageAtTime?: boolean | null;
  readWithoutReply?: boolean | null;
  sectionComplete: boolean;
}

export interface UpdateCommunicationPrefs {
  commModes?: string[];
  preferredTone?: TonePreference;
  slowRepliesOk?: boolean;
  oneMessageAtTime?: boolean;
  readWithoutReply?: boolean;
  sectionComplete?: boolean;
}

export interface SensoryPrefs {
  enableAnimations: boolean;
  colorIntensity?: ColorIntensity | null;
  soundEnabled: boolean;
  notificationLimit?: number | null;
  notificationGrouped: boolean;
  sectionComplete: boolean;
}

export interface UpdateSensoryPrefs {
  enableAnimations?: boolean;
  colorIntensity?: ColorIntensity;
  soundEnabled?: boolean;
  notificationLimit?: number;
  notificationGrouped?: boolean;
  sectionComplete?: boolean;
}

export interface ConversationStarters {
  goodTopics: string[];
  avoidTopics: string[];
  interactionTips: string[];
  sectionComplete: boolean;
}

export interface UpdateConversationStarters {
  goodTopics?: string[];
  avoidTopics?: string[];
  interactionTips?: string[];
  sectionComplete?: boolean;
}

// Preferences API
export const preferencesApi = {
  getCommunication: () =>
    request<CommunicationPrefs>('/api/preferences/communication', {
      method: 'GET',
    }),

  updateCommunication: (data: UpdateCommunicationPrefs) =>
    request<CommunicationPrefs>('/api/preferences/communication', {
      method: 'PATCH',
      body: data,
    }),

  getSensory: () =>
    request<SensoryPrefs>('/api/preferences/sensory', {
      method: 'GET',
    }),

  updateSensory: (data: UpdateSensoryPrefs) =>
    request<SensoryPrefs>('/api/preferences/sensory', {
      method: 'PATCH',
      body: data,
    }),

  getConversationStarters: () =>
    request<ConversationStarters>('/api/preferences/conversation-starters', {
      method: 'GET',
    }),

  updateConversationStarters: (data: UpdateConversationStarters) =>
    request<ConversationStarters>('/api/preferences/conversation-starters', {
      method: 'PATCH',
      body: data,
    }),
};
