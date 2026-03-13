'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';
import { useAuth } from './auth-context';
import { useSessionTimer, type TimerDuration, type TimerStatus } from './use-session-timer';

interface SessionTimerContextValue {
  duration: TimerDuration;
  status: TimerStatus;
  secondsLeft: number;
  setDuration: (d: TimerDuration) => void;
  dismissBreak: () => void;
  showBreakScreen: boolean;
  setShowBreakScreen: (v: boolean) => void;
}

const SessionTimerContext = createContext<SessionTimerContextValue | null>(null);

export function SessionTimerProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [showBreakScreen, setShowBreakScreen] = useState(false);

  const { duration, setDuration, status, secondsLeft, dismissBreak } = useSessionTimer({
    userId: user?.id,
    onExpired: () => setShowBreakScreen(true),
  });

  return (
    <SessionTimerContext.Provider
      value={{
        duration,
        status,
        secondsLeft,
        setDuration,
        dismissBreak,
        showBreakScreen,
        setShowBreakScreen,
      }}
    >
      {children}
    </SessionTimerContext.Provider>
  );
}

export function useSessionTimerContext() {
  const ctx = useContext(SessionTimerContext);
  if (!ctx) {
    throw new Error('useSessionTimerContext must be used within SessionTimerProvider');
  }
  return ctx;
}
