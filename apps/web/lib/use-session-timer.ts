'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { STORAGE_KEYS } from './constants';

export type TimerDuration = 0 | 15 | 20 | 25 | 30; // 0 = off
export type TimerStatus = 'idle' | 'running' | 'warning5' | 'warning1' | 'expired';

interface StoredTimer {
  userId: string;
  duration: TimerDuration;
}

export function loadTimerDuration(userId: string): TimerDuration {
  if (typeof window === 'undefined') return 0;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SESSION_TIMER);
    if (!raw) return 20; // default 20 min
    const stored: StoredTimer = JSON.parse(raw);
    if (stored.userId !== userId) return 20;
    return stored.duration;
  } catch {
    return 20;
  }
}

export function saveTimerDuration(userId: string, duration: TimerDuration) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.SESSION_TIMER, JSON.stringify({ userId, duration }));
  } catch {
    // Ignore
  }
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

  // Load stored duration when userId is available
  useEffect(() => {
    if (!userId) return;
    const d = loadTimerDuration(userId);
    setDurationState(d);
    durationRef.current = d;
  }, [userId]);

  const setDuration = useCallback(
    (d: TimerDuration) => {
      setDurationState(d);
      durationRef.current = d;
      if (userId) saveTimerDuration(userId, d);
      // If timer is running, reset it
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      startedAtRef.current = null;
      setStatus('idle');
      setSecondsLeft(d * 60);
    },
    [userId]
  );

  const startTimer = useCallback(() => {
    const dur = durationRef.current;
    if (dur === 0 || intervalRef.current) return; // off or already running

    const totalSeconds = dur * 60;
    startedAtRef.current = Date.now();
    setSecondsLeft(totalSeconds);
    setStatus('running');

    intervalRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startedAtRef.current!) / 1000);
      const remaining = Math.max(0, totalSeconds - elapsed);
      setSecondsLeft(remaining);

      if (remaining === 0) {
        setStatus('expired');
        clearInterval(intervalRef.current!);
        intervalRef.current = null;
        onExpiredRef.current?.();
      } else if (remaining <= 60) {
        setStatus('warning1');
      } else if (remaining <= 300) {
        setStatus('warning5');
      } else {
        setStatus('running');
      }
    }, 1000);
  }, []);

  const resetTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    startedAtRef.current = null;
    setStatus('idle');
    setSecondsLeft(durationRef.current * 60);
  }, []);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return {
    duration,
    setDuration,
    status,
    secondsLeft,
    startTimer,
    resetTimer,
  };
}
