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

// ===== Admin Types =====
export interface AdminUser {
  id: string;
  email: string;
  username: string;
  isAdmin: boolean;
  createdAt: string;
}

// ===== API Types =====
export interface ApiError {
  code: string;
  message: string;
  errors?: Record<string, string[]>;
}
