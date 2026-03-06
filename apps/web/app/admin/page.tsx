'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/lib/auth-context';
import { useAuthGuard } from '@/lib/use-auth-guard';
import { adminApi, AdminUser } from '@/lib/admin-api';

const ROLE_OPTIONS = ['adult', 'moderator', 'super_admin'] as const;

export default function AdminPage() {
  const { t } = useTranslation('admin');
  const { isReady, isLoading: authLoading } = useAuthGuard('onboarded');
  const { user } = useAuth();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Confirm dialog state
  const [confirm, setConfirm] = useState<{
    accountId: string;
    name: string;
    from: string;
    to: string;
  } | null>(null);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const fetchUsers = useCallback(
    async (query?: string) => {
      if (!user?.isSuperAdmin) return;
      setLoading(true);
      setError('');
      try {
        const data = await adminApi.listUsers(query);
        setUsers(data);
      } catch {
        setError(t('error'));
      } finally {
        setLoading(false);
      }
    },
    [user?.isSuperAdmin, t]
  );

  useEffect(() => {
    if (isReady && user?.isSuperAdmin) {
      fetchUsers();
    }
  }, [isReady, user?.isSuperAdmin, fetchUsers]);

  // Debounced search
  useEffect(() => {
    if (!isReady || !user?.isSuperAdmin) return;
    const timer = setTimeout(() => fetchUsers(search || undefined), 300);
    return () => clearTimeout(timer);
  }, [search, isReady, user?.isSuperAdmin, fetchUsers]);

  const handleRoleChange = async () => {
    if (!confirm) return;
    setSaving(true);
    setSuccessMsg('');
    try {
      const updated = await adminApi.setRole(
        confirm.accountId,
        confirm.to as 'adult' | 'moderator' | 'super_admin'
      );
      setUsers(prev => prev.map(u => (u.accountId === updated.accountId ? updated : u)));
      setSuccessMsg(t('set_role.success'));
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch {
      setError(t('set_role.error'));
    } finally {
      setSaving(false);
      setConfirm(null);
    }
  };

  if (authLoading || !isReady) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p role="status">
          <span className="sr-only">{t('common:loading')}</span>
          <span className="text-gray-500">...</span>
        </p>
      </main>
    );
  }

  if (!user?.isSuperAdmin) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-red-600">{t('auth:forbidden')}</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="mx-auto max-w-5xl">
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
          <div className="flex items-center gap-3">
            <a
              href="/dashboard"
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
            >
              {t('dashboard:title')}
            </a>
            <a
              href="/moderation"
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
            >
              {t('dashboard:status_bar.moderation')}
            </a>
          </div>
        </header>

        {/* Search */}
        <div className="mb-4">
          <label htmlFor="admin-search" className="sr-only">
            {t('search_placeholder')}
          </label>
          <input
            id="admin-search"
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('search_placeholder')}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none sm:max-w-md"
          />
        </div>

        {/* Success/error messages */}
        {successMsg && (
          <p role="status" className="mb-4 rounded-lg bg-green-50 px-4 py-2 text-sm text-green-700">
            {successMsg}
          </p>
        )}
        {error && (
          <p role="alert" className="mb-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        {/* User count */}
        {!loading && (
          <p className="mb-2 text-sm text-gray-500">{t('total_users', { count: users.length })}</p>
        )}

        {/* Loading */}
        {loading && (
          <p role="status" className="py-8 text-center text-gray-500">
            {t('loading')}
          </p>
        )}

        {/* Table */}
        {!loading && users.length === 0 && (
          <p className="py-8 text-center text-gray-500">{t('no_results')}</p>
        )}

        {!loading && users.length > 0 && (
          <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="px-4 py-3 font-medium text-gray-700">{t('table.email')}</th>
                  <th className="px-4 py-3 font-medium text-gray-700">{t('table.display_name')}</th>
                  <th className="px-4 py-3 font-medium text-gray-700">{t('table.role')}</th>
                  <th className="px-4 py-3 font-medium text-gray-700">{t('table.status')}</th>
                  <th className="hidden px-4 py-3 font-medium text-gray-700 md:table-cell">
                    {t('table.verified')}
                  </th>
                  <th className="px-4 py-3 font-medium text-gray-700">{t('table.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map(u => (
                  <tr key={u.accountId} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-900">{u.email}</td>
                    <td className="px-4 py-3 text-gray-700">{u.displayName || '—'}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                          u.accountType === 'super_admin'
                            ? 'bg-purple-100 text-purple-700'
                            : u.accountType === 'moderator'
                              ? 'bg-blue-100 text-blue-700'
                              : u.accountType === 'parent_managed'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {t(`roles.${u.accountType}`)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs ${
                          u.status === 'active'
                            ? 'text-green-600'
                            : u.status === 'suspended'
                              ? 'text-red-600'
                              : 'text-amber-600'
                        }`}
                      >
                        {t(`status.${u.status}`)}
                      </span>
                    </td>
                    <td className="hidden px-4 py-3 md:table-cell">
                      {u.emailVerified ? t('yes') : t('no')}
                    </td>
                    <td className="px-4 py-3">
                      {u.accountType === 'parent_managed' ? (
                        <span className="text-xs text-gray-400">—</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {ROLE_OPTIONS.filter(r => r !== u.accountType).map(role => (
                            <button
                              key={role}
                              onClick={() =>
                                setConfirm({
                                  accountId: u.accountId,
                                  name: u.displayName || u.email,
                                  from: t(`roles.${u.accountType}`),
                                  to: role,
                                })
                              }
                              className={`rounded px-2 py-0.5 text-xs font-medium transition-colors ${
                                role === 'super_admin'
                                  ? 'border border-purple-200 text-purple-600 hover:bg-purple-50'
                                  : role === 'moderator'
                                    ? 'border border-blue-200 text-blue-600 hover:bg-blue-50'
                                    : 'border border-gray-200 text-gray-600 hover:bg-gray-100'
                              }`}
                            >
                              {t(
                                `set_role.to_${role === 'super_admin' ? 'admin' : role === 'moderator' ? 'moderator' : 'user'}`
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Confirm dialog */}
        {confirm && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            onClick={() => !saving && setConfirm(null)}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="confirm-title"
              className="mx-4 w-full max-w-sm rounded-lg bg-white p-6 shadow-xl"
              onClick={e => e.stopPropagation()}
            >
              <h2 id="confirm-title" className="mb-3 text-lg font-semibold text-gray-900">
                {t('set_role.confirm_title')}
              </h2>
              <p className="mb-5 text-sm text-gray-600">
                {t('set_role.confirm_message', {
                  name: confirm.name,
                  from: confirm.from,
                  to: t(`roles.${confirm.to}`),
                })}
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setConfirm(null)}
                  disabled={saving}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  {t('set_role.cancel')}
                </button>
                <button
                  onClick={handleRoleChange}
                  disabled={saving}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? '...' : t('set_role.confirm')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
