import Constants from 'expo-constants';
import { secureStorage } from './storage';

const API_BASE_URL = Constants.expoConfig?.extra?.apiBaseUrl || 'http://localhost:3001';

export { API_BASE_URL };

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

// In-memory token cache for synchronous access (SecureStore is async)
let cachedAccessToken: string | null = null;

export function getCachedAccessToken(): string | null {
  return cachedAccessToken;
}

export function setCachedAccessToken(token: string | null): void {
  cachedAccessToken = token;
}

// Track whether a token refresh is already in progress
let refreshPromise: Promise<boolean> | null = null;

async function tryRefreshToken(): Promise<boolean> {
  const refreshToken = await secureStorage.getRefreshToken();
  if (!refreshToken) return false;

  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) return false;

    const data = await response.json();
    cachedAccessToken = data.accessToken;
    await secureStorage.setAccessToken(data.accessToken);
    await secureStorage.setRefreshToken(data.refreshToken);
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

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(customHeaders as Record<string, string>),
  };

  // Inject auth token — use in-memory cache first, fall back to SecureStore
  let token = cachedAccessToken;
  if (!token) {
    token = await secureStorage.getAccessToken();
    if (token) cachedAccessToken = token;
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
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
  if (response.status === 401 && !_isRetry) {
    if (!refreshPromise) {
      refreshPromise = tryRefreshToken().finally(() => {
        refreshPromise = null;
      });
    }
    const refreshed = await refreshPromise;
    if (refreshed) {
      return request<T>(endpoint, options, true);
    }
    // Refresh failed — clear auth state
    cachedAccessToken = null;
    await secureStorage.clearTokens();
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
