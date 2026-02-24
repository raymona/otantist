'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/lib/auth-context';
import { authApi, ApiException } from '@/lib/api';

export default function AcceptTermsPage() {
  const { t, i18n } = useTranslation('auth');
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading, refreshUser } = useAuth();

  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  // Redirect if terms already accepted
  useEffect(() => {
    if (user?.legalAccepted) {
      // Go to onboarding if not complete, otherwise home
      router.push(user.onboardingComplete ? '/' : '/onboarding');
    }
  }, [user, router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!accepted) {
      setError(t('terms_required'));
      return;
    }

    setIsLoading(true);

    try {
      await authApi.acceptTerms();
      await refreshUser();
      // Go to onboarding - that page will redirect to home if already complete
      router.push('/onboarding');
    } catch (err) {
      const lang = i18n.language as 'fr' | 'en';
      if (err instanceof ApiException) {
        setError(err.getLocalizedMessage(lang));
      } else {
        setError(lang === 'fr' ? 'Une erreur est survenue' : 'An error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h1 className="text-center text-3xl font-bold text-gray-900">Otantist</h1>
          <h2 className="mt-6 text-center text-xl text-gray-600">{t('accept_terms_title')}</h2>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-lg bg-white p-4 shadow md:p-6">
            <p className="mb-6 text-gray-600">{t('accept_terms_message')}</p>

            {/* Placeholder for actual terms content */}
            <div className="mb-6 h-48 overflow-y-auto rounded border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
              <p className="mb-2 font-medium">Terms of Service</p>
              <p className="mb-2">
                By using Otantist, you agree to treat all users with respect and kindness. This
                platform is designed to be an emotionally safe space for autistic and neurodivergent
                individuals.
              </p>
              <p className="mb-2">
                You agree not to share harmful content, harass other users, or violate anyone&apos;s
                privacy.
              </p>
              <p>
                We reserve the right to moderate content and suspend accounts that violate these
                terms.
              </p>
            </div>

            {error && (
              <div className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-red-700">
                {error}
              </div>
            )}

            <label className="flex cursor-pointer items-start space-x-3">
              <input
                type="checkbox"
                checked={accepted}
                onChange={e => setAccepted(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">{t('accept_terms_checkbox')}</span>
            </label>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading || !accepted}
              className="flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? t('accepting_terms') : t('accept_terms_button')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
