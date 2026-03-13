'use client';

import { useAuth } from '@/lib/auth-context';
import { useSessionTimerContext } from '@/lib/session-timer-context';
import SessionTimerBar from './dashboard/SessionTimerBar';
import SessionBreakScreen from './dashboard/SessionBreakScreen';

export default function GlobalSessionTimer() {
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

  // Only show for authenticated, onboarded users (not moderators/admins who bypass onboarding)
  if (!user || (!user.onboardingComplete && !user.isModerator && !user.isSuperAdmin)) {
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
