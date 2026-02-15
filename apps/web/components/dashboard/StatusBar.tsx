'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { stateApi } from '@/lib/state-api';
import type { UserState, SocialEnergyLevel } from '@/lib/types';
import LanguageSwitcher from '@/components/LanguageSwitcher';

const ENERGY_LEVELS: SocialEnergyLevel[] = ['high', 'medium', 'low'];

const energyColors: Record<SocialEnergyLevel, string> = {
  high: 'bg-green-500',
  medium: 'bg-yellow-500',
  low: 'bg-red-500',
};

interface StatusBarProps {
  onOpenBlockedUsers?: () => void;
  isConnected?: boolean;
}

export default function StatusBar({ onOpenBlockedUsers, isConnected }: StatusBarProps) {
  const { t } = useTranslation('dashboard');
  const router = useRouter();
  const { user, logout } = useAuth();
  const [state, setState] = useState<UserState | null>(null);

  const fetchState = useCallback(async () => {
    try {
      const data = await stateApi.getCurrent();
      setState(data);
    } catch {
      // Non-critical: status bar works without state data
    }
  }, []);

  useEffect(() => {
    fetchState();
  }, [fetchState]);

  const handleEnergyChange = async (level: SocialEnergyLevel) => {
    try {
      const data = await stateApi.updateSocialEnergy(level);
      setState(data);
    } catch {
      // Non-critical: energy update failure is visible by unchanged UI
    }
  };

  const handleCalmToggle = async () => {
    try {
      if (state?.calmModeActive) {
        await stateApi.deactivateCalmMode();
        setState(prev => (prev ? { ...prev, calmModeActive: false, calmModeStarted: null } : prev));
      } else {
        await stateApi.activateCalmMode();
        setState(prev =>
          prev ? { ...prev, calmModeActive: true, calmModeStarted: new Date().toISOString() } : prev
        );
      }
    } catch {
      // Non-critical: calm mode toggle failure is visible by unchanged UI
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const energyLevel = state?.socialEnergy;
  const energyLabel = energyLevel ? t(`status_bar.energy_${energyLevel}`) : '—';

  return (
    <header className="flex items-center justify-between gap-4 border-b border-gray-200 bg-white px-4 py-2">
      {/* Left: user info + energy */}
      <div className="flex items-center gap-4">
        <span className="max-w-[150px] truncate text-sm font-medium text-gray-700">
          {user?.displayName || user?.email}
        </span>

        {/* Energy level selector */}
        <div
          role="radiogroup"
          aria-label={t('status_bar.energy')}
          className="flex items-center gap-2"
        >
          <span className="text-xs text-gray-500" aria-hidden="true">
            {t('status_bar.energy')}
          </span>
          <div className="flex gap-1">
            {ENERGY_LEVELS.map(level => (
              <button
                key={level}
                role="radio"
                aria-checked={energyLevel === level}
                aria-label={t(`status_bar.energy_${level}`)}
                title={t(`status_bar.energy_${level}`)}
                onClick={() => handleEnergyChange(level)}
                className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold text-white transition-all ${
                  energyColors[level]
                } ${energyLevel === level ? 'scale-110 ring-2 ring-gray-400 ring-offset-1' : 'opacity-40 hover:opacity-70'}`}
              >
                {t(`status_bar.energy_${level}`).charAt(0).toUpperCase()}
              </button>
            ))}
          </div>
          <span className="text-xs text-gray-500" aria-live="polite">
            {energyLabel}
          </span>
        </div>
      </div>

      {/* Right: calm mode + language + logout */}
      <nav aria-label={t('common:app_name')} className="flex items-center gap-3">
        {/* Calm mode toggle */}
        <button
          onClick={handleCalmToggle}
          aria-pressed={state?.calmModeActive ?? false}
          className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            state?.calmModeActive
              ? 'border border-purple-300 bg-purple-100 text-purple-700'
              : 'border border-gray-200 bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <svg
            className="h-3.5 w-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
            />
          </svg>
          {t('status_bar.calm_mode')}{' '}
          {state?.calmModeActive ? t('status_bar.calm_mode_on') : t('status_bar.calm_mode_off')}
        </button>

        {/* Blocked users button */}
        <button
          onClick={onOpenBlockedUsers}
          className="flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-200"
        >
          <svg
            className="h-3.5 w-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
            />
          </svg>
          {t('status_bar.blocked_users')}
        </button>

        {/* Connection status */}
        <span
          role="status"
          aria-live="polite"
          className={`flex items-center gap-1 text-xs ${
            isConnected ? 'text-green-600' : 'text-amber-600'
          }`}
        >
          <span
            aria-hidden="true"
            className={`h-1.5 w-1.5 rounded-full ${isConnected ? 'bg-green-500' : 'bg-amber-500'}`}
          />
          {isConnected ? t('status_bar.connected') : t('status_bar.reconnecting')}
        </span>

        <LanguageSwitcher />

        <button
          onClick={handleLogout}
          className="rounded-lg border border-red-300 px-3 py-1 text-xs text-red-600 transition-colors hover:bg-red-50"
        >
          {t('common:logout')}
        </button>
      </nav>
    </header>
  );
}
