'use client';
import AnimatedLogo from '@/components/AnimatedLogo';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { adminUsersApi } from '@/lib/api';
import { AdminUser } from '@/types';

export default function AdminUsersPage() {
  const router = useRouter();
  const { user, checkAuth } = useAuthStore();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [togglingPremiumId, setTogglingPremiumId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
    const token = localStorage.getItem('accessToken');
    if (!token) { router.push('/login'); return; }
    loadUsers();
  }, [checkAuth, router]);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const res = await adminUsersApi.getAll();
      setUsers(res.data);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleAdmin = async (u: AdminUser) => {
    if (u.id === user?.id && u.isAdmin) {
      alert('You cannot remove your own admin rights.');
      return;
    }
    const action = u.isAdmin ? 'remove admin rights from' : 'promote';
    if (!confirm(`Do you want to ${action} "${u.username}"?`)) return;

    setTogglingId(u.id);
    try {
      const res = await adminUsersApi.toggleAdmin(u.id);
      setUsers(prev => prev.map(x => x.id === u.id ? res.data : x));
    } catch {
      alert('Error while changing role.');
    } finally {
      setTogglingId(null);
    }
  };

  const handleTogglePremium = async (u: AdminUser) => {
    const action = u.isPremium ? 'remove premium from' : 'grant premium to';
    if (!confirm(`Do you want to ${action} "${u.username}"?`)) return;
    setTogglingPremiumId(u.id);
    try {
      const res = await adminUsersApi.togglePremium(u.id);
      setUsers(prev => prev.map(x => x.id === u.id ? res.data : x));
    } catch {
      alert('Error while changing premium status.');
    } finally {
      setTogglingPremiumId(null);
    }
  };

  const handleDelete = async (u: AdminUser) => {
    if (u.id === user?.id) { alert('You cannot delete your own account.'); return; }
    if (!confirm(`Delete "${u.username}" permanently? This cannot be undone.`)) return;
    setDeletingId(u.id);
    try {
      await adminUsersApi.deleteUser(u.id);
      setUsers(prev => prev.filter(x => x.id !== u.id));
    } catch {
      alert('Error while deleting user.');
    } finally {
      setDeletingId(null);
    }
  };

  const admins = users.filter(u => u.isAdmin);
  const regular = users.filter(u => !u.isAdmin);

  return (
    <div className="min-h-screen flex flex-col app-grid" style={{ backgroundColor: '#101b22', color: '#e2e8f0' }}>
      {/* Header */}
      <header className="border-b border-slate-800 bg-[#101b22] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button onClick={() => router.push('/')} className="flex items-center gap-2 text-[#3caff6]">
                <AnimatedLogo size={24} />
                <span className="text-white text-xl font-bold tracking-tight">CloudCode</span>
              </button>
              <div className="hidden sm:flex items-center gap-2 text-slate-600">
                <span>/</span>
                <button onClick={() => router.push('/admin/challenges')} className="text-slate-400 text-sm font-medium hover:text-white transition-colors">Admin</button>
                <span>/</span>
                <span className="text-white text-sm font-medium">Users</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => router.push('/admin/challenges')} className="text-slate-400 hover:text-[#3caff6] text-sm font-medium transition-colors">
                ← Challenges
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats bar */}
        <div className="flex items-center gap-6 mb-8">
          <h1 className="text-2xl font-bold text-white">Users</h1>
          <div className="flex items-center gap-4 text-sm">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#3caff6]" />
              <span className="text-slate-400">{admins.length} admin{admins.length > 1 ? 's' : ''}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-slate-500" />
              <span className="text-slate-400">{regular.length} member{regular.length !== 1 ? 's' : ''}</span>
            </span>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-[#3caff6] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="rounded-xl border border-slate-800 overflow-hidden">
            {/* Table header */}
            <div className="hidden md:grid grid-cols-[2fr_2fr_1fr_1fr_220px] gap-4 px-6 py-3 bg-slate-800/50 text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-800">
              <span>User</span>
              <span>Email</span>
              <span>Role</span>
              <span>Premium</span>
              <span className="text-right">Actions</span>
            </div>

            {users.length === 0 ? (
              <div className="text-center py-12 text-slate-500">No users found.</div>
            ) : (
              users.map((u, i) => (
                <div
                  key={u.id}
                  className={`grid grid-cols-1 md:grid-cols-[2fr_2fr_1fr_1fr_220px] gap-4 px-6 py-4 items-center transition-colors hover:bg-slate-800/30 ${
                    i !== users.length - 1 ? 'border-b border-slate-800' : ''
                  } ${u.id === user?.id ? 'bg-[#3caff6]/5' : ''}`}
                >
                  {/* Username */}
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-sm font-bold text-[#3caff6] shrink-0">
                      {u.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-white text-sm">{u.username}</p>
                      {u.id === user?.id && (
                        <p className="text-[10px] text-[#3caff6]">you</p>
                      )}
                    </div>
                  </div>

                  {/* Email */}
                  <div className="text-sm text-slate-400 truncate">{u.email}</div>

                  {/* Role badge */}
                  <div>
                    <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded ${
                      u.isAdmin
                        ? 'bg-[#3caff6]/10 text-[#3caff6]'
                        : 'bg-slate-700 text-slate-400'
                    }`}>
                      {u.isAdmin ? 'Admin' : 'Member'}
                    </span>
                  </div>

                  {/* Premium badge */}
                  <div>
                    <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded ${
                      u.isPremium
                        ? 'bg-yellow-400/10 text-yellow-400'
                        : 'bg-slate-700 text-slate-500'
                    }`}>
                      {u.isPremium ? 'Premium' : 'Free'}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 justify-start md:justify-end flex-wrap">
                    {/* Promote / Demote */}
                    <button
                      onClick={() => handleToggleAdmin(u)}
                      disabled={togglingId === u.id || (u.id === user?.id && u.isAdmin)}
                      title={u.id === user?.id && u.isAdmin ? 'Cannot remove your own rights' : u.isAdmin ? 'Demote to member' : 'Promote to admin'}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-40 ${
                        u.isAdmin ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20' : 'bg-[#3caff6]/10 text-[#3caff6] hover:bg-[#3caff6]/20'
                      }`}
                    >
                      {togglingId === u.id ? (
                        <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      ) : u.isAdmin ? 'Demote' : 'Promote'}
                    </button>

                    {/* Toggle Premium */}
                    <button
                      onClick={() => handleTogglePremium(u)}
                      disabled={togglingPremiumId === u.id}
                      title={u.isPremium ? 'Remove premium' : 'Grant premium'}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-40 ${
                        u.isPremium ? 'bg-yellow-400/10 text-yellow-400 hover:bg-yellow-400/20' : 'bg-yellow-400/10 text-yellow-600 hover:bg-yellow-400/20'
                      }`}
                    >
                      {togglingPremiumId === u.id ? (
                        <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      ) : u.isPremium ? 'Revoke' : 'Grant'}
                    </button>

                    {/* Delete */}
                    {u.id !== user?.id && (
                      <button
                        onClick={() => handleDelete(u)}
                        disabled={deletingId === u.id}
                        title="Delete user"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-40"
                      >
                        {deletingId === u.id ? (
                          <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        )}
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>

      <footer className="border-t border-slate-800 py-4 mt-8">
        <p className="text-center text-xs text-slate-600">CloudCode Admin — 2026</p>
      </footer>
    </div>
  );
}
