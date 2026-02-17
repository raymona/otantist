'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { useAuthGuard } from '@/lib/use-auth-guard';
import { parentApi, type ManagedMember } from '@/lib/parent-api';
import MemberList from '@/components/parent/MemberList';
import MemberDetail from '@/components/parent/MemberDetail';

export default function ParentDashboardPage() {
  const { t, ready: i18nReady } = useTranslation('parent');
  const { isReady, isLoading: authLoading } = useAuthGuard('onboarded');

  const [members, setMembers] = useState<ManagedMember[]>([]);
  const [selectedMember, setSelectedMember] = useState<ManagedMember | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Load members on mount
  useEffect(() => {
    if (!isReady) return;

    setIsLoading(true);
    parentApi
      .getMembers()
      .then(data => {
        setMembers(data);
        if (data.length > 0) {
          setSelectedMember(data[0]);
        }
      })
      .catch(() => setError(t('errors.load_members')))
      .finally(() => setIsLoading(false));
  }, [isReady, t]);

  if (authLoading || !i18nReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50" role="status">
        <p className="text-gray-600">{t('common:loading')}</p>
      </div>
    );
  }

  if (!isReady) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white px-4 py-3">
        <div className="mx-auto flex max-w-5xl items-center gap-4">
          <Link
            href="/dashboard"
            className="text-sm text-blue-600 transition-colors hover:text-blue-800"
          >
            &larr; {t('back')}
          </Link>
          <h1 className="text-xl font-semibold text-gray-900">{t('title')}</h1>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        {isLoading && (
          <div role="status" className="flex justify-center py-12">
            <p className="text-gray-600">{t('common:loading')}</p>
          </div>
        )}

        {error && (
          <p role="alert" className="py-12 text-center text-sm text-red-600">
            {error}
          </p>
        )}

        {!isLoading && !error && members.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-lg font-medium text-gray-700">{t('no_members')}</p>
            <p className="mt-1 text-sm text-gray-500">{t('no_members_hint')}</p>
            <Link
              href="/dashboard"
              className="mt-4 inline-block text-sm text-blue-600 hover:text-blue-800"
            >
              &larr; {t('back')}
            </Link>
          </div>
        )}

        {!isLoading && members.length > 0 && (
          <div className="flex flex-col gap-8 md:flex-row">
            {/* Member list sidebar */}
            <aside className="w-full flex-shrink-0 md:w-64">
              <MemberList
                members={members}
                selectedId={selectedMember?.member.userId ?? null}
                onSelect={setSelectedMember}
              />
            </aside>

            {/* Member detail */}
            <section className="min-w-0 flex-1 rounded-lg border border-gray-200 bg-white p-6">
              {selectedMember ? (
                <MemberDetail key={selectedMember.member.userId} member={selectedMember} />
              ) : (
                <p className="py-8 text-center text-sm text-gray-500">{t('member_list.title')}</p>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
