'use client';
import Navbar from '@/components/Navbar';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { quizApi } from '@/lib/api';
import {
  QuizCategory, QuizDifficulty, QuizRank, QuizLeaderboardEntry,
  QuizCategoryNames, QuizCategoryIcons, QuizDifficultyNames, TierColors,
  QuizMatchFoundPayload,
} from '@/types';
import { HubConnectionBuilder, HubConnection, LogLevel } from '@microsoft/signalr';
import { Brain, Trophy, Zap, Clock, Loader2, X } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5072';

const TIER_ICONS: Record<string, string> = {
  Bronze: '🥉', Silver: '🥈', Gold: '🥇', Platinum: '💎',
  Diamond: '💠', Master: '⚡', Grandmaster: '👑',
};

const DIFF_COLORS: Record<QuizDifficulty, string> = {
  [QuizDifficulty.Easy]: '#22c55e',
  [QuizDifficulty.Medium]: '#f59e0b',
  [QuizDifficulty.Hard]: '#ef4444',
};

export default function QuizVsLobbyPage() {
  const router = useRouter();
  const { checkAuth } = useAuthStore();

  const [myRank, setMyRank] = useState<QuizRank | null>(null);
  const [leaderboard, setLeaderboard] = useState<QuizLeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isQueuing, setIsQueuing] = useState(false);
  const [queueTime, setQueueTime] = useState(0);
  const [category, setCategory] = useState<QuizCategory>(QuizCategory.Python);
  const [difficulty, setDifficulty] = useState<QuizDifficulty>(QuizDifficulty.Easy);

  const connectionRef = useRef<HubConnection | null>(null);
  const queueTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    checkAuth();
    const token = localStorage.getItem('accessToken');
    if (!token) { router.push('/login'); return; }
    loadData();
    setupSignalR();
    return () => { cleanup(); };
  }, []);

  const loadData = async () => {
    try {
      const [rankRes, lbRes] = await Promise.all([
        quizApi.getMyRank(),
        quizApi.getLeaderboard(),
      ]);
      setMyRank(rankRes.data);
      setLeaderboard(lbRes.data);
    } catch { /* ignore */ } finally {
      setIsLoading(false);
    }
  };

  const setupSignalR = useCallback(async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    const conn = new HubConnectionBuilder()
      .withUrl(`${API_URL}/hubs/quiz?access_token=${token}`)
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Warning)
      .build();

    conn.on('MatchFound', (payload: QuizMatchFoundPayload) => {
      cleanup();
      router.push(`/quiz/vs/${payload.matchId}`);
    });

    connectionRef.current = conn;
    try { await conn.start(); } catch { /* ignore */ }
  }, [router]);

  const cleanup = () => {
    if (queueTimerRef.current) clearInterval(queueTimerRef.current);
    connectionRef.current?.invoke('LeaveQueue').catch(() => {});
    connectionRef.current?.stop().catch(() => {});
  };

  const startQueueTimer = () => {
    setQueueTime(0);
    if (queueTimerRef.current) clearInterval(queueTimerRef.current);
    queueTimerRef.current = setInterval(() => setQueueTime(t => t + 1), 1000);
  };

  const handleJoinQueue = async () => {
    if (!connectionRef.current) return;
    setIsQueuing(true);
    try {
      await connectionRef.current.invoke('JoinQueue', category, difficulty);
      startQueueTimer();
    } catch {
      setIsQueuing(false);
    }
  };

  const handleLeaveQueue = async () => {
    if (queueTimerRef.current) clearInterval(queueTimerRef.current);
    setQueueTime(0);
    setIsQueuing(false);
    try { await connectionRef.current?.invoke('LeaveQueue'); } catch { /* ignore */ }
  };

  const formatTime = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#101b22', color: '#f0f6fc' }}>
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-3 mb-3">
            <Brain size={40} style={{ color: '#3caff6' }} />
            <h1 className="text-4xl font-bold">Quiz VS</h1>
          </div>
          <p style={{ color: '#8b949e' }}>10 questions · Race your opponent · ELO ranking</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT */}
          <div className="lg:col-span-1 space-y-5">
            {/* My rank */}
            {myRank && (
              <div className="rounded-2xl p-5" style={{ border: '1px solid #1e293b', backgroundColor: 'rgba(30,41,59,0.4)' }}>
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">{TIER_ICONS[myRank.tier] || '🎮'}</span>
                  <div>
                    <p className="font-bold" style={{ color: '#f0f6fc' }}>{myRank.username}</p>
                    <p className="text-sm font-semibold" style={{ color: TierColors[myRank.tier] || '#8b949e' }}>{myRank.tier}</p>
                  </div>
                </div>
                <div className="text-3xl font-mono font-bold mb-4" style={{ color: '#3caff6' }}>{myRank.elo} ELO</div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  {[['W', myRank.wins, '#22c55e'], ['L', myRank.losses, '#ef4444'], ['D', myRank.draws, '#8b949e']].map(([l, v, c]) => (
                    <div key={String(l)} className="rounded-lg py-2" style={{ backgroundColor: 'rgba(16,27,34,0.8)' }}>
                      <div className="font-bold" style={{ color: String(c) }}>{v}</div>
                      <div className="text-xs" style={{ color: '#6e7681' }}>{l}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Matchmaking */}
            <div className="rounded-2xl p-5" style={{ border: '1px solid #1e293b', backgroundColor: 'rgba(30,41,59,0.4)' }}>
              <h2 className="font-bold mb-4 flex items-center gap-2" style={{ color: '#f0f6fc' }}>
                <Zap size={16} style={{ color: '#3caff6' }} /> Find Match
              </h2>

              {/* Category */}
              <div className="mb-4">
                <label className="text-xs mb-2 block" style={{ color: '#8b949e' }}>CATEGORY</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {(Object.values(QuizCategory).filter(v => typeof v === 'number') as QuizCategory[]).map(c => {
                    const active = category === c;
                    return (
                      <button key={c} onClick={() => !isQueuing && setCategory(c)}
                        className="py-2 px-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 justify-center"
                        style={{
                          border: `1px solid ${active ? '#3caff6' : '#1e293b'}`,
                          backgroundColor: active ? 'rgba(60,175,246,0.12)' : 'rgba(16,27,34,0.6)',
                          color: active ? '#3caff6' : '#8b949e',
                          cursor: isQueuing ? 'not-allowed' : 'pointer',
                        }}>
                        {QuizCategoryIcons[c]} {QuizCategoryNames[c]}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Difficulty */}
              <div className="mb-4">
                <label className="text-xs mb-2 block" style={{ color: '#8b949e' }}>DIFFICULTY</label>
                <div className="flex gap-1.5">
                  {(Object.values(QuizDifficulty).filter(v => typeof v === 'number') as QuizDifficulty[]).map(d => {
                    const active = difficulty === d;
                    return (
                      <button key={d} onClick={() => !isQueuing && setDifficulty(d)}
                        className="flex-1 py-2 rounded-lg text-xs font-bold transition-all"
                        style={{
                          border: `1px solid ${active ? DIFF_COLORS[d] : '#1e293b'}`,
                          backgroundColor: active ? `${DIFF_COLORS[d]}20` : 'rgba(16,27,34,0.6)',
                          color: active ? DIFF_COLORS[d] : '#8b949e',
                          cursor: isQueuing ? 'not-allowed' : 'pointer',
                        }}>
                        {QuizDifficultyNames[d]}
                      </button>
                    );
                  })}
                </div>
              </div>

              {!isQueuing ? (
                <button onClick={handleJoinQueue}
                  className="w-full py-3 rounded-xl font-bold transition-all"
                  style={{ backgroundColor: '#3caff6', color: '#101b22' }}>
                  Find Opponent
                </button>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2" style={{ color: '#3caff6' }}>
                      <Loader2 size={16} className="animate-spin" />
                      <span className="text-sm font-medium">Searching...</span>
                    </div>
                    <span className="font-mono text-sm" style={{ color: '#8b949e' }}>
                      <Clock size={12} className="inline mr-1" />{formatTime(queueTime)}
                    </span>
                  </div>
                  <div className="w-full rounded-full mb-3" style={{ height: 3, backgroundColor: '#1e293b' }}>
                    <div className="h-full rounded-full animate-pulse" style={{ width: '65%', backgroundColor: '#3caff6' }} />
                  </div>
                  <button onClick={handleLeaveQueue}
                    className="w-full py-2 rounded-lg text-xs flex items-center justify-center gap-1 transition-colors"
                    style={{ border: '1px solid #ef4444', color: '#ef4444' }}>
                    <X size={12} /> Cancel
                  </button>
                </div>
              )}
            </div>

            {/* Rules */}
            <div className="rounded-2xl p-4" style={{ border: '1px solid #1e293b', backgroundColor: 'rgba(30,41,59,0.4)' }}>
              <h3 className="text-xs font-bold mb-2" style={{ color: '#8b949e' }}>SCORING</h3>
              <div className="space-y-1.5 text-xs" style={{ color: '#6e7681' }}>
                {[
                  ['🥇', 'First correct answer → 2 pts'],
                  ['🤝', 'Both correct simultaneously → 1 pt each'],
                  ['❌', 'Wrong answer → 0 pts'],
                  ['⏱️', '30 seconds per question'],
                  ['📊', 'ELO adjusts after each match'],
                ].map(([icon, text]) => (
                  <div key={String(text)} className="flex items-start gap-2">
                    <span>{icon}</span><span>{text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT — Leaderboard */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid #1e293b', backgroundColor: 'rgba(30,41,59,0.4)' }}>
              <div className="px-6 py-4 flex items-center gap-2" style={{ borderBottom: '1px solid #1e293b' }}>
                <Trophy size={18} style={{ color: '#f59e0b' }} />
                <h2 className="font-bold" style={{ color: '#f0f6fc' }}>Quiz VS Leaderboard</h2>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 size={32} className="animate-spin" style={{ color: '#3caff6' }} />
                </div>
              ) : leaderboard.length === 0 ? (
                <div className="text-center py-16" style={{ color: '#8b949e' }}>
                  <Brain size={48} className="mx-auto mb-3 opacity-30" />
                  <p>No matches yet. Be the first!</p>
                </div>
              ) : (
                <div className="divide-y" style={{ borderColor: '#1e293b' }}>
                  {leaderboard.map(entry => (
                    <div key={entry.userId} className="flex items-center gap-4 px-6 py-4 hover:bg-white/5 transition-colors">
                      <div className="w-8 text-center font-bold text-sm" style={{
                        color: entry.rank === 1 ? '#f59e0b' : entry.rank === 2 ? '#94a3b8' : entry.rank === 3 ? '#ea8f4a' : '#6e7681',
                      }}>
                        {entry.rank <= 3 ? ['🥇', '🥈', '🥉'][entry.rank - 1] : `#${entry.rank}`}
                      </div>
                      <span className="text-xl">{TIER_ICONS[entry.tier] || '🎮'}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold" style={{ color: '#f0f6fc' }}>{entry.username}</span>
                          <span className="text-xs px-1.5 py-0.5 rounded" style={{
                            color: TierColors[entry.tier] || '#8b949e', backgroundColor: 'rgba(30,41,59,0.8)',
                          }}>{entry.tier}</span>
                        </div>
                        <div className="text-xs mt-0.5" style={{ color: '#6e7681' }}>
                          {entry.wins}W / {entry.losses}L · {entry.winRate}% WR
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-bold" style={{ color: '#3caff6' }}>{entry.elo}</div>
                        <div className="text-xs" style={{ color: '#6e7681' }}>ELO</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <footer className="py-6 text-center text-sm" style={{ color: '#6e7681', borderTop: '1px solid #1e293b' }}>
        <p>CloudCode © 2026 · <span style={{ color: '#3caff6' }}>Quiz VS</span></p>
      </footer>
    </div>
  );
}
