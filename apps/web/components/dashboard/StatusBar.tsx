'use client';

import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import type { SocialEnergyLevel } from '@/lib/types';
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
  calmModeActive: boolean;
  onCalmModeToggle: () => void;
  socialEnergy: SocialEnergyLevel | null;
  onEnergyChange: (level: SocialEnergyLevel) => void;
}

export default function StatusBar({
  onOpenBlockedUsers,
  isConnected,
  calmModeActive,
  onCalmModeToggle,
  socialEnergy,
  onEnergyChange,
}: StatusBarProps) {
  const { t } = useTranslation('dashboard');
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const energyLabel = socialEnergy ? t(`status_bar.energy_${socialEnergy}`) : '—';

  return (
    <header className="flex items-center justify-between gap-4 border-b border-gray-200 bg-white px-4 py-2">
      {/* Left: user info + energy */}
      <div className="flex items-center gap-4">
        <Link
          href="/settings"
          className="flex max-w-[180px] items-center gap-1.5 text-sm font-medium text-gray-700 transition-colors hover:text-blue-600"
        >
          <span className="truncate">{user?.displayName || user?.email}</span>
          {calmModeActive && (
            <svg
              className="h-4 w-4 flex-shrink-0 text-purple-600"
              fill="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </Link>

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
                aria-checked={socialEnergy === level}
                aria-label={t(`status_bar.energy_${level}`)}
                title={t(`status_bar.energy_${level}`)}
                onClick={() => onEnergyChange(level)}
                className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold text-white transition-all ${
                  energyColors[level]
                } ${socialEnergy === level ? 'scale-110 ring-2 ring-gray-400 ring-offset-1' : 'opacity-40 hover:opacity-70'}`}
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
          onClick={onCalmModeToggle}
          aria-pressed={calmModeActive}
          className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            calmModeActive
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
          {calmModeActive ? t('status_bar.calm_mode_on') : t('status_bar.calm_mode_off')}
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

        {/* Parent dashboard link — only shown to parent accounts */}
        {user?.isParent && (
          <Link
            href="/parent"
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
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            {t('status_bar.parent_dashboard')}
          </Link>
        )}

        {/* Moderation link */}
        <Link
          href="/moderation"
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
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
            />
          </svg>
          {t('status_bar.moderation')}
        </Link>

        {/* Help link */}
        <Link
          href="/help"
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
              d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          {t('status_bar.help')}
        </Link>

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
