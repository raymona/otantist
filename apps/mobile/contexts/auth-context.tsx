import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { useTranslation } from 'react-i18next';
import { secureStorage } from '../lib/storage';
import { setCachedAccessToken, ApiException } from '../lib/api';
import { authApi, usersApi } from '../lib/api/index';
import type { LoginData, RegisterData, User } from '../lib/api/auth';

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginData) => Promise<void>;
  register: (data: RegisterData) => Promise<User>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { i18n } = useTranslation();
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const clearAuth = useCallback(async () => {
    setUser(null);
    setAccessToken(null);
    setCachedAccessToken(null);
    await secureStorage.clearTokens();
  }, []);

  const storeTokens = useCallback(async (access: string, refresh: string) => {
    setAccessToken(access);
    setCachedAccessToken(access);
    await secureStorage.setAccessToken(access);
    await secureStorage.setRefreshToken(refresh);
  }, []);

  const fetchUser = useCallback(async () => {
    try {
      const userData = await usersApi.getMe();
      setUser(userData);
      if (userData.language && userData.language !== i18n.language) {
        i18n.changeLanguage(userData.language);
      }
    } catch {
      // If fetching user fails, try to refresh token
      const refreshToken = await secureStorage.getRefreshToken();
      if (refreshToken) {
        try {
          const response = await authApi.refresh(refreshToken);
          await storeTokens(response.accessToken, response.refreshToken);
          const userData = await usersApi.getMe();
          setUser(userData);
          if (userData.language && userData.language !== i18n.language) {
            i18n.changeLanguage(userData.language);
          }
        } catch {
          await clearAuth();
        }
      } else {
        await clearAuth();
      }
    }
  }, [clearAuth, storeTokens, i18n]);

  // Initialize auth state on mount
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = await secureStorage.getAccessToken();
      if (storedToken) {
        setAccessToken(storedToken);
        setCachedAccessToken(storedToken);
        await fetchUser();
      }
      setIsLoading(false);
    };

    initAuth();
  }, [fetchUser]);

  const login = useCallback(
    async (data: LoginData) => {
      const response = await authApi.login(data);
      await storeTokens(response.accessToken, response.refreshToken);
      await fetchUser();
    },
    [storeTokens, fetchUser]
  );

  const register = useCallback(
    async (data: RegisterData): Promise<User> => {
      const response = await authApi.register(data);
      await storeTokens(response.accessToken, response.refreshToken);
      const userData = await usersApi.getMe();
      setUser(userData);
      return userData;
    },
    [storeTokens]
  );

  const logout = useCallback(async () => {
    await clearAuth();
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
    return language === 'fr' ? "Une erreur s'est produite" : 'An error occurred';
  }, []);

  return { getErrorMessage };
}
