'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { premiumApi } from '@/lib/api';

interface PremiumGateProps {
  feature: string;
  children: React.ReactNode;
}

/**
 * Wraps a page/section that requires an active Premium subscription.
 * Shows an upgrade prompt if the user is not premium.
 */
export default function PremiumGate({ feature, children }: PremiumGateProps) {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'premium' | 'free'>('loading');
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.push('/login');
      return;
    }
    premiumApi.getStatus()
      .then(r => setStatus(r.data.isActive ? 'premium' : 'free'))
      .catch(() => setStatus('free'));
  }, [router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#101b22' }}>
        <div className="w-8 h-8 border-2 border-[#3caff6] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (status === 'free') {
    const handleUpgrade = async () => {
      setCheckoutLoading(true);
      try {
        const res = await premiumApi.createCheckout();
        window.location.href = res.data.url;
      } catch (err: any) {
        alert(err.response?.data?.message || 'Failed to start checkout.');
        setCheckoutLoading(false);
      }
    };

    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#101b22', color: '#e2e8f0' }}>
        <div className="text-center max-w-md">
          {/* Icon */}
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-amber-500/10 flex items-center justify-center">
            <svg className="w-10 h-10 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-white mb-3">Premium Feature</h1>
          <p className="text-slate-400 mb-2">
            <span className="font-semibold text-white">{feature}</span> is available to Premium members only.
          </p>
          <p className="text-slate-500 text-sm mb-8">
            Upgrade to unlock Courses, Quiz, VS Mode, all Hard challenges and more.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={handleUpgrade}
              disabled={checkoutLoading}
              className="bg-[#3caff6] hover:bg-[#3caff6]/90 text-[#101b22] font-bold py-3 px-8 rounded-xl transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {checkoutLoading ? (
                <><div className="w-4 h-4 border-2 border-[#101b22] border-t-transparent rounded-full animate-spin" /> Processing...</>
              ) : (
                'Upgrade to Premium — $9/mo'
              )}
            </button>
            <button
              onClick={() => router.push('/pricing')}
              className="border border-slate-700 hover:border-slate-500 text-slate-300 font-semibold py-3 px-6 rounded-xl transition-all"
            >
              See Plans
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
