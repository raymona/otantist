'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './auth-context';

// Defines what auth state a page requires
type AuthRequirement =
  | 'guest' // Must NOT be logged in (login, register pages)
  | 'authenticated' // Must be logged in, no other checks
  | 'onboarded'; // Must be logged in + terms accepted + onboarding complete

interface AuthGuardResult {
  isReady: boolean; // True when auth state is resolved and user belongs on this page
  isLoading: boolean; // True while auth state is being determined
}

// Single source of truth for auth-based redirects.
// Every protected page uses this instead of writing its own useEffect.
export function useAuthGuard(requirement: AuthRequirement): AuthGuardResult {
  const router = useRouter();
  const { isAuthenticated, user, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    if (requirement === 'guest') {
      if (isAuthenticated && user) {
        if (!user.legalAccepted) {
          router.push('/accept-terms');
        } else if (!user.onboardingComplete) {
          router.push('/onboarding');
        } else if (user.isModerator) {
          router.push('/moderation');
        } else if (user.isParent) {
          router.push('/parent');
        } else {
          router.push('/dashboard');
        }
      }
      return;
    }

    // 'authenticated' and 'onboarded' both require login
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (requirement === 'onboarded' && user) {
      // Moderators bypass the normal onboarding gates
      if (!user.isModerator) {
        if (!user.legalAccepted) {
          router.push('/accept-terms');
        } else if (!user.onboardingComplete) {
          router.push('/onboarding');
        }
      }
    }
  }, [isLoading, isAuthenticated, user, requirement, router]);

  if (isLoading) {
    return { isReady: false, isLoading: true };
  }

  if (requirement === 'guest') {
    return { isReady: !isAuthenticated, isLoading: false };
  }

  if (!isAuthenticated || !user) {
    return { isReady: false, isLoading: false };
  }

  if (requirement === 'onboarded') {
    return {
      isReady: !!user.isModerator || (!!user.legalAccepted && !!user.onboardingComplete),
      isLoading: false,
    };
  }

  // 'authenticated' — logged in is sufficient
  return { isReady: true, isLoading: false };
}
