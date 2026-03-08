'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { challengesApi } from '@/lib/api';
import { CreateChallengeDto, ChallengeDetail } from '@/types';
import ChallengeForm from '../../_components/ChallengeForm';

export default function EditChallengePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { checkAuth } = useAuthStore();
  const [challenge, setChallenge] = useState<ChallengeDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    checkAuth();
    const token = localStorage.getItem('accessToken');
    if (!token) { router.push('/login'); return; }
    loadChallenge();
  }, [id, checkAuth, router]);

  const loadChallenge = async () => {
    try {
      setIsLoading(true);
      // Fetch all challenges and find by id (admin endpoint returns list)
      const res = await challengesApi.adminGetAll();
      const found = res.data.find(c => c.id === id);
      if (!found) { setLoadError('Challenge not found.'); return; }
      // Get full detail via slug
      const detail = await challengesApi.getBySlug(found.slug);
      setChallenge(detail.data);
    } catch {
      setLoadError('Error loading challenge.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (data: CreateChallengeDto) => {
    setIsSubmitting(true);
    try {
      await challengesApi.adminUpdate(id, data);
      setSuccessMsg('Challenge updated successfully!');
      setTimeout(() => router.push('/admin/challenges'), 1000);
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Error while updating.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#101b22', color: '#e2e8f0' }}>
      {/* Header */}
      <header className="border-b border-slate-800 bg-[#101b22] sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <button onClick={() => router.push('/')} className="text-[#3caff6] font-bold flex items-center gap-1.5">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 48 48">
                  <path d="M44 4H30.6666V17.3334H17.3334V30.6666H4V44H44V4Z" />
                </svg>
                CloudCode
              </button>
              <span>/</span>
              <button onClick={() => router.push('/admin/challenges')} className="hover:text-white transition-colors">Admin</button>
              <span>/</span>
              <span className="text-white font-medium truncate max-w-[200px]">{challenge?.title ?? 'Edit'}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-white mb-8">
          Edit: <span className="text-[#3caff6]">{challenge?.title}</span>
        </h1>

        {successMsg && (
          <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-sm flex items-center gap-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            {successMsg}
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-[#3caff6] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : loadError ? (
          <div className="text-center py-20">
            <p className="text-red-400 mb-4">{loadError}</p>
            <button onClick={() => router.push('/admin/challenges')} className="text-[#3caff6] hover:underline text-sm">
              ← Back to list
            </button>
          </div>
        ) : challenge ? (
          <div className="bg-slate-800/30 rounded-xl border border-slate-800 p-6">
            <ChallengeForm initial={challenge} onSubmit={handleSubmit} isSubmitting={isSubmitting} />
          </div>
        ) : null}
      </main>
    </div>
  );
}
