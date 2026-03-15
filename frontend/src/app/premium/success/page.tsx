'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';

export default function PremiumSuccessPage() {
  const router = useRouter();

  useEffect(() => {
    const t = setTimeout(() => router.push('/challenges'), 5000);
    return () => clearTimeout(t);
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#101b22', color: '#e2e8f0' }}>
      <Navbar />
      <main className="flex-1 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          {/* Success icon */}
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-emerald-500/10 flex items-center justify-center">
            <svg className="w-10 h-10 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h1 className="text-3xl font-bold text-white mb-3">You&apos;re Premium!</h1>
          <p className="text-slate-400 mb-2">
            Your subscription is now active. All Hard challenges and hints are unlocked.
          </p>
          <p className="text-slate-500 text-sm mb-8">Redirecting to challenges in 5 seconds…</p>

          <button
            onClick={() => router.push('/challenges')}
            className="bg-[#3caff6] hover:bg-[#3caff6]/90 text-[#101b22] font-bold py-3 px-8 rounded-xl transition-all"
          >
            Go to Challenges
          </button>
        </div>
      </main>
    </div>
  );
}
