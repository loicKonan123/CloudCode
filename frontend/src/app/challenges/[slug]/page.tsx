'use client';
import AnimatedLogo from '@/components/AnimatedLogo';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { challengesApi, formattingApi } from '@/lib/api';
import {
  ChallengeDetail,
  ChallengeLanguage,
  ChallengeLanguageNames,
  DifficultyNames,
  JudgeResult,
  TestResult,
  SubmissionInfo,
  SubmissionStatus,
} from '@/types';
import dynamic from 'next/dynamic';
import ReactMarkdown from 'react-markdown';
import type * as Monaco from 'monaco-editor';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

const DifficultyBadgeStyles: Record<number, string> = {
  1: 'bg-green-500/10 text-green-500 border-green-500/20',
  2: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  3: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
};

type Tab = 'description' | 'submissions';

export default function ChallengePage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;
  const { isAuthenticated, checkAuth } = useAuthStore();

  const [challenge, setChallenge] = useState<ChallengeDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState<ChallengeLanguage>(ChallengeLanguage.Python);
  const [activeTab, setActiveTab] = useState<Tab>('description');
  const [submissions, setSubmissions] = useState<SubmissionInfo[]>([]);

  // Execution
  const [isTesting, setIsTesting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [testResults, setTestResults] = useState<JudgeResult | null>(null);
  const [selectedTestIndex, setSelectedTestIndex] = useState(0);

  // Editor settings
  const [fontSize, setFontSize] = useState(14);
  const [isFormatting, setIsFormatting] = useState(false);
  const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null);

  // Timer
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    checkAuth();
    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.push('/login');
      return;
    }
    loadChallenge();
    // Start timer
    timerRef.current = setInterval(() => setElapsedSeconds(s => s + 1), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [slug, checkAuth, router]);

  const loadChallenge = async () => {
    try {
      setIsLoading(true);
      const response = await challengesApi.getBySlug(slug);
      setChallenge(response.data);
      const c = response.data;
      if (c.supportedLanguages === ChallengeLanguage.JavaScript) {
        setLanguage(ChallengeLanguage.JavaScript);
        setCode(c.starterCodeJavaScript || '');
      } else {
        setLanguage(ChallengeLanguage.Python);
        setCode(c.starterCodePython || '');
      }
    } catch {
      router.push('/challenges');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLanguageChange = (lang: ChallengeLanguage) => {
    setLanguage(lang);
    if (challenge) {
      setCode(lang === ChallengeLanguage.Python ? challenge.starterCodePython || '' : challenge.starterCodeJavaScript || '');
    }
    setTestResults(null);
  };

  const handleTest = useCallback(async () => {
    if (!challenge || !isAuthenticated) return;
    setIsTesting(true);
    setTestResults(null);
    try {
      const response = await challengesApi.test(slug, code, language);
      setTestResults(response.data);
      setSelectedTestIndex(0);
    } catch (error: any) {
      setTestResults({
        status: SubmissionStatus.Error, passedTests: 0, totalTests: 0, score: 0, totalExecutionTimeMs: 0,
        results: [{ testIndex: 0, passed: false, error: error.response?.data?.message || 'Error', executionTimeMs: 0, isHidden: false }],
      });
    } finally {
      setIsTesting(false);
    }
  }, [challenge, isAuthenticated, slug, code, language]);

  const handleSubmit = useCallback(async () => {
    if (!challenge || !isAuthenticated) return;
    setIsSubmitting(true);
    setTestResults(null);
    try {
      const response = await challengesApi.submit(slug, code, language);
      setTestResults(response.data);
      setSelectedTestIndex(0);
      const updated = await challengesApi.getBySlug(slug);
      setChallenge(updated.data);
    } catch { /* ignore */ } finally {
      setIsSubmitting(false);
    }
  }, [challenge, isAuthenticated, slug, code, language]);

  const loadSubmissions = async () => {
    if (!isAuthenticated) return;
    try {
      const response = await challengesApi.getSubmissions(slug);
      setSubmissions(response.data);
    } catch { /* ignore */ }
  };

  const handleFormat = useCallback(async () => {
    if (isFormatting) return;
    setIsFormatting(true);
    try {
      const langName = language === ChallengeLanguage.Python ? 'python' : 'javascript';
      const res = await formattingApi.format(code, langName);
      if (res.data.success) setCode(res.data.formattedCode);
    } catch { /* ignore if formatter unavailable */ } finally {
      setIsFormatting(false);
    }
  }, [code, language, isFormatting]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleTest(); }
      else if (e.ctrlKey && e.shiftKey && e.key === 'Enter') { e.preventDefault(); handleSubmit(); }
      else if (e.ctrlKey && e.shiftKey && e.key === 'F') { e.preventDefault(); editorRef.current?.getAction('actions.find')?.run(); }
      else if (e.altKey && e.shiftKey && e.key === 'F') { e.preventDefault(); handleFormat(); }
      else if (e.ctrlKey && e.key === '+') { e.preventDefault(); setFontSize(s => Math.min(s + 1, 28)); }
      else if (e.ctrlKey && e.key === '-') { e.preventDefault(); setFontSize(s => Math.max(s - 1, 10)); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleTest, handleSubmit, handleFormat]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return { min: m.toString().padStart(2, '0'), sec: sec.toString().padStart(2, '0') };
  };

  if (isLoading || !challenge) {
    return (
      <div className="min-h-screen flex items-center justify-center app-grid" style={{ backgroundColor: '#101b22' }}>
        <div className="w-8 h-8 border-2 border-[#3caff6] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const monacoLang = language === ChallengeLanguage.Python ? 'python' : 'javascript';
  const showPython = challenge.supportedLanguages === ChallengeLanguage.Python || challenge.supportedLanguages === ChallengeLanguage.Both;
  const showJS = challenge.supportedLanguages === ChallengeLanguage.JavaScript || challenge.supportedLanguages === ChallengeLanguage.Both;
  const time = formatTime(elapsedSeconds);
  const selectedResult = testResults?.results?.[selectedTestIndex];

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ backgroundColor: '#101b22', color: '#e2e8f0' }}>
      {/* Top Bar */}
      <header className="flex flex-col md:flex-row md:items-center justify-between px-4 md:px-6 py-3 border-b border-slate-800 bg-[#101b22] z-10 gap-3">
        <div className="flex items-center gap-4 md:gap-6 min-w-0">
          <div className="flex items-center gap-2 text-[#3caff6] shrink-0">
            <AnimatedLogo size={28} />
            <h1 className="text-xl font-bold tracking-tight hidden sm:block">CloudCode</h1>
          </div>
          <nav className="flex items-center gap-2 text-sm min-w-0">
            <button onClick={() => router.push('/challenges')} className="text-slate-500 hover:text-[#3caff6] transition-colors shrink-0">
              Challenges
            </button>
            <span className="text-slate-600 shrink-0">/</span>
            <span className="font-medium text-white truncate">{challenge.title}</span>
          </nav>
        </div>

        <div className="flex items-center gap-2 md:gap-4 flex-wrap">
          {/* Timer */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/50 rounded-lg border border-slate-700">
            <svg className="w-4 h-4 text-[#3caff6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex items-baseline gap-1 font-mono">
              <span className="text-base md:text-lg font-bold text-[#3caff6]">{time.min}</span>
              <span className="text-[10px] uppercase text-slate-500">min</span>
              <span className="text-base md:text-lg font-bold text-[#3caff6]">{time.sec}</span>
              <span className="text-[10px] uppercase text-slate-500">sec</span>
            </div>
          </div>

          <div className="h-8 w-px bg-slate-700 hidden md:block" />

          {/* Language selector */}
          <select
            value={language}
            onChange={(e) => handleLanguageChange(Number(e.target.value) as ChallengeLanguage)}
            className="bg-slate-800 border-none rounded-lg text-xs md:text-sm font-medium py-2 pl-3 pr-8 focus:ring-2 focus:ring-[#3caff6]/50 cursor-pointer text-white"
          >
            {showPython && <option value={ChallengeLanguage.Python}>Python 3.10</option>}
            {showJS && <option value={ChallengeLanguage.JavaScript}>JavaScript (ES6)</option>}
          </select>

          <div className="flex gap-2 ml-auto md:ml-0">
            <button
              onClick={handleTest}
              disabled={isTesting || isSubmitting || !isAuthenticated}
              className="flex items-center gap-2 px-3 md:px-5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm font-bold transition-all disabled:opacity-50"
            >
              {isTesting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
              )}
              Run
            </button>
            <button
              onClick={handleSubmit}
              disabled={isTesting || isSubmitting || !isAuthenticated}
              className="flex items-center gap-2 px-4 md:px-6 py-2 rounded-lg bg-[#3caff6] hover:bg-[#3caff6]/90 text-[#101b22] text-sm font-bold transition-all shadow-lg shadow-[#3caff6]/20 disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-[#101b22] border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              )}
              Submit
            </button>
          </div>
        </div>
      </header>

      {/* Main IDE Layout */}
      <main className="flex flex-col md:flex-row flex-1 overflow-hidden">
        {/* Left Pane: Description */}
        <section className="w-full md:w-[40%] flex flex-col border-b md:border-b-0 md:border-r border-slate-800 bg-[#101b22] max-h-[40vh] md:max-h-none">
          {/* Tabs */}
          <div className="flex border-b border-slate-800 px-4">
            <button
              onClick={() => setActiveTab('description')}
              className={`px-4 py-3 text-sm font-bold flex items-center gap-2 transition-colors ${
                activeTab === 'description'
                  ? 'border-b-2 border-[#3caff6] text-[#3caff6]'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Description
            </button>
            <button
              onClick={() => { setActiveTab('submissions'); loadSubmissions(); }}
              className={`px-4 py-3 text-sm font-medium flex items-center gap-2 transition-colors ${
                activeTab === 'submissions'
                  ? 'border-b-2 border-[#3caff6] text-[#3caff6]'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Submissions
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6" style={{ scrollbarWidth: 'thin', scrollbarColor: '#315368 transparent' }}>
            {activeTab === 'description' ? (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold mb-4">{challenge.title}</h2>
                  <div className="flex gap-2 mb-6">
                    <span className={`px-2 py-1 text-xs font-bold rounded border uppercase tracking-wider ${DifficultyBadgeStyles[challenge.difficulty]}`}>
                      {DifficultyNames[challenge.difficulty]}
                    </span>
                    {challenge.tags.map((tag) => (
                      <span key={tag} className="px-2 py-1 text-xs font-bold bg-slate-800 text-slate-500 rounded border border-slate-700 uppercase tracking-wider">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="prose prose-invert prose-sm max-w-none prose-code:bg-slate-800 prose-code:px-1 prose-code:rounded prose-code:text-[#3caff6]">
                    <ReactMarkdown>{challenge.description}</ReactMarkdown>
                  </div>
                </div>

                {/* Visible Test Cases as Examples */}
                {challenge.visibleTestCases.map((tc, i) => (
                  <div key={tc.id} className="space-y-2">
                    <h3 className="font-bold text-lg">Example {i + 1}:</h3>
                    <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 space-y-2">
                      <div className="flex gap-2">
                        <span className="text-slate-500 text-sm font-mono w-16">Input:</span>
                        <code className="text-sm font-mono">{tc.input}</code>
                      </div>
                      <div className="flex gap-2">
                        <span className="text-slate-500 text-sm font-mono w-16">Output:</span>
                        <code className="text-sm font-mono">{tc.expectedOutput}</code>
                      </div>
                      {tc.description && (
                        <div className="flex gap-2 pt-2 border-t border-slate-800">
                          <span className="text-slate-500 text-sm italic">{tc.description}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {/* Stats */}
                <div className="pt-6 border-t border-slate-800">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>{challenge.totalTestCases} total test cases</span>
                    <span>{challenge.totalTestCases - challenge.visibleTestCases.length} hidden</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {submissions.length === 0 ? (
                  <p className="text-slate-500 text-sm">No submissions yet</p>
                ) : submissions.map((sub) => (
                  <div
                    key={sub.id}
                    onClick={() => { setCode(sub.code); setActiveTab('description'); }}
                    className="bg-slate-800/40 border border-slate-800 rounded-lg p-4 cursor-pointer hover:border-slate-600 transition"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {sub.status === SubmissionStatus.Passed ? (
                          <span className="text-emerald-500 text-xs font-bold">Accepted</span>
                        ) : (
                          <span className="text-red-500 text-xs font-bold">Failed</span>
                        )}
                        <span className="text-sm text-slate-400">{sub.passedTests}/{sub.totalTests} tests</span>
                      </div>
                      <span className="text-xs text-slate-500">{new Date(sub.submittedAt).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span>{ChallengeLanguageNames[sub.language]}</span>
                      <span>{sub.executionTimeMs.toFixed(0)}ms</span>
                      <span>Score: {sub.score}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Right Pane: Editor + Results */}
        <section className="flex-1 flex flex-col" style={{ backgroundColor: '#0d161c' }}>
          {/* Editor toolbar */}
          <div className="bg-[#101b22]/50 px-4 py-2 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                solution.{language === ChallengeLanguage.Python ? 'py' : 'js'}
              </span>
            </div>
            <div className="flex items-center gap-1">
              {/* Format button */}
              <button
                onClick={handleFormat}
                disabled={isFormatting}
                title="Format code (Alt+Shift+F)"
                className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors disabled:opacity-50"
                style={{ color: '#8b949e', backgroundColor: 'rgba(30,41,59,0.5)' }}
              >
                {isFormatting ? (
                  <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h10M4 18h7" />
                  </svg>
                )}
                Format
              </button>
              {/* Font size */}
              <div className="flex items-center gap-0.5 ml-1">
                <button
                  onClick={() => setFontSize(s => Math.max(s - 1, 10))}
                  title="Decrease font size (Ctrl+-)"
                  className="w-6 h-6 flex items-center justify-center rounded text-slate-400 hover:text-white hover:bg-slate-700 transition-colors text-sm font-bold"
                >A−</button>
                <span className="text-xs text-slate-500 w-6 text-center font-mono">{fontSize}</span>
                <button
                  onClick={() => setFontSize(s => Math.min(s + 1, 28))}
                  title="Increase font size (Ctrl++)"
                  className="w-6 h-6 flex items-center justify-center rounded text-slate-400 hover:text-white hover:bg-slate-700 transition-colors text-sm font-bold"
                >A+</button>
              </div>
            </div>
          </div>

          {/* Monaco Editor */}
          <div className="flex-1 min-h-0">
            <MonacoEditor
              height="100%"
              language={monacoLang}
              theme="vs-dark"
              value={code}
              onChange={(v) => setCode(v || '')}
              onMount={(editor) => { editorRef.current = editor; }}
              options={{
                minimap: { enabled: false },
                fontSize: fontSize,
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: language === ChallengeLanguage.Python ? 4 : 2,
                padding: { top: 12 },
                fontFamily: "'Fira Code', 'Courier New', monospace",
              }}
            />
          </div>

          {/* Test Results Panel */}
          {testResults && (
            <div className="h-[250px] md:h-[300px] border-t-4 border-slate-800 bg-[#101b22] flex flex-col">
              {/* Results header */}
              <div className="px-6 py-3 flex items-center justify-between border-b border-slate-800">
                <div className="flex items-center gap-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                    <svg className="w-4 h-4 text-[#3caff6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    Test Results
                  </h3>
                  <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold ${
                    testResults.status === SubmissionStatus.Passed
                      ? 'bg-green-500/10 text-green-500'
                      : 'bg-red-500/10 text-red-500'
                  }`}>
                    {testResults.passedTests}/{testResults.totalTests} PASSED
                  </div>
                  {testResults.score > 0 && (
                    <span className="text-xs text-slate-400">Score: {testResults.score}</span>
                  )}
                </div>
                <button onClick={() => setTestResults(null)} className="text-slate-400 hover:text-white">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>

              <div className="flex-1 flex overflow-hidden">
                {/* Test case sidebar */}
                <div className="w-36 md:w-56 border-r border-slate-800 overflow-y-auto shrink-0">
                  <div className="p-2 space-y-1">
                    {testResults.results.map((result, i) => (
                      <button
                        key={i}
                        onClick={() => setSelectedTestIndex(i)}
                        className={`w-full text-left px-4 py-3 rounded-lg flex items-center justify-between transition ${
                          selectedTestIndex === i
                            ? result.passed
                              ? 'bg-[#3caff6]/10 border border-[#3caff6]/20'
                              : 'bg-red-500/10 border border-red-500/20'
                            : 'hover:bg-slate-800'
                        }`}
                      >
                        <span className={`text-sm font-medium ${!result.passed && selectedTestIndex === i ? 'text-red-500' : ''}`}>
                          Test Case {i + 1}
                        </span>
                        {result.passed ? (
                          <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Test case detail */}
                <div className="flex-1 p-6 overflow-y-auto" style={{ backgroundColor: '#101b22', scrollbarWidth: 'thin', scrollbarColor: '#315368 transparent' }}>
                  {selectedResult && (
                    <div className="space-y-6">
                      {selectedResult.error && (
                        <div className="p-3 bg-red-500/10 text-red-400 rounded-lg border border-red-500/20 text-sm">
                          <pre className="whitespace-pre-wrap font-mono text-xs">{selectedResult.error}</pre>
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Input</label>
                          <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 font-mono text-sm break-all">
                            {selectedResult.input || '-'}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Status</label>
                          <div className={`p-3 rounded-lg border font-bold text-sm ${
                            selectedResult.passed
                              ? 'bg-green-500/10 text-green-500 border-green-500/20'
                              : 'bg-red-500/10 text-red-500 border-red-500/20'
                          }`}>
                            {selectedResult.passed ? 'Accepted' : 'Wrong Answer'}
                          </div>
                        </div>
                      </div>

                      {/* Output diff */}
                      <div className="space-y-3">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Output Diff</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-slate-800 border border-slate-800 rounded-lg overflow-hidden">
                          <div className="bg-slate-900 p-4">
                            <div className="text-[10px] text-slate-400 mb-2 uppercase">Expected</div>
                            <code className="text-green-500 font-mono text-lg">{selectedResult.expectedOutput}</code>
                          </div>
                          <div className="bg-slate-900 p-4">
                            <div className="text-[10px] text-slate-400 mb-2 uppercase">Actual</div>
                            <code className={`font-mono text-lg ${selectedResult.passed ? 'text-green-500' : 'text-red-500'}`}>
                              {selectedResult.actualOutput ?? '-'}
                            </code>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </section>
      </main>

      {/* Status Bar */}
      <footer className="h-8 bg-[#101b22] border-t border-slate-800 flex items-center justify-between px-4 text-[10px] font-medium text-slate-500 uppercase tracking-widest">
        <div className="flex gap-4">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            Connected
          </span>
        </div>
        <div className="hidden sm:flex gap-4">
          <span>Ctrl+Enter: Run</span>
          <span>Ctrl+Shift+Enter: Submit</span>
        </div>
      </footer>
    </div>
  );
}
