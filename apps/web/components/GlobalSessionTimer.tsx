'use client';

import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useSessionTimerContext } from '@/lib/session-timer-context';
import SessionTimerBar from './dashboard/SessionTimerBar';
import SessionBreakScreen from './dashboard/SessionBreakScreen';

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
  const { user } = useAuth();
  const {
    duration,
    status,
    secondsLeft,
    setDuration,
    dismissBreak,
    showBreakScreen,
    setShowBreakScreen,
  } = useSessionTimerContext();

  // Hide on public pages and for unauthenticated/non-onboarded users
  if (
    HIDDEN_PATHS.includes(pathname) ||
    !user ||
    (!user.onboardingComplete && !user.isModerator && !user.isSuperAdmin)
  ) {
    return null;
  }

  return (
    <>
      <SessionTimerBar
        duration={duration}
        status={status}
        secondsLeft={secondsLeft}
        onSelectDuration={setDuration}
        onDismissBreak={dismissBreak}
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
