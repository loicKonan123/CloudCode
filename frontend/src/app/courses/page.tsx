'use client';
import Navbar from '@/components/Navbar';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { coursesApi } from '@/lib/api';
import { CourseListItem, ChallengeLanguage } from '@/types';

const LanguageStyles: Record<number, { label: string; badge: string; dot: string }> = {
  [ChallengeLanguage.Python]: { label: 'Python', badge: 'bg-blue-500/10 text-blue-400 border border-blue-500/20', dot: 'bg-blue-400' },
  [ChallengeLanguage.JavaScript]: { label: 'JavaScript', badge: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20', dot: 'bg-yellow-400' },
};

export default function CoursesPage() {
  const router = useRouter();
  const { checkAuth } = useAuthStore();
  const [courses, setCourses] = useState<CourseListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'python' | 'javascript'>('all');


  useEffect(() => {
    checkAuth();
    const token = localStorage.getItem('accessToken');
    if (!token) { router.push('/login'); return; }
    loadCourses();
  }, [checkAuth, router]);

  const loadCourses = async () => {
    try {
      setIsLoading(true);
      const res = await coursesApi.getAll();
      setCourses(res.data);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  const filtered = courses.filter(c => {
    if (activeTab === 'python') return c.language === ChallengeLanguage.Python;
    if (activeTab === 'javascript') return c.language === ChallengeLanguage.JavaScript;
    return true;
  });

  const pythonCount = courses.filter(c => c.language === ChallengeLanguage.Python).length;
  const jsCount = courses.filter(c => c.language === ChallengeLanguage.JavaScript).length;

  return (
    <div className="min-h-screen flex flex-col app-grid" style={{ backgroundColor: '#101b22', color: '#e2e8f0' }}>
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Title + tabs */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Courses</h1>
          <p className="text-slate-400 text-sm mb-6">Structured learning paths to master Python and JavaScript.</p>

          <div className="flex items-center gap-1 bg-slate-800/50 rounded-lg p-1 w-fit border border-slate-800">
            {([
              { key: 'all', label: `All (${courses.length})` },
              { key: 'python', label: `Python (${pythonCount})` },
              { key: 'javascript', label: `JavaScript (${jsCount})` },
            ] as const).map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? 'bg-[#3caff6] text-[#101b22]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 border-2 border-[#3caff6] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24 border-2 border-dashed border-slate-800 rounded-xl">
            <svg className="w-12 h-12 text-slate-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <p className="text-slate-500 text-lg font-medium">No courses available yet</p>
            <p className="text-slate-600 text-sm mt-1">Check back soon for new learning paths.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(course => {
              const lang = LanguageStyles[course.language] ?? LanguageStyles[ChallengeLanguage.Python];
              return (
                <button
                  key={course.id}
                  onClick={() => router.push(`/courses/${course.slug}`)}
                  className="text-left bg-slate-800/30 border border-slate-800 rounded-xl p-5 hover:border-slate-700 hover:bg-slate-800/50 transition-all group"
                >
                  {/* Language badge */}
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${lang.badge}`}>
                      {lang.label}
                    </span>
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      {course.challengeCount} challenge{course.challengeCount !== 1 ? 's' : ''}
                    </span>
                  </div>

                  {/* Title */}
                  <h2 className="font-bold text-white text-base mb-2 group-hover:text-[#3caff6] transition-colors line-clamp-2">
                    {course.title}
                  </h2>

                  {/* Description */}
                  <p className="text-slate-500 text-xs leading-relaxed line-clamp-3 mb-4">
                    {course.description}
                  </p>

                  {/* Start arrow */}
                  <div className="flex items-center gap-1 text-[#3caff6] text-xs font-semibold">
                    Start learning
                    <svg className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </main>

      <footer className="border-t border-slate-800 py-4 mt-8">
        <p className="text-center text-xs text-slate-600">CloudCode — 2026</p>
      </footer>
    </div>
  );
}
