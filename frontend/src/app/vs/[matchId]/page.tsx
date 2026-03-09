'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { vsApi, challengesApi } from '@/lib/api';
import {
  VsMatch, VsMatchResult, VsMatchStatus,
  MatchEndedPayload, OpponentStatusPayload, TierColors, ChallengeDetail,
} from '@/types';
import { HubConnectionBuilder, HubConnection, LogLevel } from '@microsoft/signalr';
import dynamic from 'next/dynamic';
import { sounds } from '@/lib/sounds';
import SoundControl from '@/components/SoundControl';
import {
  Swords, Clock, CheckCircle, XCircle, Loader2,
  AlertTriangle, Flag, ChevronRight, Shield, Eye, EyeOff,
} from 'lucide-react';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5072';

const TIER_ICONS: Record<string, string> = {
  Bronze: '🥉', Silver: '🥈', Gold: '🥇', Platinum: '💎',
  Diamond: '💠', Master: '⚡', Grandmaster: '👑',
};

type MatchPhase = 'loading' | 'battle' | 'finished';

export default function VsBattlePage() {
  const { matchId } = useParams<{ matchId: string }>();
  const router = useRouter();
  const { user } = useAuthStore();

  // Match state
  const [phase, setPhase] = useState<MatchPhase>('loading');
  const [match, setMatch] = useState<VsMatch | null>(null);
  const [challenge, setChallenge] = useState<ChallengeDetail | null>(null);
  const [code, setCode] = useState('');
  const [result, setResult] = useState<VsMatchResult | null>(null);
  const [matchEnd, setMatchEnd] = useState<MatchEndedPayload | null>(null);
  const [opponentEvent, setOpponentEvent] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [showDescription, setShowDescription] = useState(true);
  const [anticheatWarnings, setAnticheatWarnings] = useState(0);

  // SignalR
  const connectionRef = useRef<HubConnection | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const anticheatRef = useRef({ warnings: 0, hidden: false });
  const myIdRef = useRef<string | undefined>(undefined);

  // ── Load match + challenge ────────────────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) { router.push('/login'); return; }

    sounds.loadPrefs();
    myIdRef.current = user?.id;
    loadMatch();
    setupSignalR();
    setupAntiCheat();

    return () => {
      cleanup();
      teardownAntiCheat();
    };
  }, [matchId]);

  const loadMatch = async () => {
    try {
      const matchRes = await vsApi.getMatch(matchId);
      const m = matchRes.data;
      setMatch(m);

      if (m.status === VsMatchStatus.Finished || m.status === VsMatchStatus.Cancelled) {
        setPhase('finished');
        return;
      }

      const challengeRes = await challengesApi.getBySlug(m.challengeSlug);
      const c = challengeRes.data;
      setChallenge(c);

      // Set starter code based on this player's own language
      const isP1 = m.player1.id === user?.id;
      const myLang = isP1 ? m.player1Language : m.player2Language;
      const starter = myLang === 'python' ? c.starterCodePython : c.starterCodeJavaScript;
      setCode(starter || '');

      setPhase('battle');
      startTimer(m.startedAt);
    } catch {
      router.push('/vs');
    }
  };

  const startTimer = (startedAt?: string, limitSeconds = 1800) => {
    if (!startedAt) return;
    if (timerRef.current) clearInterval(timerRef.current);
    const start = new Date(startedAt).getTime();
    timerRef.current = setInterval(() => {
      const secs = Math.floor((Date.now() - start) / 1000);
      setElapsed(secs);
      const remaining = limitSeconds - secs;
      // Urgent beep at 30s, 20s, 10s, and every second below 10s
      if (remaining === 30 || remaining === 20 || remaining === 10 || (remaining > 0 && remaining <= 10)) {
        sounds.timerBeep();
      }
      // Auto-forfeit at time limit
      if (remaining <= 0) {
        stopTimer();
      }
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  };

  // ── SignalR ────────────────────────────────────────────────────────────────
  const setupSignalR = useCallback(async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    const conn = new HubConnectionBuilder()
      .withUrl(`${API_URL}/hubs/vs?access_token=${token}`)
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Warning)
      .build();

    conn.on('OpponentStatus', (payload: OpponentStatusPayload) => {
      if (payload.event === 'submitting') {
        setOpponentEvent('Opponent is submitting...');
        sounds.opponentSubmitted();
      } else if (payload.event === 'passed') {
        setOpponentEvent('⚠️ Opponent submitted a correct solution!');
        sounds.anticheatWarning();
      } else if (payload.event === 'failed') {
        setOpponentEvent("Opponent's submission failed");
      }
      setTimeout(() => setOpponentEvent(null), 4000);
    });

    conn.on('MatchEnded', (payload: MatchEndedPayload) => {
      stopTimer();
      setMatchEnd(payload);
      setPhase('finished');
      // Play win/lose/draw sound after short delay for drama
      setTimeout(() => {
        if (payload.isDraw) sounds.draw();
        else if (payload.winnerId === myIdRef.current) sounds.win();
        else sounds.lose();
      }, 300);
    });

    connectionRef.current = conn;
    try {
      await conn.start();
      await conn.invoke('JoinMatchRoom', matchId);
    } catch { /* ignore */ }
  }, [matchId]);

  const cleanup = () => {
    stopTimer();
    connectionRef.current?.stop().catch(() => {});
  };

  // ── Anti-cheat ────────────────────────────────────────────────────────────
  const setupAntiCheat = () => {
    // Tab/window visibility detection
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);

    // Block external paste (allow paste within editor)
    document.addEventListener('paste', handleExternalPaste, true);
  };

  const teardownAntiCheat = () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    window.removeEventListener('blur', handleWindowBlur);
    document.removeEventListener('paste', handleExternalPaste, true);
  };

  const handleVisibilityChange = () => {
    if (document.hidden && phase === 'battle') {
      anticheatRef.current.warnings++;
      setAnticheatWarnings(anticheatRef.current.warnings);
      sounds.anticheatWarning();
    }
  };

  const handleWindowBlur = () => {
    if (phase === 'battle') {
      anticheatRef.current.warnings++;
      setAnticheatWarnings(anticheatRef.current.warnings);
      sounds.anticheatWarning();
    }
  };

  const handleExternalPaste = (e: ClipboardEvent) => {
    // Allow paste inside Monaco editor (its own paste handler)
    const target = e.target as HTMLElement;
    if (target?.closest?.('.monaco-editor')) return;
    // Block paste outside of editor during battle
    if (phase === 'battle') e.preventDefault();
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!match || isSubmitting) return;
    sounds.submit();
    setIsSubmitting(true);
    setSubmitError(null);

    // Notify opponent
    try { await connectionRef.current?.invoke('NotifySubmitting', matchId); } catch { /* ignore */ }

    try {
      const res = await vsApi.submit(matchId, code, myLanguage);
      setResult(res.data);

      if (res.data.passed) {
        stopTimer();
        // MatchEnded event will come via SignalR
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      setSubmitError(e?.response?.data?.error || 'Submission failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForfeit = async () => {
    if (!confirm('Forfeit this match? Your opponent wins.')) return;
    try { await vsApi.forfeit(matchId); } catch { /* ignore */ }
  };

  // ── Helpers ────────────────────────────────────────────────────────────────
  const formatTime = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  const myId = user?.id;
  const isPlayer1 = match?.player1.id === myId;
  const me = isPlayer1 ? match?.player1 : match?.player2;
  const opponent = isPlayer1 ? match?.player2 : match?.player1;
  const myLanguage = match ? (isPlayer1 ? match.player1Language : match.player2Language) : 'python';
  const opponentLanguage = match ? (isPlayer1 ? match.player2Language : match.player1Language) : 'python';
  const myEloChange = matchEnd
    ? (isPlayer1 ? matchEnd.player1EloChange : matchEnd.player2EloChange)
    : null;
  const iWon = matchEnd?.winnerId === myId;
  const isDraw = matchEnd?.isDraw;

  // ── Render: Loading ────────────────────────────────────────────────────────
  if (phase === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#101b22' }}>
        <div className="text-center">
          <Loader2 size={48} className="animate-spin mx-auto mb-4" style={{ color: '#3caff6' }} />
          <p style={{ color: '#8b949e' }}>Loading match...</p>
        </div>
      </div>
    );
  }

  // ── Render: Finished ───────────────────────────────────────────────────────
  if (phase === 'finished') {
    return (
      <div className="min-h-screen flex items-center justify-center app-grid" style={{ backgroundColor: '#101b22' }}>
        <div className="text-center p-10 rounded-2xl max-w-md w-full mx-4"
          style={{ border: '1px solid #1e293b', backgroundColor: 'rgba(30,41,59,0.6)' }}>
          <div className="text-6xl mb-4">
            {isDraw ? '🤝' : iWon ? '🏆' : '💀'}
          </div>
          <h1 className="text-3xl font-bold mb-2" style={{ color: '#f0f6fc' }}>
            {isDraw ? 'Draw!' : iWon ? 'You Win!' : 'Defeat'}
          </h1>
          {matchEnd && (
            <p className="text-lg mb-6" style={{ color: myEloChange! >= 0 ? '#22c55e' : '#ef4444' }}>
              {myEloChange! >= 0 ? '+' : ''}{myEloChange} ELO
            </p>
          )}
          {matchEnd?.winnerUsername && !isDraw && (
            <p className="mb-6" style={{ color: '#8b949e' }}>
              {iWon ? 'Congratulations!' : `${matchEnd.winnerUsername} solved it first.`}
            </p>
          )}
          <div className="flex gap-3">
            <button onClick={() => router.push('/vs')}
              className="flex-1 py-3 rounded-xl font-semibold transition-all"
              style={{ backgroundColor: '#3caff6', color: '#101b22' }}>
              Play Again
            </button>
            <button onClick={() => router.push('/challenges')}
              className="flex-1 py-3 rounded-xl font-semibold transition-all"
              style={{ border: '1px solid #1e293b', color: '#8b949e' }}>
              Challenges
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Render: Battle ─────────────────────────────────────────────────────────
  return (
    <div className="h-screen flex flex-col" style={{ backgroundColor: '#101b22', color: '#f0f6fc' }}>
      {/* Top bar */}
      <div className="flex items-center gap-4 px-4 h-14 shrink-0"
        style={{ borderBottom: '1px solid #1e293b', backgroundColor: 'rgba(16,27,34,0.95)' }}>
        {/* Me */}
        <div className="flex items-center gap-2 flex-1">
          <span className="text-lg">{me && TIER_ICONS[me.tier]}</span>
          <div>
            <span className="font-semibold text-sm" style={{ color: '#f0f6fc' }}>{me?.username}</span>
            <span className="ml-1 text-xs" style={{ color: TierColors[me?.tier || ''] || '#8b949e' }}>{me?.tier}</span>
          </div>
          <span className="text-xs font-mono ml-1" style={{ color: '#3caff6' }}>{me?.elo} ELO</span>
          <span className="text-xs px-1.5 py-0.5 rounded font-medium" style={{ backgroundColor: 'rgba(60,175,246,0.15)', color: '#3caff6', border: '1px solid rgba(60,175,246,0.3)' }}>
            {myLanguage === 'python' ? '🐍' : '⚡'} {myLanguage}
          </span>
        </div>

        {/* VS + timer */}
        <div className="flex flex-col items-center gap-0.5">
          <div className="flex items-center gap-2">
            <Swords size={16} style={{ color: '#3caff6' }} />
            <span className="font-mono font-bold text-lg" style={{
              color: elapsed > 1770 ? '#ef4444' : elapsed > 1740 ? '#f59e0b' : '#f0f6fc'
            }}>{formatTime(elapsed)}</span>
          </div>
          <SoundControl />
        </div>

        {/* Opponent */}
        <div className="flex items-center gap-2 flex-1 justify-end">
          <span className="text-xs px-1.5 py-0.5 rounded font-medium" style={{ backgroundColor: 'rgba(139,148,158,0.15)', color: '#8b949e', border: '1px solid rgba(139,148,158,0.3)' }}>
            {opponentLanguage === 'python' ? '🐍' : '⚡'} {opponentLanguage}
          </span>
          <span className="text-xs font-mono mr-1" style={{ color: '#3caff6' }}>{opponent?.elo} ELO</span>
          <div className="text-right">
            <span className="font-semibold text-sm" style={{ color: '#f0f6fc' }}>{opponent?.username}</span>
            <span className="ml-1 text-xs" style={{ color: TierColors[opponent?.tier || ''] || '#8b949e' }}>{opponent?.tier}</span>
          </div>
          <span className="text-lg">{opponent && TIER_ICONS[opponent.tier]}</span>
        </div>
      </div>

      {/* Anti-cheat warning banner */}
      {anticheatWarnings > 0 && (
        <div className="flex items-center gap-2 px-4 py-2 text-sm"
          style={{ backgroundColor: anticheatWarnings >= 3 ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)', borderBottom: '1px solid rgba(245,158,11,0.3)', color: '#f59e0b' }}>
          <Shield size={14} />
          <span>
            {anticheatWarnings >= 3
              ? `⚠️ ${anticheatWarnings} focus violations detected. Your session is being monitored.`
              : `Focus violation detected (${anticheatWarnings}). Stay on this tab during the match.`}
          </span>
        </div>
      )}

      {/* Opponent event banner */}
      {opponentEvent && (
        <div className="flex items-center gap-2 px-4 py-2 text-sm animate-pulse"
          style={{ backgroundColor: 'rgba(60,175,246,0.1)', borderBottom: '1px solid rgba(60,175,246,0.3)', color: '#3caff6' }}>
          <AlertTriangle size={14} />
          <span>{opponentEvent}</span>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Description panel */}
        {showDescription && challenge && (
          <div className="w-80 shrink-0 overflow-y-auto p-4 space-y-4"
            style={{ borderRight: '1px solid #1e293b', backgroundColor: 'rgba(16,27,34,0.6)' }}>
            <div className="flex items-start justify-between gap-2">
              <h2 className="font-bold text-base leading-tight" style={{ color: '#f0f6fc' }}>
                {challenge.title}
              </h2>
              <button onClick={() => setShowDescription(false)} style={{ color: '#6e7681' }}>
                <EyeOff size={14} />
              </button>
            </div>
            <div className="prose prose-invert text-sm max-w-none leading-relaxed"
              style={{ color: '#8b949e' }}
              dangerouslySetInnerHTML={{ __html: challenge.description.replace(/\n/g, '<br/>') }} />

            {challenge.visibleTestCases.length > 0 && (
              <div>
                <h3 className="text-xs font-bold mb-2 uppercase tracking-wider" style={{ color: '#6e7681' }}>Examples</h3>
                {challenge.visibleTestCases.slice(0, 2).map((tc, i) => (
                  <div key={tc.id} className="mb-3 rounded-lg p-3 text-xs font-mono"
                    style={{ backgroundColor: 'rgba(16,27,34,0.8)', border: '1px solid #1e293b' }}>
                    <div style={{ color: '#6e7681' }}>Input {i + 1}:</div>
                    <div className="mt-1 mb-2" style={{ color: '#f0f6fc' }}>{tc.input || '(none)'}</div>
                    <div style={{ color: '#6e7681' }}>Output:</div>
                    <div className="mt-1" style={{ color: '#22c55e' }}>{tc.expectedOutput}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Editor */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {!showDescription && (
            <button onClick={() => setShowDescription(true)}
              className="flex items-center gap-1 px-3 py-1 text-xs transition-colors"
              style={{ color: '#6e7681', borderBottom: '1px solid #1e293b', backgroundColor: 'rgba(16,27,34,0.6)' }}>
              <Eye size={12} /> Show description
            </button>
          )}
          <MonacoEditor
            height="100%"
            language={myLanguage === 'javascript' ? 'javascript' : 'python'}
            value={code}
            onChange={(v) => setCode(v || '')}
            theme="vs-dark"
            options={{
              fontSize: 14,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              tabSize: myLanguage === 'python' ? 4 : 2,
              wordWrap: 'on',
              lineNumbers: 'on',
              renderLineHighlight: 'all',
            }}
          />
        </div>

        {/* Right panel — submit + results */}
        <div className="w-72 shrink-0 flex flex-col"
          style={{ borderLeft: '1px solid #1e293b', backgroundColor: 'rgba(16,27,34,0.6)' }}>
          <div className="p-4 space-y-3">
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || phase !== 'battle'}
              className="w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
              style={{
                backgroundColor: isSubmitting ? 'rgba(60,175,246,0.3)' : '#3caff6',
                color: isSubmitting ? '#3caff6' : '#101b22',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
              }}>
              {isSubmitting ? <><Loader2 size={18} className="animate-spin" /> Judging...</> : <><ChevronRight size={18} /> Submit Solution</>}
            </button>

            <button onClick={handleForfeit}
              className="w-full py-2 rounded-xl text-sm flex items-center justify-center gap-1 transition-colors"
              style={{ border: '1px solid rgba(239,68,68,0.3)', color: '#6e7681' }}>
              <Flag size={14} /> Forfeit
            </button>
          </div>

          {/* Submit error */}
          {submitError && (
            <div className="mx-4 mb-3 p-3 rounded-lg text-sm flex items-start gap-2"
              style={{ backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444' }}>
              <XCircle size={14} className="mt-0.5 shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          {/* Judge result */}
          {result && (
            <div className="mx-4 mb-3 p-4 rounded-lg space-y-3"
              style={{
                backgroundColor: result.passed ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                border: `1px solid ${result.passed ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
              }}>
              <div className="flex items-center gap-2 font-bold"
                style={{ color: result.passed ? '#22c55e' : '#ef4444' }}>
                {result.passed ? <CheckCircle size={18} /> : <XCircle size={18} />}
                {result.passed ? 'All Tests Passed!' : 'Some Tests Failed'}
              </div>
              <div className="text-sm space-y-1" style={{ color: '#8b949e' }}>
                <div>Tests: <span style={{ color: '#f0f6fc' }}>{result.passedTests}/{result.totalTests}</span></div>
                <div>Score: <span style={{ color: '#f0f6fc' }}>{result.score}%</span></div>
                <div>Time: <span style={{ color: '#f0f6fc' }}>{result.executionTimeMs}ms</span></div>
              </div>
              {result.errorOutput && (
                <div className="text-xs font-mono p-2 rounded overflow-x-auto max-h-32"
                  style={{ backgroundColor: 'rgba(16,27,34,0.8)', color: '#ef4444' }}>
                  {result.errorOutput}
                </div>
              )}
            </div>
          )}

          {/* Opponent status */}
          <div className="mt-auto p-4 space-y-2" style={{ borderTop: '1px solid #1e293b' }}>
            <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#6e7681' }}>
              Opponent
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm">{opponent && TIER_ICONS[opponent.tier]}</span>
              <span className="text-sm font-medium" style={{ color: '#f0f6fc' }}>{opponent?.username}</span>
              {opponent?.submitted && (
                <span className="ml-auto text-xs px-1.5 py-0.5 rounded"
                  style={{ backgroundColor: 'rgba(245,158,11,0.15)', color: '#f59e0b' }}>
                  Submitted
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
