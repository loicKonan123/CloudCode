'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { premiumApi } from '@/lib/api';

type FeatureRow = {
  label: string;
  free: boolean | string;
  premium: boolean | string;
};

const FEATURES: FeatureRow[] = [
  { label: 'Easy & Medium challenges',    free: true,        premium: true },
  { label: 'Hard challenges',             free: false,       premium: true },
  { label: 'Hints on challenges',         free: 'First only', premium: 'All unlocked' },
  { label: 'Daily challenge',             free: true,        premium: true },
  { label: 'Global leaderboard',          free: true,        premium: true },
  { label: 'Python & JavaScript',         free: true,        premium: true },
  { label: 'Courses',                     free: false,       premium: true },
  { label: 'Quiz solo mode',              free: false,       premium: true },
  { label: 'VS Mode (1v1 battles)',       free: false,       premium: true },
  { label: 'Priority support',            free: false,       premium: true },
];

const FAQ = [
  {
    q: 'Can I cancel anytime?',
    a: 'Yes. Your Premium access continues until the end of the current billing period, then stops automatically.',
  },
  {
    q: 'What payment methods are accepted?',
    a: 'All major credit/debit cards via Stripe. Your payment info is never stored on our servers — Stripe handles everything.',
  },
  {
    q: 'Do I lose my progress if I downgrade?',
    a: 'Never. All your solved challenges, scores and rank are kept forever regardless of your plan.',
  },
  {
    q: 'Is there a free trial?',
    a: 'The Free plan gives you full access to Easy & Medium challenges indefinitely — no credit card required.',
  },
];

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
    </svg>
  );
}

function FeatureCell({ value }: { value: boolean | string }) {
  if (value === true) return <CheckIcon className="w-5 h-5 text-emerald-400 mx-auto" />;
  if (value === false) return <XIcon className="w-4 h-4 text-slate-600 mx-auto" />;
  return <span className="text-xs font-medium text-slate-400">{value}</span>;
}

