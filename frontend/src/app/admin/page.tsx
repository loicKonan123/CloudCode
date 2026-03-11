'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import AnimatedLogo from '@/components/AnimatedLogo';
import api from '@/lib/api';

interface AdminStats {
  users: { total: number; today: number; week: number };
  submissions: { total: number; today: number; week: number };
  challenges: { total: number; published: number; solves: number };
  matches: { total: number; today: number };
  submissionsPerDay: { date: string; count: number }[];
  topChallenges: { title: string; slug: string; difficulty: number; submissions: number }[];
}

const DifficultyColors: Record<number, string> = {
  1: 'text-emerald-400',
  2: 'text-amber-400',
  3: 'text-rose-400',
};
const DifficultyLabels: Record<number, string> = { 1: 'Easy', 2: 'Medium', 3: 'Hard' };

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, checkAuth } = useAuthStore();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
    const token = localStorage.getItem('accessToken');
    if (!token) { router.push('/login'); return; }
    api.get<AdminStats>('/admin/stats')
      .then(r => setStats(r.data))
      .catch(() => router.push('/challenges'))
      .finally(() => setIsLoading(false));
  }, [checkAuth, router]);

  if (isLoading || !stats) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#101b22' }}>
        <div className="w-8 h-8 border-2 border-[#3caff6] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const maxBar = Math.max(...stats.submissionsPerDay.map(d => d.count), 1);

  return (
    <div className="min-h-screen app-grid" style={{ backgroundColor: '#101b22', color: '#e2e8f0' }}>
      {/* Header */}
      <header className="border-b border-slate-800 bg-[#101b22] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button onClick={() => router.push('/')} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <AnimatedLogo size={26} />
              <span className="text-lg font-bold text-white">CloudCode</span>
            </button>
            <span className="text-slate-600">/</span>
            <span className="text-sm font-semibold text-[#3caff6]">Admin Dashboard</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            {[
              { label: 'Dashboard', path: '/admin' },
              { label: 'Challenges', path: '/admin/challenges' },
              { label: 'Courses', path: '/admin/courses' },
              { label: 'Users', path: '/admin/users' },
            ].map(item => (
              <button
                key={item.path}
                onClick={() => router.push(item.path)}
                className={`font-medium transition-colors ${
                  item.path === '/admin' ? 'text-[#3caff6]' : 'text-slate-400 hover:text-white'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>
          <span className="text-xs text-slate-500">{user?.username}</span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: 'Total Users',
              value: stats.users.total,
              sub: `+${stats.users.today} today · +${stats.users.week} this week`,
              color: '#3caff6',
              icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
            },
            {
              label: 'Submissions',
              value: stats.submissions.total,
              sub: `+${stats.submissions.today} today · +${stats.submissions.week} this week`,
              color: '#a78bfa',
              icon: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4',
            },
            {
              label: 'Challenges Solved',
              value: stats.challenges.solves,
              sub: `${stats.challenges.published} published · ${stats.challenges.total - stats.challenges.published} draft`,
              color: '#34d399',
              icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
            },
            {
              label: 'VS Matches',
              value: stats.matches.total,
              sub: `+${stats.matches.today} today`,
              color: '#f59e0b',
              icon: 'M13 10V3L4 14h7v7l9-11h-7z',
            },
          ].map(card => (
            <div key={card.label} className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
              <div className="flex items-start justify-between mb-3">
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">{card.label}</p>
                <svg className="w-5 h-5 opacity-60" style={{ color: card.color }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={card.icon} />
                </svg>
              </div>
              <p className="text-3xl font-bold text-white mb-1">{card.value.toLocaleString()}</p>
              <p className="text-xs text-slate-500">{card.sub}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Submissions chart — last 14 days */}
          <div className="lg:col-span-2 bg-slate-800/40 border border-slate-700 rounded-xl p-6">
            <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-6">
              Submissions — Last 14 Days
            </h2>
            <div className="flex items-end gap-1.5 h-36">
              {stats.submissionsPerDay.map(({ date, count }) => (
                <div key={date} className="flex-1 flex flex-col items-center gap-1 group">
                  <span className="text-[10px] text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    {count}
                  </span>
                  <div
                    className="w-full rounded-t transition-all"
                    style={{
                      height: `${Math.max(4, (count / maxBar) * 120)}px`,
                      backgroundColor: count > 0 ? 'rgba(60,175,246,0.7)' : 'rgba(255,255,255,0.05)',
                    }}
                  />
                  <span className="text-[9px] text-slate-600">{date}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Top challenges */}
          <div className="bg-slate-800/40 border border-slate-700 rounded-xl p-6">
            <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-4">
              Top Challenges
            </h2>
            <div className="space-y-3">
              {stats.topChallenges.map((c, i) => (
                <button
                  key={c.slug}
                  onClick={() => router.push(`/challenges/${c.slug}`)}
                  className="w-full flex items-center gap-3 text-left hover:bg-slate-700/40 rounded-lg p-2 transition-colors"
                >
                  <span className="text-slate-600 font-bold text-sm w-4">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium truncate">{c.title}</p>
                    <p className={`text-xs ${DifficultyColors[c.difficulty]}`}>
                      {DifficultyLabels[c.difficulty]}
                    </p>
                  </div>
                  <span className="text-xs text-slate-500 shrink-0">{c.submissions} subs</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Manage Challenges', path: '/admin/challenges', icon: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4' },
            { label: 'Manage Courses', path: '/admin/courses', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
            { label: 'Manage Users', path: '/admin/users', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
            { label: 'View Leaderboard', path: '/leaderboard', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
          ].map(link => (
            <button
              key={link.path}
              onClick={() => router.push(link.path)}
              className="flex items-center gap-3 p-4 bg-slate-800/40 border border-slate-700 rounded-xl hover:border-[#3caff6]/40 hover:bg-slate-700/40 transition-all text-left"
            >
              <svg className="w-5 h-5 text-[#3caff6] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={link.icon} />
              </svg>
              <span className="text-sm font-medium text-slate-300">{link.label}</span>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}
