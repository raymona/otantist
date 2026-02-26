'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { authApi, ApiException } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

export default function VerifyEmailSentPage() {
  const { t, i18n } = useTranslation('auth');
  const { user } = useAuth();
  const [email, setEmail] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Prefer sessionStorage (set during registration), fall back to the
    // logged-in user's email so the resend button works from any session.
    const storedEmail = sessionStorage.getItem('otantist-pending-email');
    setEmail(storedEmail || user?.email || null);
  }, [user]);

  const handleResend = async () => {
    if (!email) return;

    setIsResending(true);
    setError('');
    setResendSuccess(false);

    try {
      await authApi.resendVerification(email);
      setResendSuccess(true);
    } catch (err) {
      const lang = i18n.language as 'fr' | 'en';
      if (err instanceof ApiException) {
        setError(err.getLocalizedMessage(lang));
      } else {
        setError(lang === 'fr' ? 'Une erreur est survenue' : 'An error occurred');
      }
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h1 className="text-center text-3xl font-bold text-gray-900">Otantist</h1>
          <h2 className="mt-6 text-center text-xl text-gray-600">{t('verify_email_title')}</h2>
        </div>

        <div className="space-y-4 rounded-lg bg-white p-6 shadow">
          <p className="text-center text-gray-600">{t('verify_email_message')}</p>

          {email && <p className="text-center text-sm text-gray-500">{email}</p>}

          {error && (
            <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {resendSuccess && (
            <div className="rounded border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              {t('resend_success')}
            </div>
          )}

          {email && (
            <button
              onClick={handleResend}
              disabled={isResending}
              className="flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isResending ? '...' : t('resend_verification')}
            </button>
          )}

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