export default function PricingPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) { setCheckingStatus(false); return; }
    premiumApi.getStatus()
      .then(r => { setIsPremium(r.data.isActive); setExpiresAt(r.data.expiresAt); })
      .catch(() => {})
      .finally(() => setCheckingStatus(false));
  }, []);

  const handleUpgrade = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) { router.push('/login?redirect=/pricing'); return; }
    setIsLoading(true);
    try {
      const res = await premiumApi.createCheckout();
      window.location.href = res.data.url;
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to start checkout. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#101b22', color: '#e2e8f0' }}>
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">

        {/* Header */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#3caff6]/10 border border-[#3caff6]/20 text-[#3caff6] text-xs font-bold uppercase tracking-widest mb-4">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            Pricing
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-white mb-4 tracking-tight">
            Unlock your full potential
          </h1>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">
            Start free, upgrade when you&apos;re ready. No hidden fees, cancel anytime.
          </p>
        </div>

        {/* Price Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12">
          {/* Free */}
          <div className="bg-slate-800/40 border border-slate-700 rounded-2xl p-7 flex flex-col">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Free</p>
            <div className="flex items-end gap-1 mb-1">
              <span className="text-5xl font-black text-white">$0</span>
              <span className="text-slate-500 mb-1.5">/month</span>
            </div>
            <p className="text-slate-500 text-sm mb-6">Forever free. No card required.</p>
            <button
              disabled
              className="w-full py-2.5 rounded-xl border border-slate-600 text-slate-500 font-semibold text-sm cursor-default"
            >
              Current Plan
            </button>
          </div>

          {/* Premium */}
          <div className="relative bg-linear-to-br from-[#3caff6]/15 via-slate-800/60 to-slate-800/40 border border-[#3caff6]/40 rounded-2xl p-7 flex flex-col shadow-xl shadow-[#3caff6]/5">
            <div className="absolute -top-3.5 right-6">
              <span className="bg-[#3caff6] text-[#101b22] text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow">
                Most Popular
              </span>
            </div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#3caff6] mb-3">Premium</p>
            <div className="flex items-end gap-1 mb-1">
              <span className="text-5xl font-black text-white">$9</span>
              <span className="text-slate-400 mb-1.5">/month</span>
            </div>
            <p className="text-slate-400 text-sm mb-6">Billed monthly. Cancel anytime.</p>

            {checkingStatus ? (
              <div className="w-full h-10 rounded-xl bg-slate-700/50 animate-pulse" />
            ) : isPremium ? (
              <div className="text-center py-2">
                <p className="text-emerald-400 font-bold text-sm">✓ You&apos;re Premium</p>
                {expiresAt && (
                  <p className="text-slate-500 text-xs mt-1">
                    Renews {new Date(expiresAt).toLocaleDateString()}
                  </p>
                )}
              </div>
            ) : (
              <button
                onClick={handleUpgrade}
                disabled={isLoading}
                className="w-full py-2.5 rounded-xl bg-[#3caff6] hover:bg-[#3caff6]/90 text-[#101b22] font-bold text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <><div className="w-4 h-4 border-2 border-[#101b22] border-t-transparent rounded-full animate-spin" />Processing...</>
                ) : 'Upgrade to Premium'}
              </button>
            )}
          </div>
        </div>

        {/* Feature Comparison Table */}
        <div className="rounded-2xl overflow-hidden border border-slate-700/60 mb-16">
          {/* Table header */}
          <div className="grid grid-cols-3 bg-slate-800/60 border-b border-slate-700/60">
            <div className="px-5 py-3 text-xs font-bold uppercase tracking-widest text-slate-400">Feature</div>
            <div className="px-5 py-3 text-xs font-bold uppercase tracking-widest text-slate-400 text-center">Free</div>
            <div className="px-5 py-3 text-xs font-bold uppercase tracking-widest text-[#3caff6] text-center">Premium</div>
          </div>

          {FEATURES.map((row, i) => (
            <div
              key={row.label}
              className={`grid grid-cols-3 items-center border-b border-slate-700/30 last:border-0 ${
                i % 2 === 0 ? 'bg-slate-800/20' : 'bg-transparent'
              }`}
            >
              <div className="px-5 py-3.5 text-sm text-slate-300">{row.label}</div>
              <div className="px-5 py-3.5 text-center">
                <FeatureCell value={row.free} />
              </div>
              <div className="px-5 py-3.5 text-center">
                <FeatureCell value={row.premium} />
              </div>
            </div>
          ))}
        </div>

        {/* CTA Banner */}
        {!isPremium && !checkingStatus && (
          <div className="relative overflow-hidden rounded-2xl bg-linear-to-r from-[#3caff6]/20 to-[#3caff6]/5 border border-[#3caff6]/30 p-8 text-center mb-16">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,var(--tw-gradient-stops))] from-[#3caff6]/10 via-transparent to-transparent pointer-events-none" />
            <h2 className="text-2xl font-black text-white mb-2 relative">Ready to level up?</h2>
            <p className="text-slate-400 text-sm mb-6 relative">
              Join Premium and unlock Courses, Quiz, VS Mode and all Hard challenges.
            </p>
            <button
              onClick={handleUpgrade}
              disabled={isLoading}
              className="inline-flex items-center gap-2 bg-[#3caff6] hover:bg-[#3caff6]/90 text-[#101b22] font-bold py-3 px-10 rounded-xl transition-all disabled:opacity-60 disabled:cursor-not-allowed text-sm"
            >
              {isLoading ? (
                <><div className="w-4 h-4 border-2 border-[#101b22] border-t-transparent rounded-full animate-spin" />Processing...</>
              ) : 'Get Premium — $9/mo'}
            </button>
          </div>
        )}

        {/* FAQ */}
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-black text-white text-center mb-8">Frequently asked questions</h2>
          <div className="space-y-3">
            {FAQ.map(({ q, a }, i) => (
              <div key={i} className="bg-slate-800/40 border border-slate-700/60 rounded-xl overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left"
                >
                  <span className="font-semibold text-white text-sm">{q}</span>
                  <svg
                    className={`w-4 h-4 text-slate-400 shrink-0 ml-4 transition-transform ${openFaq === i ? 'rotate-180' : ''}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-4 text-sm text-slate-400 border-t border-slate-700/40 pt-3">
                    {a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

      </main>

      <footer className="bg-slate-900 border-t border-slate-800 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-xs text-slate-500">© 2026 CloudCode. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
