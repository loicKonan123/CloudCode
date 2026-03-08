'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { challengesApi } from '@/lib/api';
import { ChallengeListItem, DifficultyNames } from '@/types';

const DifficultyStyles: Record<number, string> = {
  1: 'bg-emerald-500/10 text-emerald-400',
  2: 'bg-amber-500/10 text-amber-400',
  3: 'bg-rose-500/10 text-rose-400',
};

export default function AdminChallengesPage() {
  const router = useRouter();
  const { checkAuth } = useAuthStore();
  const [challenges, setChallenges] = useState<ChallengeListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
    const token = localStorage.getItem('accessToken');
    if (!token) { router.push('/login'); return; }
    loadChallenges();
  }, [checkAuth, router]);

  const loadChallenges = async () => {
    try {
      setIsLoading(true);
      const res = await challengesApi.adminGetAll();
      setChallenges(res.data);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"? This action is irreversible.`)) return;
    setDeletingId(id);
    try {
      await challengesApi.adminDelete(id);
      setChallenges(prev => prev.filter(c => c.id !== id));
    } catch {
      alert('Error while deleting.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleTogglePublish = async (id: string) => {
    setTogglingId(id);
    try {
      await challengesApi.adminTogglePublish(id);
      await loadChallenges();
    } catch {
      alert('Error while changing status.');
    } finally {
      setTogglingId(null);
    }
  };

  const published = challenges.filter(c => c.isPublished);
  const drafts = challenges.filter(c => !c.isPublished);

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#101b22', color: '#e2e8f0' }}>
      {/* Header */}
      <header className="border-b border-slate-800 bg-[#101b22] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button onClick={() => router.push('/')} className="flex items-center gap-2 text-[#3caff6]">
                <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 48 48">
                  <path d="M44 4H30.6666V17.3334H17.3334V30.6666H4V44H44V4Z" />
                </svg>
                <span className="text-white text-xl font-bold tracking-tight">CloudCode</span>
              </button>
              <div className="hidden sm:flex items-center gap-2 text-slate-600">
                <span>/</span>
                <span className="text-slate-400 text-sm font-medium">Admin</span>
                <span>/</span>
                <span className="text-white text-sm font-medium">Challenges</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => router.push('/admin/users')} className="text-slate-400 hover:text-[#3caff6] text-sm font-medium transition-colors">
                Users
              </button>
              <button onClick={() => router.push('/challenges')} className="text-slate-400 hover:text-[#3caff6] text-sm font-medium transition-colors">
                ← Back to site
              </button>
              <button
                onClick={() => router.push('/admin/challenges/new')}
                className="flex items-center gap-2 px-4 py-2 bg-[#3caff6] text-[#101b22] text-sm font-bold rounded-lg hover:bg-[#3caff6]/90 transition"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New challenge
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats bar */}
        <div className="flex items-center gap-6 mb-8">
          <h1 className="text-2xl font-bold text-white">Challenges</h1>
          <div className="flex items-center gap-4 text-sm">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-slate-400">{published.length} published</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-slate-500" />
              <span className="text-slate-400">{drafts.length} draft{drafts.length !== 1 ? 's' : ''}</span>
            </span>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-[#3caff6] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : challenges.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-slate-800 rounded-xl">
            <svg className="w-12 h-12 text-slate-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-slate-500 mb-4">No challenges yet</p>
            <button
              onClick={() => router.push('/admin/challenges/new')}
              className="px-6 py-2 bg-[#3caff6] text-[#101b22] font-bold rounded-lg hover:opacity-90 transition"
            >
              Create the first challenge
            </button>
          </div>
        ) : (
          <div className="rounded-xl border border-slate-800 overflow-hidden">
            {/* Table header */}
            <div className="hidden md:grid grid-cols-[2fr_1fr_1fr_1fr_120px] gap-4 px-6 py-3 bg-slate-800/50 text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-800">
              <span>Challenge</span>
              <span>Difficulty</span>
              <span>Tests</span>
              <span>Status</span>
              <span className="text-right">Actions</span>
            </div>

            {challenges.map((c, i) => (
              <div
                key={c.id}
                className={`grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_1fr_120px] gap-4 px-6 py-4 items-center transition-colors hover:bg-slate-800/30 ${
                  i !== challenges.length - 1 ? 'border-b border-slate-800' : ''
                }`}
              >
                {/* Title + tags */}
                <div className="min-w-0">
                  <p className="font-semibold text-white truncate">{c.title}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {c.tags.map(tag => (
                      <span key={tag} className="text-[10px] bg-slate-800 text-slate-500 px-2 py-0.5 rounded">{tag}</span>
                    ))}
                  </div>
                </div>

                {/* Difficulty */}
                <div>
                  <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded ${DifficultyStyles[c.difficulty]}`}>
                    {DifficultyNames[c.difficulty]}
                  </span>
                </div>

                {/* Success rate */}
                <div className="text-sm text-slate-400">
                  {c.successRate > 0 ? `${c.successRate}%` : '—'}
                  <span className="text-slate-600 text-xs ml-1">rate</span>
                </div>

                {/* Status */}
                <div>
                  <span className={`flex items-center gap-1.5 w-fit text-xs font-bold px-2.5 py-1 rounded-full ${
                    c.isPublished
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : 'bg-slate-700 text-slate-400'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${c.isPublished ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                    {c.isPublished ? 'Published' : 'Draft'}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 md:justify-end">
                  {/* Publish toggle */}
                  <button
                    onClick={() => handleTogglePublish(c.id)}
                    disabled={togglingId === c.id}
                    title={c.isPublished ? 'Unpublish' : 'Publish'}
                    className={`p-2 rounded-lg transition-colors ${
                      c.isPublished
                        ? 'text-emerald-400 hover:bg-emerald-500/10'
                        : 'text-slate-500 hover:bg-slate-700 hover:text-emerald-400'
                    } disabled:opacity-40`}
                  >
                    {togglingId === c.id ? (
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>

                  {/* Edit */}
                  <button
                    onClick={() => router.push(`/admin/challenges/${c.id}/edit`)}
                    title="Edit"
                    className="p-2 text-slate-500 hover:text-[#3caff6] hover:bg-[#3caff6]/10 rounded-lg transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => handleDelete(c.id, c.title)}
                    disabled={deletingId === c.id}
                    title="Delete"
                    className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-40"
                  >
                    {deletingId === c.id ? (
                      <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <footer className="border-t border-slate-800 py-4 mt-8">
        <p className="text-center text-xs text-slate-600">CloudCode Admin — 2026</p>
      </footer>
    </div>
  );
}
