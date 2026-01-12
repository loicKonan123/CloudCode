import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface EditorState {
  // Font settings
  fontSize: number;
  minFontSize: number;
  maxFontSize: number;

  // Editor view settings
  showMinimap: boolean;
  wordWrap: 'off' | 'on' | 'wordWrapColumn' | 'bounded';
  showLineNumbers: boolean;
  tabSize: number;
  renderWhitespace: 'none' | 'boundary' | 'selection' | 'trailing' | 'all';
  cursorBlinking: 'blink' | 'smooth' | 'phase' | 'expand' | 'solid';
  cursorStyle: 'line' | 'block' | 'underline' | 'line-thin' | 'block-outline' | 'underline-thin';
  bracketPairColorization: boolean;
  autoClosingBrackets: 'always' | 'languageDefined' | 'beforeWhitespace' | 'never';

  // Actions
  setFontSize: (size: number) => void;
  increaseFontSize: () => void;
  decreaseFontSize: () => void;
  resetFontSize: () => void;
  toggleMinimap: () => void;
  setWordWrap: (value: 'off' | 'on' | 'wordWrapColumn' | 'bounded') => void;
  toggleLineNumbers: () => void;
  setTabSize: (size: number) => void;
  setRenderWhitespace: (value: 'none' | 'boundary' | 'selection' | 'trailing' | 'all') => void;
  setCursorBlinking: (value: 'blink' | 'smooth' | 'phase' | 'expand' | 'solid') => void;
  setCursorStyle: (value: 'line' | 'block' | 'underline' | 'line-thin' | 'block-outline' | 'underline-thin') => void;
  toggleBracketPairColorization: () => void;
  setAutoClosingBrackets: (value: 'always' | 'languageDefined' | 'beforeWhitespace' | 'never') => void;
  resetAllSettings: () => void;
}

const DEFAULT_FONT_SIZE = 14;
const MIN_FONT_SIZE = 10;
const MAX_FONT_SIZE = 24;
const FONT_SIZE_STEP = 2;

const defaultSettings = {
  fontSize: DEFAULT_FONT_SIZE,
  showMinimap: true,
  wordWrap: 'off' as const,
  showLineNumbers: true,
  tabSize: 2,
  renderWhitespace: 'none' as const,
  cursorBlinking: 'blink' as const,
  cursorStyle: 'line' as const,
  bracketPairColorization: true,
  autoClosingBrackets: 'languageDefined' as const,
};

export const useEditorStore = create<EditorState>()(
  persist(
    (set, get) => ({
      ...defaultSettings,
      minFontSize: MIN_FONT_SIZE,
      maxFontSize: MAX_FONT_SIZE,

      setFontSize: (size: number) => {
        const clampedSize = Math.min(Math.max(size, MIN_FONT_SIZE), MAX_FONT_SIZE);
        set({ fontSize: clampedSize });
      },

      increaseFontSize: () => {
        const { fontSize } = get();
        const newSize = Math.min(fontSize + FONT_SIZE_STEP, MAX_FONT_SIZE);
        set({ fontSize: newSize });
      },

      decreaseFontSize: () => {
        const { fontSize } = get();
        const newSize = Math.max(fontSize - FONT_SIZE_STEP, MIN_FONT_SIZE);
        set({ fontSize: newSize });
      },

      resetFontSize: () => {
        set({ fontSize: DEFAULT_FONT_SIZE });
      },

      toggleMinimap: () => {
        set({ showMinimap: !get().showMinimap });
      },

      setWordWrap: (value) => {
        set({ wordWrap: value });
      },

      toggleLineNumbers: () => {
        set({ showLineNumbers: !get().showLineNumbers });
      },

      setTabSize: (size) => {
        set({ tabSize: Math.min(Math.max(size, 1), 8) });
      },

      setRenderWhitespace: (value) => {
        set({ renderWhitespace: value });
      },

      setCursorBlinking: (value) => {
        set({ cursorBlinking: value });
      },

      setCursorStyle: (value) => {
        set({ cursorStyle: value });
      },

      toggleBracketPairColorization: () => {
        set({ bracketPairColorization: !get().bracketPairColorization });
      },

      setAutoClosingBrackets: (value) => {
        set({ autoClosingBrackets: value });
      },

      resetAllSettings: () => {
        set(defaultSettings);
      },
    }),
    {
      name: 'cloudcode-editor',
      partialize: (state) => ({
        fontSize: state.fontSize,
        showMinimap: state.showMinimap,
        wordWrap: state.wordWrap,
        showLineNumbers: state.showLineNumbers,
        tabSize: state.tabSize,
        renderWhitespace: state.renderWhitespace,
        cursorBlinking: state.cursorBlinking,
        cursorStyle: state.cursorStyle,
        bracketPairColorization: state.bracketPairColorization,
        autoClosingBrackets: state.autoClosingBrackets,
      }),
    }
  )
);
