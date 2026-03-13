'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { STORAGE_KEYS } from './constants';

export type TimerDuration = 0 | 15 | 20 | 25 | 30; // 0 = off
export type TimerStatus = 'idle' | 'running' | 'warning5' | 'warning1' | 'expired';

interface StoredTimer {
  userId: string;
  duration: TimerDuration;
  startedAt: number | null; // timestamp when timer was started
}

function loadStoredTimer(userId: string): StoredTimer | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SESSION_TIMER);
    if (!raw) return null;
    const stored: StoredTimer = JSON.parse(raw);
    if (stored.userId !== userId) return null;
    return stored;
  } catch {
    return null;
  }
}

function saveStoredTimer(userId: string, duration: TimerDuration, startedAt: number | null) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(
      STORAGE_KEYS.SESSION_TIMER,
      JSON.stringify({ userId, duration, startedAt })
    );
  } catch {
    // Ignore
  }
}

function computeStatus(remaining: number): TimerStatus {
  if (remaining <= 0) return 'expired';
  if (remaining <= 60) return 'warning1';
  if (remaining <= 300) return 'warning5';
  return 'running';
}

interface UseSessionTimerOptions {
  userId: string | undefined;
  onExpired?: () => void;
}

export function useSessionTimer({ userId, onExpired }: UseSessionTimerOptions) {
  const [duration, setDurationState] = useState<TimerDuration>(0);
  const [status, setStatus] = useState<TimerStatus>('idle');
  const [secondsLeft, setSecondsLeft] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAtRef = useRef<number | null>(null);
  const durationRef = useRef<TimerDuration>(0);
  const onExpiredRef = useRef(onExpired);

  useEffect(() => {
    onExpiredRef.current = onExpired;
  }, [onExpired]);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const tick = useCallback(() => {
    if (!startedAtRef.current || durationRef.current === 0) return;

    const totalSeconds = durationRef.current * 60;
    const elapsed = Math.floor((Date.now() - startedAtRef.current) / 1000);
    const remaining = Math.max(0, totalSeconds - elapsed);
    setSecondsLeft(remaining);

    const newStatus = computeStatus(remaining);
    setStatus(newStatus);

    if (remaining === 0) {
      clearTimer();
      startedAtRef.current = null;
      if (userId) saveStoredTimer(userId, durationRef.current, null);
      onExpiredRef.current?.();
    }
  }, [userId, clearTimer]);

  const startInterval = useCallback(() => {
    clearTimer();
    intervalRef.current = setInterval(tick, 1000);
    tick(); // immediate first tick
  }, [clearTimer, tick]);

  // Load stored timer on mount / userId change — resume if active
  useEffect(() => {
    if (!userId) return;
    const stored = loadStoredTimer(userId);

    if (!stored) {
      setDurationState(0);
      durationRef.current = 0;
      setStatus('idle');
      setSecondsLeft(0);
      return;
    }

    setDurationState(stored.duration);
    durationRef.current = stored.duration;

    if (stored.startedAt && stored.duration > 0) {
      const totalSeconds = stored.duration * 60;
      const elapsed = Math.floor((Date.now() - stored.startedAt) / 1000);
      const remaining = Math.max(0, totalSeconds - elapsed);

      if (remaining > 0) {
        // Resume running timer
        startedAtRef.current = stored.startedAt;
        setSecondsLeft(remaining);
        setStatus(computeStatus(remaining));
        startInterval();
      } else {
        // Timer expired while away — show expired
        startedAtRef.current = null;
        setSecondsLeft(0);
        setStatus('expired');
        saveStoredTimer(userId, stored.duration, null);
        onExpiredRef.current?.();
      }
    } else {
      setStatus('idle');
      setSecondsLeft(stored.duration * 60);
    }
  }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Pick a duration: 0 = stop, >0 = start immediately
  const setDuration = useCallback(
    (d: TimerDuration) => {
      setDurationState(d);
      durationRef.current = d;
      clearTimer();

      if (d === 0) {
        // Turn off
        startedAtRef.current = null;
        setStatus('idle');
        setSecondsLeft(0);
        if (userId) saveStoredTimer(userId, 0, null);
      } else {
        // Start immediately
        const now = Date.now();
        startedAtRef.current = now;
        setSecondsLeft(d * 60);
        setStatus('running');
        if (userId) saveStoredTimer(userId, d, now);
        startInterval();
      }
    },
    [userId, clearTimer, startInterval]
  );

  // Dismiss break screen — reset to Off so user picks again
  const dismissBreak = useCallback(() => {
    clearTimer();
    startedAtRef.current = null;
    setDurationState(0);
    durationRef.current = 0;
    setStatus('idle');
    setSecondsLeft(0);
    if (userId) saveStoredTimer(userId, 0, null);
  }, [userId, clearTimer]);

  // Clean up on unmount
  useEffect(() => {
    return () => clearTimer();
  }, [clearTimer]);

  return {
    duration,
    setDuration,
    status,
    secondsLeft,
    dismissBreak,
  };
}
