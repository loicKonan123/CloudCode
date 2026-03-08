'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { challengesApi } from '@/lib/api';
import {
  ChallengeListItem,
  ChallengeDifficulty,
  DifficultyNames,
  ChallengeLanguage,
} from '@/types';

const DifficultyBadgeStyles: Record<ChallengeDifficulty, string> = {
  [ChallengeDifficulty.Easy]: 'bg-emerald-500/10 text-emerald-500',
  [ChallengeDifficulty.Medium]: 'bg-amber-500/10 text-amber-500',
  [ChallengeDifficulty.Hard]: 'bg-rose-500/10 text-rose-500',
};

export default function ChallengesPage() {
  const router = useRouter();
  const { user, isAuthenticated, logout, checkAuth } = useAuthStore();
  const [challenges, setChallenges] = useState<ChallengeListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<ChallengeDifficulty | null>(null);
  const [languageFilter, setLanguageFilter] = useState<ChallengeLanguage | null>(null);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    checkAuth();
    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.push('/login');
      return;
    }
    loadChallenges();
  }, [checkAuth, router]);

  const loadChallenges = async () => {
    try {
      setIsLoading(true);
      const response = await challengesApi.getAll();
      setChallenges(response.data);
    } catch (error) {
      console.error('Error loading challenges:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Collect all unique tags
  const allTags = [...new Set(challenges.flatMap(c => c.tags))];

  const filteredChallenges = challenges.filter((c) => {
    if (searchTerm && !c.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !c.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()))) return false;
    if (difficultyFilter && c.difficulty !== difficultyFilter) return false;
    if (languageFilter && c.supportedLanguages !== languageFilter && c.supportedLanguages !== ChallengeLanguage.Both) return false;
    if (activeTag && !c.tags.includes(activeTag)) return false;
    return true;
  });

  // Featured challenge = first one
  const featured = challenges[0];

  return (
    <div className="min-h-screen font-[var(--font-inter)]" style={{ backgroundColor: '#101b22', color: '#e2e8f0' }}>
      {/* Header */}
      <header className="border-b border-slate-800 bg-[#101b22] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <svg className="w-8 h-8 text-[#3caff6]" fill="none" viewBox="0 0 48 48">
                <path d="M44 4H30.6666V17.3334H17.3334V30.6666H4V44H44V4Z" fill="currentColor" />
              </svg>
              <span className="text-xl font-bold tracking-tight text-white">CloudCode</span>
            </div>

            <nav className="hidden md:flex items-center gap-8">
              <button onClick={() => router.push('/challenges')} className="text-[#3caff6] font-semibold text-sm">
                Challenges
              </button>
              <button onClick={() => router.push('/leaderboard')} className="text-slate-400 hover:text-[#3caff6] transition-colors text-sm font-medium">
                Leaderboard
              </button>
            </nav>

            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-3">
                <span className="text-sm text-slate-400">{user?.username}</span>
                <div className="h-9 w-9 rounded-full bg-[#3caff6]/20 flex items-center justify-center border border-[#3caff6]/30 text-[#3caff6] font-bold text-sm">
                  {user?.username?.charAt(0).toUpperCase()}
                </div>
                <button onClick={() => { logout(); router.push('/login'); }} className="p-2 text-slate-500 hover:text-red-400 transition-colors" title="Se déconnecter">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
              {/* Mobile hamburger */}
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 text-slate-400 hover:text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {mobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-800 bg-[#101b22] px-4 py-4 space-y-3">
          <button onClick={() => { router.push('/challenges'); setMobileMenuOpen(false); }} className="block w-full text-left text-[#3caff6] font-semibold text-sm py-2">
            Challenges
          </button>
          <button onClick={() => { router.push('/leaderboard'); setMobileMenuOpen(false); }} className="block w-full text-left text-slate-400 hover:text-[#3caff6] text-sm font-medium py-2">
            Leaderboard
          </button>
          <button onClick={() => { logout(); router.push('/login'); setMobileMenuOpen(false); }} className="block w-full text-left text-red-400 hover:text-red-300 text-sm font-medium py-2">
            Se déconnecter
          </button>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Featured Challenge */}
        {featured && (
          <section className="mb-10">
            <div className="relative overflow-hidden rounded-xl bg-slate-800/50 border border-slate-700 p-1">
              <div className="flex flex-col lg:flex-row items-stretch">
                <div className="lg:w-1/3 h-48 lg:h-auto bg-[#3caff6]/10 relative overflow-hidden flex items-center justify-center">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#3caff6]/20 to-transparent" />
                  <svg className="w-20 h-20 text-[#3caff6] opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                </div>
                <div className="flex-1 p-6 lg:p-8 flex flex-col justify-center">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-[#3caff6]/20 text-[#3caff6] rounded">
                      Daily Challenge
                    </span>
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-3">{featured.title}</h2>
                  <p className="text-slate-400 text-sm max-w-2xl mb-6">
                    Cliquez pour resoudre ce challenge. Difficulte : {DifficultyNames[featured.difficulty]}.
                  </p>
                  <div className="flex flex-wrap items-center gap-4">
                    <button
                      onClick={() => router.push(`/challenges/${featured.slug}`)}
                      className="bg-[#3caff6] hover:bg-[#3caff6]/90 text-[#101b22] font-bold py-2 px-6 rounded-lg transition-all flex items-center gap-2"
                    >
                      Solve Now
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                    <div className="flex items-center gap-4 text-xs text-slate-500 font-medium">
                      <span>{featured.successRate > 0 ? `${featured.successRate}% Success` : 'New'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Search and Filters */}
        <section className="mb-8 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search challenges by title or keywords..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg focus:ring-2 focus:ring-[#3caff6]/50 focus:border-[#3caff6] outline-none text-sm transition-all text-white placeholder-slate-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Difficulty dropdown */}
              <select
                value={difficultyFilter ?? ''}
                onChange={(e) => setDifficultyFilter(e.target.value ? Number(e.target.value) as ChallengeDifficulty : null)}
                className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs font-medium hover:border-[#3caff6] transition-colors cursor-pointer text-slate-300 focus:outline-none"
              >
                <option value="">Difficulty: All</option>
                <option value={ChallengeDifficulty.Easy}>Easy</option>
                <option value={ChallengeDifficulty.Medium}>Medium</option>
                <option value={ChallengeDifficulty.Hard}>Hard</option>
              </select>

              <select
                value={languageFilter ?? ''}
                onChange={(e) => setLanguageFilter(e.target.value ? Number(e.target.value) as ChallengeLanguage : null)}
                className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs font-medium hover:border-[#3caff6] transition-colors cursor-pointer text-slate-300 focus:outline-none"
              >
                <option value="">Language: All</option>
                <option value={ChallengeLanguage.Python}>Python</option>
                <option value={ChallengeLanguage.JavaScript}>JavaScript</option>
              </select>
            </div>
          </div>

          {/* Tags Quick Filter */}
          {allTags.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              <span className="text-xs text-slate-500 font-medium whitespace-nowrap mr-2">Quick Tags:</span>
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                  className={`px-3 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap border transition-colors ${
                    activeTag === tag
                      ? 'bg-[#3caff6]/20 text-[#3caff6] border-[#3caff6]/30'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-[#3caff6]'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Challenge Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-[#3caff6] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredChallenges.length === 0 ? (
          <div className="text-center py-20 text-slate-500">
            <p className="text-lg">No challenges found</p>
          </div>
        ) : (
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredChallenges.map((challenge) => (
              <div
                key={challenge.id}
                onClick={() => router.push(`/challenges/${challenge.slug}`)}
                className="bg-slate-800/40 border border-slate-800 hover:border-[#3caff6]/50 transition-all rounded-xl p-5 group flex flex-col justify-between cursor-pointer"
              >
                <div>
                  {/* Difficulty + Solved status */}
                  <div className="flex justify-between items-start mb-3">
                    <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded ${DifficultyBadgeStyles[challenge.difficulty]}`}>
                      {DifficultyNames[challenge.difficulty]}
                    </span>
                    {challenge.isSolved ? (
                      <div className="flex items-center gap-1 text-emerald-500">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="text-[10px] font-bold uppercase">Solved</span>
                      </div>
                    ) : (
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Unsolved</span>
                    )}
                  </div>

                  {/* Title */}
                  <h3 className="text-base font-bold text-slate-100 group-hover:text-[#3caff6] transition-colors mb-2">
                    {challenge.title}
                  </h3>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {challenge.tags.map((tag) => (
                      <span key={tag} className="text-[10px] bg-slate-800 text-slate-500 px-2 py-0.5 rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-800">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">Success Rate</span>
                    <span className="text-sm font-semibold text-slate-300">
                      {challenge.successRate > 0 ? `${challenge.successRate}%` : '-'}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-800 text-slate-400 group-hover:bg-[#3caff6] group-hover:text-[#101b22] transition-all">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            ))}
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 grayscale opacity-50">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 48 48">
              <path d="M44 4H30.6666V17.3334H17.3334V30.6666H4V44H44V4Z" />
            </svg>
            <span className="font-bold text-lg">CloudCode</span>
          </div>
          <p className="text-xs text-slate-500">2026 CloudCode. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
