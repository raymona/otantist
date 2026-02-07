'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { authApi, ApiException } from '@/lib/api';

function VerifyEmailContent() {
  const { t, i18n } = useTranslation('auth');
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setError(t('verify_error'));
      return;
    }

    const verifyEmail = async () => {
      try {
        await authApi.verifyEmail(token);
        setStatus('success');
        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      } catch (err) {
        setStatus('error');
        const lang = i18n.language as 'fr' | 'en';
        if (err instanceof ApiException) {
          setError(err.getLocalizedMessage(lang));
        } else {
          setError(t('verify_error'));
        }
      }
    };

    verifyEmail();
  }, [token, router, t, i18n.language]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h1 className="text-center text-3xl font-bold text-gray-900">Otantist</h1>
        </div>

        <div className="space-y-4 rounded-lg bg-white p-6 shadow">
          {status === 'verifying' && (
            <div className="text-center">
              <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
              <p className="text-gray-600">{t('verifying')}</p>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center">
              <div className="mb-4 text-4xl text-green-500">✓</div>
              <p className="text-green-700">{t('verify_success')}</p>
              <p className="mt-2 text-sm text-gray-500">Redirecting to login...</p>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center">
              <div className="mb-4 text-4xl text-red-500">✗</div>
              <p className="text-red-700">{error || t('verify_error')}</p>
              <div className="mt-6">
                <Link
                  href="/login"
                  className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
                >
                  {t('back_to_login')}
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
