// ===========================================
// Types TypeScript pour CloudCode Frontend
// ===========================================

// ===== Auth Types =====
export interface User {
  id: string;
  email: string;
  username: string;
  avatar?: string;
  isAdmin?: boolean;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  user: User;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  email: string;
  username: string;
  password: string;
}

// ===== Challenge Types =====
export enum ChallengeDifficulty {
  Easy = 1,
  Medium = 2,
  Hard = 3,
}

export const DifficultyNames: Record<ChallengeDifficulty, string> = {
  [ChallengeDifficulty.Easy]: 'Easy',
  [ChallengeDifficulty.Medium]: 'Medium',
  [ChallengeDifficulty.Hard]: 'Hard',
};

export const DifficultyColors: Record<ChallengeDifficulty, string> = {
  [ChallengeDifficulty.Easy]: 'text-green-400',
  [ChallengeDifficulty.Medium]: 'text-yellow-400',
  [ChallengeDifficulty.Hard]: 'text-red-400',
};

export enum ChallengeLanguage {
  Python = 1,
  JavaScript = 2,
  Both = 3,
}

export const ChallengeLanguageNames: Record<ChallengeLanguage, string> = {
  [ChallengeLanguage.Python]: 'Python',
  [ChallengeLanguage.JavaScript]: 'JavaScript',
  [ChallengeLanguage.Both]: 'Python & JavaScript',
};

export enum SubmissionStatus {
  Pending = 1,
  Running = 2,
  Passed = 3,
  Failed = 4,
  Error = 5,
  Timeout = 6,
}

export interface ChallengeListItem {
  id: string;
  title: string;
  slug: string;
  difficulty: ChallengeDifficulty;
  supportedLanguages: ChallengeLanguage;
  tags: string[];
  isPublished: boolean;
  successRate: number;
  isSolved?: boolean;
  bestScore?: number;
}

export interface ChallengeDetail {
  id: string;
  title: string;
  slug: string;
  description: string;
  difficulty: ChallengeDifficulty;
  supportedLanguages: ChallengeLanguage;
  starterCodePython?: string;
  starterCodeJavaScript?: string;
  tags: string[];
  visibleTestCases: TestCaseInfo[];
  totalTestCases: number;
  isSolved?: boolean;
  bestScore?: number;
  hints: string[];
  officialSolutionPython?: string;
  officialSolutionJS?: string;
}

// ===== Profile Types =====
export interface UserProfile {
  id: string;
  email: string;
  username: string;
  avatar?: string;
  bio?: string;
  emailConfirmed: boolean;
  createdAt: string;
  // Challenge stats
  challengesSolved: number;
  totalScore: number;
  totalSubmissions: number;
  easySolved: number;
  mediumSolved: number;
  hardSolved: number;
  pythonSubmissions: number;
  javaScriptSubmissions: number;
  // Streak
  challengeStreak: number;
  bestChallengeStreak: number;
  // VS stats
  elo: number;
  tier: string;
  vsWins: number;
  vsLosses: number;
  // Recent activity
  recentSubmissions: RecentSubmission[];
  // Heatmap
  activityByDay: Record<string, number>;
}

export interface RecentSubmission {
  challengeTitle: string;
  challengeSlug: string;
  passed: boolean;
  score: number;
  language: ChallengeLanguage;
  submittedAt: string;
}

export interface UpdateProfileDto {
  username?: string;
  avatar?: string;
  bio?: string;
}

export interface PublicProfile {
  id: string;
  username: string;
  avatar?: string;
  bio?: string;
  createdAt: string;
  publicProjectCount: number;
  challengesSolved: number;
  totalScore: number;
  easySolved: number;
  mediumSolved: number;
  hardSolved: number;
  challengeStreak: number;
  bestChallengeStreak: number;
  recentSubmissions: RecentSubmission[];
}

export interface TestCaseInfo {
  id: string;
  input: string;
  expectedOutput: string;
  orderIndex: number;
  description?: string;
}

export interface TestResult {
  testIndex: number;
  description?: string;
  passed: boolean;
  input?: string;
  expectedOutput?: string;
  actualOutput?: string;
  error?: string;
  executionTimeMs: number;
  isHidden: boolean;
}

export interface JudgeResult {
  status: SubmissionStatus;
  passedTests: number;
  totalTests: number;
  score: number;
  totalExecutionTimeMs: number;
  results: TestResult[];
}

export interface SubmissionInfo {
  id: string;
  language: ChallengeLanguage;
  code: string;
  status: SubmissionStatus;
  passedTests: number;
  totalTests: number;
  score: number;
  executionTimeMs: number;
  errorOutput?: string;
  submittedAt: string;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  totalScore: number;
  challengesSolved: number;
  perfectScores: number;
}

