'use client';
import Navbar from '@/components/Navbar';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { challengesApi } from '@/lib/api';
import { LeaderboardEntry } from '@/types';

export default function LeaderboardPage() {
  const router = useRouter();
  const { user, checkAuth } = useAuthStore(); // user needed for isMe highlight
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState('all');

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
      <Navbar />

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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xs text-slate-500">© 2026 CloudCode. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
