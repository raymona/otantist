// Storage keys — single source of truth for all persisted keys
// Matches web app's STORAGE_KEYS for consistency
export const STORAGE_KEYS = {
  // SecureStore keys (sensitive)
  ACCESS_TOKEN: 'otantist-access-token',
  REFRESH_TOKEN: 'otantist-refresh-token',
  // AsyncStorage keys (non-sensitive)
  LANGUAGE: 'otantist-language',
  PENDING_EMAIL: 'otantist-pending-email',
  SENSORY_PREFS: 'otantist-sensory-prefs',
  DAILY_CHECKIN: 'otantist-daily-checkin',
  SESSION_TIMER: 'otantist-session-timer',
} as const;
