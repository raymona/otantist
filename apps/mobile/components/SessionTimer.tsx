import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, AppState } from 'react-native';
import { useTranslation } from 'react-i18next';
import { appStorage } from '../lib/storage';
import { STORAGE_KEYS } from '../lib/constants';

interface SessionTimerProps {
  userId: string | undefined;
}

export function SessionTimer({ userId }: SessionTimerProps) {
  const { t } = useTranslation('dashboard');
  const [duration, setDuration] = useState(0); // in minutes, 0 = off
  const [remaining, setRemaining] = useState(0); // in seconds
  const [isActive, setIsActive] = useState(false);
  const [showBreak, setShowBreak] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(null);
  const startedAtRef = useRef<number>(0);

  // Load timer settings
  useEffect(() => {
    if (!userId) return;
    const load = async () => {
      const timerVal = await appStorage.get(STORAGE_KEYS.SESSION_TIMER);
      const mins = timerVal ? parseInt(timerVal, 10) : 0;
      setDuration(mins);

      // Check if we have an active session (startedAt saved)
      const startedAt = await appStorage.get(`${STORAGE_KEYS.SESSION_TIMER}_started_${userId}`);
      if (startedAt && mins > 0) {
        const elapsed = Math.floor((Date.now() - parseInt(startedAt, 10)) / 1000);
        const totalSeconds = mins * 60;
        const left = totalSeconds - elapsed;
        if (left > 0) {
          startedAtRef.current = parseInt(startedAt, 10);
          setRemaining(left);
          setIsActive(true);
        } else {
          // Timer expired while away
          setShowBreak(true);
          setIsActive(false);
          await appStorage.remove(`${STORAGE_KEYS.SESSION_TIMER}_started_${userId}`);
        }
      }
    };
    load();
  }, [userId]);

  // Start timer when duration changes and is > 0
  useEffect(() => {
    if (duration > 0 && !isActive && !showBreak) {
      const startTime = Date.now();
      startedAtRef.current = startTime;
      setRemaining(duration * 60);
      setIsActive(true);
      if (userId) {
        appStorage.set(`${STORAGE_KEYS.SESSION_TIMER}_started_${userId}`, String(startTime));
      }
    }
  }, [duration]);

  // Countdown tick
  useEffect(() => {
    if (!isActive) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startedAtRef.current) / 1000);
      const totalSeconds = duration * 60;
      const left = totalSeconds - elapsed;

      if (left <= 0) {
        setRemaining(0);
        setIsActive(false);
        setShowBreak(true);
        if (userId) {
          appStorage.remove(`${STORAGE_KEYS.SESSION_TIMER}_started_${userId}`);
        }
      } else {
        setRemaining(left);
      }
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive, duration, userId]);

  // Recalculate on app foreground
  useEffect(() => {
    const sub = AppState.addEventListener('change', nextState => {
      if (nextState === 'active' && isActive && startedAtRef.current) {
        const elapsed = Math.floor((Date.now() - startedAtRef.current) / 1000);
        const totalSeconds = duration * 60;
        const left = totalSeconds - elapsed;
        if (left <= 0) {
          setRemaining(0);
          setIsActive(false);
          setShowBreak(true);
          if (userId) {
            appStorage.remove(`${STORAGE_KEYS.SESSION_TIMER}_started_${userId}`);
          }
        } else {
          setRemaining(left);
        }
      }
    });
    return () => sub.remove();
  }, [isActive, duration, userId]);

  const handleDismissBreak = async () => {
    setShowBreak(false);
    setDuration(0);
    setRemaining(0);
    if (userId) {
      await appStorage.set(STORAGE_KEYS.SESSION_TIMER, '0');
    }
  };

  const formatRemaining = () => {
    const mins = Math.floor(remaining / 60);
    const secs = remaining % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Don't render anything if timer is off
  if (duration === 0 && !showBreak) return null;

  return (
    <>
      {/* Timer pill — shown when active */}
      {isActive && remaining > 0 && (
        <View style={styles.timerPill} accessibilityRole="timer">
          <Text style={styles.timerText}>{formatRemaining()}</Text>
        </View>
      )}

      {/* Break overlay */}
      <Modal visible={showBreak} animationType="fade" transparent>
        <View style={styles.breakOverlay}>
          <View style={styles.breakCard}>
            <Text style={styles.breakIcon} accessibilityRole="image">
              ☕
            </Text>
            <Text style={styles.breakTitle}>{t('timer.break_title')}</Text>
            <Text style={styles.breakMessage}>{t('timer.break_body')}</Text>
            <TouchableOpacity style={styles.breakButton} onPress={handleDismissBreak}>
              <Text style={styles.breakButtonText}>{t('timer.break_dismiss')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  timerPill: {
    position: 'absolute',
    top: 56,
    alignSelf: 'center',
    backgroundColor: 'rgba(37, 99, 235, 0.9)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
    zIndex: 100,
  },
  timerText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  breakOverlay: {
    flex: 1,
    backgroundColor: 'rgba(17, 24, 39, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  breakCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    width: '100%',
    maxWidth: 340,
  },
  breakIcon: { fontSize: 48, marginBottom: 16 },
  breakTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  breakMessage: {
    fontSize: 15,
    color: '#4b5563',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  breakButton: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  breakButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
