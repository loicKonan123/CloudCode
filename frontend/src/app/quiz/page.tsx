'use client';
import Navbar from '@/components/Navbar';
import PremiumGate from '@/components/PremiumGate';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { quizApi } from '@/lib/api';
import {
  QuizCategory, QuizDifficulty, QuizSession, QuizSessionAnswer,
  QuizCategoryNames, QuizCategoryIcons, QuizDifficultyNames,
} from '@/types';
import { Brain, CheckCircle, XCircle, Clock, Trophy, RotateCcw, ChevronRight, Loader2 } from 'lucide-react';

type Phase = 'select' | 'playing' | 'finished';

const QUESTION_TIME = 30; // seconds

function QuizSoloPageInner() {
  const router = useRouter();
  const { checkAuth } = useAuthStore();

  const [phase, setPhase] = useState<Phase>('select');
  const [category, setCategory] = useState<QuizCategory>(QuizCategory.Python);
  const [difficulty, setDifficulty] = useState<QuizDifficulty>(QuizDifficulty.Easy);

  const [session, setSession] = useState<QuizSession | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [answerResult, setAnswerResult] = useState<QuizSessionAnswer | null>(null);
  const [answers, setAnswers] = useState<QuizSessionAnswer[]>([]);
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME);
  const [isLoading, setIsLoading] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  // Refs to avoid stale closures in timer callbacks
  const sessionRef = useRef<QuizSession | null>(null);
  const submittedRef = useRef(false);
  const currentIndexRef = useRef(0);

  useEffect(() => {
    checkAuth();
    const token = localStorage.getItem('accessToken');
    if (!token) router.push('/login');
  }, []);

  // Keep refs in sync with state
  useEffect(() => { sessionRef.current = session; }, [session]);
  useEffect(() => { submittedRef.current = submitted; }, [submitted]);
  useEffect(() => { currentIndexRef.current = currentIndex; }, [currentIndex]);

  const stopTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const startTimer = () => {
    stopTimer();
    setTimeLeft(QUESTION_TIME);
    startTimeRef.current = Date.now();
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          // Use refs to avoid stale closure
          if (!submittedRef.current && sessionRef.current) {
            const timeTakenMs = Math.round(Date.now() - startTimeRef.current);
            const question = sessionRef.current.questions[currentIndexRef.current];
            if (question) {
              doSubmitAnswer(sessionRef.current, currentIndexRef.current, question.id, null, timeTakenMs);
            }
          }
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  };

  const handleStart = async () => {
    setIsLoading(true);
    try {
      const res = await quizApi.startSession(category, difficulty);
      setSession(res.data);
      sessionRef.current = res.data;
      setCurrentIndex(0);
      currentIndexRef.current = 0;
      setAnswers([]);
      setSelected(null);
      setSubmitted(false);
      submittedRef.current = false;
      setAnswerResult(null);
      setPhase('playing');
      setTimeout(() => startTimer(), 100);
    } catch {
      /* ignore */
    } finally {
      setIsLoading(false);
    }
  };

  // Core submit logic — accepts all values explicitly to avoid stale closures
  const doSubmitAnswer = async (
    sess: QuizSession, qIndex: number, questionId: string,
    option: number | null, timeTakenMs: number
  ) => {
    setSubmitted(true);
    submittedRef.current = true;
    try {
      const res = await quizApi.submitAnswer(sess.id, questionId, qIndex, option, timeTakenMs);
      setAnswerResult(res.data);
      setAnswers(prev => [...prev, res.data]);
    } catch { /* ignore */ }
  };

  const submitAnswer = (option: number | null) => {
    if (!session || submitted) return;
    stopTimer();
    const timeTakenMs = Math.round(Date.now() - startTimeRef.current);
    const question = session.questions[currentIndex];
    doSubmitAnswer(session, currentIndex, question.id, option, timeTakenMs);
  };

  const handleSelect = (opt: number) => {
    if (submitted) return;
    setSelected(opt);
  };

  const handleSubmit = () => {
    if (selected === null || submitted) return;
    submitAnswer(selected);
  };

  const handleNext = () => {
    const nextIndex = currentIndex + 1;
    if (!session) return;

    if (nextIndex >= session.questions.length) {
      setPhase('finished');
      return;
    }

    setCurrentIndex(nextIndex);
    currentIndexRef.current = nextIndex;
    setSelected(null);
    setSubmitted(false);
    submittedRef.current = false;
    setAnswerResult(null);
    setTimeout(() => startTimer(), 100);
  };

  const handleRestart = () => {
    setPhase('select');
    setSession(null);
    setAnswers([]);
    setCurrentIndex(0);
    setSelected(null);
    setSubmitted(false);
    setAnswerResult(null);
  };

  const OPTION_LABELS = ['A', 'B', 'C', 'D'];
  const DIFF_COLORS: Record<QuizDifficulty, string> = {
    [QuizDifficulty.Easy]: '#22c55e',
    [QuizDifficulty.Medium]: '#f59e0b',
    [QuizDifficulty.Hard]: '#ef4444',
  };

  // ── SELECT PHASE ──────────────────────────────────────────────────────────
  if (phase === 'select') {
    return (
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#101b22', color: '#f0f6fc' }}>
        <Navbar />
        <main className="flex-1 flex flex-col items-center justify-center px-4 py-10">
          <div className="w-full max-w-lg">
            <div className="text-center mb-8">
              <Brain size={48} style={{ color: '#3caff6' }} className="mx-auto mb-3" />
              <h1 className="text-3xl font-bold">Quiz Solo</h1>
              <p className="mt-2" style={{ color: '#8b949e' }}>10 questions · 30 seconds each</p>
            </div>

            {/* Category */}
            <div className="rounded-2xl p-6 mb-4" style={{ border: '1px solid #1e293b', backgroundColor: 'rgba(30,41,59,0.4)' }}>
              <h2 className="font-semibold mb-3" style={{ color: '#8b949e' }}>Category</h2>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {Object.values(QuizCategory).filter(v => typeof v === 'number').map(cat => {
                  const c = cat as QuizCategory;
                  const active = category === c;
                  return (
                    <button key={c} onClick={() => setCategory(c)}
                      className="py-3 px-2 rounded-xl text-sm font-medium transition-all flex flex-col items-center gap-1"
                      style={{
                        border: `1px solid ${active ? '#3caff6' : '#1e293b'}`,
                        backgroundColor: active ? 'rgba(60,175,246,0.12)' : 'rgba(16,27,34,0.6)',
                        color: active ? '#3caff6' : '#8b949e',
                      }}>
                      <span className="text-xl">{QuizCategoryIcons[c]}</span>
                      {QuizCategoryNames[c]}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Difficulty */}
            <div className="rounded-2xl p-6 mb-6" style={{ border: '1px solid #1e293b', backgroundColor: 'rgba(30,41,59,0.4)' }}>
              <h2 className="font-semibold mb-3" style={{ color: '#8b949e' }}>Difficulty</h2>
              <div className="flex gap-2">
                {Object.values(QuizDifficulty).filter(v => typeof v === 'number').map(diff => {
                  const d = diff as QuizDifficulty;
                  const active = difficulty === d;
                  return (
                    <button key={d} onClick={() => setDifficulty(d)}
                      className="flex-1 py-3 rounded-xl text-sm font-bold transition-all"
                      style={{
                        border: `1px solid ${active ? DIFF_COLORS[d] : '#1e293b'}`,
                        backgroundColor: active ? `${DIFF_COLORS[d]}20` : 'rgba(16,27,34,0.6)',
                        color: active ? DIFF_COLORS[d] : '#8b949e',
                      }}>
                      {QuizDifficultyNames[d]}
                    </button>
                  );
                })}
              </div>
            </div>

            <button onClick={handleStart} disabled={isLoading}
              className="w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-all"
              style={{ backgroundColor: '#3caff6', color: '#101b22', opacity: isLoading ? 0.7 : 1 }}>
              {isLoading ? <Loader2 size={20} className="animate-spin" /> : <Brain size={20} />}
              {isLoading ? 'Starting...' : 'Start Quiz'}
            </button>

            <p className="text-center mt-4 text-sm cursor-pointer" style={{ color: '#3caff6' }}
              onClick={() => router.push('/quiz/vs')}>
              Want to play VS? → Quiz VS Mode
            </p>
          </div>
        </main>
      </div>
    );
  }

  // ── PLAYING PHASE ─────────────────────────────────────────────────────────
  if (phase === 'playing' && session) {
    const question = session.questions[currentIndex];
    const options = [question.optionA, question.optionB, question.optionC, question.optionD];
    const correctOpt = answerResult?.question?.correctOption;
    const timerPct = (timeLeft / QUESTION_TIME) * 100;

    return (
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#101b22', color: '#f0f6fc' }}>
        <Navbar />
        <main className="flex-1 flex flex-col items-center justify-center px-4 py-8">
          <div className="w-full max-w-2xl">
            {/* Progress */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm" style={{ color: '#8b949e' }}>Question {currentIndex + 1} / {session.questions.length}</span>
              <div className="flex items-center gap-2">
                <Clock size={14} style={{ color: timeLeft <= 10 ? '#ef4444' : '#8b949e' }} />
                <span className="font-mono font-bold text-lg" style={{ color: timeLeft <= 10 ? '#ef4444' : '#f0f6fc' }}>
                  {timeLeft}s
                </span>
              </div>
            </div>

            {/* Timer bar */}
            <div className="w-full rounded-full mb-6 overflow-hidden" style={{ height: 4, backgroundColor: '#1e293b' }}>
              <div className="h-full rounded-full transition-all duration-1000"
                style={{ width: `${timerPct}%`, backgroundColor: timeLeft <= 10 ? '#ef4444' : '#3caff6' }} />
            </div>

            {/* Question */}
            <div className="rounded-2xl p-6 mb-4" style={{ border: '1px solid #1e293b', backgroundColor: 'rgba(30,41,59,0.4)' }}>
              <p className="text-lg font-medium leading-relaxed" style={{ color: '#f0f6fc' }}>{question.text}</p>
            </div>

            {/* Options */}
            <div className="grid grid-cols-1 gap-3 mb-6">
              {options.map((opt, i) => {
                let borderColor = '#1e293b';
                let bgColor = 'rgba(16,27,34,0.6)';
                let textColor = '#f0f6fc';

                if (submitted) {
                  if (i === correctOpt) { borderColor = '#22c55e'; bgColor = 'rgba(34,197,94,0.12)'; textColor = '#22c55e'; }
                  else if (i === selected && i !== correctOpt) { borderColor = '#ef4444'; bgColor = 'rgba(239,68,68,0.12)'; textColor = '#ef4444'; }
                  else { textColor = '#6e7681'; }
                } else if (selected === i) {
                  borderColor = '#3caff6'; bgColor = 'rgba(60,175,246,0.12)'; textColor = '#3caff6';
                }

                return (
                  <button key={i} onClick={() => handleSelect(i)}
                    className="w-full text-left px-5 py-4 rounded-xl flex items-center gap-3 transition-all"
                    style={{ border: `1px solid ${borderColor}`, backgroundColor: bgColor, color: textColor, cursor: submitted ? 'default' : 'pointer' }}>
                    <span className="font-bold text-sm w-6 text-center rounded"
                      style={{ backgroundColor: 'rgba(30,41,59,0.8)' }}>{OPTION_LABELS[i]}</span>
                    <span className="flex-1">{opt}</span>
                    {submitted && i === correctOpt && <CheckCircle size={18} style={{ color: '#22c55e', flexShrink: 0 }} />}
                    {submitted && i === selected && i !== correctOpt && <XCircle size={18} style={{ color: '#ef4444', flexShrink: 0 }} />}
                  </button>
                );
              })}
            </div>

            {/* Explanation */}
            {submitted && answerResult?.question?.explanation && (
              <div className="rounded-xl p-4 mb-4" style={{ border: '1px solid #1e293b', backgroundColor: 'rgba(30,41,59,0.6)' }}>
                <p className="text-sm" style={{ color: '#8b949e' }}>
                  <span className="font-bold" style={{ color: '#3caff6' }}>Explanation: </span>
                  {answerResult.question.explanation}
                </p>
              </div>
            )}

            {/* Action */}
            {!submitted ? (
              <button onClick={handleSubmit} disabled={selected === null}
                className="w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
                style={{
                  backgroundColor: selected !== null ? '#3caff6' : '#1e293b',
                  color: selected !== null ? '#101b22' : '#6e7681',
                  cursor: selected === null ? 'not-allowed' : 'pointer',
                }}>
                Submit Answer
              </button>
            ) : (
              <button onClick={handleNext}
                className="w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2"
                style={{ backgroundColor: '#3caff6', color: '#101b22' }}>
                {currentIndex + 1 < session.questions.length ? (
                  <><ChevronRight size={18} /> Next Question</>
                ) : (
                  <><Trophy size={18} /> See Results</>
                )}
              </button>
            )}
          </div>
        </main>
      </div>
    );
  }

  // ── FINISHED PHASE ────────────────────────────────────────────────────────
  if (phase === 'finished' && session) {
    const correct = answers.filter(a => a.isCorrect).length;
    const total = session.questions.length;
    const pct = Math.round((correct / total) * 100);
    const avgTime = answers.length > 0
      ? Math.round(answers.reduce((s, a) => s + a.timeTakenMs, 0) / answers.length / 1000)
      : 0;

    return (
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#101b22', color: '#f0f6fc' }}>
        <Navbar />
        <main className="flex-1 flex flex-col items-center justify-center px-4 py-8">
          <div className="w-full max-w-xl">
            {/* Score card */}
            <div className="rounded-2xl p-8 text-center mb-6" style={{ border: '1px solid #1e293b', backgroundColor: 'rgba(30,41,59,0.4)' }}>
              <Trophy size={48} style={{ color: '#f59e0b' }} className="mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Quiz Complete!</h2>
              <div className="text-6xl font-mono font-bold mb-2" style={{ color: pct >= 70 ? '#22c55e' : pct >= 40 ? '#f59e0b' : '#ef4444' }}>
                {pct}%
              </div>
              <p style={{ color: '#8b949e' }}>{correct} / {total} correct · avg {avgTime}s/question</p>

              <div className="grid grid-cols-3 gap-4 mt-6">
                {[
                  ['Score', `${correct}/${total}`, '#3caff6'],
                  ['Accuracy', `${pct}%`, pct >= 70 ? '#22c55e' : '#f59e0b'],
                  ['Avg Time', `${avgTime}s`, '#8b949e'],
                ].map(([label, value, color]) => (
                  <div key={String(label)} className="rounded-xl p-3" style={{ backgroundColor: 'rgba(16,27,34,0.8)' }}>
                    <div className="font-bold" style={{ color: String(color) }}>{value}</div>
                    <div className="text-xs mt-1" style={{ color: '#6e7681' }}>{label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Answers review */}
            <div className="rounded-2xl overflow-hidden mb-6" style={{ border: '1px solid #1e293b', backgroundColor: 'rgba(30,41,59,0.4)' }}>
              <div className="px-5 py-3" style={{ borderBottom: '1px solid #1e293b' }}>
                <h3 className="font-semibold">Review</h3>
              </div>
              <div className="divide-y" style={{ borderColor: '#1e293b' }}>
                {answers.map((a, i) => (
                  <div key={i} className="px-5 py-3 flex items-start gap-3">
                    {a.isCorrect
                      ? <CheckCircle size={18} style={{ color: '#22c55e', flexShrink: 0, marginTop: 2 }} />
                      : <XCircle size={18} style={{ color: '#ef4444', flexShrink: 0, marginTop: 2 }} />
                    }
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: '#f0f6fc' }}>{a.question?.text || `Q${i + 1}`}</p>
                      {!a.isCorrect && a.question?.correctOption !== undefined && (
                        <p className="text-xs mt-0.5" style={{ color: '#22c55e' }}>
                          Correct: {['A','B','C','D'][a.question.correctOption]}
                        </p>
                      )}
                    </div>
                    <span className="text-xs" style={{ color: '#6e7681' }}>{Math.round(a.timeTakenMs / 1000)}s</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={handleRestart}
                className="flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
                style={{ border: '1px solid #3caff6', color: '#3caff6' }}>
                <RotateCcw size={16} /> Play Again
              </button>
              <button onClick={() => router.push('/quiz/vs')}
                className="flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2"
                style={{ backgroundColor: '#3caff6', color: '#101b22' }}>
                Try VS Mode
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return null;
}

export default function QuizSoloPage() {
  return (
    <PremiumGate feature="Quiz">
      <QuizSoloPageInner />
    </PremiumGate>
  );
}
