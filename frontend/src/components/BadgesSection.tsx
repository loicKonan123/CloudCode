'use client';

import { UserProfile } from '@/types';

interface Badge {
  id: string;
  icon: string;
  label: string;
  description: string;
  earned: boolean;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

function computeBadges(profile: UserProfile): Badge[] {
  const {
    challengesSolved, bestChallengeStreak, challengeStreak,
    hardSolved, mediumSolved, vsWins, totalSubmissions,
    pythonSubmissions, javaScriptSubmissions, totalScore,
  } = profile;

  return [
    {
      id: 'first_blood',
      icon: '🎯',
      label: 'First Blood',
      description: 'Solve your first challenge',
      earned: challengesSolved >= 1,
      rarity: 'common',
    },
    {
      id: 'getting_started',
      icon: '🌱',
      label: 'Getting Started',
      description: 'Solve 10 challenges',
      earned: challengesSolved >= 10,
      rarity: 'common',
    },
    {
      id: 'problem_solver',
      icon: '🧠',
      label: 'Problem Solver',
      description: 'Solve 25 challenges',
      earned: challengesSolved >= 25,
      rarity: 'rare',
    },
    {
      id: 'code_master',
      icon: '🚀',
      label: 'Code Master',
      description: 'Solve 50 challenges',
      earned: challengesSolved >= 50,
      rarity: 'epic',
    },
    {
      id: 'centurion',
      icon: '💯',
      label: 'Centurion',
      description: 'Reach 100 challenges solved',
      earned: challengesSolved >= 100,
      rarity: 'legendary',
    },
    {
      id: 'on_fire',
      icon: '🔥',
      label: 'On Fire',
      description: 'Achieve a 7-day streak',
      earned: bestChallengeStreak >= 7,
      rarity: 'rare',
    },
    {
      id: 'month_warrior',
      icon: '⚡',
      label: 'Month Warrior',
      description: 'Achieve a 30-day streak',
      earned: bestChallengeStreak >= 30,
      rarity: 'epic',
    },
    {
      id: 'unstoppable',
      icon: '👑',
      label: 'Unstoppable',
      description: 'Achieve a 100-day streak',
      earned: bestChallengeStreak >= 100,
      rarity: 'legendary',
    },
    {
      id: 'hard_boiled',
      icon: '💎',
      label: 'Hard Boiled',
      description: 'Solve 5 Hard challenges',
      earned: hardSolved >= 5,
      rarity: 'rare',
    },
    {
      id: 'nightmare',
      icon: '☠️',
      label: 'Nightmare',
      description: 'Solve 20 Hard challenges',
      earned: hardSolved >= 20,
      rarity: 'legendary',
    },
    {
      id: 'vs_fighter',
      icon: '⚔️',
      label: 'VS Fighter',
      description: 'Win 5 VS matches',
      earned: vsWins >= 5,
      rarity: 'common',
    },
    {
      id: 'vs_champion',
      icon: '🏆',
      label: 'VS Champion',
      description: 'Win 25 VS matches',
      earned: vsWins >= 25,
      rarity: 'epic',
    },
    {
      id: 'grinder',
      icon: '⚙️',
      label: 'Grinder',
      description: 'Submit 100 solutions',
      earned: totalSubmissions >= 100,
      rarity: 'common',
    },
    {
      id: 'pythonista',
      icon: '🐍',
      label: 'Pythonista',
      description: 'Submit 50 Python solutions',
      earned: pythonSubmissions >= 50,
      rarity: 'rare',
    },
    {
      id: 'js_ninja',
      icon: '🟨',
      label: 'JS Ninja',
      description: 'Submit 50 JavaScript solutions',
      earned: javaScriptSubmissions >= 50,
      rarity: 'rare',
    },
    {
      id: 'high_scorer',
      icon: '🌟',
      label: 'High Scorer',
      description: 'Accumulate 1000 total points',
      earned: totalScore >= 1000,
      rarity: 'rare',
    },
  ];
}

const RarityStyles: Record<string, { border: string; glow: string; label: string }> = {
  common:    { border: 'border-slate-600',        glow: '',                                       label: 'text-slate-400' },
  rare:      { border: 'border-blue-500/50',      glow: '0 0 12px rgba(59,130,246,0.15)',         label: 'text-blue-400' },
  epic:      { border: 'border-purple-500/50',    glow: '0 0 12px rgba(168,85,247,0.2)',          label: 'text-purple-400' },
  legendary: { border: 'border-amber-400/60',     glow: '0 0 16px rgba(251,191,36,0.25)',         label: 'text-amber-400' },
};

interface Props {
  profile: UserProfile;
}

export default function BadgesSection({ profile }: Props) {
  const badges = computeBadges(profile);
  const earned = badges.filter(b => b.earned);
  const locked = badges.filter(b => !b.earned);

  return (
    <div className="bg-slate-800/40 border border-slate-700 rounded-xl p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider">
          Badges
        </h2>
        <span className="text-xs text-slate-500">
          {earned.length} / {badges.length} unlocked
        </span>
      </div>

      {/* Earned */}
      {earned.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 mb-5">
          {earned.map(badge => {
            const style = RarityStyles[badge.rarity];
            return (
              <div
                key={badge.id}
                title={badge.description}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border ${style.border} bg-slate-900/50 cursor-default transition-transform hover:scale-105`}
                style={{ boxShadow: style.glow }}
              >
                <span className="text-2xl">{badge.icon}</span>
                <span className="text-[10px] font-semibold text-center leading-tight text-slate-300">{badge.label}</span>
                <span className={`text-[9px] font-bold uppercase ${style.label}`}>{badge.rarity}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Locked */}
      {locked.length > 0 && (
        <>
          <p className="text-[10px] text-slate-600 uppercase tracking-wider font-bold mb-3">Locked</p>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {locked.map(badge => (
              <div
                key={badge.id}
                title={badge.description}
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-slate-800 bg-slate-900/30 cursor-default opacity-40 grayscale"
              >
                <span className="text-2xl">{badge.icon}</span>
                <span className="text-[10px] font-semibold text-center leading-tight text-slate-500">{badge.label}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {earned.length === 0 && (
        <p className="text-center text-sm text-slate-600 py-4">Solve challenges to earn your first badge!</p>
      )}
    </div>
  );
}
