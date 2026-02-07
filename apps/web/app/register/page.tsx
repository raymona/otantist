'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { useAuth, useApiError } from '@/lib/auth-context';
import { ApiException } from '@/lib/api';

export default function RegisterPage() {
  const { t, i18n } = useTranslation('auth');
  const router = useRouter();
  const { register } = useAuth();
  const { getErrorMessage } = useApiError();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [language, setLanguage] = useState<'fr' | 'en'>((i18n.language as 'fr' | 'en') || 'fr');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = (): string | null => {
    if (!email) return t('email_required');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return t('email_invalid');
    if (!password) return t('password_required');
    if (password.length < 8) return t('password_min_length');
    if (password !== confirmPassword) return t('passwords_must_match');
    if (!inviteCode) return t('invite_code_required');
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
      await register({
        email,
        password,
        inviteCode,
        language,
      });
      // Store email for the verify-email-sent page
      sessionStorage.setItem('otantist-pending-email', email);
      router.push('/verify-email-sent');
    } catch (err) {
      const lang = i18n.language as 'fr' | 'en';
      if (err instanceof ApiException) {
        setError(err.getLocalizedMessage(lang));
      } else {
        setError(getErrorMessage(err, lang));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h1 className="text-center text-3xl font-bold text-gray-900">Otantist</h1>
          <h2 className="mt-6 text-center text-xl text-gray-600">{t('create_account')}</h2>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-red-700">
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
                autoComplete="new-password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                {t('confirm_password')}
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="inviteCode" className="block text-sm font-medium text-gray-700">
                {t('invite_code')}
              </label>
              <input
                id="inviteCode"
                name="inviteCode"
                type="text"
                required
                value={inviteCode}
                onChange={e => setInviteCode(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="language" className="block text-sm font-medium text-gray-700">
                {t('language')}
              </label>
              <select
                id="language"
                name="language"
                value={language}
                onChange={e => setLanguage(e.target.value as 'fr' | 'en')}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none"
              >
                <option value="fr">Français</option>
                <option value="en">English</option>
              </select>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? t('registering') : t('register')}
            </button>
          </div>

          <div className="text-center text-sm">
            <span className="text-gray-600">{t('already_have_account')} </span>
            <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
              {t('login')}
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
