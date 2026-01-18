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
