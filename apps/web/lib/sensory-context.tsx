'use client';

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { preferencesApi, type ColorIntensity } from './api';
import { useAuth } from './auth-context';
import { STORAGE_KEYS } from './constants';

interface SensoryState {
  enableAnimations: boolean;
  colorIntensity: ColorIntensity;
  soundEnabled: boolean;
  isLoaded: boolean;
}

interface SensoryContextValue extends SensoryState {
  refreshSensory: () => Promise<void>;
}

const defaultState: SensoryState = {
  enableAnimations: true,
  colorIntensity: 'standard',
  soundEnabled: true,
  isLoaded: false,
};

const SensoryContext = createContext<SensoryContextValue>({
  ...defaultState,
  refreshSensory: async () => {},
});

function applyBodyClasses(state: SensoryState) {
  if (typeof document === 'undefined') return;
  const { body } = document;
  body.classList.toggle('sensory-no-animations', !state.enableAnimations);
  body.classList.toggle('sensory-reduced', state.colorIntensity === 'reduced');
  body.classList.toggle('sensory-minimal', state.colorIntensity === 'minimal');
}

function clearBodyClasses() {
  if (typeof document === 'undefined') return;
  const { body } = document;
  body.classList.remove('sensory-no-animations', 'sensory-reduced', 'sensory-minimal');
}

// Cache is keyed by userId inside the stored object so a different user's
// cached prefs are never blindly applied.
interface CachedEntry {
  userId: string;
  enableAnimations: boolean;
  colorIntensity: ColorIntensity;
  soundEnabled: boolean;
}

function loadCached(forUserId: string): SensoryState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SENSORY_PREFS);
    if (!raw) return null;
    const parsed: CachedEntry = JSON.parse(raw);
    // Reject the cache if it belongs to a different user or has no userId
    // (old format from before this fix).
    if (!parsed.userId || parsed.userId !== forUserId) return null;
    return {
      enableAnimations: parsed.enableAnimations ?? true,
      colorIntensity: parsed.colorIntensity ?? 'standard',
      soundEnabled: parsed.soundEnabled ?? true,
      isLoaded: true,
    };
  } catch {
    return null;
  }
}

function saveCache(userId: string, state: SensoryState) {
  if (typeof window === 'undefined') return;
  try {
    const entry: CachedEntry = {
      userId,
      enableAnimations: state.enableAnimations,
      colorIntensity: state.colorIntensity,
      soundEnabled: state.soundEnabled,
    };
    localStorage.setItem(STORAGE_KEYS.SENSORY_PREFS, JSON.stringify(entry));
  } catch {
    // Ignore storage errors
  }
}

function clearCache() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEYS.SENSORY_PREFS);
  } catch {
    // Ignore
  }
}

export function SensoryProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoading: authLoading } = useAuth();
  const [state, setState] = useState<SensoryState>(defaultState);

  // Track the user ID we last fetched prefs for, so we can detect account switches.
  const loadedForUserRef = useRef<string | null>(null);

  const fetchAndApply = useCallback(async () => {
    try {
      const prefs = await preferencesApi.getSensory();
      const next: SensoryState = {
        enableAnimations: prefs.enableAnimations,
        colorIntensity: (prefs.colorIntensity as ColorIntensity) || 'standard',
        soundEnabled: prefs.soundEnabled,
        isLoaded: true,
      };
      setState(next);
      if (user?.id) {
        saveCache(user.id, next);
        loadedForUserRef.current = user.id;
      }
      applyBodyClasses(next);
    } catch {
      // Not authenticated or API error — keep current state
    }
  }, [user?.id]);

  // React to auth state changes:
  // - user becomes null (logout) → reset
  // - user.id changes (account switch) → load that user's cache then fetch fresh
  // - auth finishes loading and we have a user → load cache or fetch
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      // Logged out — clear everything
      setState(defaultState);
      clearBodyClasses();
      clearCache();
      loadedForUserRef.current = null;
      return;
    }

    // Already loaded for this user (e.g. re-render) — skip
    if (loadedForUserRef.current === user.id) return;

    // Different or new user — reset visuals first so we never show another
    // user's colour settings while the fetch is in flight.
    if (loadedForUserRef.current !== null && loadedForUserRef.current !== user.id) {
      setState(defaultState);
      clearBodyClasses();
    }

    // Try to apply this user's cached prefs immediately to avoid a visible flash
    const cached = loadCached(user.id);
    if (cached) {
      setState(cached);
      applyBodyClasses(cached);
    }

    // Always fetch fresh from the API
    fetchAndApply();
  }, [user?.id, authLoading, fetchAndApply]);

  // Re-apply classes whenever state changes (covers refreshSensory calls from settings)
  useEffect(() => {
    if (state.isLoaded) {
      applyBodyClasses(state);
    }
  }, [state]);

  // Re-fetch when the window regains focus (e.g. returning from settings in another tab)
  useEffect(() => {
    const handleFocus = () => {
      if (user?.id) fetchAndApply();
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [user?.id, fetchAndApply]);

  const value: SensoryContextValue = {
    ...state,
    refreshSensory: fetchAndApply,
  };

  return <SensoryContext.Provider value={value}>{children}</SensoryContext.Provider>;
}

export function useSensory() {
  return useContext(SensoryContext);
}
