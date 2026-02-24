'use client';

import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { useAuthGuard } from '@/lib/use-auth-guard';
import { useAuth } from '@/lib/auth-context';
import LanguageSwitcher from '@/components/LanguageSwitcher';

export default function HelpPage() {
  const { t, ready: i18nReady } = useTranslation('help');
  const { isReady, isLoading: authLoading } = useAuthGuard('onboarded');
  const { user } = useAuth();

  if (authLoading || !i18nReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50" role="status">
        <p className="text-gray-600">{t('common:loading')}</p>
      </div>
    );
  }

  if (!isReady) return null;

  const sections = [
    'getting_around',
    'energy',
    'calm_mode',
    'messaging',
    'message_status',
    'settings',
    'safety',
    ...(user?.isParent ? ['parent'] : []),
    'feedback',
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white px-4 py-3 md:px-6 md:py-4">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href={user?.isParent ? '/parent' : '/dashboard'}
              className="text-sm text-blue-600 hover:underline"
            >
              ← {t('common:back')}
            </Link>
            <h1 className="text-lg font-semibold text-gray-900">{t('title')}</h1>
          </div>
          <LanguageSwitcher />
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6 md:px-6 md:py-10">
        {/* Intro */}
        <p className="mb-8 text-gray-600">{t('intro')}</p>

        {/* Jump links */}
        <nav aria-label={t('nav_label')} className="mb-10">
          <ol className="flex flex-wrap gap-2">
            {sections.map(key => (
              <li key={key}>
                <a
                  href={`#${key}`}
                  className="rounded-full border border-gray-200 bg-white px-3 py-1 text-sm text-blue-600 hover:bg-blue-50"
                >
                  {t(`sections.${key}.title`)}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        {/* Sections */}
        <div className="space-y-12">
          {/* Getting around */}
          <section id="getting_around" aria-labelledby="heading-getting_around">
            <h2 id="heading-getting_around" className="mb-3 text-xl font-semibold text-gray-900">
              {t('sections.getting_around.title')}
            </h2>
            <p className="text-gray-700">{t('sections.getting_around.content')}</p>
          </section>

          {/* Social energy */}
          <section id="energy" aria-labelledby="heading-energy">
            <h2 id="heading-energy" className="mb-3 text-xl font-semibold text-gray-900">
              {t('sections.energy.title')}
            </h2>
            <p className="text-gray-700">{t('sections.energy.content')}</p>
          </section>

          {/* Calm mode */}
          <section id="calm_mode" aria-labelledby="heading-calm_mode">
            <h2 id="heading-calm_mode" className="mb-3 text-xl font-semibold text-gray-900">
              {t('sections.calm_mode.title')}
            </h2>
            <p className="text-gray-700">{t('sections.calm_mode.content')}</p>
          </section>

          {/* Messaging */}
          <section id="messaging" aria-labelledby="heading-messaging">
            <h2 id="heading-messaging" className="mb-3 text-xl font-semibold text-gray-900">
              {t('sections.messaging.title')}
            </h2>
            <p className="mb-4 text-gray-700">{t('sections.messaging.content')}</p>
            <h3 className="mb-2 font-medium text-gray-800">
              {t('sections.messaging.features_title')}
            </h3>
            <ul className="list-disc space-y-1 pl-5 text-gray-700">
              {(t('sections.messaging.features', { returnObjects: true }) as string[]).map(
                (item, i) => (
                  <li key={i}>{item}</li>
                )
              )}
            </ul>
          </section>

          {/* Message status */}
          <section id="message_status" aria-labelledby="heading-message_status">
            <h2 id="heading-message_status" className="mb-3 text-xl font-semibold text-gray-900">
              {t('sections.message_status.title')}
            </h2>
            <p className="mb-2 text-gray-700">{t('sections.message_status.content')}</p>
            <ul className="list-disc space-y-1 pl-5 text-gray-700">
              {(t('sections.message_status.statuses', { returnObjects: true }) as string[]).map(
                (item, i) => (
                  <li key={i}>{item}</li>
                )
              )}
            </ul>
          </section>

          {/* Settings */}
          <section id="settings" aria-labelledby="heading-settings">
            <h2 id="heading-settings" className="mb-3 text-xl font-semibold text-gray-900">
              {t('sections.settings.title')}
            </h2>
            <p className="mb-2 text-gray-700">{t('sections.settings.content')}</p>
            <ul className="mb-3 list-disc space-y-1 pl-5 text-gray-700">
              {(t('sections.settings.items', { returnObjects: true }) as string[]).map(
                (item, i) => (
                  <li key={i}>{item}</li>
                )
              )}
            </ul>
            <p className="text-sm text-gray-500">{t('sections.settings.save_note')}</p>
          </section>

          {/* Safety */}
          <section id="safety" aria-labelledby="heading-safety">
            <h2 id="heading-safety" className="mb-3 text-xl font-semibold text-gray-900">
              {t('sections.safety.title')}
            </h2>
            <p className="mb-3 text-gray-700">{t('sections.safety.block_content')}</p>
            <p className="text-gray-700">{t('sections.safety.report_content')}</p>
          </section>

          {/* Parent — only shown to parent accounts */}
          {user?.isParent && (
            <section id="parent" aria-labelledby="heading-parent">
              <h2 id="heading-parent" className="mb-3 text-xl font-semibold text-gray-900">
                {t('sections.parent.title')}
              </h2>
              <p className="text-gray-700">{t('sections.parent.content')}</p>
            </section>
          )}

          {/* Feedback */}
          <section id="feedback" aria-labelledby="heading-feedback">
            <h2 id="heading-feedback" className="mb-3 text-xl font-semibold text-gray-900">
              {t('sections.feedback.title')}
            </h2>
            <p className="text-gray-700">{t('sections.feedback.content')}</p>
          </section>
        </div>
      </main>
    </div>
  );
}
