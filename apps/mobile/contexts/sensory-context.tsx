import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from 'react';
import { preferencesApi } from '../lib/api/index';
import type { ColorIntensity } from '../lib/api/preferences';
import { useAuth } from './auth-context';
import { appStorage } from '../lib/storage';
import { STORAGE_KEYS } from '../lib/constants';

interface SensoryState {
  enableAnimations: boolean;
  colorIntensity: ColorIntensity;
  soundEnabled: boolean;
  hapticEnabled: boolean;
  isLoaded: boolean;
}

interface SensoryContextValue extends SensoryState {
  refreshSensory: () => Promise<void>;
}

const defaultState: SensoryState = {
  enableAnimations: true,
  colorIntensity: 'standard',
  soundEnabled: true,
  hapticEnabled: true,
  isLoaded: false,
};

const SensoryContext = createContext<SensoryContextValue>({
  ...defaultState,
  refreshSensory: async () => {},
});

interface CachedEntry {
  userId: string;
  enableAnimations: boolean;
  colorIntensity: ColorIntensity;
  soundEnabled: boolean;
  hapticEnabled: boolean;
}

async function loadCached(forUserId: string): Promise<SensoryState | null> {
  try {
    const parsed = await appStorage.getJSON<CachedEntry>(STORAGE_KEYS.SENSORY_PREFS);
    if (!parsed || !parsed.userId || parsed.userId !== forUserId) return null;
    return {
      enableAnimations: parsed.enableAnimations ?? true,
      colorIntensity: parsed.colorIntensity ?? 'standard',
      soundEnabled: parsed.soundEnabled ?? true,
      hapticEnabled: parsed.hapticEnabled ?? true,
      isLoaded: true,
    };
  } catch {
    return null;
  }
}

async function saveCache(userId: string, state: SensoryState): Promise<void> {
  try {
    const entry: CachedEntry = {
      userId,
      enableAnimations: state.enableAnimations,
      colorIntensity: state.colorIntensity,
      soundEnabled: state.soundEnabled,
      hapticEnabled: state.hapticEnabled,
    };
    await appStorage.setJSON(STORAGE_KEYS.SENSORY_PREFS, entry);
  } catch {
    // Ignore storage errors
  }
}

async function clearCache(): Promise<void> {
  try {
    await appStorage.remove(STORAGE_KEYS.SENSORY_PREFS);
  } catch {
    // Ignore
  }
}

export function SensoryProvider({ children }: { children: ReactNode }) {
  const { user, isLoading: authLoading } = useAuth();
  const [state, setState] = useState<SensoryState>(defaultState);
  const loadedForUserRef = useRef<string | null>(null);

  const fetchAndApply = useCallback(async () => {
    try {
      const prefs = await preferencesApi.getSensory();
      const next: SensoryState = {
        enableAnimations: prefs.enableAnimations,
        colorIntensity: (prefs.colorIntensity as ColorIntensity) || 'standard',
        soundEnabled: prefs.soundEnabled,
        hapticEnabled: true, // Not stored server-side yet, default on
        isLoaded: true,
      };
      setState(next);
      if (user?.id) {
        await saveCache(user.id, next);
        loadedForUserRef.current = user.id;
      }
    } catch {
      // Not authenticated or API error — keep current state
    }
  }, [user?.id]);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setState(defaultState);
      clearCache();
      loadedForUserRef.current = null;
      return;
    }

    if (loadedForUserRef.current === user.id) return;

    if (loadedForUserRef.current !== null && loadedForUserRef.current !== user.id) {
      setState(defaultState);
    }

    // Load cached prefs immediately, then fetch fresh
    loadCached(user.id).then(cached => {
      if (cached) setState(cached);
    });

    fetchAndApply();
  }, [user?.id, authLoading, fetchAndApply]);

  const value: SensoryContextValue = {
    ...state,
    refreshSensory: fetchAndApply,
  };

  return <SensoryContext.Provider value={value}>{children}</SensoryContext.Provider>;
}

export function useSensory() {
  return useContext(SensoryContext);
}
