'use client';
import Navbar from '@/components/Navbar';
import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import {
  QuizVsMatch,
  QuizQuestionPayload, QuizOpponentAnsweredPayload,
  QuizQuestionResultPayload, QuizMatchEndedPayload,
} from '@/types';
import { quizApi } from '@/lib/api';
import { HubConnectionBuilder, HubConnection, LogLevel } from '@microsoft/signalr';
import { Brain, CheckCircle, XCircle, Clock, Loader2, Zap } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5072';
const QUESTION_TIME = 30;
const OPTION_LABELS = ['A', 'B', 'C', 'D'];

type Phase = 'loading' | 'playing' | 'result' | 'finished';

interface QuestionState {
  payload: QuizQuestionPayload;
  selected: number | null;
  submitted: boolean;
  opponentAnswered: boolean;
  result: QuizQuestionResultPayload | null;
}

export default function QuizVsBattlePage() {
  const router = useRouter();
  const params = useParams();
  const matchId = params.matchId as string;
  const { checkAuth } = useAuthStore();

  const [phase, setPhase] = useState<Phase>('loading');
  const [match, setMatch] = useState<QuizVsMatch | null>(null);
  const [myScore, setMyScore] = useState(0);
  const [oppScore, setOppScore] = useState(0);
  const [questionState, setQuestionState] = useState<QuestionState | null>(null);
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME);
  const [matchResult, setMatchResult] = useState<QuizMatchEndedPayload | null>(null);
  const [eloChange, setEloChange] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Refs to avoid stale closures in SignalR handlers
  const isP1Ref = useRef<boolean>(false);
  const connectionRef = useRef<HubConnection | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const hasJoinedRef = useRef(false);
  const submittingRef = useRef(false);
  const questionIndexRef = useRef(0);

  useEffect(() => {
    checkAuth();
    const token = localStorage.getItem('accessToken');
    if (!token) { router.push('/login'); return; }
    setupSignalR();
    return () => { cleanup(); };
  }, [matchId]);

  const stopTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const startTimer = (seconds: number) => {
    stopTimer();
    setTimeLeft(seconds);
    startTimeRef.current = Date.now();
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          // Auto-submit null on timeout — use current ref values to avoid stale closure
          if (!submittingRef.current) {
            doSubmit(questionIndexRef.current, null);
          }
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  };

  const doSubmit = async (qIndex: number, selectedOption: number | null) => {
    if (!connectionRef.current || submittingRef.current) return;
    stopTimer();
    submittingRef.current = true;
    setIsSubmitting(true);
    setQuestionState(prev => prev ? { ...prev, submitted: true } : prev);

    const timeTakenMs = Math.round(Date.now() - startTimeRef.current);
    try {
      await connectionRef.current.invoke('SubmitVsAnswer', matchId, qIndex, selectedOption, timeTakenMs);
    } catch { /* ignore */ }
  };

  const setupSignalR = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    const conn = new HubConnectionBuilder()
      .withUrl(`${API_URL}/hubs/quiz?access_token=${token}`)
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Warning)
      .build();

    conn.on('Question', (payload: QuizQuestionPayload) => {
      stopTimer();
      submittingRef.current = false;
      questionIndexRef.current = payload.questionIndex;
      setIsSubmitting(false);
      setQuestionState({
        payload,
        selected: null,
        submitted: false,
        opponentAnswered: false,
        result: null,
      });
      setPhase('playing');
      startTimer(payload.timerSeconds || QUESTION_TIME);
    });

    conn.on('OpponentAnswered', (payload: QuizOpponentAnsweredPayload) => {
      setQuestionState(prev => prev ? { ...prev, opponentAnswered: true } : prev);
    });

    // Use refs for isP1 since match state may not be set yet when handler fires
    conn.on('QuestionResult', (payload: QuizQuestionResultPayload) => {
      stopTimer();
      setQuestionState(prev => prev ? { ...prev, result: payload, submitted: true } : prev);
      setPhase('result');
      setMyScore(isP1Ref.current ? payload.player1TotalScore : payload.player2TotalScore);
      setOppScore(isP1Ref.current ? payload.player2TotalScore : payload.player1TotalScore);
    });

    conn.on('MatchEnded', (payload: QuizMatchEndedPayload) => {
      stopTimer();
      setMatchResult(payload);
      setMyScore(isP1Ref.current ? payload.player1Score : payload.player2Score);
      setOppScore(isP1Ref.current ? payload.player2Score : payload.player1Score);
      setEloChange(isP1Ref.current ? payload.player1EloChange : payload.player2EloChange);
      setPhase('finished');
    });

    connectionRef.current = conn;

    try {
      await conn.start();
      if (!hasJoinedRef.current) {
        hasJoinedRef.current = true;
        await conn.invoke('JoinMatchRoom', matchId);
        // Load match info to know player positions
        const res = await quizApi.getVsMatch(matchId);
        setMatch(res.data);
        // Determine if current user is player1 — decode from JWT
        const rawToken = localStorage.getItem('accessToken') || '';
        let currentUserId = '';
        try {
          const payload = JSON.parse(atob(rawToken.split('.')[1]));
          currentUserId = payload.userId || payload.sub || payload.nameid || '';
        } catch { /* ignore */ }
        isP1Ref.current = res.data.player1.id.toLowerCase() === currentUserId.toLowerCase();
      }
    } catch { /* ignore */ }
  };

  const cleanup = () => {
    stopTimer();
    connectionRef.current?.stop().catch(() => {});
  };

  const handleSelect = (opt: number) => {
    if (!questionState || questionState.submitted) return;
    setQuestionState(prev => prev ? { ...prev, selected: opt } : prev);
  };

  const handleSubmit = () => {
    if (!questionState || questionState.submitted || questionState.selected === null) return;
    doSubmit(questionState.payload.questionIndex, questionState.selected);
  };

  const getOpponent = () => {
    if (!match) return null;
    return isP1Ref.current ? match.player2 : match.player1;
  };

  const getMe = () => {
    if (!match) return null;
    return isP1Ref.current ? match.player1 : match.player2;
  };

  // ── LOADING ───────────────────────────────────────────────────────────────
  if (phase === 'loading') {
    return (
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#101b22', color: '#f0f6fc' }}>
        <Navbar />
        <main className="flex-1 flex flex-col items-center justify-center gap-4">
          <Brain size={48} style={{ color: '#3caff6' }} className="animate-pulse" />
          <p className="text-xl font-bold">Connecting to match...</p>
        </main>
      </div>
    );
  }

  // ── FINISHED ──────────────────────────────────────────────────────────────
  if (phase === 'finished' && matchResult) {
    const won = matchResult.winnerId === null ? false : !matchResult.isDraw &&
      ((isP1Ref.current && matchResult.player1Score > matchResult.player2Score) ||
       (!isP1Ref.current && matchResult.player2Score > matchResult.player1Score));
    const isDraw = matchResult.isDraw;
    const opponent = getOpponent();

    return (
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#101b22', color: '#f0f6fc' }}>
        <Navbar />
        <main className="flex-1 flex flex-col items-center justify-center px-4 py-8">
          <div className="w-full max-w-md text-center">
            <div className="text-6xl mb-4">{isDraw ? '🤝' : won ? '🏆' : '💀'}</div>
            <h2 className="text-3xl font-bold mb-2">
              {isDraw ? 'Draw!' : won ? 'You Win!' : 'You Lose!'}
            </h2>

            <div className="rounded-2xl p-6 mb-6 flex items-center justify-around" style={{ border: '1px solid #1e293b', backgroundColor: 'rgba(30,41,59,0.4)' }}>
              <div className="text-center">
                <p className="text-sm mb-1" style={{ color: '#8b949e' }}>You</p>
                <p className="text-4xl font-bold font-mono" style={{ color: '#3caff6' }}>{myScore}</p>
              </div>
              <div style={{ color: '#6e7681', fontSize: 24 }}>vs</div>
              <div className="text-center">
                <p className="text-sm mb-1" style={{ color: '#8b949e' }}>{opponent?.username || 'Opponent'}</p>
                <p className="text-4xl font-bold font-mono" style={{ color: '#ef4444' }}>{oppScore}</p>
              </div>
            </div>

            <div className="rounded-xl p-4 mb-6" style={{ border: '1px solid #1e293b', backgroundColor: 'rgba(30,41,59,0.4)' }}>
              <p className="text-sm mb-1" style={{ color: '#8b949e' }}>ELO Change</p>
              <p className="text-2xl font-bold font-mono" style={{ color: eloChange >= 0 ? '#22c55e' : '#ef4444' }}>
                {eloChange >= 0 ? '+' : ''}{eloChange}
              </p>
            </div>

            <div className="flex gap-3">
              <button onClick={() => router.push('/quiz/vs')}
                className="flex-1 py-3 rounded-xl font-bold"
                style={{ border: '1px solid #3caff6', color: '#3caff6' }}>
                Play Again
              </button>
              <button onClick={() => router.push('/quiz')}
                className="flex-1 py-3 rounded-xl font-bold"
                style={{ backgroundColor: '#3caff6', color: '#101b22' }}>
                Solo Quiz
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ── PLAYING / RESULT ──────────────────────────────────────────────────────
  if (!questionState) {
    return (
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#101b22', color: '#f0f6fc' }}>
        <Navbar />
        <main className="flex-1 flex flex-col items-center justify-center gap-4">
          <Brain size={48} style={{ color: '#3caff6' }} className="animate-pulse" />
          <p style={{ color: '#8b949e' }}>Waiting for first question...</p>
        </main>
      </div>
    );
  }

  const { payload, selected, submitted, opponentAnswered, result } = questionState;
  const question = payload.question;
  const options = [question.optionA, question.optionB, question.optionC, question.optionD];
  const correctOpt = result?.correctOption;
  const timerPct = (timeLeft / QUESTION_TIME) * 100;
  const me = getMe();
  const opponent = getOpponent();

  const myQuestionScore = result ? (isP1Ref.current ? result.player1Points : result.player2Points) : null;
  const oppQuestionScore = result ? (isP1Ref.current ? result.player2Points : result.player1Points) : null;

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#101b22', color: '#f0f6fc' }}>
      <Navbar />
      <main className="flex-1 flex flex-col items-center px-4 py-6">
        <div className="w-full max-w-2xl">

          {/* Players header */}
          <div className="flex items-center justify-between mb-4 rounded-2xl px-5 py-3" style={{ border: '1px solid #1e293b', backgroundColor: 'rgba(30,41,59,0.4)' }}>
            <div className="text-center">
              <p className="text-xs mb-0.5" style={{ color: '#8b949e' }}>You</p>
              <p className="font-bold" style={{ color: '#f0f6fc' }}>{me?.username || 'You'}</p>
              <p className="text-xl font-mono font-bold" style={{ color: '#3caff6' }}>{myScore}</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold" style={{ color: '#8b949e' }}>Q{payload.questionIndex + 1}</p>
              <div className="flex items-center gap-1 justify-center mt-1" style={{ color: timeLeft <= 10 ? '#ef4444' : '#8b949e' }}>
                <Clock size={12} />
                <span className="font-mono text-sm">{timeLeft}s</span>
              </div>
            </div>
            <div className="text-center">
              <p className="text-xs mb-0.5" style={{ color: '#8b949e' }}>Opponent</p>
              <p className="font-bold" style={{ color: '#f0f6fc' }}>{opponent?.username || '?'}</p>
              <p className="text-xl font-mono font-bold" style={{ color: '#ef4444' }}>{oppScore}</p>
            </div>
          </div>

          {/* Opponent answered indicator */}
          {!submitted && opponentAnswered && (
            <div className="text-center text-xs mb-2 py-1.5 rounded-lg" style={{ backgroundColor: 'rgba(34,197,94,0.08)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.2)' }}>
              <Zap size={12} className="inline mr-1" /> Opponent answered!
            </div>
          )}

          {/* Timer bar */}
          <div className="w-full rounded-full mb-4 overflow-hidden" style={{ height: 3, backgroundColor: '#1e293b' }}>
            <div className="h-full rounded-full transition-all duration-1000"
              style={{ width: `${timerPct}%`, backgroundColor: timeLeft <= 10 ? '#ef4444' : '#3caff6' }} />
          </div>

          {/* Question */}
          <div className="rounded-2xl p-5 mb-4" style={{ border: '1px solid #1e293b', backgroundColor: 'rgba(30,41,59,0.4)' }}>
            <p className="font-medium leading-relaxed" style={{ color: '#f0f6fc' }}>{question.text}</p>
          </div>

          {/* Options */}
          <div className="grid grid-cols-1 gap-2.5 mb-4">
            {options.map((opt, i) => {
              let borderColor = '#1e293b';
              let bgColor = 'rgba(16,27,34,0.6)';
              let textColor = '#f0f6fc';

              if (phase === 'result' || submitted) {
                if (i === correctOpt) { borderColor = '#22c55e'; bgColor = 'rgba(34,197,94,0.12)'; textColor = '#22c55e'; }
                else if (i === selected && i !== correctOpt) { borderColor = '#ef4444'; bgColor = 'rgba(239,68,68,0.12)'; textColor = '#ef4444'; }
                else { textColor = '#6e7681'; }
              } else if (selected === i) {
                borderColor = '#3caff6'; bgColor = 'rgba(60,175,246,0.12)'; textColor = '#3caff6';
              }

              return (
                <button key={i} onClick={() => handleSelect(i)}
                  className="w-full text-left px-4 py-3.5 rounded-xl flex items-center gap-3 transition-all"
                  style={{ border: `1px solid ${borderColor}`, backgroundColor: bgColor, color: textColor, cursor: submitted ? 'default' : 'pointer' }}>
                  <span className="font-bold text-xs w-5 text-center shrink-0" style={{ opacity: 0.8 }}>{OPTION_LABELS[i]}</span>
                  <span className="flex-1 text-sm">{opt}</span>
                  {(phase === 'result' || submitted) && i === correctOpt && <CheckCircle size={16} style={{ color: '#22c55e', flexShrink: 0 }} />}
                  {(phase === 'result' || submitted) && i === selected && i !== correctOpt && <XCircle size={16} style={{ color: '#ef4444', flexShrink: 0 }} />}
                </button>
              );
            })}
          </div>

          {/* Result explanation */}
          {phase === 'result' && result && (
            <div className="rounded-xl p-4 mb-4" style={{ border: '1px solid #1e293b', backgroundColor: 'rgba(30,41,59,0.4)' }}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {myQuestionScore !== null && myQuestionScore > 0
                    ? <CheckCircle size={16} style={{ color: '#22c55e' }} />
                    : <XCircle size={16} style={{ color: '#ef4444' }} />}
                  <span className="text-sm font-medium" style={{ color: '#f0f6fc' }}>
                    You {myQuestionScore !== null && myQuestionScore > 0 ? `+${myQuestionScore} pts` : '0 pts'}
                  </span>
                </div>
                <span className="text-sm" style={{ color: '#6e7681' }}>
                  Opponent: {oppQuestionScore !== null && oppQuestionScore > 0 ? `+${oppQuestionScore} pts` : '0 pts'}
                </span>
              </div>
              {result.explanation && (
                <p className="text-xs" style={{ color: '#8b949e' }}>
                  <span style={{ color: '#3caff6' }}>Explanation: </span>{result.explanation}
                </p>
              )}
              <p className="text-xs mt-2 text-center" style={{ color: '#6e7681' }}>Next question in 3s...</p>
            </div>
          )}

          {/* Submit button */}
          {!submitted && phase === 'playing' && (
            <button onClick={handleSubmit} disabled={selected === null || isSubmitting}
              className="w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
              style={{
                backgroundColor: selected !== null ? '#3caff6' : '#1e293b',
                color: selected !== null ? '#101b22' : '#6e7681',
                cursor: selected === null ? 'not-allowed' : 'pointer',
              }}>
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : null}
              {isSubmitting ? 'Submitting...' : 'Submit Answer'}
            </button>
          )}

          {submitted && phase === 'playing' && !result && (
            <div className="w-full py-3 rounded-xl text-center text-sm" style={{ border: '1px solid #1e293b', color: '#8b949e' }}>
              <Loader2 size={14} className="inline animate-spin mr-2" />
              Waiting for opponent...
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
