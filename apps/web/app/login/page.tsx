'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/lib/auth-context';
import { useAuthGuard } from '@/lib/use-auth-guard';
import { useApiError } from '@/lib/use-api-error';

export default function LoginPage() {
  const { t } = useTranslation('auth');
  const { login } = useAuth();
  const { isReady, isLoading: authLoading } = useAuthGuard('guest');
  const { getErrorMessage } = useApiError();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = (): string | null => {
    if (!email) return t('email_required');
    if (!password) return t('password_required');
    return null;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);

    try {
      await login({ email, password });
      // useAuthGuard will detect the new auth state and redirect
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50" role="status">
        <p className="text-gray-600">{t('common:loading')}</p>
      </div>
    );
  }

  // Already authenticated — useAuthGuard is redirecting
  if (!isReady) {
    return null;
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h1 className="text-center text-3xl font-bold text-gray-900">{t('common:app_name')}</h1>
          <h2 className="mt-6 text-center text-xl text-gray-600">{t('welcome_back')}</h2>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div
              role="alert"
              className="rounded border border-red-200 bg-red-50 px-4 py-3 text-red-700"
            >
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                {t('email')}
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                {t('password')}
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end">
            <Link
              href="/forgot-password"
              className="text-sm font-medium text-blue-600 hover:text-blue-500"
            >
              {t('forgot_password')}
            </Link>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              aria-busy={isLoading}
              className="flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? t('logging_in') : t('login')}
            </button>
          </div>

          <div className="text-center text-sm">
            <span className="text-gray-600">{t('no_account')} </span>
            <Link href="/register" className="font-medium text-blue-600 hover:text-blue-500">
              {t('register')}
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}
