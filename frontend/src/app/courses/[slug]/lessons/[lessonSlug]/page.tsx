'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { lessonsApi } from '@/lib/api';
import { LessonDetail } from '@/types';
import AnimatedLogo from '@/components/AnimatedLogo';
import ReactMarkdown, { Components } from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

/* ── Custom Markdown components ─────────────────────────────────── */
const mdComponents: Components = {
  h2: ({ children }) => (
    <h2 className="flex items-center gap-3 text-2xl font-extrabold mt-12 mb-5 pb-3 border-b border-slate-700/60">
      <span className="w-1 h-7 rounded-full bg-[#3caff6] shrink-0" />
      <span className="bg-gradient-to-r from-[#3caff6] to-[#60d0ff] bg-clip-text text-transparent">
        {children}
      </span>
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="flex items-center gap-2.5 text-lg font-bold text-amber-400 mt-9 mb-3">
      <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
      {children}
    </h3>
  ),
  p: ({ children }) => (
    <p className="text-slate-300 leading-[1.85] text-[15.5px] mb-4">{children}</p>
  ),
  strong: ({ children }) => (
    <strong className="text-[#3caff6] font-semibold">{children}</strong>
  ),
  em: ({ children }) => (
    <em className="text-purple-300 not-italic font-medium">{children}</em>
  ),
  a: ({ href, children }) => (
    <a href={href} className="text-[#3caff6] underline underline-offset-2 hover:text-white transition-colors" target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  ),

  /* Code blocks with syntax highlighting */
  code: ({ className, children, ...props }) => {
    const match = /language-(\w+)/.exec(className || '');
    const codeStr = String(children).replace(/\n$/, '');

    if (match) {
      const lang = match[1];
      return (
        <div className="relative group my-5 rounded-xl overflow-hidden border border-slate-700/60 bg-[#0d1117]">
          {/* Language badge */}
          <div className="flex items-center justify-between px-4 py-2 bg-slate-800/80 border-b border-slate-700/60">
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
              lang === 'python' ? 'bg-blue-500/15 text-blue-400' :
              lang === 'javascript' || lang === 'js' ? 'bg-yellow-500/15 text-yellow-400' :
              'bg-slate-600/30 text-slate-400'
            }`}>
              {lang}
            </span>
            <button
              onClick={() => navigator.clipboard.writeText(codeStr)}
              className="text-[10px] text-slate-500 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
            >
              Copy
            </button>
          </div>
          <SyntaxHighlighter
            style={vscDarkPlus}
            language={lang}
            PreTag="div"
            customStyle={{
              margin: 0,
              padding: '1rem 1.25rem',
              background: 'transparent',
              fontSize: '13.5px',
              lineHeight: '1.7',
            }}
          >
            {codeStr}
          </SyntaxHighlighter>
        </div>
      );
    }

    /* Inline code */
    return (
      <code className="bg-slate-800/80 text-emerald-400 px-1.5 py-0.5 rounded text-[13px] font-mono border border-slate-700/40" {...props}>
        {children}
      </code>
    );
  },

  /* Blockquotes as tip/info boxes */
  blockquote: ({ children }) => (
    <div className="my-5 flex gap-3 rounded-xl bg-[#3caff6]/5 border border-[#3caff6]/20 px-5 py-4">
      <div className="shrink-0 mt-0.5">
        <svg className="w-5 h-5 text-[#3caff6]" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
      </div>
      <div className="text-[14.5px] leading-relaxed text-slate-300 [&>p]:mb-1 [&>p:last-child]:mb-0">
        {children}
      </div>
    </div>
  ),

  /* Tables */
  table: ({ children }) => (
    <div className="my-6 overflow-x-auto rounded-xl border border-slate-700/60">
      <table className="w-full text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="bg-slate-800/80">{children}</thead>
  ),
  th: ({ children }) => (
    <th className="px-4 py-2.5 text-left text-[#3caff6] font-semibold text-xs uppercase tracking-wider border-b border-slate-700/60">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="px-4 py-2.5 text-slate-300 border-b border-slate-800/60 font-mono text-[13px]">
      {children}
    </td>
  ),
  tr: ({ children }) => (
    <tr className="hover:bg-slate-800/30 transition-colors">{children}</tr>
  ),

  /* Lists */
  ul: ({ children }) => (
    <ul className="my-4 space-y-2 text-slate-300 text-[15px]">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="my-4 space-y-2 text-slate-300 text-[15px] list-decimal list-inside">{children}</ol>
  ),
  li: ({ children }) => (
    <li className="flex gap-2 items-start">
      <span className="mt-2 w-1.5 h-1.5 rounded-full bg-[#3caff6] shrink-0" />
      <span className="flex-1">{children}</span>
    </li>
  ),

  hr: () => (
    <hr className="my-8 border-none h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
  ),
};

/* ── Page ────────────────────────────────────────────────────────── */
export default function LessonPage() {
  const router = useRouter();
  const params = useParams();
  const courseSlug = params.slug as string;
  const lessonSlug = params.lessonSlug as string;
  const { checkAuth } = useAuthStore();
  const [lesson, setLesson] = useState<LessonDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const loadLesson = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await lessonsApi.getBySlug(courseSlug, lessonSlug);
      setLesson(res.data);
    } catch {
      setError('Lesson not found.');
    } finally {
      setIsLoading(false);
    }
  }, [courseSlug, lessonSlug]);

  useEffect(() => {
    checkAuth();
    const token = localStorage.getItem('accessToken');
    if (!token) { router.push('/login'); return; }
    loadLesson();
  }, [courseSlug, lessonSlug, checkAuth, router, loadLesson]);

  /* Scroll to top on lesson change */
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [lessonSlug]);

  return (
    <div className="min-h-screen flex flex-col app-grid" style={{ backgroundColor: '#101b22', color: '#e2e8f0' }}>
      {/* Header */}
      <header className="border-b border-slate-800 bg-[#101b22]/95 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <button onClick={() => router.push('/')} className="text-[#3caff6] font-bold flex items-center gap-1.5">
                <AnimatedLogo size={18} />
                CloudCode
              </button>
              <span className="text-slate-700">/</span>
              <button onClick={() => router.push('/courses')} className="hover:text-white transition-colors">Courses</button>
              <span className="text-slate-700">/</span>
              <button onClick={() => router.push(`/courses/${courseSlug}`)} className="hover:text-white transition-colors truncate max-w-[120px]">{courseSlug}</button>
              <span className="text-slate-700">/</span>
              <span className="text-white font-medium truncate max-w-[180px]">{lesson?.title ?? '...'}</span>
            </div>

            {/* Quick nav */}
            <div className="flex items-center gap-1">
              {lesson?.prevLessonSlug && (
                <button
                  onClick={() => router.push(`/courses/${courseSlug}/lessons/${lesson.prevLessonSlug}`)}
                  className="p-2 text-slate-500 hover:text-[#3caff6] hover:bg-slate-800 rounded-lg transition-all"
                  title="Previous Lesson"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              )}
              {lesson?.nextLessonSlug && (
                <button
                  onClick={() => router.push(`/courses/${courseSlug}/lessons/${lesson.nextLessonSlug}`)}
                  className="p-2 text-slate-500 hover:text-[#3caff6] hover:bg-slate-800 rounded-lg transition-all"
                  title="Next Lesson"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 border-2 border-[#3caff6] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center py-24">
            <p className="text-red-400 mb-4">{error}</p>
            <button onClick={() => router.push(`/courses/${courseSlug}`)} className="text-[#3caff6] hover:underline text-sm">
              Back to course
            </button>
          </div>
        ) : lesson ? (
          <>
            {/* Lesson header */}
            <div className="mb-10">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-[#3caff6] bg-[#3caff6]/10 px-2.5 py-1 rounded-md">
                  Lesson {lesson.orderIndex + 1}
                </span>
                {lesson.challengeSlug && (
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md">
                    + Exercise
                  </span>
                )}
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">
                {lesson.title}
              </h1>
            </div>

            {/* Markdown content */}
            <article className="lesson-content">
              <ReactMarkdown components={mdComponents}>
                {lesson.content}
              </ReactMarkdown>
            </article>

            {/* Challenge CTA */}
            {lesson.challengeSlug && (
              <div className="mt-12 relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/5 to-emerald-500/10">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="relative p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-emerald-400 font-bold text-sm uppercase tracking-wide">Practice Exercise</p>
                    </div>
                    <p className="text-white font-semibold text-lg">{lesson.challengeTitle}</p>
                    <p className="text-slate-400 text-sm mt-1">Apply what you just learned!</p>
                  </div>
                  <button
                    onClick={() => router.push(`/challenges/${lesson.challengeSlug}`)}
                    className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-xl transition-all hover:shadow-lg hover:shadow-emerald-500/20 text-sm shrink-0"
                  >
                    Start Challenge
                  </button>
                </div>
              </div>
            )}

            {/* Bottom navigation */}
            <div className="mt-12 grid grid-cols-2 gap-4 border-t border-slate-800 pt-8">
              {lesson.prevLessonSlug ? (
                <button
                  onClick={() => router.push(`/courses/${courseSlug}/lessons/${lesson.prevLessonSlug}`)}
                  className="text-left p-4 rounded-xl border border-slate-800 hover:border-slate-600 hover:bg-slate-800/30 transition-all group"
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 group-hover:text-slate-400">Previous</span>
                  <div className="flex items-center gap-2 mt-1">
                    <svg className="w-4 h-4 text-slate-500 group-hover:text-[#3caff6] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    <span className="text-sm font-medium text-slate-400 group-hover:text-white truncate">Previous Lesson</span>
                  </div>
                </button>
              ) : <div />}

              {lesson.nextLessonSlug ? (
                <button
                  onClick={() => router.push(`/courses/${courseSlug}/lessons/${lesson.nextLessonSlug}`)}
                  className="text-right p-4 rounded-xl border border-slate-800 hover:border-[#3caff6]/30 hover:bg-[#3caff6]/5 transition-all group col-start-2"
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 group-hover:text-[#3caff6]">Next</span>
                  <div className="flex items-center gap-2 mt-1 justify-end">
                    <span className="text-sm font-medium text-slate-400 group-hover:text-white truncate">Next Lesson</span>
                    <svg className="w-4 h-4 text-slate-500 group-hover:text-[#3caff6] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
              ) : (
                <button
                  onClick={() => router.push(`/courses/${courseSlug}`)}
                  className="text-right p-4 rounded-xl border border-slate-800 hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all group col-start-2"
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 group-hover:text-emerald-400">Complete</span>
                  <div className="flex items-center gap-2 mt-1 justify-end">
                    <span className="text-sm font-medium text-slate-400 group-hover:text-white truncate">Back to Course</span>
                    <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                </button>
              )}
            </div>
          </>
        ) : null}
      </main>

      <footer className="border-t border-slate-800 py-4 mt-8">
        <p className="text-center text-xs text-slate-600">CloudCode — 2026</p>
      </footer>
    </div>
  );
}
