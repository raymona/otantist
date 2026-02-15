'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { authApi, usersApi, RegisterData, LoginData, User, ApiException } from './api';
import { STORAGE_KEYS } from './constants';

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginData) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { i18n } = useTranslation();
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const clearAuth = useCallback(() => {
    setUser(null);
    setAccessToken(null);
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  }, []);

  const storeTokens = useCallback((access: string, refresh: string) => {
    setAccessToken(access);
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, access);
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refresh);
  }, []);

  const fetchUser = useCallback(async () => {
    try {
      const userData = await usersApi.getMe();
      setUser(userData);
      if (userData.language && userData.language !== i18n.language) {
        i18n.changeLanguage(userData.language);
      }
    } catch (error) {
      // If fetching user fails, try to refresh token
      const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
      if (refreshToken) {
        try {
          const response = await authApi.refresh(refreshToken);
          storeTokens(response.accessToken, response.refreshToken);
          const userData = await usersApi.getMe();
          setUser(userData);
          if (userData.language && userData.language !== i18n.language) {
            i18n.changeLanguage(userData.language);
          }
        } catch {
          clearAuth();
        }
      } else {
        clearAuth();
      }
    }
  }, [clearAuth, storeTokens, i18n]);

  // Initialize auth state on mount
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      if (storedToken) {
        setAccessToken(storedToken);
        await fetchUser();
      }
      setIsLoading(false);
    };

    initAuth();
  }, [fetchUser]);

  const login = useCallback(
    async (data: LoginData) => {
      const response = await authApi.login(data);
      storeTokens(response.accessToken, response.refreshToken);
      await fetchUser();
    },
    [storeTokens, fetchUser]
  );

  const register = useCallback(
    async (data: RegisterData) => {
      const response = await authApi.register(data);
      storeTokens(response.accessToken, response.refreshToken);
      // Don't fetch user after registration - they need to verify email first
    },
    [storeTokens]
  );

  const logout = useCallback(() => {
    clearAuth();
  }, [clearAuth]);

  const refreshUser = useCallback(async () => {
    if (accessToken) {
      await fetchUser();
    }
  }, [accessToken, fetchUser]);

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Helper hook for getting localized error messages
export function useApiError() {
  const getErrorMessage = useCallback((error: unknown, language: 'fr' | 'en' = 'en'): string => {
    if (error instanceof ApiException) {
      return error.getLocalizedMessage(language);
    }
    if (error instanceof Error) {
      return error.message;
    }
    return language === 'fr' ? 'Une erreur est survenue' : 'An error occurred';
  }, []);

  return { getErrorMessage };
}