export interface LeaderboardPage {
  items: LeaderboardEntry[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CreateChallengeDto {
  title: string;
  description: string;
  difficulty: ChallengeDifficulty;
  supportedLanguages: ChallengeLanguage;
  starterCodePython?: string;
  starterCodeJavaScript?: string;
  tags: string[];
  testCases: CreateTestCaseDto[];
}

export interface CreateTestCaseDto {
  input: string;
  expectedOutput: string;
  isHidden: boolean;
  orderIndex: number;
  description?: string;
}

// ===== Course Types =====
export interface CourseListItem {
  id: string;
  title: string;
  slug: string;
  description: string;
  language: ChallengeLanguage;
  challengeCount: number;
  isPublished: boolean;
  orderIndex: number;
}

export interface CourseChallengeItem {
  id: string;
  title: string;
  slug: string;
  difficulty: ChallengeDifficulty;
  tags: string[];
  orderIndex: number;
  isSolved: boolean;
}

export interface CourseDetail {
  id: string;
  title: string;
  slug: string;
  description: string;
  language: ChallengeLanguage;
  isPublished: boolean;
  orderIndex: number;
  challenges: CourseChallengeItem[];
}

export interface CreateCourseDto {
  title: string;
  description: string;
  language: ChallengeLanguage;
  orderIndex: number;
  isPublished: boolean;
  challengeIds: string[];
}

// ===== VS Mode Types =====
export enum VsMatchStatus {
  Waiting = 1,
  InProgress = 2,
  Finished = 3,
  Cancelled = 4,
}

export interface VsPlayer {
  id: string;
  username: string;
  avatar?: string;
  elo: number;
  tier: string;
  submitted: boolean;
}

export interface VsRank {
  userId: string;
  username: string;
  avatar?: string;
  elo: number;
  tier: string;
  wins: number;
  losses: number;
  draws: number;
  currentStreak: number;
  bestStreak: number;
  gamesPlayed: number;
  winRate: number;
}

export interface VsMatch {
  id: string;
  player1: VsPlayer;
  player2: VsPlayer;
  challengeTitle: string;
  challengeSlug: string;
  player1Language: string;
  player2Language: string;
  status: VsMatchStatus;
  winnerId?: string;
  startedAt?: string;
  finishedAt?: string;
  player1EloChange: number;
  player2EloChange: number;
}

export interface VsMatchResult {
  passed: boolean;
  passedTests: number;
  totalTests: number;
  score: number;
  executionTimeMs: number;
  errorOutput?: string;
}

export interface VsLeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  avatar?: string;
  elo: number;
  tier: string;
  wins: number;
  losses: number;
  winRate: number;
}

export interface MatchFoundPayload {
  matchId: string;
  opponent: VsPlayer;
  challengeSlug: string;
  challengeTitle: string;
  myLanguage: string;
  opponentLanguage: string;
}

export interface MatchEndedPayload {
  matchId: string;
  winnerId?: string;
  winnerUsername?: string;
  player1EloChange: number;
  player2EloChange: number;
  isDraw: boolean;
}

export interface OpponentStatusPayload {
  playerId: string;
  event: 'submitting' | 'passed' | 'failed';
}

export const TierColors: Record<string, string> = {
  Bronze: 'text-orange-600',
  Silver: 'text-slate-400',
  Gold: 'text-yellow-400',
  Platinum: 'text-cyan-400',
  Diamond: 'text-blue-400',
  Master: 'text-purple-400',
  Grandmaster: 'text-red-400',
};

export const TierGlows: Record<string, string> = {
  Bronze: 'shadow-orange-600/30',
  Silver: 'shadow-slate-400/30',
  Gold: 'shadow-yellow-400/30',
  Platinum: 'shadow-cyan-400/30',
  Diamond: 'shadow-blue-400/30',
  Master: 'shadow-purple-400/30',
  Grandmaster: 'shadow-red-400/30',
};

// ===== Admin Types =====
export interface AdminUser {
  id: string;
  email: string;
  username: string;
  isAdmin: boolean;
  createdAt: string;
}

// ===== Discussion Types =====
export interface CommentAuthor {
  id: string;
  username: string;
  avatar?: string;
}

export interface ChallengeComment {
  id: string;
  content: string;
  createdAt: string;
  parentId?: string;
  author: CommentAuthor;
  replies: ChallengeComment[];
}

// ===== API Types =====
export interface ApiError {
  code: string;
  message: string;
  errors?: Record<string, string[]>;
}
