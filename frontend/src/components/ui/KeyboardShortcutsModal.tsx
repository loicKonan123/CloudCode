'use client';

import { useEffect } from 'react';
import { X, Keyboard } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ShortcutGroup {
  title: string;
  shortcuts: { keys: string[]; description: string }[];
}

const shortcutGroups: ShortcutGroup[] = [
  {
    title: 'Fichiers',
    shortcuts: [
      { keys: ['Ctrl', 'S'], description: 'Sauvegarder le fichier' },
      { keys: ['Ctrl', 'N'], description: 'Nouveau fichier' },
      { keys: ['Ctrl', 'Shift', 'N'], description: 'Nouveau dossier' },
      { keys: ['Ctrl', 'W'], description: 'Fermer l\'onglet actif' },
    ],
  },
  {
    title: 'Exécution',
    shortcuts: [
      { keys: ['Ctrl', 'Enter'], description: 'Exécuter le code' },
    ],
  },
  {
    title: 'Éditeur',
    shortcuts: [
      { keys: ['Ctrl', 'Z'], description: 'Annuler' },
      { keys: ['Ctrl', 'Y'], description: 'Rétablir' },
      { keys: ['Ctrl', 'F'], description: 'Rechercher' },
      { keys: ['Ctrl', 'H'], description: 'Rechercher et remplacer' },
      { keys: ['Ctrl', 'D'], description: 'Dupliquer la sélection' },
      { keys: ['Ctrl', '/'], description: 'Commenter/décommenter' },
      { keys: ['Alt', '↑/↓'], description: 'Déplacer la ligne' },
    ],
  },
  {
    title: 'Navigation',
    shortcuts: [
      { keys: ['Ctrl', 'G'], description: 'Aller à la ligne' },
      { keys: ['Ctrl', 'P'], description: 'Palette de commandes' },
    ],
  },
  {
    title: 'Général',
    shortcuts: [
      { keys: ['Ctrl', '`'], description: 'Ouvrir/fermer le terminal' },
      { keys: ['Ctrl', 'Shift', '?'], description: 'Afficher les raccourcis' },
      { keys: ['Esc'], description: 'Fermer le panneau de sortie' },
    ],
  },
];

export default function KeyboardShortcutsModal({ isOpen, onClose }: KeyboardShortcutsModalProps) {
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

      {/* Modal */}
      <div className="relative bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[85vh] overflow-hidden border border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-gray-850">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600/20 rounded-lg">
              <Keyboard className="w-5 h-5 text-blue-400" />
            </div>
            <h2 className="text-lg font-semibold text-white">Raccourcis clavier</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[calc(85vh-80px)]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {shortcutGroups.map((group) => (
              <div key={group.title}>
                <h3 className="text-sm font-semibold text-blue-400 uppercase tracking-wide mb-3">
                  {group.title}
                </h3>
                <div className="space-y-2">
                  {group.shortcuts.map((shortcut, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between py-1.5"
                    >
                      <span className="text-sm text-gray-300">{shortcut.description}</span>
                      <div className="flex items-center gap-1">
                        {shortcut.keys.map((key, keyIndex) => (
                          <span key={keyIndex} className="flex items-center">
                            <kbd className="px-2 py-1 text-xs font-mono bg-gray-700 border border-gray-600 rounded text-gray-200 shadow-sm">
                              {key}
                            </kbd>
                            {keyIndex < shortcut.keys.length - 1 && (
                              <span className="mx-1 text-gray-500">+</span>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-gray-700 bg-gray-850">
          <p className="text-xs text-gray-500 text-center">
            Appuyez sur <kbd className="px-1.5 py-0.5 text-xs bg-gray-700 rounded">Esc</kbd> pour fermer
          </p>
        </div>
      </div>
    </div>
  );
}
