// Storage keys — single source of truth for all localStorage keys
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'otantist-access-token',
  REFRESH_TOKEN: 'otantist-refresh-token',
  LANGUAGE: 'otantist-language',
  PENDING_EMAIL: 'otantist-pending-email',
} as const;
