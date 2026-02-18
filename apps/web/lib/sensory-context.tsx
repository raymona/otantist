'use client';

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { preferencesApi, type ColorIntensity } from './api';
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

  // Animations
  body.classList.toggle('sensory-no-animations', !state.enableAnimations);

  // Color intensity — only one active at a time
  body.classList.toggle('sensory-reduced', state.colorIntensity === 'reduced');
  body.classList.toggle('sensory-minimal', state.colorIntensity === 'minimal');
}

function clearBodyClasses() {
  if (typeof document === 'undefined') return;
  const { body } = document;
  body.classList.remove('sensory-no-animations', 'sensory-reduced', 'sensory-minimal');
}

function loadCached(): SensoryState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SENSORY_PREFS);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
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

function saveCache(state: SensoryState) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(
      STORAGE_KEYS.SENSORY_PREFS,
      JSON.stringify({
        enableAnimations: state.enableAnimations,
        colorIntensity: state.colorIntensity,
        soundEnabled: state.soundEnabled,
      })
    );
  } catch {
    // Ignore storage errors
  }
}

export function SensoryProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<SensoryState>(() => {
    const cached = loadCached();
    return cached ?? defaultState;
  });

  const isAuthenticated = useRef(false);

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
      saveCache(next);
      applyBodyClasses(next);
    } catch {
      // Not authenticated or API error — keep defaults
    }
  }, []);

  // On mount: check if authenticated, apply cached prefs immediately, then fetch fresh
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    isAuthenticated.current = !!token;

    // Apply cached state immediately to avoid flash
    const cached = loadCached();
    if (cached) {
      applyBodyClasses(cached);
    }

    if (token) {
      fetchAndApply();
    }

    return () => {
      clearBodyClasses();
    };
  }, [fetchAndApply]);

  // Re-fetch when window regains focus (e.g. returning from settings)
  useEffect(() => {
    const handleFocus = () => {
      if (typeof window === 'undefined') return;
      const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      if (token) {
        fetchAndApply();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [fetchAndApply]);

  // Re-apply classes whenever state changes
  useEffect(() => {
    if (state.isLoaded) {
      applyBodyClasses(state);
    }
  }, [state]);

  // Listen for storage changes (logout clears tokens)
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEYS.ACCESS_TOKEN && !e.newValue) {
        // Logged out — reset to defaults
        setState(defaultState);
        clearBodyClasses();
        try {
          localStorage.removeItem(STORAGE_KEYS.SENSORY_PREFS);
        } catch {
          // Ignore
        }
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const value: SensoryContextValue = {
    ...state,
    refreshSensory: fetchAndApply,
  };

  return <SensoryContext.Provider value={value}>{children}</SensoryContext.Provider>;
}

export function useSensory() {
  return useContext(SensoryContext);
}
