'use client';
import AnimatedLogo from '@/components/AnimatedLogo';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { vsApi } from '@/lib/api';
import { VsRank, VsLeaderboardEntry, MatchFoundPayload, TierColors } from '@/types';
import { HubConnectionBuilder, HubConnection, LogLevel } from '@microsoft/signalr';
import { Swords, Trophy, Zap, Shield, Clock, ChevronRight, Loader2, X } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5072';

const TIER_ICONS: Record<string, string> = {
  Bronze: '🥉', Silver: '🥈', Gold: '🥇', Platinum: '💎',
  Diamond: '💠', Master: '⚡', Grandmaster: '👑',
};

export default function VsLobbyPage() {
  const router = useRouter();
  const { user, checkAuth, logout } = useAuthStore();
  const [myRank, setMyRank] = useState<VsRank | null>(null);
  const [leaderboard, setLeaderboard] = useState<VsLeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isQueuing, setIsQueuing] = useState(false);
  const [queueTime, setQueueTime] = useState(0);
  const [language, setLanguage] = useState('python');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
        vsApi.getMyRank(),
        vsApi.getLeaderboard(),
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
      .withUrl(`${API_URL}/hubs/vs?access_token=${token}`, {})
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Warning)
      .build();

    conn.on('MatchFound', (payload: MatchFoundPayload) => {
      cleanup();
      router.push(`/vs/${payload.matchId}`);
    });

    conn.on('QueueJoined', () => {
      startQueueTimer();
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
      await connectionRef.current.invoke('JoinQueue', language);
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

  const handleLogout = async () => { await logout(); router.push('/login'); };

  const formatQueueTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <div className="min-h-screen flex flex-col app-grid" style={{ backgroundColor: '#101b22', color: '#f0f6fc' }}>
      {/* NAV */}
      <nav style={{ borderBottom: '1px solid #1e293b', backgroundColor: 'rgba(16,27,34,0.95)' }} className="sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => router.push('/')}>
              <AnimatedLogo size={28} />
              <span className="font-bold text-lg" style={{ color: '#3caff6' }}>CloudCode</span>
            </div>
            <div className="hidden md:flex items-center gap-6">
              {[['/', 'Home'], ['/challenges', 'Challenges'], ['/courses', 'Courses'], ['/leaderboard', 'Leaderboard'], ['/vs', 'VS Mode']].map(([href, label]) => (
                <span key={href} onClick={() => router.push(href)}
                  className="cursor-pointer text-sm font-medium transition-colors"
                  style={{ color: href === '/vs' ? '#3caff6' : '#8b949e' }}>{label}</span>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm" style={{ color: '#8b949e' }}>{user?.username}</span>
              <button onClick={handleLogout} className="text-sm px-3 py-1.5 rounded-lg transition-colors"
                style={{ color: '#8b949e', border: '1px solid #1e293b' }}>Logout</button>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Swords size={40} style={{ color: '#3caff6' }} />
            <h1 className="text-4xl font-bold" style={{ color: '#f0f6fc' }}>VS Mode</h1>
          </div>
          <p className="text-lg" style={{ color: '#8b949e' }}>Challenge another coder in real-time. First to solve wins.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT — My rank + matchmaking */}
          <div className="lg:col-span-1 space-y-6">
            {/* My Rank Card */}
            {myRank && (
              <div className="rounded-2xl p-6" style={{ border: '1px solid #1e293b', backgroundColor: 'rgba(30,41,59,0.4)' }}>
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-4xl">{TIER_ICONS[myRank.tier] || '🎮'}</span>
                  <div>
                    <p className="text-xl font-bold" style={{ color: '#f0f6fc' }}>{myRank.username}</p>
                    <p className="text-sm font-semibold" style={{ color: TierColors[myRank.tier] || '#8b949e' }}>{myRank.tier}</p>
                  </div>
                </div>
                <div className="text-3xl font-mono font-bold mb-4" style={{ color: '#3caff6' }}>{myRank.elo} ELO</div>
                <div className="grid grid-cols-3 gap-3 text-center">
                  {[['Wins', myRank.wins, '#22c55e'], ['Losses', myRank.losses, '#ef4444'], ['Draws', myRank.draws, '#8b949e']].map(([label, value, color]) => (
                    <div key={String(label)} className="rounded-lg p-2" style={{ backgroundColor: 'rgba(16,27,34,0.8)' }}>
                      <div className="text-lg font-bold" style={{ color: String(color) }}>{value}</div>
                      <div className="text-xs" style={{ color: '#6e7681' }}>{label}</div>
                    </div>
                  ))}
                </div>
                {myRank.gamesPlayed > 0 && (
                  <div className="mt-3 text-center text-sm" style={{ color: '#8b949e' }}>
                    Win rate: <span style={{ color: '#3caff6' }}>{myRank.winRate}%</span>
                    {myRank.currentStreak > 1 && <span className="ml-3">🔥 {myRank.currentStreak} streak</span>}
                  </div>
                )}
              </div>
            )}

            {/* Matchmaking */}
            <div className="rounded-2xl p-6" style={{ border: '1px solid #1e293b', backgroundColor: 'rgba(30,41,59,0.4)' }}>
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: '#f0f6fc' }}>
                <Zap size={18} style={{ color: '#3caff6' }} /> Find a Match
              </h2>

              <div className="mb-4">
                <label className="text-sm mb-2 block" style={{ color: '#8b949e' }}>Language</label>
                <div className="flex gap-2">
                  {['python', 'javascript'].map(lang => (
                    <button key={lang} onClick={() => !isQueuing && setLanguage(lang)}
                      className="flex-1 py-2 rounded-lg text-sm font-medium transition-all"
                      style={{
                        backgroundColor: language === lang ? 'rgba(60,175,246,0.15)' : 'rgba(16,27,34,0.8)',
                        border: `1px solid ${language === lang ? '#3caff6' : '#1e293b'}`,
                        color: language === lang ? '#3caff6' : '#8b949e',
                        cursor: isQueuing ? 'not-allowed' : 'pointer',
                      }}>
                      {lang === 'python' ? '🐍 Python' : '⚡ JavaScript'}
                    </button>
                  ))}
                </div>
              </div>

              {!isQueuing ? (
                <button onClick={handleJoinQueue}
                  className="w-full py-3 rounded-xl font-bold text-lg transition-all"
                  style={{ backgroundColor: '#3caff6', color: '#101b22' }}>
                  Find Opponent
                </button>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2" style={{ color: '#3caff6' }}>
                      <Loader2 size={18} className="animate-spin" />
                      <span className="font-medium">Searching...</span>
                    </div>
                    <span className="font-mono text-sm" style={{ color: '#8b949e' }}>
                      <Clock size={14} className="inline mr-1" />{formatQueueTime(queueTime)}
                    </span>
                  </div>
                  <div className="w-full rounded-full overflow-hidden mb-3" style={{ height: 4, backgroundColor: '#1e293b' }}>
                    <div className="h-full rounded-full animate-pulse" style={{ width: '60%', backgroundColor: '#3caff6' }} />
                  </div>
                  <button onClick={handleLeaveQueue}
                    className="w-full py-2 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors"
                    style={{ border: '1px solid #ef4444', color: '#ef4444' }}>
                    <X size={14} /> Cancel
                  </button>
                </div>
              )}
            </div>

            {/* How it works */}
            <div className="rounded-2xl p-5" style={{ border: '1px solid #1e293b', backgroundColor: 'rgba(30,41,59,0.4)' }}>
              <h3 className="text-sm font-bold mb-3" style={{ color: '#8b949e' }}>How VS Mode Works</h3>
              <div className="space-y-2 text-sm" style={{ color: '#6e7681' }}>
                {[
                  ['🎯', 'Both players get the same challenge'],
                  ['⏱️', 'First to submit a passing solution wins'],
                  ['📊', 'Elo rating adjusts based on result'],
                  ['🏆', 'Climb from Bronze to Grandmaster'],
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
                <h2 className="font-bold" style={{ color: '#f0f6fc' }}>VS Leaderboard</h2>
                <span className="text-sm ml-auto" style={{ color: '#6e7681' }}>Top players</span>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 size={32} className="animate-spin" style={{ color: '#3caff6' }} />
                </div>
              ) : leaderboard.length === 0 ? (
                <div className="text-center py-16" style={{ color: '#8b949e' }}>
                  <Swords size={48} className="mx-auto mb-3 opacity-30" />
                  <p>No matches played yet. Be the first!</p>
                </div>
              ) : (
                <div className="divide-y" style={{ borderColor: '#1e293b' }}>
                  {leaderboard.map((entry) => (
                    <div key={entry.userId} className="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-white/5">
                      <div className="w-8 text-center font-bold text-sm" style={{
                        color: entry.rank === 1 ? '#f59e0b' : entry.rank === 2 ? '#94a3b8' : entry.rank === 3 ? '#ea8f4a' : '#6e7681'
                      }}>
                        {entry.rank <= 3 ? ['🥇', '🥈', '🥉'][entry.rank - 1] : `#${entry.rank}`}
                      </div>
                      <div className="text-xl">{TIER_ICONS[entry.tier] || '🎮'}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold" style={{ color: '#f0f6fc' }}>{entry.username}</span>
                          <span className="text-xs font-medium px-1.5 py-0.5 rounded" style={{
                            color: TierColors[entry.tier] || '#8b949e',
                            backgroundColor: 'rgba(30,41,59,0.8)',
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
        <p>CloudCode © 2026 · <span style={{ color: '#3caff6' }}>VS Mode</span></p>
      </footer>
    </div>
  );
}
