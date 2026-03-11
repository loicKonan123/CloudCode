'use client';
import AnimatedLogo from '@/components/AnimatedLogo';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { authApi } from '@/lib/api';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!token) router.replace('/forgot-password');
  }, [token, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }
    if (password.length < 6) {
      setError('Le mot de passe doit faire au moins 6 caractères.');
      return;
    }

    setIsLoading(true);
    try {
      await authApi.resetPassword(email, token, password, confirmPassword);
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Lien invalide ou expiré.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-slate-800/50 rounded-xl p-8 border border-slate-800">
      {success ? (
        <div className="text-center py-4">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-xl font-bold text-white mb-3">Password updated!</h2>
          <p className="text-slate-400 text-sm mb-6">You can now sign in with your new password.</p>
          <Link
            href="/login"
            className="block w-full py-3 bg-[#3caff6] text-[#101b22] font-bold rounded-lg hover:bg-[#3caff6]/90 transition text-sm text-center"
          >
            Sign in
          </Link>
        </div>
      ) : (
        <>
          <h2 className="text-xl font-bold text-white mb-2">Set a new password</h2>
          <p className="text-slate-500 text-sm mb-6">Enter your email and choose a new password.</p>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-[#3caff6]/50 focus:border-[#3caff6] transition text-sm"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">New password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-[#3caff6]/50 focus:border-[#3caff6] transition text-sm"
                placeholder="••••••••"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Confirm password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-[#3caff6]/50 focus:border-[#3caff6] transition text-sm"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-[#3caff6] hover:bg-[#3caff6]/90 text-[#101b22] font-bold rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-[#101b22] border-t-transparent rounded-full animate-spin" />
                  Updating...
                </>
              ) : (
                'Reset password'
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
  );
}

export default function ResetPasswordPage() {
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
          <p className="text-slate-500 mt-2 text-sm">New password</p>
        </div>

        <Suspense fallback={
          <div className="bg-slate-800/50 rounded-xl p-8 border border-slate-800 flex justify-center">
            <div className="w-6 h-6 border-2 border-[#3caff6] border-t-transparent rounded-full animate-spin" />
          </div>
        }>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
