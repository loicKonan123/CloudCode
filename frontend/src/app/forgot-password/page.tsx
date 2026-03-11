'use client';
import AnimatedLogo from '@/components/AnimatedLogo';
import { useState } from 'react';
import Link from 'next/link';
import { authApi } from '@/lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await authApi.forgotPassword(email);
      setSent(true);
    } catch {
      setError('Une erreur est survenue. Réessayez.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden app-grid" style={{ backgroundColor: '#101b22' }}>
      <style>{`
        @keyframes _orb1 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(40px,-30px) scale(1.06)} }
        @keyframes _orb2 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-35px,25px) scale(1.08)} }
      `}</style>
      <div className="absolute inset-0 pointer-events-none">
        <div style={{ position:'absolute', top:'-15%', left:'-10%', width:520, height:520, borderRadius:'50%', background:'radial-gradient(circle, rgba(60,175,246,0.13) 0%, transparent 70%)', animation:'_orb1 14s ease-in-out infinite' }} />
        <div style={{ position:'absolute', bottom:'-20%', right:'-8%', width:460, height:460, borderRadius:'50%', background:'radial-gradient(circle, rgba(60,175,246,0.09) 0%, transparent 70%)', animation:'_orb2 18s ease-in-out infinite' }} />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center gap-3 mb-4">
            <AnimatedLogo size={44} />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">CloudCode</h1>
          <p className="text-slate-500 mt-2 text-sm">Password Reset</p>
        </div>

        <div className="bg-slate-800/50 rounded-xl p-8 border border-slate-800">
          {sent ? (
            <div className="text-center py-4">
              <div className="text-5xl mb-4">📬</div>
              <h2 className="text-xl font-bold text-white mb-3">Email sent!</h2>
              <p className="text-slate-400 text-sm mb-6">
                Check <span className="text-[#3caff6] font-medium">{email}</span> for a link to reset your password.
                If it doesn't appear within a few minutes, check your spam folder.
              </p>
              <Link
                href="/login"
                className="block w-full py-3 bg-[#3caff6] text-[#101b22] font-bold rounded-lg hover:bg-[#3caff6]/90 transition text-sm text-center"
              >
                Back to Sign in
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-bold text-white mb-2">Reset your password</h2>
              <p className="text-slate-500 text-sm mb-6">Enter your email and we'll send you a reset link.</p>

              {error && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="email" className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                    </svg>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-[#3caff6]/50 focus:border-[#3caff6] transition text-sm"
                      placeholder="you@example.com"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 bg-[#3caff6] hover:bg-[#3caff6]/90 text-[#101b22] font-bold rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-[#101b22] border-t-transparent rounded-full animate-spin" />
                      Sending...
                    </>
                  ) : (
                    'Send reset link'
                  )}
                </button>
              </form>

              <div className="mt-6 text-center">
                <Link href="/login" className="text-sm text-slate-500 hover:text-[#3caff6] transition">
                  ← Back to Sign in
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
