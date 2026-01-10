import { clsx, type ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(date: string | Date) {
  return new Date(date).toLocaleString('fr-FR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getLanguageExtension(language: number): string {
  const extensions: Record<number, string> = {
    0: '.cs',    // CSharp
    1: '.py',    // Python
    2: '.js',    // JavaScript
    3: '.ts',    // TypeScript
    4: '.java',  // Java
    5: '.cpp',   // Cpp
    6: '.go',    // Go
    7: '.rs',    // Rust
    8: '.rb',    // Ruby
    9: '.php',   // Php
  };
  return extensions[language] || '.txt';
}

export function getMonacoLanguage(language: number): string {
  const languages: Record<number, string> = {
    0: 'csharp',
    1: 'python',
    2: 'javascript',
    3: 'typescript',
    4: 'java',
    5: 'cpp',
    6: 'go',
    7: 'rust',
    8: 'ruby',
    9: 'php',
  };
  return languages[language] || 'plaintext';
}

export function getFileIcon(filename: string, isFolder: boolean): string {
  if (isFolder) return '📁';

  const ext = filename.split('.').pop()?.toLowerCase();
  const icons: Record<string, string> = {
    ts: '🟦',
    tsx: '⚛️',
    js: '🟨',
    jsx: '⚛️',
    py: '🐍',
    cs: '🟣',
    java: '☕',
    cpp: '🔷',
    go: '🐹',
    rs: '🦀',
    rb: '💎',
    php: '🐘',
    html: '🌐',
    css: '🎨',
    json: '📋',
    md: '📝',
  };
  return icons[ext || ''] || '📄';
}

// Get ProgrammingLanguage enum value from filename extension (for execution)
// Values must match backend: CloudCode.Domain.Enums.ProgrammingLanguage
export function getProgrammingLanguageFromFilename(filename: string): number | null {
  const ext = filename.split('.').pop()?.toLowerCase();
  const languages: Record<string, number> = {
    // Backend enum values:
    js: 1,      // JavaScript = 1
    jsx: 1,     // JavaScript = 1
    py: 2,      // Python = 2
    cs: 3,      // CSharp = 3
    java: 4,    // Java = 4
    go: 5,      // Go = 5
    ts: 6,      // TypeScript = 6
    tsx: 6,     // TypeScript = 6
    rs: 15,     // Rust = 15
  };
  return languages[ext || ''] ?? null;
}

export function getMonacoLanguageFromFilename(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  const languages: Record<string, string> = {
    ts: 'typescript',
    tsx: 'typescript',
    js: 'javascript',
    jsx: 'javascript',
    py: 'python',
    cs: 'csharp',
    java: 'java',
    cpp: 'cpp',
    c: 'c',
    h: 'cpp',
    hpp: 'cpp',
    go: 'go',
    rs: 'rust',
    rb: 'ruby',
    php: 'php',
    html: 'html',
    htm: 'html',
    css: 'css',
    scss: 'scss',
    sass: 'scss',
    less: 'less',
    json: 'json',
    md: 'markdown',
    markdown: 'markdown',
    xml: 'xml',
    yaml: 'yaml',
    yml: 'yaml',
    sql: 'sql',
    sh: 'shell',
    bash: 'shell',
    ps1: 'powershell',
    dockerfile: 'dockerfile',
    txt: 'plaintext',
  };
  return languages[ext || ''] || 'plaintext';
}
