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
export enum ProgrammingLanguage {
  CSharp = 0,
  Python = 1,
  JavaScript = 2,
  TypeScript = 3,
  Java = 4,
  Cpp = 5,
  Go = 6,
  Rust = 7,
  Ruby = 8,
  Php = 9,
}

export const LanguageNames: Record<ProgrammingLanguage, string> = {
  [ProgrammingLanguage.CSharp]: 'C#',
  [ProgrammingLanguage.Python]: 'Python',
  [ProgrammingLanguage.JavaScript]: 'JavaScript',
  [ProgrammingLanguage.TypeScript]: 'TypeScript',
  [ProgrammingLanguage.Java]: 'Java',
  [ProgrammingLanguage.Cpp]: 'C++',
  [ProgrammingLanguage.Go]: 'Go',
  [ProgrammingLanguage.Rust]: 'Rust',
  [ProgrammingLanguage.Ruby]: 'Ruby',
  [ProgrammingLanguage.Php]: 'PHP',
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
