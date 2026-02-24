'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import type { SocialEnergyLevel } from '@/lib/types';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { moderationApi } from '@/lib/moderation-api';

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

  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const moreButtonRef = useRef<HTMLButtonElement>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);
  const [pendingModerationCount, setPendingModerationCount] = useState(0);

  // Poll moderation pending count every 60s for moderators
  useEffect(() => {
    if (!user?.isModerator) return;
    const fetchCount = () => {
      moderationApi
        .getStats()
        .then(s => setPendingModerationCount(s.pending + s.reviewing))
        .catch(() => {});
    };
    fetchCount();
    const interval = setInterval(fetchCount, 60_000);
    return () => clearInterval(interval);
  }, [user?.isModerator]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const energyLabel = socialEnergy ? t(`status_bar.energy_${socialEnergy}`) : '—';

  // Close More menu on click outside or Escape
  useEffect(() => {
    if (!moreMenuOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        moreMenuRef.current &&
        !moreMenuRef.current.contains(e.target as Node) &&
        moreButtonRef.current &&
        !moreButtonRef.current.contains(e.target as Node)
      ) {
        setMoreMenuOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMoreMenuOpen(false);
        moreButtonRef.current?.focus();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [moreMenuOpen]);

  return (
    <header className="flex items-center justify-between gap-2 border-b border-gray-200 bg-white px-3 py-2 md:gap-4 md:px-4">
      {/* Left: user info + energy */}
      <div className="flex min-w-0 items-center gap-2 md:gap-4">
        <Link
          href="/settings"
          className="flex max-w-[140px] items-center gap-1.5 text-sm font-medium text-gray-700 transition-colors hover:text-blue-600 md:max-w-[180px]"
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
          className="flex items-center gap-1.5 md:gap-2"
        >
          <span className="hidden text-xs text-gray-500 sm:inline" aria-hidden="true">
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
          <span className="hidden text-xs text-gray-500 sm:inline" aria-live="polite">
            {energyLabel}
          </span>
        </div>
      </div>

      {/* Right: calm mode + (desktop: full nav) + (mobile: more button) */}
      <nav aria-label={t('common:app_name')} className="flex items-center gap-2 md:gap-3">
        {/* Calm mode toggle — always visible */}
        <button
          onClick={onCalmModeToggle}
          aria-pressed={calmModeActive}
          className={`flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium transition-colors md:px-3 ${
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
          <span className="hidden sm:inline">
            {t('status_bar.calm_mode')}{' '}
            {calmModeActive ? t('status_bar.calm_mode_on') : t('status_bar.calm_mode_off')}
          </span>
        </button>

        {/* Desktop nav items — hidden on mobile */}
        <div className="hidden items-center gap-3 md:flex">
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

          {/* Moderation link — moderators only */}
          {user?.isModerator && (
            <Link
              href="/moderation"
              className="relative flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-200"
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
              {pendingModerationCount > 0 && (
                <span
                  aria-label={t('status_bar.moderation_badge', { count: pendingModerationCount })}
                  className="ml-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white"
                >
                  {pendingModerationCount > 99 ? '99+' : pendingModerationCount}
                </span>
              )}
            </Link>
          )}

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

          {/* Feedback link */}
          <Link
            href="/feedback"
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
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
            {t('common:feedback.nav_link')}
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
        </div>

        {/* Mobile More button — hidden on desktop */}
        <div className="relative md:hidden">
          <button
            ref={moreButtonRef}
            type="button"
            aria-label={t('status_bar.more_options')}
            aria-expanded={moreMenuOpen}
            aria-haspopup="true"
            onClick={() => setMoreMenuOpen(prev => !prev)}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-gray-100 text-lg leading-none text-gray-600 hover:bg-gray-200"
          >
            <span aria-hidden="true">⋮</span>
          </button>

          {moreMenuOpen && (
            <div
              ref={moreMenuRef}
              role="menu"
              aria-label={t('status_bar.more_options')}
              className="absolute top-full right-0 z-50 mt-1 w-52 rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
            >
              {/* Blocked users */}
              <button
                role="menuitem"
                onClick={() => {
                  setMoreMenuOpen(false);
                  onOpenBlockedUsers?.();
                }}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
              >
                <svg
                  className="h-4 w-4 flex-shrink-0"
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

              {/* Parent link */}
              {user?.isParent && (
                <Link
                  role="menuitem"
                  href="/parent"
                  onClick={() => setMoreMenuOpen(false)}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <svg
                    className="h-4 w-4 flex-shrink-0"
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

              {/* Moderation link — moderators only */}
              {user?.isModerator && (
                <Link
                  role="menuitem"
                  href="/moderation"
                  onClick={() => setMoreMenuOpen(false)}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <svg
                    className="h-4 w-4 flex-shrink-0"
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
                  {pendingModerationCount > 0 && (
                    <span
                      aria-hidden="true"
                      className="ml-auto flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white"
                    >
                      {pendingModerationCount > 99 ? '99+' : pendingModerationCount}
                    </span>
                  )}
                </Link>
              )}

              {/* Help link */}
              <Link
                role="menuitem"
                href="/help"
                onClick={() => setMoreMenuOpen(false)}
                className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
              >
                <svg
                  className="h-4 w-4 flex-shrink-0"
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

              {/* Feedback link */}
              <Link
                role="menuitem"
                href="/feedback"
                onClick={() => setMoreMenuOpen(false)}
                className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
              >
                <svg
                  className="h-4 w-4 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
                {t('common:feedback.nav_link')}
              </Link>

              {/* Connection status */}
              <div
                role="status"
                aria-live="polite"
                className={`flex items-center gap-2 px-4 py-2.5 text-sm ${
                  isConnected ? 'text-green-700' : 'text-amber-700'
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`h-2 w-2 flex-shrink-0 rounded-full ${isConnected ? 'bg-green-500' : 'bg-amber-500'}`}
                />
                {isConnected ? t('status_bar.connected') : t('status_bar.reconnecting')}
              </div>

              <hr className="my-1 border-gray-100" />

              {/* Language switcher */}
              <div className="px-4 py-2">
                <LanguageSwitcher />
              </div>

              <hr className="my-1 border-gray-100" />

              {/* Logout */}
              <button
                role="menuitem"
                onClick={() => {
                  setMoreMenuOpen(false);
                  handleLogout();
                }}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
              >
                {t('common:logout')}
              </button>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}
