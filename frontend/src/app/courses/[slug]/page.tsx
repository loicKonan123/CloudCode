'use client';
import AnimatedLogo from '@/components/AnimatedLogo';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { coursesApi } from '@/lib/api';
import { CourseDetail, ChallengeLanguage, ChallengeDifficulty, DifficultyNames } from '@/types';

const DifficultyStyles: Record<number, string> = {
  [ChallengeDifficulty.Easy]: 'bg-emerald-500/10 text-emerald-400',
  [ChallengeDifficulty.Medium]: 'bg-amber-500/10 text-amber-400',
  [ChallengeDifficulty.Hard]: 'bg-rose-500/10 text-rose-400',
};

const LanguageLabel: Record<number, string> = {
  [ChallengeLanguage.Python]: 'Python',
  [ChallengeLanguage.JavaScript]: 'JavaScript',
};

const LanguageBadge: Record<number, string> = {
  [ChallengeLanguage.Python]: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
  [ChallengeLanguage.JavaScript]: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
};

export default function CourseDetailPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;
  const { checkAuth } = useAuthStore();
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

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

  return (
    <div className="min-h-screen flex flex-col app-grid" style={{ backgroundColor: '#101b22', color: '#e2e8f0' }}>
      {/* Header */}
      <header className="border-b border-slate-800 bg-[#101b22] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <button onClick={() => router.push('/')} className="text-[#3caff6] font-bold flex items-center gap-1.5">
                <AnimatedLogo size={20} />
                CloudCode
              </button>
              <span>/</span>
              <button onClick={() => router.push('/courses')} className="hover:text-white transition-colors">Courses</button>
              <span>/</span>
              <span className="text-white font-medium truncate max-w-[200px]">{course?.title ?? '...'}</span>
            </div>
            <button onClick={() => router.push('/courses')} className="text-slate-400 hover:text-[#3caff6] text-sm font-medium transition-colors">
              ← Back to courses
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 border-2 border-[#3caff6] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center py-24">
            <p className="text-red-400 mb-4">{error}</p>
            <button onClick={() => router.push('/courses')} className="text-[#3caff6] hover:underline text-sm">← Back to courses</button>
          </div>
        ) : course ? (
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar: course info */}
            <aside className="lg:w-72 shrink-0">
              <div className="bg-slate-800/30 border border-slate-800 rounded-xl p-5 sticky top-24">
                {/* Language badge */}
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded mb-3 inline-block ${LanguageBadge[course.language] ?? ''}`}>
                  {LanguageLabel[course.language] ?? 'Unknown'}
                </span>

                <h1 className="text-xl font-bold text-white mb-3">{course.title}</h1>
                <p className="text-slate-400 text-sm leading-relaxed mb-5">{course.description}</p>

                {/* Progress */}
                <div className="mb-2 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Progress</span>
                  <span className="text-white font-semibold">{solved}/{total} completed</span>
                </div>
                <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden mb-5">
                  <div
                    className="h-full bg-[#3caff6] rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                {progress === 100 && (
                  <div className="flex items-center gap-2 text-emerald-400 text-sm font-semibold bg-emerald-500/10 rounded-lg px-3 py-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Course completed!
                  </div>
                )}
              </div>
            </aside>

            {/* Challenge list */}
            <div className="flex-1">
              <h2 className="text-lg font-bold text-white mb-4">
                {total} Challenge{total !== 1 ? 's' : ''}
              </h2>

              <div className="space-y-3">
                {course.challenges.map((challenge, idx) => (
                  <button
                    key={challenge.id}
                    onClick={() => router.push(`/challenges/${challenge.slug}`)}
                    className="w-full text-left bg-slate-800/30 border border-slate-800 rounded-xl px-5 py-4 hover:border-slate-600 hover:bg-slate-800/50 transition-all group flex items-center gap-4"
                  >
                    {/* Order number / solved icon */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                      challenge.isSolved
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-slate-700 text-slate-400'
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
                        <span className="font-semibold text-white group-hover:text-[#3caff6] transition-colors text-sm">
                          {challenge.title}
                        </span>
                        <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${DifficultyStyles[challenge.difficulty]}`}>
                          {DifficultyNames[challenge.difficulty as ChallengeDifficulty]}
                        </span>
                      </div>
                      <div className="flex gap-1 flex-wrap">
                        {challenge.tags.slice(0, 3).map(tag => (
                          <span key={tag} className="text-[10px] bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Arrow */}
                    <svg className="w-4 h-4 text-slate-600 group-hover:text-[#3caff6] shrink-0 group-hover:translate-x-0.5 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </main>

      <footer className="border-t border-slate-800 py-4 mt-8">
        <p className="text-center text-xs text-slate-600">CloudCode — 2026</p>
      </footer>
    </div>
  );
}
