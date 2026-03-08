// ===========================================
// Types TypeScript pour CloudCode Frontend
// ===========================================

// ===== Auth Types =====
export interface User {
  id: string;
  email: string;
  username: string;
  avatar?: string;
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

// ===== Project Types =====
// Must match backend CloudCode.Domain.Enums.ProgrammingLanguage
export enum ProgrammingLanguage {
  JavaScript = 1,
  Python = 2,
  CSharp = 3,
  Java = 4,
  Go = 5,
  TypeScript = 6,
  Html = 7,
  Css = 8,
  Json = 9,
  Markdown = 10,
  Sql = 11,
  Xml = 12,
  Yaml = 13,
  Bash = 14,
  Rust = 15,
}

export const LanguageNames: Record<ProgrammingLanguage, string> = {
  [ProgrammingLanguage.JavaScript]: 'JavaScript',
  [ProgrammingLanguage.Python]: 'Python',
  [ProgrammingLanguage.CSharp]: 'C#',
  [ProgrammingLanguage.Java]: 'Java',
  [ProgrammingLanguage.Go]: 'Go',
  [ProgrammingLanguage.TypeScript]: 'TypeScript',
  [ProgrammingLanguage.Html]: 'HTML',
  [ProgrammingLanguage.Css]: 'CSS',
  [ProgrammingLanguage.Json]: 'JSON',
  [ProgrammingLanguage.Markdown]: 'Markdown',
  [ProgrammingLanguage.Sql]: 'SQL',
  [ProgrammingLanguage.Xml]: 'XML',
  [ProgrammingLanguage.Yaml]: 'YAML',
  [ProgrammingLanguage.Bash]: 'Bash',
  [ProgrammingLanguage.Rust]: 'Rust',
};

// Langages supportés pour la création de nouveaux projets (exécution + terminal)
export const SupportedLanguages: ProgrammingLanguage[] = [
  ProgrammingLanguage.JavaScript,
  ProgrammingLanguage.TypeScript,
  ProgrammingLanguage.Python,
];

export interface Project {
  id: string;
  name: string;
  description?: string;
  language: ProgrammingLanguage;
  isPublic: boolean;
  tags: string[];
  createdAt: string;
  updatedAt?: string;
  owner: {
    id: string;
    username: string;
    avatar?: string;
  };
  fileCount: number;
  collaboratorCount: number;
}

export interface ProjectListItem {
  id: string;
  name: string;
  description?: string;
  language: ProgrammingLanguage;
  isPublic: boolean;
  createdAt: string;
  ownerUsername: string;
}

export interface CreateProjectDto {
  name: string;
  description?: string;
  language: ProgrammingLanguage;
  isPublic: boolean;
  tags?: string[];
}

// ===== File Types =====
export interface CodeFile {
  id: string;
  name: string;
  path: string;
  content?: string;
  isFolder: boolean;
  projectId: string;
  parentId?: string;
  children?: CodeFile[];
  createdAt: string;
  updatedAt?: string;
}

export interface CreateFileDto {
  name: string;
  content?: string;
  isFolder: boolean;
  parentId?: string;
}

// ===== Collaboration Types =====
export enum CollaboratorRole {
  Read = 0,
  Write = 1,
  Admin = 2,
}

export interface Collaborator {
  id: string;
  userId: string;
  username: string;
  email: string;
  avatar?: string;
  role: CollaboratorRole;
  invitedAt: string;
  acceptedAt?: string;
}

// ===== Execution Types =====
export enum ExecutionStatus {
  Pending = 0,
  Running = 1,
  Completed = 2,
  Failed = 3,
  Timeout = 4,
  Cancelled = 5
}

export interface ExecutionResult {
  id: string;
  output: string;
  errorOutput?: string;
  exitCode: number;
  executionTimeMs: number;
  status: ExecutionStatus;
  memoryUsedBytes?: number;
  executedAt?: string;
}

// ===== Dependency Types =====
export enum DependencyType {
  Pip = 1,
  Npm = 2,
  Cargo = 3,
  Go = 4,
}

export const DependencyTypeNames: Record<DependencyType, string> = {
  [DependencyType.Pip]: 'pip',
  [DependencyType.Npm]: 'npm',
  [DependencyType.Cargo]: 'cargo',
  [DependencyType.Go]: 'go',
};

export interface Dependency {
  id: string;
  name: string;
  version?: string;
  type: DependencyType;
  isInstalled: boolean;
  installedAt?: string;
  createdAt: string;
}

export interface ProjectDependencies {
  projectId: string;
  defaultType: DependencyType;
  dependencies: Dependency[];
}

export interface AddDependencyDto {
  name: string;
  version?: string;
}

export interface DependencyInstallStatus {
  name: string;
  version?: string;
  installed: boolean;
  error?: string;
}

export interface InstallResultDto {
  success: boolean;
  output: string;
  error?: string;
  installedCount: number;
  failedCount: number;
  dependencies: DependencyInstallStatus[];
}

export interface EnvironmentStatusDto {
  pythonAvailable: boolean;
  pythonVersion?: string;
  nodeAvailable: boolean;
  nodeVersion?: string;
  npmAvailable: boolean;
  npmVersion?: string;
  workingDirectory: string;
}

export interface ProjectEnvironmentDto {
  projectId: string;
  workingDirectory: string;
  hasVenv: boolean;
  venvPath?: string;
  hasNodeModules: boolean;
  nodeModulesPath?: string;
  hasPackageJson: boolean;
  installedPackages: string[];
  totalSizeBytes: number;
  fileCount: number;
}

// ===== Environment Variables Types =====
export interface EnvironmentVariable {
  id: string;
  key: string;
  value: string;
  isSecret: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateEnvironmentVariableDto {
  key: string;
  value: string;
  isSecret: boolean;
}

export interface UpdateEnvironmentVariableDto {
  key?: string;
  value?: string;
  isSecret?: boolean;
}

// ===== Search Types =====
export interface SearchResult {
  fileId: string;
  fileName: string;
  filePath: string;
  lineNumber: number;
  lineContent: string;
  columnStart: number;
}

// ===== Formatting Types =====
export interface FormattingResult {
  formattedCode: string;
  success: boolean;
  error?: string;
}

// ===== Git Types =====
export interface GitFileStatus {
  path: string;
  status: string; // "M", "A", "D", "R", "?"
}

export interface GitStatus {
  isRepo: boolean;
  branch: string;
  remoteUrl?: string;
  staged: GitFileStatus[];
  unstaged: GitFileStatus[];
  untracked: GitFileStatus[];
  aheadBy: number;
  behindBy: number;
}

export interface GitCommit {
  hash: string;
  shortHash: string;
  message: string;
  author: string;
  date: string;
}

export interface GitOperationResult {
  success: boolean;
  output: string;
  error?: string;
}

export interface GitCredentialInfo {
  provider: string;
  username: string;
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

// ===== API Types =====
export interface ApiError {
  code: string;
  message: string;
  errors?: Record<string, string[]>;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
}
