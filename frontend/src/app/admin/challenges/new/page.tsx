'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { challengesApi } from '@/lib/api';
import { CreateChallengeDto } from '@/types';
import ChallengeForm from '../_components/ChallengeForm';

export default function NewChallengePage() {
  const router = useRouter();
  const { checkAuth } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    checkAuth();
    const token = localStorage.getItem('accessToken');
    if (!token) { router.push('/login'); }
  }, [checkAuth, router]);

  const handleSubmit = async (data: CreateChallengeDto) => {
    setIsSubmitting(true);
    try {
      await challengesApi.adminCreate(data);
      setSuccessMsg('Challenge created successfully!');
      setTimeout(() => router.push('/admin/challenges'), 1000);
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Error while creating.');
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
              <span className="text-white font-medium">New challenge</span>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-white mb-8">New challenge</h1>

        {successMsg && (
          <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-sm flex items-center gap-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            {successMsg}
          </div>
        )}

        <div className="bg-slate-800/30 rounded-xl border border-slate-800 p-6">
          <ChallengeForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
        </div>
      </main>
    </div>
  );
}
