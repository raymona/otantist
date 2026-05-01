'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/lib/auth-context';
import { useAuthGuard } from '@/lib/use-auth-guard';
import { adminApi, AdminUser, InviteCode, InviteRequest } from '@/lib/admin-api';

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

  // Invite code state
  const [inviteCodes, setInviteCodes] = useState<InviteCode[]>([]);
  const [inviteLoading, setInviteLoading] = useState(true);
  const [inviteError, setInviteError] = useState('');
  const [newCode, setNewCode] = useState('');
  const [newMaxUses, setNewMaxUses] = useState(1);
  const [newExpiresAt, setNewExpiresAt] = useState('');
  const [creating, setCreating] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState('');
  const [copiedCode, setCopiedCode] = useState('');

  // Invite request state
  const [inviteRequests, setInviteRequests] = useState<InviteRequest[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [requestsError, setRequestsError] = useState('');
  const [requestFilter, setRequestFilter] = useState<string>('pending');
  const [pendingCount, setPendingCount] = useState(0);
  const [reviewConfirm, setReviewConfirm] = useState<{
    id: string;
    name: string;
    email: string;
    decision: 'approved' | 'rejected';
  } | null>(null);
  const [reviewing, setReviewing] = useState(false);
  const [requestSuccess, setRequestSuccess] = useState('');

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

  const fetchInviteCodes = useCallback(async () => {
    if (!user?.isSuperAdmin) return;
    setInviteLoading(true);
    setInviteError('');
    try {
      const data = await adminApi.listInviteCodes();
      setInviteCodes(data);
    } catch {
      setInviteError(t('invite_codes.error_loading'));
    } finally {
      setInviteLoading(false);
    }
  }, [user?.isSuperAdmin, t]);

  const fetchInviteRequests = useCallback(
    async (status?: string) => {
      if (!user?.isSuperAdmin) return;
      setRequestsLoading(true);
      setRequestsError('');
      try {
        const data = await adminApi.listInviteRequests(status || undefined);
        setInviteRequests(data);
      } catch {
        setRequestsError(t('invite_requests.error_loading'));
      } finally {
        setRequestsLoading(false);
      }
    },
    [user?.isSuperAdmin, t]
  );

  const fetchPendingCount = useCallback(async () => {
    if (!user?.isSuperAdmin) return;
    try {
      const { count } = await adminApi.countPendingRequests();
      setPendingCount(count);
    } catch {
      // silent
    }
  }, [user?.isSuperAdmin]);

  useEffect(() => {
    if (isReady && user?.isSuperAdmin) {
      fetchUsers();
      fetchInviteCodes();
      fetchInviteRequests(requestFilter === 'all' ? undefined : requestFilter);
      fetchPendingCount();
    }
  }, [
    isReady,
    user?.isSuperAdmin,
    fetchUsers,
    fetchInviteCodes,
    fetchInviteRequests,
    fetchPendingCount,
    requestFilter,
  ]);

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

  const handleCreateInviteCode = async () => {
    setCreating(true);
    setInviteError('');
    setInviteSuccess('');
    try {
      const created = await adminApi.createInviteCode(
        newCode.trim(),
        newMaxUses,
        newExpiresAt || undefined
      );
      setInviteCodes(prev => [created, ...prev]);
      setNewCode('');
      setNewMaxUses(1);
      setNewExpiresAt('');
      setInviteSuccess(t('invite_codes.success'));
      setTimeout(() => setInviteSuccess(''), 3000);
    } catch {
      setInviteError(t('invite_codes.error'));
    } finally {
      setCreating(false);
    }
  };

  const handleReview = async () => {
    if (!reviewConfirm) return;
    setReviewing(true);
    setRequestSuccess('');
    setRequestsError('');
    try {
      await adminApi.reviewInviteRequest(reviewConfirm.id, reviewConfirm.decision);
      if (reviewConfirm.decision === 'approved') {
        setRequestSuccess(t('invite_requests.approved_success', { email: reviewConfirm.email }));
      } else {
        setRequestSuccess(t('invite_requests.rejected_success'));
      }
      setTimeout(() => setRequestSuccess(''), 5000);
      fetchInviteRequests(requestFilter === 'all' ? undefined : requestFilter);
      fetchPendingCount();
      fetchInviteCodes();
    } catch {
      setRequestsError(t('invite_requests.error'));
    } finally {
      setReviewing(false);
      setReviewConfirm(null);
    }
  };

  const handleCopyInviteCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(''), 2000);
    } catch {
      // Fallback: no-op
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

        {/* Invite Requests Section */}
        <section aria-labelledby="invite-requests-title" className="mt-10">
          <div className="mb-4 flex items-center gap-3">
            <h2 id="invite-requests-title" className="text-xl font-bold text-gray-900">
              {t('invite_requests.title')}
            </h2>
            {pendingCount > 0 && (
              <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                {t('invite_requests.pending_badge', { count: pendingCount })}
              </span>
            )}
          </div>

          {/* Filters */}
          <div className="mb-4 flex gap-2">
            {(['all', 'pending', 'approved', 'rejected'] as const).map(f => (
              <button
                key={f}
                onClick={() => setRequestFilter(f)}
                className={`rounded-lg px-3 py-1 text-sm font-medium transition-colors ${
                  requestFilter === f
                    ? 'bg-blue-600 text-white'
                    : 'border border-gray-300 text-gray-600 hover:bg-gray-100'
                }`}
              >
                {t(`invite_requests.filter_${f}`)}
              </button>
            ))}
          </div>

          {/* Success/error */}
          {requestSuccess && (
            <p
              role="status"
              className="mb-4 rounded-lg bg-green-50 px-4 py-2 text-sm text-green-700"
            >
              {requestSuccess}
            </p>
          )}
          {requestsError && (
            <p role="alert" className="mb-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">
              {requestsError}
            </p>
          )}

          {/* Table */}
          {requestsLoading ? (
            <p role="status" className="py-4 text-center text-gray-500">
              {t('invite_requests.loading')}
            </p>
          ) : inviteRequests.length === 0 ? (
            <p className="py-4 text-center text-gray-500">{t('invite_requests.none')}</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-gray-200 bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 font-medium text-gray-700">
                      {t('invite_requests.name')}
                    </th>
                    <th className="px-4 py-3 font-medium text-gray-700">
                      {t('invite_requests.email')}
                    </th>
                    <th className="px-4 py-3 font-medium text-gray-700">
                      {t('invite_requests.context')}
                    </th>
                    <th className="hidden px-4 py-3 font-medium text-gray-700 md:table-cell">
                      {t('invite_requests.message')}
                    </th>
                    <th className="px-4 py-3 font-medium text-gray-700">
                      {t('invite_requests.status')}
                    </th>
                    <th className="px-4 py-3 font-medium text-gray-700">
                      {t('invite_requests.date')}
                    </th>
                    <th className="px-4 py-3 font-medium text-gray-700">
                      {t('invite_requests.actions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {inviteRequests.map(req => (
                    <tr key={req.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-900">{req.name}</td>
                      <td className="px-4 py-3 text-gray-700">{req.email}</td>
                      <td className="px-4 py-3">
                        <span className="inline-block rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                          {t(`invite_requests.context_${req.context}`)}
                        </span>
                      </td>
                      <td
                        className="hidden max-w-[200px] truncate px-4 py-3 text-gray-500 md:table-cell"
                        title={req.message || ''}
                      >
                        {req.message || t('invite_requests.no_message')}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs font-medium ${
                            req.status === 'approved'
                              ? 'text-green-600'
                              : req.status === 'rejected'
                                ? 'text-red-600'
                                : 'text-amber-600'
                          }`}
                        >
                          {t(`invite_requests.status_${req.status}`)}
                        </span>
                        {req.inviteCode && (
                          <span className="ml-2 font-mono text-xs text-gray-400">
                            {req.inviteCode}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {new Date(req.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        {req.status === 'pending' ? (
                          <div className="flex gap-1">
                            <button
                              onClick={() =>
                                setReviewConfirm({
                                  id: req.id,
                                  name: req.name,
                                  email: req.email,
                                  decision: 'approved',
                                })
                              }
                              className="rounded border border-green-200 px-2 py-0.5 text-xs font-medium text-green-600 hover:bg-green-50"
                            >
                              {t('invite_requests.approve')}
                            </button>
                            <button
                              onClick={() =>
                                setReviewConfirm({
                                  id: req.id,
                                  name: req.name,
                                  email: req.email,
                                  decision: 'rejected',
                                })
                              }
                              className="rounded border border-red-200 px-2 py-0.5 text-xs font-medium text-red-600 hover:bg-red-50"
                            >
                              {t('invite_requests.reject')}
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">
                            {t('invite_requests.no_message')}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Review confirm dialog */}
        {reviewConfirm && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            onClick={() => !reviewing && setReviewConfirm(null)}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="review-confirm-title"
              className="mx-4 w-full max-w-sm rounded-lg bg-white p-6 shadow-xl"
              onClick={e => e.stopPropagation()}
            >
              <h2 id="review-confirm-title" className="mb-3 text-lg font-semibold text-gray-900">
                {reviewConfirm.decision === 'approved'
                  ? t('invite_requests.approve')
                  : t('invite_requests.reject')}
              </h2>
              <p className="mb-5 text-sm text-gray-600">
                {reviewConfirm.decision === 'approved'
                  ? t('invite_requests.approve_confirm', { email: reviewConfirm.email })
                  : t('invite_requests.reject_confirm', { name: reviewConfirm.name })}
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setReviewConfirm(null)}
                  disabled={reviewing}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  {t('set_role.cancel')}
                </button>
                <button
                  onClick={handleReview}
                  disabled={reviewing}
                  className={`rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50 ${
                    reviewConfirm.decision === 'approved'
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {reviewing ? '...' : t('set_role.confirm')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Invite Codes Section */}
        <section aria-labelledby="invite-codes-title" className="mt-10">
          <h2 id="invite-codes-title" className="mb-4 text-xl font-bold text-gray-900">
            {t('invite_codes.title')}
          </h2>

          {/* Create form */}
          <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4">
            <h3 className="mb-3 text-sm font-semibold text-gray-700">
              {t('invite_codes.create_new')}
            </h3>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex-1">
                <label htmlFor="new-invite-code" className="mb-1 block text-xs text-gray-600">
                  {t('invite_codes.code')}
                </label>
                <input
                  id="new-invite-code"
                  type="text"
                  value={newCode}
                  onChange={e => setNewCode(e.target.value.toUpperCase())}
                  placeholder="BETA2025"
                  className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div className="w-24">
                <label htmlFor="new-max-uses" className="mb-1 block text-xs text-gray-600">
                  {t('invite_codes.max_uses')}
                </label>
                <input
                  id="new-max-uses"
                  type="number"
                  min={1}
                  value={newMaxUses}
                  onChange={e => setNewMaxUses(parseInt(e.target.value) || 1)}
                  className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div className="w-40">
                <label htmlFor="new-expires" className="mb-1 block text-xs text-gray-600">
                  {t('invite_codes.expires_at')}
                </label>
                <input
                  id="new-expires"
                  type="date"
                  value={newExpiresAt}
                  onChange={e => setNewExpiresAt(e.target.value)}
                  className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>
              <button
                onClick={handleCreateInviteCode}
                disabled={creating || !newCode.trim()}
                className="rounded-lg bg-green-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
              >
                {creating ? '...' : t('invite_codes.create')}
              </button>
            </div>
            {inviteSuccess && (
              <p role="status" className="mt-2 text-sm text-green-600">
                {inviteSuccess}
              </p>
            )}
            {inviteError && (
              <p role="alert" className="mt-2 text-sm text-red-600">
                {inviteError}
              </p>
            )}
          </div>

          {/* Invite codes table */}
          {inviteLoading ? (
            <p role="status" className="py-4 text-center text-gray-500">
              {t('invite_codes.loading')}
            </p>
          ) : inviteCodes.length === 0 ? (
            <p className="py-4 text-center text-gray-500">{t('invite_codes.none')}</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-gray-200 bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 font-medium text-gray-700">
                      {t('invite_codes.code')}
                    </th>
                    <th className="px-4 py-3 font-medium text-gray-700">
                      {t('invite_codes.uses')}
                    </th>
                    <th className="px-4 py-3 font-medium text-gray-700">
                      {t('invite_codes.expires_at')}
                    </th>
                    <th className="px-4 py-3 font-medium text-gray-700">
                      {t('invite_codes.created')}
                    </th>
                    <th className="px-4 py-3 font-medium text-gray-700"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {inviteCodes.map(ic => (
                    <tr key={ic.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono text-gray-900">{ic.code}</td>
                      <td className="px-4 py-3">
                        <span
                          className={
                            ic.currentUses >= ic.maxUses ? 'text-red-600' : 'text-gray-700'
                          }
                        >
                          {ic.currentUses}/{ic.maxUses}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {ic.expiresAt
                          ? new Date(ic.expiresAt).toLocaleDateString()
                          : t('invite_codes.no_expiry')}
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {new Date(ic.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleCopyInviteCode(ic.code)}
                          className="text-xs text-blue-600 hover:text-blue-800"
                        >
                          {copiedCode === ic.code
                            ? t('invite_codes.copied')
                            : t('invite_codes.copy')}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
