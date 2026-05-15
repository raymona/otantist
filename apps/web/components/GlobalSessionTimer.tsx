'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/lib/auth-context';
import { useSessionTimerContext } from '@/lib/session-timer-context';
import SessionTimerBar from './dashboard/SessionTimerBar';
import SessionBreakScreen from './dashboard/SessionBreakScreen';
import LanguageSwitcher from './LanguageSwitcher';

const HIDDEN_PATHS = [
  '/request-invite',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/verify-email-sent',
];

export default function GlobalSessionTimer() {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useTranslation('common');
  const { user, logout } = useAuth();
  const {
    duration,
    status,
    secondsLeft,
    setDuration,
    dismissBreak,
    showBreakScreen,
    setShowBreakScreen,
  } = useSessionTimerContext();

  const isPublicPage = HIDDEN_PATHS.includes(pathname);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  // Public / unauthenticated / pre-onboarding — minimal bar with language toggle (+ logout if logged in)
  if (
    isPublicPage ||
    !user ||
    (!user.onboardingComplete && !user.isModerator && !user.isSuperAdmin)
  ) {
    return (
      <div className="flex items-center justify-end border-b border-gray-200 bg-gray-50 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          {user && (
            <button
              onClick={handleLogout}
              className="rounded-lg border border-red-300 px-3 py-1 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
            >
              {t('logout')}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      <SessionTimerBar
        duration={duration}
        status={status}
        secondsLeft={secondsLeft}
        onSelectDuration={setDuration}
        onDismissBreak={dismissBreak}
        onLogout={handleLogout}
      />
      {showBreakScreen && (
        <SessionBreakScreen
          onDismiss={() => {
            setShowBreakScreen(false);
            dismissBreak();
          }}
        />
      )}
    </>
  );
}
