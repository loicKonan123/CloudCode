'use client';
import AnimatedLogo from '@/components/AnimatedLogo';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { profileApi } from '@/lib/api';
import { UserProfile, UpdateProfileDto, ChallengeLanguage, TierColors } from '@/types';

const TierGlowColors: Record<string, string> = {
  Bronze: 'shadow-amber-600/30',
  Silver: 'shadow-slate-400/30',
  Gold: 'shadow-yellow-400/30',
  Platinum: 'shadow-cyan-400/30',
  Diamond: 'shadow-blue-400/30',
  Master: 'shadow-purple-400/30',
  Grandmaster: 'shadow-red-400/30',
};

export default function ProfilePage() {
  const router = useRouter();
  const { user, checkAuth, setUser } = useAuthStore();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [editForm, setEditForm] = useState<UpdateProfileDto>({});

  useEffect(() => {
    checkAuth();
    const token = localStorage.getItem('accessToken');
    if (!token) { router.push('/login'); return; }
    loadProfile();
  }, [checkAuth, router]);

  const loadProfile = async () => {
    try {
      setIsLoading(true);
      const res = await profileApi.getMyProfile();
      setProfile(res.data);
      setEditForm({ username: res.data.username, bio: res.data.bio ?? '' });
    } catch {
      router.push('/challenges');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!profile) return;
    setSaveError('');
    setIsSaving(true);
    try {
      const res = await profileApi.updateMyProfile(editForm);
      setProfile(res.data);
      setUser({ ...user!, username: res.data.username, avatar: res.data.avatar });
      setIsEditing(false);
    } catch (e: any) {
      setSaveError(e.response?.data?.message ?? 'Error saving profile');
    } finally {
      setIsSaving(false);
    }
  };

  const memberSince = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  if (isLoading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#101b22' }}>
        <div className="w-8 h-8 border-2 border-[#3caff6] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const pyPct = profile.totalSubmissions > 0
    ? Math.round((profile.pythonSubmissions / profile.totalSubmissions) * 100)
    : 0;
  const jsPct = 100 - pyPct;
  const totalChallenges = profile.easySolved + profile.mediumSolved + profile.hardSolved;

  return (
    <div className="min-h-screen font-[var(--font-inter)]" style={{ backgroundColor: '#101b22', color: '#e2e8f0' }}>
      {/* Header */}
      <header className="border-b border-slate-800 bg-[#101b22] sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push('/challenges')} className="flex items-center gap-2 text-[#3caff6]">
              <AnimatedLogo size={26} />
              <span className="text-lg font-bold hidden sm:block">CloudCode</span>
            </button>
            <span className="text-slate-600">/</span>
            <span className="text-sm font-medium text-white">Profile</span>
          </div>
          <button
            onClick={() => router.push('/challenges')}
            className="text-sm text-slate-400 hover:text-white transition-colors"
          >
            ← Back to Challenges
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* Profile Card */}
        <div className="bg-slate-800/40 border border-slate-700 rounded-2xl p-6 flex flex-col sm:flex-row gap-6 items-start sm:items-center">
          {/* Avatar */}
          <div className={`w-20 h-20 rounded-full bg-[#3caff6]/20 border-2 border-[#3caff6]/40 flex items-center justify-center text-3xl font-bold text-[#3caff6] shrink-0 shadow-lg ${TierGlowColors[profile.tier] ?? ''}`}>
            {profile.avatar ? (
              <img src={profile.avatar} alt="avatar" className="w-full h-full rounded-full object-cover" />
            ) : (
              profile.username.charAt(0).toUpperCase()
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <div className="space-y-3">
                <input
                  type="text"
                  value={editForm.username ?? ''}
                  onChange={e => setEditForm(f => ({ ...f, username: e.target.value }))}
                  placeholder="Username"
                  className="w-full max-w-xs bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#3caff6]"
                />
                <textarea
                  value={editForm.bio ?? ''}
                  onChange={e => setEditForm(f => ({ ...f, bio: e.target.value }))}
                  placeholder="Bio (optional)"
                  rows={2}
                  className="w-full max-w-lg bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#3caff6] resize-none"
                />
                {saveError && <p className="text-red-400 text-xs">{saveError}</p>}
                <div className="flex gap-2">
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-4 py-1.5 bg-[#3caff6] text-[#101b22] text-sm font-bold rounded-lg hover:bg-[#3caff6]/90 transition disabled:opacity-50"
                  >
                    {isSaving ? 'Saving…' : 'Save'}
                  </button>
                  <button
                    onClick={() => { setIsEditing(false); setSaveError(''); }}
                    className="px-4 py-1.5 bg-slate-700 text-slate-300 text-sm font-medium rounded-lg hover:bg-slate-600 transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl font-bold">{profile.username}</h1>
                  <span className={`text-sm font-bold ${TierColors[profile.tier] ?? 'text-slate-400'}`}>
                    {profile.tier}
                  </span>
                </div>
                <p className="text-slate-400 text-sm mt-1">{profile.bio || 'No bio yet.'}</p>
                <p className="text-slate-500 text-xs mt-2">Member since {memberSince(profile.createdAt)}</p>
              </>
            )}
          </div>

          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-sm font-medium rounded-lg transition shrink-0"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              Edit Profile
            </button>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Solved', value: profile.challengesSolved, color: 'text-emerald-400' },
            { label: 'Total Score', value: profile.totalScore, color: 'text-[#3caff6]' },
            { label: 'Submissions', value: profile.totalSubmissions, color: 'text-slate-300' },
            { label: 'ELO', value: profile.elo, color: TierColors[profile.tier] ?? 'text-slate-300' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-slate-800/40 border border-slate-800 rounded-xl p-4 text-center">
              <div className={`text-2xl font-bold ${color}`}>{value}</div>
              <div className="text-xs text-slate-500 uppercase tracking-widest mt-1">{label}</div>
            </div>
          ))}
        </div>

        {/* Streak Card */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-4 flex items-center gap-4">
            <div className="text-4xl">🔥</div>
            <div>
              <div className={`text-2xl font-bold ${profile.challengeStreak >= 3 ? 'text-orange-400' : 'text-slate-300'}`}>
                {profile.challengeStreak} day{profile.challengeStreak !== 1 ? 's' : ''}
              </div>
              <div className="text-xs text-slate-500 uppercase tracking-widest">Current Streak</div>
            </div>
          </div>
          <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-4 flex items-center gap-4">
            <div className="text-4xl">🏆</div>
            <div>
              <div className="text-2xl font-bold text-yellow-400">
                {profile.bestChallengeStreak} day{profile.bestChallengeStreak !== 1 ? 's' : ''}
              </div>
              <div className="text-xs text-slate-500 uppercase tracking-widest">Best Streak</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Difficulty Breakdown */}
          <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-5">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Challenges Solved</h2>
            <div className="space-y-3">
              {[
                { label: 'Easy', count: profile.easySolved, color: 'bg-emerald-500', textColor: 'text-emerald-400' },
                { label: 'Medium', count: profile.mediumSolved, color: 'bg-amber-500', textColor: 'text-amber-400' },
                { label: 'Hard', count: profile.hardSolved, color: 'bg-rose-500', textColor: 'text-rose-400' },
              ].map(({ label, count, color, textColor }) => {
                const pct = totalChallenges > 0 ? (count / totalChallenges) * 100 : 0;
                return (
                  <div key={label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className={`font-bold ${textColor}`}>{label}</span>
                      <span className="text-slate-400">{count}</span>
                    </div>
                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* VS Stats + Language */}
          <div className="space-y-4">
            {/* VS Stats */}
            <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-5">
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">VS Mode</h2>
              <div className="flex items-center justify-between">
                <div className="text-center">
                  <div className="text-xl font-bold text-emerald-400">{profile.vsWins}</div>
                  <div className="text-xs text-slate-500 uppercase">Wins</div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${TierColors[profile.tier] ?? 'text-slate-400'}`}>{profile.elo}</div>
                  <div className={`text-xs font-bold uppercase ${TierColors[profile.tier] ?? 'text-slate-400'}`}>{profile.tier}</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-red-400">{profile.vsLosses}</div>
                  <div className="text-xs text-slate-500 uppercase">Losses</div>
                </div>
              </div>
            </div>

            {/* Language breakdown */}
            <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-5">
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Languages</h2>
              <div className="flex h-3 rounded-full overflow-hidden">
                <div className="bg-blue-500 transition-all" style={{ width: `${pyPct}%` }} title={`Python ${pyPct}%`} />
                <div className="bg-yellow-400 transition-all" style={{ width: `${jsPct}%` }} title={`JavaScript ${jsPct}%`} />
              </div>
              <div className="flex justify-between mt-2 text-xs text-slate-400">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500 inline-block" /> Python {pyPct}%</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" /> JavaScript {jsPct}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Submissions */}
        {profile.recentSubmissions.length > 0 && (
          <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-5">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Recent Submissions</h2>
            <div className="space-y-2">
              {profile.recentSubmissions.map((sub, i) => (
                <div
                  key={i}
                  onClick={() => router.push(`/challenges/${sub.challengeSlug}`)}
                  className="flex items-center justify-between px-4 py-3 bg-slate-900/50 rounded-lg border border-slate-800 hover:border-slate-600 cursor-pointer transition"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {sub.passed ? (
                      <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 text-red-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    )}
                    <span className="text-sm font-medium truncate">{sub.challengeTitle}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-500 shrink-0 ml-4">
                    <span>{sub.language === ChallengeLanguage.Python ? 'Python' : 'JavaScript'}</span>
                    {sub.passed && <span className="text-[#3caff6]">{sub.score} pts</span>}
                    <span>{new Date(sub.submittedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
