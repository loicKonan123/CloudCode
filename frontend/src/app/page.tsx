'use client';
import AnimatedLogo from '@/components/AnimatedLogo';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useAuthStore } from '@/stores/authStore';
import { challengesApi } from '@/lib/api';
import { ChallengeListItem, LeaderboardEntry, DifficultyNames } from '@/types';

// Three.js scene loaded only client-side (no SSR)
const HeroScene = dynamic(() => import('@/components/three/HeroScene'), { ssr: false });


export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, checkAuth } = useAuthStore();
  const [featuredChallenge, setFeaturedChallenge] = useState<ChallengeListItem | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [cursorOn, setCursorOn] = useState(true);

  useEffect(() => {
    checkAuth();
    loadData();
    const blink = setInterval(() => setCursorOn(v => !v), 530);
    return () => clearInterval(blink);
  }, [checkAuth]);

  const loadData = async () => {
    try {
      const [challengesRes, leaderboardRes] = await Promise.allSettled([
        challengesApi.getAll(),
        challengesApi.getLeaderboard('all'),
      ]);
      if (challengesRes.status === 'fulfilled' && challengesRes.value.data.length > 0)
        setFeaturedChallenge(challengesRes.value.data[0]);
      if (leaderboardRes.status === 'fulfilled')
        setLeaderboard(leaderboardRes.value.data.items.slice(0, 4));
    } catch {}
  };

  const handleStartCoding = () => {
    if (isAuthenticated) router.push('/challenges');
    else router.push('/register');
  };

  return (
    <div className="min-h-screen flex flex-col app-grid" style={{ backgroundColor: '#101b22', color: '#e2e8f0' }}>

      {/* ── Global keyframes ── */}
      <style>{`
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(22px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes borderGlow {
          0%,100% { box-shadow: 0 0 0 0 rgba(60,175,246,0); }
          50%     { box-shadow: 0 0 24px 3px rgba(60,175,246,0.18); }
        }
        .fu0  { animation: fadeUp .75s ease-out .0s  both; }
        .fu1  { animation: fadeUp .75s ease-out .15s both; }
        .fu2  { animation: fadeUp .75s ease-out .3s  both; }
        .fu3  { animation: fadeUp .75s ease-out .5s  both; }
        .stat-card { transition: border-color .25s, transform .25s, box-shadow .25s; }
        .stat-card:hover {
          border-color: rgba(60,175,246,.45) !important;
          transform: translateY(-3px);
          box-shadow: 0 8px 32px rgba(60,175,246,.1);
        }
      `}</style>

      {/* ── Header ── */}
      <header className="flex items-center justify-between whitespace-nowrap border-b border-slate-800 px-6 py-4 lg:px-20">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2 text-[#3caff6]">
            <AnimatedLogo size={28} />
            <h2 className="text-white text-xl font-bold tracking-tight">CloudCode</h2>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <button onClick={() => router.push('/challenges')} className="text-slate-300 text-sm font-medium hover:text-[#3caff6] transition-colors">Challenges</button>
            <button onClick={() => router.push('/courses')} className="text-slate-300 text-sm font-medium hover:text-[#3caff6] transition-colors">Courses</button>
            <button onClick={() => router.push('/leaderboard')} className="text-slate-300 text-sm font-medium hover:text-[#3caff6] transition-colors">Leaderboard</button>
            <button onClick={() => router.push('/vs')} className="text-slate-300 text-sm font-medium hover:text-[#3caff6] transition-colors">VS Mode</button>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <button onClick={() => router.push('/challenges')} className="flex cursor-pointer items-center justify-center rounded-lg h-10 px-5 bg-[#3caff6] text-[#101b22] text-sm font-bold hover:opacity-90 transition-opacity">
              My Challenges
            </button>
          ) : (
            <>
              <button onClick={() => router.push('/login')} className="hidden sm:block text-slate-300 text-sm font-medium hover:text-[#3caff6] transition-colors">Sign in</button>
              <button onClick={() => router.push('/register')} className="flex cursor-pointer items-center justify-center rounded-lg h-10 px-5 bg-[#3caff6] text-[#101b22] text-sm font-bold hover:opacity-90 transition-opacity">
                Sign Up
              </button>
            </>
          )}
        </div>
      </header>

      <main className="flex flex-col flex-1 px-6 lg:px-20 py-10 max-w-[1280px] mx-auto w-full">

        {/* ══ Hero ══ */}
        <section className="relative flex flex-col lg:flex-row gap-12 items-center mb-16" style={{ minHeight: 560 }}>

          {/* ── Three.js 3D background ── */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ borderRadius: 24 }}>
            <HeroScene />
            {/* Vignette so text stays readable */}
            <div style={{
              position: 'absolute', inset: 0,
              background: 'radial-gradient(ellipse 110% 110% at 50% 50%, transparent 30%, rgba(16,27,34,.65) 100%)',
              pointerEvents: 'none',
            }} />
          </div>

          {/* ── Left: Text ── */}
          <div className="relative z-10 flex flex-col gap-8 flex-1">
            <div className="flex flex-col gap-4">
              <span className="fu0 text-[#3caff6] font-bold tracking-widest text-xs uppercase">
                Welcome to the future of coding
              </span>
              <h1 className="fu1 text-4xl lg:text-6xl font-black leading-tight tracking-tight">
                Master the Art of <span className="text-[#3caff6]">Coding</span> with CloudCode
              </h1>
              <p className="fu2 text-slate-400 text-lg lg:text-xl leading-relaxed max-w-xl">
                Join the elite community of developers solving complex problems in Python and JavaScript. Elevate your skills one challenge at a time.
              </p>
            </div>
            <div className="fu3 flex flex-wrap gap-4">
              <button
                onClick={handleStartCoding}
                className="flex min-w-[180px] cursor-pointer items-center justify-center rounded-lg h-14 px-8 bg-[#3caff6] text-[#101b22] text-base font-bold hover:scale-[1.03] transition-transform"
                style={{ boxShadow: '0 0 30px rgba(60,175,246,.35)' }}
              >
                Start Coding Now
              </button>
              <button
                onClick={() => router.push('/leaderboard')}
                className="flex min-w-[180px] cursor-pointer items-center justify-center rounded-lg h-14 px-8 text-white text-base font-bold border border-slate-700 hover:bg-slate-700/60 transition-colors"
                style={{ background: 'rgba(30,41,59,.6)', backdropFilter: 'blur(8px)' }}
              >
                View Leaderboard
              </button>
            </div>
          </div>

          {/* ── Right: Code panel ── */}
          <div className="relative z-10 flex-1 w-full">
            <div
              className="relative rounded-2xl overflow-hidden aspect-video shadow-2xl border border-slate-700/60"
              style={{
                background: 'rgba(10,18,24,0.88)',
                backdropFilter: 'blur(16px)',
                animation: 'borderGlow 4s ease-in-out infinite',
              }}
            >
              {/* Top bar */}
              <div className="absolute top-0 left-0 right-0 h-9 border-b border-slate-800/60 flex items-center px-4 gap-2" style={{ background: 'rgba(16,27,34,.7)' }}>
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div className="w-3 h-3 rounded-full bg-green-500/80" />
                <span className="ml-3 text-slate-500 text-xs font-mono">solution.py</span>
              </div>

              {/* Code */}
              <div className="absolute inset-0 top-9 flex items-center justify-center">
                <div className="text-left px-6 py-4 font-mono text-sm space-y-1.5 w-full max-w-md">
                  <p><span className="text-purple-400">def</span> <span className="text-[#3caff6]">two_sum</span><span className="text-slate-300">(nums, target):</span></p>
                  <p className="pl-4 text-slate-500">{"    # Hash-map approach — O(n)"}</p>
                  <p className="pl-4"><span className="text-orange-300">seen</span> <span className="text-slate-400">=</span> <span className="text-slate-300">{'{}'}</span></p>
                  <p className="pl-4"><span className="text-purple-400">for</span> <span className="text-slate-300">i, num</span> <span className="text-purple-400">in</span> <span className="text-yellow-300">enumerate</span><span className="text-slate-300">(nums):</span></p>
                  <p className="pl-8"><span className="text-purple-400">if</span> <span className="text-slate-300">target <span className="text-slate-400">-</span> num</span> <span className="text-purple-400">in</span> <span className="text-orange-300">seen</span><span className="text-slate-300">:</span></p>
                  <p className="pl-12"><span className="text-purple-400">return</span> <span className="text-slate-300">[<span className="text-orange-300">seen</span>[target <span className="text-slate-400">-</span> num], i]</span></p>
                  <p className="pl-8"><span className="text-orange-300">seen</span><span className="text-slate-300">[num] <span className="text-slate-400">=</span> i</span></p>
                  <p className="mt-4">
                    <span className="text-green-400">{'> '}Output: [0, 1] ✓</span>
                    <span
                      className="ml-1 text-[#3caff6] font-bold"
                      style={{ opacity: cursorOn ? 1 : 0, transition: 'opacity .08s' }}
                    >▋</span>
                  </p>
                </div>
              </div>

              {/* Corner glow */}
              <div style={{
                position: 'absolute', top: 0, right: 0,
                width: 160, height: 160,
                background: 'radial-gradient(circle at top right, rgba(60,175,246,.08) 0%, transparent 70%)',
                pointerEvents: 'none',
              }} />
            </div>
          </div>
        </section>

        {/* ══ Stats ══ */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-16">
          {[
            { icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z', label: 'Developers', value: '10k+' },
            { icon: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4', label: 'Challenges', value: '500+' },
            { icon: 'M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129', label: 'Languages', value: 'Python & JS' },
            { icon: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z', label: 'Daily Rewards', value: '2.5k XP' },
          ].map((stat) => (
            <div key={stat.label} className="stat-card flex flex-col gap-2 rounded-xl p-6 sm:p-8 bg-slate-800/50 border border-slate-800">
              <svg className="w-7 h-7 text-[#3caff6] mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={stat.icon} />
              </svg>
              <p className="text-slate-400 text-xs sm:text-sm font-medium uppercase tracking-wider">{stat.label}</p>
              <p className="text-white text-2xl sm:text-3xl font-black">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* ══ Challenge of the Day + Leaderboard ══ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12 mb-16">

          {/* Challenge of the Day */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-3">
                <svg className="w-6 h-6 text-[#3caff6]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                </svg>
                Challenge of the Day
              </h2>
              <button onClick={() => router.push('/challenges')} className="text-[#3caff6] text-sm font-bold hover:underline">View all</button>
            </div>
            {featuredChallenge ? (
              <div
                onClick={() => {
                  if (isAuthenticated) router.push(`/challenges/${featuredChallenge.slug}`);
                  else router.push('/login');
                }}
                className="flex flex-col md:flex-row items-stretch rounded-2xl overflow-hidden border border-slate-800 bg-slate-800/40 hover:bg-slate-800 transition-colors group cursor-pointer"
              >
                <div className="md:w-2/5 aspect-video md:aspect-auto overflow-hidden relative min-h-[200px]">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#3caff6]/30 via-slate-900/60 to-slate-900 flex items-center justify-center">
                    <svg className="w-20 h-20 text-[#3caff6] opacity-40 group-hover:opacity-60 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z" />
                    </svg>
                  </div>
                </div>
                <div className="p-6 sm:p-8 flex flex-col justify-between flex-1">
                  <div>
                    <div className="flex gap-2 mb-4">
                      <span className={`px-3 py-1 text-xs font-bold rounded-full uppercase ${
                        featuredChallenge.difficulty === 1 ? 'bg-emerald-500/10 text-emerald-500'
                        : featuredChallenge.difficulty === 2 ? 'bg-amber-500/10 text-amber-500'
                        : 'bg-rose-500/10 text-rose-500'
                      }`}>
                        {DifficultyNames[featuredChallenge.difficulty]}
                      </span>
                      <span className="px-3 py-1 bg-[#3caff6]/10 text-[#3caff6] text-xs font-bold rounded-full uppercase">150 Points</span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold mb-3">{featuredChallenge.title}</h3>
                    <p className="text-slate-400 text-sm sm:text-base leading-relaxed mb-6">
                      {featuredChallenge.tags.length > 0
                        ? `Tags: ${featuredChallenge.tags.join(', ')}. ${featuredChallenge.successRate > 0 ? `Success rate: ${featuredChallenge.successRate}%` : 'Be the first to solve it!'}`
                        : `Solve this ${DifficultyNames[featuredChallenge.difficulty].toLowerCase()} challenge and earn points!`}
                    </p>
                  </div>
                  <div className="flex items-center justify-between mt-auto">
                    <div className="flex -space-x-2">
                      {[0, 1, 2].map((i) => (
                        <div key={i} className="w-8 h-8 rounded-full border-2 border-slate-800 bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-300">
                          {String.fromCharCode(65 + i)}
                        </div>
                      ))}
                      <div className="w-8 h-8 rounded-full border-2 border-slate-800 bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-400">+12</div>
                    </div>
                    <span className="flex items-center gap-2 bg-[#3caff6] text-[#101b22] px-6 py-2.5 rounded-lg font-bold text-sm hover:opacity-90 transition-opacity">
                      Solve Now
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-800 bg-slate-800/40 p-12 text-center text-slate-500">Loading challenge...</div>
            )}
          </div>

          {/* Leaderboard preview */}
          <div className="lg:col-span-1">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-3">
                <svg className="w-6 h-6 text-[#3caff6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Global Leaderboard
              </h2>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-800/40 p-2">
              <div className="flex flex-col">
                {leaderboard.length > 0 ? leaderboard.map((entry, i) => (
                  <div key={entry.userId} className={`flex items-center gap-4 p-4 rounded-xl transition-colors ${i === 0 ? 'bg-[#3caff6]/10 border border-[#3caff6]/20 mb-2' : 'hover:bg-slate-700/50'}`}>
                    <span className={`font-black text-lg w-6 text-center ${i === 0 ? 'text-[#3caff6]' : 'text-slate-500'}`}>{entry.rank}</span>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${i === 0 ? 'bg-[#3caff6]/20 text-[#3caff6]' : 'bg-slate-700 text-slate-300'}`}>
                      {entry.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate">{entry.username}</p>
                      <p className="text-slate-500 text-xs">{entry.totalScore} points</p>
                    </div>
                    {i === 0 && (
                      <svg className="w-6 h-6 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                      </svg>
                    )}
                  </div>
                )) : [1, 2, 3, 4].map((i) => (
                  <div key={i} className={`flex items-center gap-4 p-4 rounded-xl ${i === 1 ? 'bg-[#3caff6]/10 border border-[#3caff6]/20 mb-2' : ''}`}>
                    <span className={`font-black text-lg w-6 text-center ${i === 1 ? 'text-[#3caff6]' : 'text-slate-500'}`}>{i}</span>
                    <div className="w-10 h-10 rounded-full bg-slate-700 animate-pulse" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-slate-700 rounded w-24 animate-pulse" />
                      <div className="h-2 bg-slate-700 rounded w-16 animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t border-slate-800 text-center">
                <button onClick={() => router.push('/leaderboard')} className="text-[#3caff6] text-sm font-bold hover:underline">Full Leaderboard</button>
              </div>
            </div>
          </div>
        </div>

        {/* ══ Languages ══ */}
        <section className="py-12 border-t border-slate-800">
          <h2 className="text-sm font-bold mb-8 text-center uppercase tracking-widest text-slate-400">Supported Languages</h2>
          <div className="flex flex-wrap justify-center gap-12 items-center">
            <div className="flex flex-col items-center gap-4 grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all cursor-default group">
              <div className="w-16 h-16 rounded-xl bg-slate-800 flex items-center justify-center border border-slate-700 group-hover:border-yellow-500/50">
                <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="3" width="18" height="18" rx="2" fill="#F7DF1E" />
                  <text x="12" y="17" textAnchor="middle" fill="black" fontSize="10" fontWeight="bold" fontFamily="Inter">JS</text>
                </svg>
              </div>
              <span className="font-bold text-sm">JavaScript</span>
            </div>
            <div className="flex flex-col items-center gap-4 grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all cursor-default group">
              <div className="w-16 h-16 rounded-xl bg-slate-800 flex items-center justify-center border border-slate-700 group-hover:border-blue-500/50">
                <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none">
                  <path d="M11.9 2C6.4 2 6.5 4.3 6.5 4.3L6.5 6.6H12.1V7.3H4.1C4.1 7.3 2 7.1 2 12.1C2 17.1 3.8 16.9 3.8 16.9H6L6 14.1C6 14.1 6 11.2 8.9 11.2H14.4C14.4 11.2 17.1 11.1 17.1 8.5V4.6C17.1 4.6 17.5 2 11.9 2Z" fill="#3776AB" />
                  <path d="M12.1 22C17.6 22 17.5 19.7 17.5 19.7L17.5 17.4H11.9V16.7H19.9C19.9 16.7 22 16.9 22 11.9C22 6.9 20.2 7.1 20.2 7.1H18L18 9.9C18 9.9 18 12.8 15.1 12.8H9.6C9.6 9.6 6.9 12.9 6.9 15.5V19.4C6.9 19.4 6.5 22 12.1 22Z" fill="#FFD43B" />
                </svg>
              </div>
              <span className="font-bold text-sm">Python</span>
            </div>
          </div>
        </section>
      </main>

      {/* ══ Footer ══ */}
      <footer className="mt-auto border-t border-slate-800 bg-slate-800/20 px-6 lg:px-20 py-12">
        <div className="max-w-[1280px] mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
          <div>
            <div className="flex items-center gap-2 text-[#3caff6] mb-6">
              <AnimatedLogo size={24} />
              <h2 className="text-white text-lg font-bold">CloudCode</h2>
            </div>
            <p className="text-slate-500 text-sm leading-relaxed">
              Empowering developers to reach their full potential through competitive coding and collaboration.
            </p>
          </div>
          <div>
            <h4 className="text-white font-bold text-sm mb-6 uppercase tracking-wider">Explore</h4>
            <ul className="flex flex-col gap-4">
              <li><button onClick={() => router.push('/challenges')} className="text-slate-500 text-sm hover:text-[#3caff6] transition-colors">All Challenges</button></li>
              <li><button onClick={() => router.push('/courses')} className="text-slate-500 text-sm hover:text-[#3caff6] transition-colors">Courses</button></li>
              <li><button onClick={() => router.push('/leaderboard')} className="text-slate-500 text-sm hover:text-[#3caff6] transition-colors">Leaderboard</button></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold text-sm mb-6 uppercase tracking-wider">Community</h4>
            <ul className="flex flex-col gap-4">
              <li><button onClick={() => router.push('/leaderboard')} className="text-slate-500 text-sm hover:text-[#3caff6] transition-colors">Leaderboard</button></li>
              <li><span className="text-slate-500 text-sm">Discussions</span></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold text-sm mb-6 uppercase tracking-wider">Stay Connected</h4>
            <p className="text-slate-500 text-sm mb-4">Join our newsletter for weekly challenges and coding tips.</p>
            <div className="flex gap-2">
              <input
                className="bg-slate-800 border border-slate-700 rounded-lg text-sm flex-1 px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-[#3caff6] min-w-0"
                placeholder="Email"
                type="email"
              />
              <button className="bg-[#3caff6] text-[#101b22] p-2 rounded-lg shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </div>
        </div>
        <div className="max-w-[1280px] mx-auto mt-12 pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-slate-500 text-xs">© 2026 CloudCode. All rights reserved.</p>
          <div className="flex gap-6">
            <span className="text-slate-500 text-xs">Privacy Policy</span>
            <span className="text-slate-500 text-xs">Terms of Service</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
