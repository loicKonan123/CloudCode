'use client';
import AnimatedLogo from '@/components/AnimatedLogo';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { challengesApi } from '@/lib/api';
import { LeaderboardEntry } from '@/types';

export default function LeaderboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, logout, checkAuth } = useAuthStore();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState('all');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    loadLeaderboard();
  }, [period]);

  const loadLeaderboard = async () => {
    try {
      setIsLoading(true);
      const response = await challengesApi.getLeaderboard(period);
      setEntries(response.data);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-(--font-inter) app-grid" style={{ backgroundColor: '#101b22', color: '#e2e8f0' }}>
      <style>{`
        @keyframes bgDrift {
          0%, 100% { transform: translateX(-50%) translateY(0) scale(1); opacity: 0.5; }
          50% { transform: translateX(-50%) translateY(-24px) scale(1.06); opacity: 0.85; }
        }
        @keyframes bgDriftB {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.3; }
          50% { transform: translateY(20px) scale(1.08); opacity: 0.55; }
        }
      `}</style>

      {/* Animated background glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
        <div style={{
          position: 'absolute', top: '-8%', left: '50%',
          width: 700, height: 450,
          background: 'radial-gradient(ellipse, rgba(60,175,246,0.07) 0%, transparent 70%)',
          animation: 'bgDrift 9s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute', bottom: '8%', right: '8%',
          width: 500, height: 400,
          background: 'radial-gradient(ellipse, rgba(251,191,36,0.04) 0%, transparent 70%)',
          animation: 'bgDriftB 13s ease-in-out infinite',
        }} />
      </div>
      {/* Header */}
      <header className="border-b border-slate-800 bg-[#101b22] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <AnimatedLogo size={28} />
              <span className="text-xl font-bold tracking-tight text-white">CloudCode</span>
            </div>

            <nav className="hidden md:flex items-center gap-8">
              <button onClick={() => router.push('/courses')} className="text-slate-400 hover:text-[#3caff6] transition-colors text-sm font-medium">
                Courses
              </button>
              <button onClick={() => router.push('/challenges')} className="text-slate-400 hover:text-[#3caff6] transition-colors text-sm font-medium">
                Challenges
              </button>
              <button onClick={() => router.push('/leaderboard')} className="text-[#3caff6] font-semibold text-sm">
                Leaderboard
              </button>
              <button onClick={() => router.push('/vs')} className="text-slate-400 hover:text-[#3caff6] transition-colors text-sm font-medium">
                VS Mode
              </button>
              {user?.isAdmin && (
                <button onClick={() => router.push('/admin/challenges')} className="text-slate-400 hover:text-[#3caff6] transition-colors text-sm font-medium">
                  Admin
                </button>
              )}
            </nav>

            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-3">
                <span className="text-sm text-slate-400">{user?.username}</span>
                <div className="h-9 w-9 rounded-full bg-[#3caff6]/20 flex items-center justify-center border border-[#3caff6]/30 text-[#3caff6] font-bold text-sm">
                  {user?.username?.charAt(0).toUpperCase()}
                </div>
                <button onClick={() => { logout(); router.push('/login'); }} className="p-2 text-slate-500 hover:text-red-400 transition-colors" title="Sign out">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 text-slate-400 hover:text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {mobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-800 bg-[#101b22] px-4 py-4 space-y-3">
          <button onClick={() => { router.push('/challenges'); setMobileMenuOpen(false); }} className="block w-full text-left text-slate-400 hover:text-[#3caff6] text-sm font-medium py-2">
            Challenges
          </button>
          <button onClick={() => { router.push('/leaderboard'); setMobileMenuOpen(false); }} className="block w-full text-left text-[#3caff6] font-semibold text-sm py-2">
            Leaderboard
          </button>
          <button onClick={() => { router.push('/vs'); setMobileMenuOpen(false); }} className="block w-full text-left text-slate-400 hover:text-[#3caff6] text-sm font-medium py-2">
            VS Mode
          </button>
              <button onClick={() => router.push('/vs')} className="text-slate-400 hover:text-[#3caff6] transition-colors text-sm font-medium">
                VS Mode
              </button>
          {user?.isAdmin && (
            <button onClick={() => { router.push('/admin/challenges'); setMobileMenuOpen(false); }} className="block w-full text-left text-slate-400 hover:text-[#3caff6] text-sm font-medium py-2">
              Admin
            </button>
          )}
          <button onClick={() => { logout(); router.push('/login'); setMobileMenuOpen(false); }} className="block w-full text-left text-red-400 hover:text-red-300 text-sm font-medium py-2">
            Sign out
          </button>
        </div>
      )}

      <main className="relative z-10 flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Title + Period Filter */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          <div className="flex items-center gap-3">
            <svg className="w-8 h-8 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
            </svg>
            <h1 className="text-2xl font-bold text-white">Leaderboard</h1>
          </div>

          <div className="flex items-center gap-2">
            {(['all', 'month', 'week'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                  period === p
                    ? 'bg-[#3caff6]/20 border-[#3caff6]/30 text-[#3caff6]'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-[#3caff6]'
                }`}
              >
                {p === 'all' ? 'All Time' : p === 'month' ? 'This Month' : 'This Week'}
              </button>
            ))}
          </div>
        </div>

        {/* Table Header (desktop only) */}
        <div className="hidden sm:grid grid-cols-[60px_1fr_100px_100px_120px] gap-2 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
          <span>Rank</span>
          <span>Player</span>
          <span className="text-center">Solved</span>
          <span className="text-center">Perfect</span>
          <span className="text-right">Score</span>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-[#3caff6] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-20 text-slate-500">
            <p className="text-lg">No rankings yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {entries.map((entry) => {
              const isMe = user?.id === entry.userId;
              const isTop3 = entry.rank <= 3;
              const medalColors: Record<number, string> = {
                1: 'text-amber-400 bg-amber-400/10 border-amber-400/30',
                2: 'text-slate-300 bg-slate-300/10 border-slate-400/30',
                3: 'text-orange-400 bg-orange-400/10 border-orange-400/30',
              };

              return (
                <div
                  key={entry.userId}
                  className={`rounded-xl border transition-all px-4 py-3 ${
                    isMe
                      ? 'bg-[#3caff6]/5 border-[#3caff6]/30'
                      : 'bg-slate-800/40 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {/* Desktop grid layout */}
                  <div className="hidden sm:grid grid-cols-[60px_1fr_100px_100px_120px] gap-2 items-center">
                    <div className="flex justify-center">
                      {isTop3 ? (
                        <span className={`w-8 h-8 flex items-center justify-center rounded-full border text-sm font-bold ${medalColors[entry.rank]}`}>
                          {entry.rank}
                        </span>
                      ) : (
                        <span className="text-sm font-bold text-slate-500">{entry.rank}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                        isMe ? 'bg-[#3caff6]/20 text-[#3caff6]' : 'bg-slate-700 text-slate-300'
                      }`}>
                        {entry.username.charAt(0).toUpperCase()}
                      </div>
                      <button
                        onClick={() => router.push(`/u/${entry.username}`)}
                        className={`font-medium text-sm hover:underline ${isMe ? 'text-[#3caff6]' : 'text-white'}`}
                      >
                        {entry.username}
                        {isMe && <span className="text-[10px] text-[#3caff6]/70 ml-2 uppercase font-bold">(you)</span>}
                      </button>
                    </div>
                    <div className="text-center">
                      <span className="text-sm font-semibold text-slate-300">{entry.challengesSolved}</span>
                    </div>
                    <div className="text-center">
                      <span className="text-sm font-semibold text-emerald-400">{entry.perfectScores}</span>
                    </div>
                    <div className="text-right">
                      <span className={`text-lg font-bold ${isTop3 ? 'text-amber-400' : 'text-white'}`}>
                        {entry.totalScore}
                      </span>
                    </div>
                  </div>

                  {/* Mobile card layout */}
                  <div className="sm:hidden">
                    <div className="flex items-center gap-3 mb-3">
                      {isTop3 ? (
                        <span className={`w-8 h-8 flex items-center justify-center rounded-full border text-sm font-bold shrink-0 ${medalColors[entry.rank]}`}>
                          {entry.rank}
                        </span>
                      ) : (
                        <span className="w-8 text-center text-sm font-bold text-slate-500 shrink-0">{entry.rank}</span>
                      )}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                        isMe ? 'bg-[#3caff6]/20 text-[#3caff6]' : 'bg-slate-700 text-slate-300'
                      }`}>
                        {entry.username.charAt(0).toUpperCase()}
                      </div>
                      <button
                        onClick={() => router.push(`/u/${entry.username}`)}
                        className={`font-medium text-sm truncate hover:underline ${isMe ? 'text-[#3caff6]' : 'text-white'}`}
                      >
                        {entry.username}
                        {isMe && <span className="text-[10px] text-[#3caff6]/70 ml-1">(you)</span>}
                      </button>
                      <span className={`ml-auto text-lg font-bold shrink-0 ${isTop3 ? 'text-amber-400' : 'text-white'}`}>
                        {entry.totalScore}
                      </span>
                    </div>
                    <div className="flex gap-4 text-xs pl-11">
                      <span className="text-slate-400">{entry.challengesSolved} solved</span>
                      <span className="text-emerald-400">{entry.perfectScores} perfect</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 grayscale opacity-50">
            <AnimatedLogo size={20} />
            <span className="font-bold text-lg">CloudCode</span>
          </div>
          <p className="text-xs text-slate-500">2026 CloudCode. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
