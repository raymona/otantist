'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/lib/auth-context';
import { useAuthGuard } from '@/lib/use-auth-guard';
import { feedbackApi } from '@/lib/api';

const CATEGORIES = ['bug', 'suggestion', 'accessibility', 'general'] as const;
type Category = (typeof CATEGORIES)[number];

export default function FeedbackPage() {
  const { t } = useTranslation('common');
  const { user } = useAuth();
  const { isReady, isLoading: authLoading } = useAuthGuard('authenticated');

  const [name, setName] = useState(user?.displayName || '');
  const [category, setCategory] = useState<Category>('general');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError(t('feedback.name_required'));
      return;
    }
    if (message.trim().length < 10) {
      setError(t('feedback.message_too_short'));
      return;
    }

    setIsSubmitting(true);
    try {
      await feedbackApi.submit({ name: name.trim(), message: message.trim(), category });
      setSent(true);
    } catch {
      setError(t('feedback.submit_error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50" role="status">
        <p className="text-gray-600">{t('loading')}</p>
      </div>
    );
  }

  if (!isReady) return null;

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="mx-auto max-w-lg">
        <header className="mb-6">
          <Link
            href="/dashboard"
            className="mb-4 inline-block text-sm text-blue-600 hover:text-blue-800"
          >
            &larr; {t('feedback.back')}
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{t('feedback.title')}</h1>
          <p className="mt-1 text-sm text-gray-600">{t('feedback.subtitle')}</p>
        </header>

        {sent ? (
          <div
            role="status"
            className="rounded-lg border border-green-200 bg-green-50 p-6 text-center"
          >
            <p className="text-lg font-medium text-green-800">{t('feedback.sent_title')}</p>
            <p className="mt-2 text-sm text-green-700">{t('feedback.sent_body')}</p>
            <Link
              href="/dashboard"
              className="mt-4 inline-block rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
            >
              {t('feedback.back_to_dashboard')}
            </Link>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="space-y-5 rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
          >
            {error && (
              <p
                role="alert"
                className="rounded border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700"
              >
                {error}
              </p>
            )}

            <div>
              <label htmlFor="feedback-name" className="block text-sm font-medium text-gray-700">
                {t('feedback.your_name')}
              </label>
              <input
                id="feedback-name"
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                maxLength={100}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <fieldset>
              <legend className="block text-sm font-medium text-gray-700">
                {t('feedback.category')}
              </legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {CATEGORIES.map(cat => (
                  <label key={cat} className="flex cursor-pointer items-center gap-1.5">
                    <input
                      type="radio"
                      name="category"
                      value={cat}
                      checked={category === cat}
                      onChange={() => setCategory(cat)}
                      className="text-blue-600"
                    />
                    <span className="text-sm text-gray-700">{t(`feedback.category_${cat}`)}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <div>
              <label htmlFor="feedback-message" className="block text-sm font-medium text-gray-700">
                {t('feedback.message')}
              </label>
              <textarea
                id="feedback-message"
                rows={6}
                value={message}
                onChange={e => setMessage(e.target.value)}
                maxLength={2000}
                placeholder={t('feedback.message_placeholder')}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none"
              />
              <p className="mt-1 text-right text-xs text-gray-400">{message.length}/2000</p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              aria-busy={isSubmitting}
              className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? t('feedback.sending') : t('feedback.send')}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
