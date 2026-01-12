'use client';

import { Minus, Plus, Type } from 'lucide-react';
import { useEditorStore } from '@/stores/editorStore';

export default function FontSizeControl() {
  const { fontSize, increaseFontSize, decreaseFontSize, minFontSize, maxFontSize } = useEditorStore();

  const canDecrease = fontSize > minFontSize;
  const canIncrease = fontSize < maxFontSize;

  return (
    <div className="flex items-center gap-1 px-1 py-0.5 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border)]">
      <button
        onClick={decreaseFontSize}
        disabled={!canDecrease}
        className="p-1.5 rounded hover:bg-[var(--bg-hover)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        title="Réduire la taille (A-)"
        aria-label="Réduire la taille de police"
      >
        <Minus className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
      </button>

      <div className="flex items-center gap-1 px-1.5 min-w-[3rem] justify-center">
        <Type className="w-3.5 h-3.5 text-[var(--text-muted)]" />
        <span className="text-xs font-medium text-[var(--text-secondary)] tabular-nums">
          {fontSize}
        </span>
      </div>

      <button
        onClick={increaseFontSize}
        disabled={!canIncrease}
        className="p-1.5 rounded hover:bg-[var(--bg-hover)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        title="Augmenter la taille (A+)"
        aria-label="Augmenter la taille de police"
      >
        <Plus className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
      </button>
    </div>
  );
}
