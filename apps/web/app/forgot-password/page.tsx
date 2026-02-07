'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { authApi, ApiException } from '@/lib/api';

export default function ForgotPasswordPage() {
  const { t, i18n } = useTranslation('auth');

  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError(t('email_required'));
      return;
    }

    setIsLoading(true);

    try {
      await authApi.forgotPassword(email);
      setIsSubmitted(true);
    } catch (err) {
      // Still show success message to prevent email enumeration
      // Only show error for network/server issues
      if (err instanceof ApiException && err.statusCode >= 500) {
        const lang = i18n.language as 'fr' | 'en';
        setError(err.getLocalizedMessage(lang));
      } else {
        setIsSubmitted(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          <div>
            <h1 className="text-center text-3xl font-bold text-gray-900">Otantist</h1>
          </div>

          <div className="space-y-4 rounded-lg bg-white p-6 shadow">
            <div className="text-center text-4xl text-green-500">✓</div>
            <p className="text-center text-gray-600">{t('forgot_password_sent')}</p>
            <div className="pt-4 text-center">
              <Link href="/login" className="text-sm font-medium text-blue-600 hover:text-blue-500">
                {t('back_to_login')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h1 className="text-center text-3xl font-bold text-gray-900">Otantist</h1>
          <h2 className="mt-6 text-center text-xl text-gray-600">{t('forgot_password_title')}</h2>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <p className="text-center text-sm text-gray-600">{t('forgot_password_message')}</p>

          {error && (
            <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-red-700">
              {error}
            </div>
          )}

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
            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? t('sending') : t('reset_password')}
            </button>
          </div>

          <div className="text-center">
            <Link href="/login" className="text-sm font-medium text-blue-600 hover:text-blue-500">
              {t('back_to_login')}
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
