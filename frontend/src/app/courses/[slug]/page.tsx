'use client';
import AnimatedLogo from '@/components/AnimatedLogo';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { coursesApi } from '@/lib/api';
import { CourseDetail, ChallengeLanguage, ChallengeDifficulty, DifficultyNames } from '@/types';

const DifficultyStyles: Record<number, string> = {
  [ChallengeDifficulty.Easy]: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  [ChallengeDifficulty.Medium]: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
  [ChallengeDifficulty.Hard]: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
};

const LanguageConfig: Record<number, { label: string; color: string; bg: string; accent: string }> = {
  [ChallengeLanguage.Python]: { label: 'Python', color: 'text-blue-400', bg: 'bg-blue-500/10', accent: '#3b82f6' },
  [ChallengeLanguage.JavaScript]: { label: 'JavaScript', color: 'text-yellow-400', bg: 'bg-yellow-500/10', accent: '#eab308' },
};

export default function CourseDetailPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;
  const { checkAuth } = useAuthStore();
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'lessons' | 'challenges'>('lessons');

  useEffect(() => {
    checkAuth();
    const token = localStorage.getItem('accessToken');
    if (!token) { router.push('/login'); return; }
    loadCourse();
  }, [slug, checkAuth, router]);

  const loadCourse = async () => {
    try {
      setIsLoading(true);
      const res = await coursesApi.getBySlug(slug);
      setCourse(res.data);
    } catch {
      setError('Course not found.');
    } finally {
      setIsLoading(false);
    }
  };

  const solved = course?.challenges.filter(c => c.isSolved).length ?? 0;
  const total = course?.challenges.length ?? 0;
  const progress = total > 0 ? Math.round((solved / total) * 100) : 0;
  const lang = course ? (LanguageConfig[course.language] ?? LanguageConfig[ChallengeLanguage.Python]) : null;


  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#0d1520', color: '#e2e8f0' }}>
      {/* Header */}
      <header className="border-b border-slate-800/80 bg-[#0d1520]/95 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <button onClick={() => router.push('/')} className="text-[#3caff6] font-bold flex items-center gap-1.5 hover:opacity-80 transition-opacity">
                <AnimatedLogo size={18} />
                CloudCode
              </button>
              <span className="text-slate-700">/</span>
              <button onClick={() => router.push('/courses')} className="hover:text-white transition-colors">Courses</button>
              <span className="text-slate-700">/</span>
              <span className="text-slate-300 truncate max-w-[180px]">{course?.title ?? '...'}</span>
            </div>
            <button
              onClick={() => router.push('/courses')}
              className="flex items-center gap-1.5 text-slate-500 hover:text-white text-sm transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
          </div>
        </div>
      </header>

      {isLoading ? (
        <div className="flex items-center justify-center py-32">
          <div className="w-8 h-8 border-2 border-[#3caff6] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="text-center py-32">
          <p className="text-red-400 mb-4">{error}</p>
          <button onClick={() => router.push('/courses')} className="text-[#3caff6] hover:underline text-sm">← Back to courses</button>
        </div>
      ) : course ? (
        <>
          {/* Hero */}
          <div className="relative overflow-hidden border-b border-slate-800/60">
            {/* Background gradient */}
            <div
              className="absolute inset-0 opacity-[0.07]"
              style={{ background: `radial-gradient(ellipse 80% 60% at 10% 50%, ${lang?.accent ?? '#3caff6'}, transparent)` }}
            />
            <div className="absolute inset-0 opacity-[0.04]"
              style={{ background: 'radial-gradient(ellipse 60% 80% at 90% 20%, #3caff6, transparent)' }}
            />

            <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
              <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
                {/* Left: meta */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-4">
                    <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-md ${lang?.bg} ${lang?.color}`}>
                      {lang?.label}
                    </span>
                    {progress === 100 && (
                      <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400">
                        ✓ Completed
                      </span>
                    )}
                  </div>

                  <h1 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight mb-3">
                    {course.title}
                  </h1>
                  <p className="text-slate-400 text-base leading-relaxed max-w-xl">
                    {course.description}
                  </p>

                  {/* Stats row */}
                  <div className="flex items-center gap-5 mt-6 text-sm text-slate-400">
                    {course.lessons && course.lessons.length > 0 && (
                      <div className="flex items-center gap-1.5">
                        <svg className="w-4 h-4 text-[#3caff6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                        <span>{course.lessons.length} lesson{course.lessons.length !== 1 ? 's' : ''}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5">
                      <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                      </svg>
                      <span>{total} challenge{total !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{solved}/{total} solved</span>
                    </div>
                  </div>
                </div>

                {/* Right: progress ring + CTA */}
                <div className="flex flex-col items-center gap-4 lg:items-end">
                  {/* Circular progress */}
                  <div className="relative w-24 h-24">
                    <svg className="w-24 h-24 -rotate-90" viewBox="0 0 96 96">
                      <circle cx="48" cy="48" r="40" fill="none" stroke="#1e293b" strokeWidth="8" />
                      <circle
                        cx="48" cy="48" r="40" fill="none"
                        stroke={progress === 100 ? '#10b981' : '#3caff6'}
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * 40}`}
                        strokeDashoffset={`${2 * Math.PI * 40 * (1 - progress / 100)}`}
                        className="transition-all duration-700"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-lg font-extrabold text-white">{progress}%</span>
                      <span className="text-[9px] text-slate-500 uppercase tracking-wide">done</span>
                    </div>
                  </div>

                  {/* CTA */}
                  {course.lessons && course.lessons.length > 0 && (
                    <button
                      onClick={() => router.push(`/courses/${slug}/lessons/${course.lessons![0].slug}`)}
                      className="px-4 py-2 rounded-lg font-semibold text-xs text-white transition-all hover:scale-105 hover:shadow-lg"
                      style={{ background: 'linear-gradient(135deg, #3caff6, #2196f3)', boxShadow: '0 0 20px rgba(60,175,246,0.2)' }}
                    >
                      {progress === 0 ? 'Start Course' : progress === 100 ? 'Review Course' : 'Continue'}
                    </button>
                  )}
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-8">
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${progress}%`,
                      background: progress === 100
                        ? 'linear-gradient(90deg, #10b981, #34d399)'
                        : 'linear-gradient(90deg, #3caff6, #60d0ff)'
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Tabs + Content */}
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
            {/* Tabs */}
            {course.lessons && course.lessons.length > 0 && (
              <div className="flex gap-1 p-1 bg-slate-800/40 rounded-xl w-fit mb-8 border border-slate-800">
                {(['lessons', 'challenges'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold capitalize transition-all ${
                      activeTab === tab
                        ? 'bg-[#3caff6] text-white shadow-sm shadow-[#3caff6]/20'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {tab === 'lessons' ? `${course.lessons!.length} Lessons` : `${total} Challenges`}
                  </button>
                ))}
              </div>
            )}

            {/* Lessons tab */}
            {activeTab === 'lessons' && course.lessons && course.lessons.length > 0 && (
              <div className="relative">
                {/* Vertical connecting line */}
                <div className="absolute left-[23px] top-8 bottom-8 w-px bg-slate-800 hidden sm:block" />

                <div className="space-y-3">
                  {course.lessons.map((lesson, idx) => (
                    <button
                      key={lesson.id}
                      onClick={() => router.push(`/courses/${slug}/lessons/${lesson.slug}`)}
                      className="w-full text-left group relative"
                    >
                      <div className="flex items-center gap-4 bg-slate-800/20 hover:bg-slate-800/50 border border-slate-800/80 hover:border-[#3caff6]/30 rounded-xl px-5 py-4 transition-all duration-200">
                        {/* Number bubble */}
                        <div className="relative z-10 w-9 h-9 rounded-full flex items-center justify-center text-xs font-extrabold shrink-0 bg-[#0d1520] border-2 border-slate-700 group-hover:border-[#3caff6] group-hover:text-[#3caff6] text-slate-400 transition-all">
                          {idx + 1}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-slate-200 group-hover:text-white transition-colors text-sm">
                              {lesson.title}
                            </span>
                            {lesson.hasChallenge && (
                              <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                                + Exercise
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Arrow */}
                        <svg className="w-4 h-4 text-slate-700 group-hover:text-[#3caff6] group-hover:translate-x-0.5 shrink-0 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Challenges tab */}
            {(activeTab === 'challenges' || !course.lessons || course.lessons.length === 0) && (
              <div className="space-y-2.5">
                {course.challenges.map((challenge, idx) => (
                  <button
                    key={challenge.id}
                    onClick={() => router.push(`/challenges/${challenge.slug}`)}
                    className="w-full text-left group flex items-center gap-4 bg-slate-800/20 hover:bg-slate-800/50 border border-slate-800/80 hover:border-slate-700 rounded-xl px-5 py-4 transition-all duration-200"
                  >
                    {/* Status icon */}
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-extrabold shrink-0 transition-all ${
                      challenge.isSolved
                        ? 'bg-emerald-500/15 text-emerald-400 border-2 border-emerald-500/40'
                        : 'bg-slate-800 text-slate-500 border-2 border-slate-700 group-hover:border-slate-600'
                    }`}>
                      {challenge.isSolved ? (
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      ) : idx + 1}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={`font-semibold text-sm transition-colors ${challenge.isSolved ? 'text-slate-400' : 'text-slate-200 group-hover:text-white'}`}>
                          {challenge.title}
                        </span>
                        <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${DifficultyStyles[challenge.difficulty]}`}>
                          {DifficultyNames[challenge.difficulty as ChallengeDifficulty]}
                        </span>
                      </div>
                      <div className="flex gap-1 flex-wrap">
                        {challenge.tags.slice(0, 4).map(tag => (
                          <span key={tag} className="text-[10px] bg-slate-800/80 text-slate-500 px-1.5 py-0.5 rounded border border-slate-700/50">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    <svg className="w-4 h-4 text-slate-700 group-hover:text-slate-400 group-hover:translate-x-0.5 shrink-0 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      ) : null}

      <footer className="border-t border-slate-800 py-4 mt-auto">
        <p className="text-center text-xs text-slate-700">CloudCode — 2026</p>
      </footer>
    </div>
  );
}
