'use client';

import { useState, FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { inviteRequestApi, ApiException } from '@/lib/api';

export default function RequestInvitePage() {
  const { t, i18n } = useTranslation('invite-request');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [context, setContext] = useState('');
  const [contextOther, setContextOther] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const toggleLanguage = () => {
    const next = i18n.language === 'fr' ? 'en' : 'fr';
    i18n.changeLanguage(next);
  };

  const validateForm = (): string | null => {
    if (!name.trim()) return t('name_required');
    if (!email.trim()) return t('email_required');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return t('email_invalid');
    if (!context) return t('context_required');
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
      const otherDetail = context === 'other' && contextOther.trim() ? contextOther.trim() : '';
      const fullMessage = [otherDetail ? `[Other: ${otherDetail}]` : '', message.trim()]
        .filter(Boolean)
        .join('\n');
      await inviteRequestApi.submit({
        name: name.trim(),
        email: email.trim(),
        context,
        message: fullMessage || undefined,
        language: i18n.language as 'fr' | 'en',
      });
      setIsSubmitted(true);
    } catch (err) {
      const lang = i18n.language as 'fr' | 'en';
      if (err instanceof ApiException) {
        setError(err.getLocalizedMessage(lang));
      } else {
        setError(t('common:error'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Success state
  if (isSubmitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8 text-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Otantist</h1>
          </div>
          <div className="rounded-lg border border-green-200 bg-green-50 p-8" role="status">
            <h2 className="text-xl font-semibold text-green-800">{t('success_title')}</h2>
            <p className="mt-4 text-green-700">{t('success_message')}</p>
          </div>
          <a
            href="https://otantist.com"
            className="inline-block text-sm font-medium text-blue-600 hover:text-blue-500"
          >
            {t('back_to_site')}
          </a>
        </div>
      </div>
    );
  }

  const contextOptions = [
    { value: 'adult', label: t('context_adult') },
    { value: 'parent', label: t('context_parent') },
    { value: 'organization', label: t('context_organization') },
    { value: 'other', label: t('context_other') },
  ];

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Otantist</h1>
            <h2 className="mt-2 text-xl text-gray-600">{t('title')}</h2>
            <p className="mt-2 text-sm text-gray-500">{t('subtitle')}</p>
          </div>
          <button
            type="button"
            onClick={toggleLanguage}
            className="rounded-md border border-gray-300 px-3 py-1 text-sm font-medium text-gray-600 hover:bg-gray-100"
            aria-label={i18n.language === 'fr' ? 'Switch to English' : 'Passer au français'}
          >
            {i18n.language === 'fr' ? 'EN' : 'FR'}
          </button>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div
              className="rounded border border-red-200 bg-red-50 px-4 py-3 text-red-700"
              role="alert"
            >
              {error}
            </div>
          )}

          <div className="space-y-4">
            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                {t('name')}
              </label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder={t('name_placeholder')}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                {t('email')}
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* Context — radio group */}
            <fieldset>
              <legend className="block text-sm font-medium text-gray-700">{t('context')}</legend>
              <div className="mt-2 space-y-2">
                {contextOptions.map(option => (
                  <label
                    key={option.value}
                    className="flex cursor-pointer items-center gap-3 rounded-md border border-gray-200 px-3 py-2 hover:bg-gray-50"
                  >
                    <input
                      type="radio"
                      name="context"
                      value={option.value}
                      checked={context === option.value}
                      onChange={e => setContext(e.target.value)}
                      className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{option.label}</span>
                  </label>
                ))}
              </div>
              {context === 'other' && (
                <div className="mt-2">
                  <label htmlFor="context-other" className="sr-only">
                    {t('context_other_placeholder')}
                  </label>
                  <input
                    id="context-other"
                    type="text"
                    value={contextOther}
                    onChange={e => setContextOther(e.target.value)}
                    placeholder={t('context_other_placeholder')}
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              )}
            </fieldset>

            {/* Message */}
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700">
                {t('message')}
              </label>
              <textarea
                id="message"
                name="message"
                rows={3}
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder={t('message_placeholder')}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? t('submitting') : t('submit')}
          </button>
        </form>
      </div>
    </div>
  );
}
