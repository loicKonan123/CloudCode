'use client';

import { useEffect, useState } from 'react';
import { useThemeStore, themes } from '@/stores/themeStore';

interface ThemeProviderProps {
  children: React.ReactNode;
}

export default function ThemeProvider({ children }: ThemeProviderProps) {
  const [mounted, setMounted] = useState(false);
  const { mode } = useThemeStore();

  useEffect(() => {
    const theme = themes[mode];
    const root = document.documentElement;

    // Apply all color variables
    Object.entries(theme.colors).forEach(([key, value]) => {
      const cssVar = key.replace(/([A-Z])/g, '-$1').toLowerCase();
      root.style.setProperty(`--${cssVar}`, value);
    });

    root.setAttribute('data-theme', theme.id);
    root.style.colorScheme = theme.id;

    setMounted(true);
  }, [mode]);

  // Prevent flash of unstyled content
  if (!mounted) {
    return (
      <div style={{ visibility: 'hidden' }}>
        {children}
      </div>
    );
  }

  return <>{children}</>;
}
