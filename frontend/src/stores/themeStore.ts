import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeMode = 'dark' | 'light';

export interface Theme {
  id: ThemeMode;
  name: string;
  monacoTheme: 'vs-dark' | 'vs';
  colors: {
    // Backgrounds
    bgPrimary: string;
    bgSecondary: string;
    bgTertiary: string;
    bgHover: string;
    bgInput: string;

    // Text
    textPrimary: string;
    textSecondary: string;
    textMuted: string;

    // Borders
    border: string;
    borderLight: string;

    // Primary accent
    primary: string;
    primaryHover: string;
    primaryLight: string;

    // Status colors
    success: string;
    error: string;
    warning: string;

    // Scrollbar
    scrollbarThumb: string;
    scrollbarTrack: string;
  };
}

const darkTheme: Theme = {
  id: 'dark',
  name: 'Sombre',
  monacoTheme: 'vs-dark',
  colors: {
    bgPrimary: '#0d1117',
    bgSecondary: '#161b22',
    bgTertiary: '#21262d',
    bgHover: '#30363d',
    bgInput: '#0d1117',

    textPrimary: '#f0f6fc',
    textSecondary: '#8b949e',
    textMuted: '#6e7681',

    border: '#30363d',
    borderLight: '#484f58',

    primary: '#2f81f7',
    primaryHover: '#1f6feb',
    primaryLight: 'rgba(47, 129, 247, 0.15)',

    success: '#3fb950',
    error: '#f85149',
    warning: '#d29922',

    scrollbarThumb: '#484f58',
    scrollbarTrack: '#161b22',
  },
};

const lightTheme: Theme = {
  id: 'light',
  name: 'Clair',
  monacoTheme: 'vs',
  colors: {
    bgPrimary: '#ffffff',
    bgSecondary: '#f6f8fa',
    bgTertiary: '#eaeef2',
    bgHover: '#d0d7de',
    bgInput: '#f6f8fa',

    textPrimary: '#1f2328',
    textSecondary: '#656d76',
    textMuted: '#8c959f',

    border: '#d0d7de',
    borderLight: '#e6e9ec',

    primary: '#0969da',
    primaryHover: '#0550ae',
    primaryLight: 'rgba(9, 105, 218, 0.1)',

    success: '#1a7f37',
    error: '#cf222e',
    warning: '#9a6700',

    scrollbarThumb: '#8c959f',
    scrollbarTrack: '#f6f8fa',
  },
};

export const themes: Record<ThemeMode, Theme> = {
  dark: darkTheme,
  light: lightTheme,
};

interface ThemeState {
  mode: ThemeMode;
  theme: Theme;
  setTheme: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  isDark: () => boolean;
}

function applyTheme(theme: Theme) {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;

  // Apply all color variables
  Object.entries(theme.colors).forEach(([key, value]) => {
    const cssVar = key.replace(/([A-Z])/g, '-$1').toLowerCase();
    root.style.setProperty(`--${cssVar}`, value);
  });

  // Set theme attribute for potential CSS selectors
  root.setAttribute('data-theme', theme.id);

  // Set color-scheme for native elements
  root.style.colorScheme = theme.id;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      mode: 'dark',
      theme: darkTheme,

      setTheme: (mode: ThemeMode) => {
        const theme = themes[mode];
        set({ mode, theme });
        applyTheme(theme);
      },

      toggleTheme: () => {
        const newMode = get().mode === 'dark' ? 'light' : 'dark';
        const theme = themes[newMode];
        set({ mode: newMode, theme });
        applyTheme(theme);
      },

      isDark: () => get().mode === 'dark',
    }),
    {
      name: 'cloudcode-theme',
      partialize: (state) => ({ mode: state.mode }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          const theme = themes[state.mode] || darkTheme;
          state.theme = theme;
          applyTheme(theme);
        }
      },
    }
  )
);
