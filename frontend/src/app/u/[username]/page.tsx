'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AnimatedLogo from '@/components/AnimatedLogo';
import { profileApi } from '@/lib/api';
import { PublicProfile, DifficultyNames, ChallengeDifficulty, ChallengeLanguage } from '@/types';

export default function PublicProfilePage() {
  const { username } = useParams<{ username: string }>();
  const router = useRouter();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    profileApi.getPublicProfile(username)
      .then(r => setProfile(r.data))
      .catch(() => setNotFound(true));
  }, [username]);

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#101b22', color: '#e2e8f0' }}>
        <div className="text-center">
          <p className="text-slate-400 mb-4">User <span className="text-white font-bold">@{username}</span> not found.</p>
          <button onClick={() => router.push('/challenges')} className="text-[#3caff6] hover:underline text-sm">
            Back to Challenges
          </button>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#101b22' }}>
        <div className="w-8 h-8 border-2 border-[#3caff6] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const memberSince = new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="min-h-screen flex flex-col app-grid" style={{ backgroundColor: '#101b22', color: '#e2e8f0' }}>
      <style>{`
        @keyframes profileDrift {
          0%, 100% { transform: translateX(-50%) translateY(0) scale(1); opacity: 0.45; }
          50% { transform: translateX(-50%) translateY(-20px) scale(1.05); opacity: 0.75; }
        }
        @keyframes profileDriftB {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.25; }
          50% { transform: translateY(18px) scale(1.06); opacity: 0.45; }
        }
      `}</style>

      {/* Animated background glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
        <div style={{
          position: 'absolute', top: '-10%', left: '50%',
          width: 650, height: 420,
          background: 'radial-gradient(ellipse, rgba(60,175,246,0.07) 0%, transparent 70%)',
          animation: 'profileDrift 10s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute', bottom: '15%', right: '5%',
          width: 450, height: 380,
          background: 'radial-gradient(ellipse, rgba(99,102,241,0.04) 0%, transparent 70%)',
          animation: 'profileDriftB 14s ease-in-out infinite',
        }} />
      </div>

      {/* Header */}
      <header className="border-b border-slate-800 bg-[#101b22] sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button onClick={() => router.push('/challenges')} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <AnimatedLogo size={26} />
              <span className="text-lg font-bold tracking-tight text-white">CloudCode</span>
            </button>
            <button onClick={() => router.push('/challenges')} className="text-sm text-slate-400 hover:text-[#3caff6] transition-colors">
              ← Challenges
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10 flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        {/* Profile header */}
        <div className="flex items-center gap-6 mb-10">
          <div className="h-20 w-20 rounded-full bg-[#3caff6]/20 border border-[#3caff6]/30 flex items-center justify-center text-[#3caff6] text-3xl font-bold flex-shrink-0">
            {profile.username.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">@{profile.username}</h1>
            {profile.bio && <p className="text-slate-400 mt-1 text-sm max-w-xl">{profile.bio}</p>}
            <p className="text-slate-500 text-xs mt-1">Member since {memberSince}</p>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
          {[
            { label: 'Solved', value: profile.challengesSolved },
            { label: 'Total Score', value: profile.totalScore },
            { label: 'Streak', value: `${profile.challengeStreak} 🔥` },
            { label: 'Best Streak', value: `${profile.bestChallengeStreak} 🏆` },
          ].map(({ label, value }) => (
            <div key={label} className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-white">{value}</div>
              <div className="text-xs text-slate-500 mt-1 uppercase tracking-wide">{label}</div>
            </div>
          ))}
        </div>

        {/* Difficulty breakdown */}
        <div className="bg-slate-800/40 border border-slate-700 rounded-xl p-6 mb-8">
          <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-4">Challenges by Difficulty</h2>
          <div className="flex gap-6">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-slate-400 text-sm">Easy</span>
              <span className="text-white font-bold text-sm">{profile.easySolved}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="text-slate-400 text-sm">Medium</span>
              <span className="text-white font-bold text-sm">{profile.mediumSolved}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span className="text-slate-400 text-sm">Hard</span>
              <span className="text-white font-bold text-sm">{profile.hardSolved}</span>
            </div>
          </div>
        </div>

        {/* Recent submissions */}
        {profile.recentSubmissions.length > 0 && (
          <div className="bg-slate-800/40 border border-slate-700 rounded-xl p-6">
            <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-4">Recent Activity</h2>
            <div className="space-y-2">
              {profile.recentSubmissions.map((sub, i) => (
                <button
                  key={i}
                  onClick={() => router.push(`/challenges/${sub.challengeSlug}`)}
                  className="w-full flex items-center justify-between py-2 px-3 rounded-lg hover:bg-slate-700/50 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-2 h-2 rounded-full ${sub.passed ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                    <span className="text-sm text-slate-200">{sub.challengeTitle}</span>
                    <span className="text-[10px] text-slate-500">
                      {sub.language === ChallengeLanguage.Python ? 'Python' : 'JavaScript'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-bold ${sub.passed ? 'text-emerald-400' : 'text-slate-500'}`}>
                      {sub.score}%
                    </span>
                    <span className="text-[10px] text-slate-600">
                      {new Date(sub.submittedAt).toLocaleDateString()}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
