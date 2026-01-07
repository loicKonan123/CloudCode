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
