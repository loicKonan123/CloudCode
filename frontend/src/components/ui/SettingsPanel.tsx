'use client';

import { useEffect } from 'react';
import { X, Settings, RotateCcw } from 'lucide-react';
import { useEditorStore } from '@/stores/editorStore';
import { useThemeStore } from '@/stores/themeStore';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ToggleProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: () => void;
}

function Toggle({ label, description, checked, onChange }: ToggleProps) {
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <div className="text-sm font-medium text-[var(--text-primary)]">{label}</div>
        {description && (
          <div className="text-xs text-[var(--text-muted)]">{description}</div>
        )}
      </div>
      <button
        onClick={onChange}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          checked ? 'bg-blue-600' : 'bg-gray-600'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}

interface SelectProps {
  label: string;
  description?: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}

function Select({ label, description, value, options, onChange }: SelectProps) {
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <div className="text-sm font-medium text-[var(--text-primary)]">{label}</div>
        {description && (
          <div className="text-xs text-[var(--text-muted)]">{description}</div>
        )}
      </div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="px-3 py-1.5 text-sm bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

interface NumberInputProps {
  label: string;
  description?: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}

function NumberInput({ label, description, value, min, max, onChange }: NumberInputProps) {
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <div className="text-sm font-medium text-[var(--text-primary)]">{label}</div>
        {description && (
          <div className="text-xs text-[var(--text-muted)]">{description}</div>
        )}
      </div>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        onChange={(e) => onChange(parseInt(e.target.value) || min)}
        className="w-20 px-3 py-1.5 text-sm bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
}

export default function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  const { mode, setTheme } = useThemeStore();
  const {
    fontSize,
    showMinimap,
    wordWrap,
    showLineNumbers,
    tabSize,
    renderWhitespace,
    cursorBlinking,
    cursorStyle,
    bracketPairColorization,
    autoClosingBrackets,
    setFontSize,
    toggleMinimap,
    setWordWrap,
    toggleLineNumbers,
    setTabSize,
    setRenderWhitespace,
    setCursorBlinking,
    setCursorStyle,
    toggleBracketPairColorization,
    setAutoClosingBrackets,
    resetAllSettings,
  } = useEditorStore();

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative bg-[var(--bg-primary)] rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[85vh] overflow-hidden border border-[var(--border)]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--border)] bg-[var(--bg-tertiary)]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600/20 rounded-lg">
              <Settings className="w-5 h-5 text-blue-400" />
            </div>
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Parametres</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={resetAllSettings}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded-lg transition"
              title="Reinitialiser les parametres"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reinitialiser</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[calc(85vh-80px)]">
          {/* Appearance Section */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-blue-400 uppercase tracking-wide mb-3">
              Apparence
            </h3>
            <div className="space-y-1 bg-[var(--bg-secondary)] rounded-lg p-3">
              <Select
                label="Theme"
                value={mode}
                options={[
                  { value: 'dark', label: 'Sombre' },
                  { value: 'light', label: 'Clair' },
                ]}
                onChange={(v) => setTheme(v as 'dark' | 'light')}
              />
              <NumberInput
                label="Taille de police"
                description="Entre 10 et 24 pixels"
                value={fontSize}
                min={10}
                max={24}
                onChange={setFontSize}
              />
            </div>
          </div>

          {/* Editor Section */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-blue-400 uppercase tracking-wide mb-3">
              Editeur
            </h3>
            <div className="space-y-1 bg-[var(--bg-secondary)] rounded-lg p-3">
              <Toggle
                label="Minimap"
                description="Afficher l'apercu du code a droite"
                checked={showMinimap}
                onChange={toggleMinimap}
              />
              <Toggle
                label="Numeros de ligne"
                description="Afficher les numeros de ligne"
                checked={showLineNumbers}
                onChange={toggleLineNumbers}
              />
              <Toggle
                label="Colorisation des parentheses"
                description="Colorer les paires de parentheses"
                checked={bracketPairColorization}
                onChange={toggleBracketPairColorization}
              />
              <Select
                label="Retour a la ligne"
                value={wordWrap}
                options={[
                  { value: 'off', label: 'Desactive' },
                  { value: 'on', label: 'Active' },
                  { value: 'wordWrapColumn', label: 'A la colonne' },
                  { value: 'bounded', label: 'Limite' },
                ]}
                onChange={(v) => setWordWrap(v as 'off' | 'on' | 'wordWrapColumn' | 'bounded')}
              />
              <NumberInput
                label="Taille des tabulations"
                description="Nombre d'espaces par tabulation"
                value={tabSize}
                min={1}
                max={8}
                onChange={setTabSize}
              />
              <Select
                label="Afficher les espaces"
                value={renderWhitespace}
                options={[
                  { value: 'none', label: 'Jamais' },
                  { value: 'boundary', label: 'Limites' },
                  { value: 'selection', label: 'Selection' },
                  { value: 'trailing', label: 'En fin de ligne' },
                  { value: 'all', label: 'Toujours' },
                ]}
                onChange={(v) => setRenderWhitespace(v as 'none' | 'boundary' | 'selection' | 'trailing' | 'all')}
              />
            </div>
          </div>

          {/* Cursor Section */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-blue-400 uppercase tracking-wide mb-3">
              Curseur
            </h3>
            <div className="space-y-1 bg-[var(--bg-secondary)] rounded-lg p-3">
              <Select
                label="Style du curseur"
                value={cursorStyle}
                options={[
                  { value: 'line', label: 'Ligne' },
                  { value: 'block', label: 'Bloc' },
                  { value: 'underline', label: 'Souligne' },
                  { value: 'line-thin', label: 'Ligne fine' },
                  { value: 'block-outline', label: 'Bloc vide' },
                  { value: 'underline-thin', label: 'Souligne fin' },
                ]}
                onChange={(v) => setCursorStyle(v as 'line' | 'block' | 'underline' | 'line-thin' | 'block-outline' | 'underline-thin')}
              />
              <Select
                label="Animation du curseur"
                value={cursorBlinking}
                options={[
                  { value: 'blink', label: 'Clignotement' },
                  { value: 'smooth', label: 'Fluide' },
                  { value: 'phase', label: 'Phase' },
                  { value: 'expand', label: 'Expansion' },
                  { value: 'solid', label: 'Fixe' },
                ]}
                onChange={(v) => setCursorBlinking(v as 'blink' | 'smooth' | 'phase' | 'expand' | 'solid')}
              />
            </div>
          </div>

          {/* Typing Section */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-blue-400 uppercase tracking-wide mb-3">
              Saisie
            </h3>
            <div className="space-y-1 bg-[var(--bg-secondary)] rounded-lg p-3">
              <Select
                label="Fermeture automatique des parentheses"
                value={autoClosingBrackets}
                options={[
                  { value: 'always', label: 'Toujours' },
                  { value: 'languageDefined', label: 'Selon le langage' },
                  { value: 'beforeWhitespace', label: 'Avant espace' },
                  { value: 'never', label: 'Jamais' },
                ]}
                onChange={(v) => setAutoClosingBrackets(v as 'always' | 'languageDefined' | 'beforeWhitespace' | 'never')}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-[var(--border)] bg-[var(--bg-tertiary)]">
          <p className="text-xs text-[var(--text-muted)] text-center">
            Les parametres sont sauvegardes automatiquement
          </p>
        </div>
      </div>
    </div>
  );
}
