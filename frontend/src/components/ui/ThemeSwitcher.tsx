'use client';

import { Moon, Sun } from 'lucide-react';
import { useThemeStore } from '@/stores/themeStore';

interface ThemeSwitcherProps {
  className?: string;
}

export default function ThemeSwitcher({ className = '' }: ThemeSwitcherProps) {
  const { mode, toggleTheme } = useThemeStore();
  const isDark = mode === 'dark';

  return (
    <button
      onClick={toggleTheme}
      className={`
        relative flex items-center justify-center
        w-9 h-9 rounded-lg
        bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)]
        border border-[var(--border)]
        transition-colors duration-200
        ${className}
      `}
      title={isDark ? 'Passer en mode clair' : 'Passer en mode sombre'}
      aria-label={isDark ? 'Activer le mode clair' : 'Activer le mode sombre'}
    >
      {isDark ? (
        <Sun className="w-4 h-4 text-[var(--text-secondary)]" />
      ) : (
        <Moon className="w-4 h-4 text-[var(--text-secondary)]" />
      )}
    </button>
  );
}
