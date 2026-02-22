'use client';

import { useState, useCallback, useEffect } from 'react';
import { Plus, X, Terminal as TerminalIcon, Maximize2, Minimize2 } from 'lucide-react';
import Terminal from './Terminal';

interface TerminalTab {
  id: string;
  name: string;
}

interface MultiTerminalProps {
  projectId: string;
  isVisible: boolean;
  isMaximized?: boolean;
  onClose: () => void;
  onToggleMaximize?: () => void;
}

export default function MultiTerminal({
  projectId,
  isVisible,
  isMaximized = false,
  onClose,
  onToggleMaximize,
}: MultiTerminalProps) {
  const [tabs, setTabs] = useState<TerminalTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);

  // Créer un premier terminal au montage
  useEffect(() => {
    if (isVisible && tabs.length === 0) {
      addTerminal();
    }
  }, [isVisible]);

  const generateTerminalId = () => {
    return Math.random().toString(36).substring(2, 10);
  };

  const addTerminal = useCallback(() => {
    const newId = generateTerminalId();
    const newTab: TerminalTab = {
      id: newId,
      name: `Terminal ${tabs.length + 1}`,
    };
    setTabs(prev => [...prev, newTab]);
    setActiveTabId(newId);
  }, [tabs.length]);

  const closeTerminal = useCallback((id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();

    setTabs(prev => {
      const newTabs = prev.filter(t => t.id !== id);

      // Si on ferme l'onglet actif, basculer vers un autre
      if (activeTabId === id && newTabs.length > 0) {
        setActiveTabId(newTabs[newTabs.length - 1].id);
      } else if (newTabs.length === 0) {
        setActiveTabId(null);
      }

      return newTabs;
    });
  }, [activeTabId]);

  const renameTerminal = useCallback((id: string, newName: string) => {
    setTabs(prev => prev.map(tab =>
      tab.id === id ? { ...tab, name: newName } : tab
    ));
  }, []);

  const handleTabDoubleClick = useCallback((id: string) => {
    const tab = tabs.find(t => t.id === id);
    if (!tab) return;

    const newName = prompt('Renommer le terminal:', tab.name);
    if (newName && newName.trim()) {
      renameTerminal(id, newName.trim());
    }
  }, [tabs, renameTerminal]);

  if (!isVisible) return null;

  return (
    <div className="flex flex-col h-full bg-gray-900">
      {/* Header avec onglets */}
      <div className="h-9 flex items-center bg-gray-800 border-b border-gray-700">
        {/* Onglets */}
        <div className="flex-1 flex items-center overflow-x-auto scrollbar-hide">
          {tabs.map(tab => (
            <div
              key={tab.id}
              onClick={() => setActiveTabId(tab.id)}
              onDoubleClick={() => handleTabDoubleClick(tab.id)}
              className={`flex items-center gap-2 px-3 h-9 cursor-pointer group border-r border-gray-700
                ${activeTabId === tab.id
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-750 hover:text-gray-200'
                }`}
            >
              <TerminalIcon className="w-3.5 h-3.5 text-green-400" />
              <span className="text-xs truncate max-w-24">{tab.name}</span>
              {tabs.length > 1 && (
                <button
                  onClick={(e) => closeTerminal(tab.id, e)}
                  className="p-0.5 text-gray-500 hover:text-white hover:bg-gray-600 rounded
                           opacity-0 group-hover:opacity-100 transition flex-shrink-0"
                  title="Fermer ce terminal"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}

          {/* Bouton ajouter terminal */}
          <button
            onClick={addTerminal}
            className="flex items-center justify-center w-8 h-9 text-gray-400 hover:text-white
                     hover:bg-gray-700 transition"
            title="Nouveau terminal"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 px-2">
          {onToggleMaximize && (
            <button
              onClick={onToggleMaximize}
              className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition"
              title={isMaximized ? 'Réduire' : 'Agrandir'}
            >
              {isMaximized ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition"
            title="Fermer le terminal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Contenu des terminaux */}
      <div className="flex-1 relative">
        {tabs.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <TerminalIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">Aucun terminal ouvert</p>
              <button
                onClick={addTerminal}
                className="mt-3 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white
                         rounded-lg transition text-sm flex items-center gap-2 mx-auto"
              >
                <Plus className="w-4 h-4" />
                Nouveau terminal
              </button>
            </div>
          </div>
        ) : (
          tabs.map(tab => (
            <div
              key={tab.id}
              className={`absolute inset-0 ${activeTabId === tab.id ? 'block' : 'hidden'}`}
            >
              <Terminal
                projectId={projectId}
                terminalId={tab.id}
                isVisible={isVisible && activeTabId === tab.id}
                onClose={() => closeTerminal(tab.id)}
                showHeader={false}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
