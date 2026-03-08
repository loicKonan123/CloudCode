'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { challengesApi } from '@/lib/api';
import { LeaderboardEntry } from '@/types';
import { Code2, Trophy, Medal, Loader2, LogOut } from 'lucide-react';
import { ThemeSwitcher } from '@/components/ui';

export default function LeaderboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, logout, checkAuth } = useAuthStore();
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
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* Header */}
      <header className="border-b" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'var(--primary)' }}>
                <Code2 className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>CloudCode</span>
            </div>

            <nav className="flex items-center gap-6">
              <button onClick={() => router.push('/challenges')} className="text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] transition">
                Challenges
              </button>
              <button onClick={() => router.push('/leaderboard')} className="text-sm font-medium text-blue-400">
                Leaderboard
              </button>
            </nav>

            <div className="flex items-center gap-4">
              {isAuthenticated ? (
                <>
                  <span className="text-sm text-[var(--text-secondary)]">{user?.username}</span>
                  <ThemeSwitcher />
                  <button onClick={() => { logout(); router.push('/login'); }} className="p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded-lg transition">
                    <LogOut className="w-5 h-5" />
                  </button>
                </>
              ) : (
                <>
                  <ThemeSwitcher />
                  <button onClick={() => router.push('/login')} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition">
                    Se connecter
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Trophy className="w-8 h-8 text-yellow-400" />
            <h1 className="text-2xl font-bold text-white">Leaderboard</h1>
          </div>

          <div className="flex items-center gap-2">
            {['all', 'month', 'week'].map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 text-sm rounded-lg border transition ${
                  period === p
                    ? 'bg-blue-600 border-blue-500 text-white'
                    : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
                }`}
              >
                {p === 'all' ? 'Tout' : p === 'month' ? 'Ce mois' : 'Cette semaine'}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            Aucun classement pour le moment
          </div>
        ) : (
          <div className="space-y-2">
            {entries.map((entry) => {
              const isMe = user?.id === entry.userId;
              const rankColors = ['text-yellow-400', 'text-gray-300', 'text-orange-400'];

              return (
                <div
                  key={entry.userId}
                  className={`flex items-center gap-4 p-4 rounded-xl border transition ${
                    isMe
                      ? 'bg-blue-900/20 border-blue-700/50'
                      : 'bg-gray-800 border-gray-700'
                  }`}
                >
                  {/* Rank */}
                  <div className="w-10 text-center">
                    {entry.rank <= 3 ? (
                      <Medal className={`w-6 h-6 mx-auto ${rankColors[entry.rank - 1]}`} />
                    ) : (
                      <span className="text-lg font-bold text-gray-500">{entry.rank}</span>
                    )}
                  </div>

                  {/* Username */}
                  <div className="flex-1">
                    <span className={`font-medium ${isMe ? 'text-blue-400' : 'text-white'}`}>
                      {entry.username}
                      {isMe && <span className="text-xs text-blue-500 ml-2">(vous)</span>}
                    </span>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-6 text-sm">
                    <div className="text-center">
                      <div className="font-bold text-white">{entry.challengesSolved}</div>
                      <div className="text-xs text-gray-500">Resolus</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-green-400">{entry.perfectScores}</div>
                      <div className="text-xs text-gray-500">Parfaits</div>
                    </div>
                    <div className="text-center min-w-[60px]">
                      <div className="font-bold text-yellow-400 text-lg">{entry.totalScore}</div>
                      <div className="text-xs text-gray-500">Score</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
