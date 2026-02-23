'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Search, X, ChevronRight, ChevronDown, FileText, Loader2 } from 'lucide-react';
import { searchApi } from '@/lib/api';
import { SearchResult, CodeFile } from '@/types';

interface SearchPanelProps {
  projectId: string;
  files: CodeFile[];
  onClose: () => void;
  onResultClick: (fileId: string, lineNumber: number) => void;
}

type GroupedResults = Record<string, SearchResult[]>;

export default function SearchPanel({ projectId, files, onClose, onResultClick }: SearchPanelProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set());
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const performSearch = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([]);
      return;
    }
    try {
      setIsSearching(true);
      setError(null);
      const res = await searchApi.search(projectId, q);
      setResults(res.data);
      // Auto-expand all files with results
      const fileIds = new Set(res.data.map(r => r.filePath));
      setExpandedFiles(fileIds);
    } catch {
      setError('Erreur lors de la recherche');
    } finally {
      setIsSearching(false);
    }
  }, [projectId]);

  const handleQueryChange = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => performSearch(value), 300);
  };

  const toggleFile = (filePath: string) => {
    setExpandedFiles(prev => {
      const next = new Set(prev);
      next.has(filePath) ? next.delete(filePath) : next.add(filePath);
      return next;
    });
  };

  // Group results by file
  const grouped: GroupedResults = results.reduce((acc, r) => {
    if (!acc[r.filePath]) acc[r.filePath] = [];
    acc[r.filePath].push(r);
    return acc;
  }, {} as GroupedResults);

  const totalMatches = results.length;
  const fileCount = Object.keys(grouped).length;

  const highlightMatch = (text: string, q: string) => {
    if (!q) return text;
    const idx = text.toLowerCase().indexOf(q.toLowerCase());
    if (idx < 0) return text;
    return (
      <>
        {text.slice(0, idx)}
        <mark className="bg-yellow-400/40 text-yellow-200 rounded-sm">{text.slice(idx, idx + q.length)}</mark>
        {text.slice(idx + q.length)}
      </>
    );
  };

  return (
    <div className="w-80 bg-gray-900 border-r border-gray-700 flex flex-col flex-shrink-0 h-full">
      {/* Header */}
      <div className="h-10 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-3 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-blue-400" />
          <span className="text-sm font-medium text-gray-200">Recherche</span>
        </div>
        <button onClick={onClose} className="p-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Search input */}
      <div className="p-3 border-b border-gray-700 flex-shrink-0">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => handleQueryChange(e.target.value)}
            placeholder="Rechercher dans les fichiers..."
            className="w-full bg-gray-800 text-gray-200 text-sm rounded pl-8 pr-8 py-1.5 border border-gray-600 focus:outline-none focus:border-blue-500 placeholder-gray-500"
          />
          {query && (
            <button
              onClick={() => { setQuery(''); setResults([]); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Stats */}
        {query.length >= 2 && !isSearching && (
          <p className="text-xs text-gray-500 mt-1.5">
            {totalMatches > 0
              ? `${totalMatches} résultat${totalMatches > 1 ? 's' : ''} dans ${fileCount} fichier${fileCount > 1 ? 's' : ''}`
              : 'Aucun résultat'}
          </p>
        )}
        {query.length === 1 && (
          <p className="text-xs text-gray-500 mt-1.5">Saisissez au moins 2 caractères</p>
        )}
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto">
        {isSearching && (
          <div className="flex items-center justify-center py-8 gap-2 text-gray-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Recherche...</span>
          </div>
        )}

        {error && (
          <div className="px-3 py-2 text-sm text-red-400">{error}</div>
        )}

        {!isSearching && Object.entries(grouped).map(([filePath, fileResults]) => (
          <div key={filePath} className="border-b border-gray-800">
            {/* File header */}
            <button
              onClick={() => toggleFile(filePath)}
              className="w-full flex items-center gap-1.5 px-2 py-1.5 hover:bg-gray-800 transition text-left"
            >
              {expandedFiles.has(filePath)
                ? <ChevronDown className="w-3 h-3 text-gray-500 flex-shrink-0" />
                : <ChevronRight className="w-3 h-3 text-gray-500 flex-shrink-0" />
              }
              <FileText className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
              <span className="text-xs text-gray-300 truncate flex-1" title={filePath}>
                {filePath.split('/').pop()}
              </span>
              <span className="text-xs text-gray-500 ml-1 flex-shrink-0">
                {fileResults.length}
              </span>
            </button>

            {/* File results */}
            {expandedFiles.has(filePath) && fileResults.map((r, i) => (
              <button
                key={i}
                onClick={() => onResultClick(r.fileId, r.lineNumber)}
                className="w-full flex items-start gap-2 px-3 py-1 hover:bg-gray-800/70 transition text-left group"
              >
                <span className="text-xs text-gray-600 w-8 flex-shrink-0 pt-0.5 text-right group-hover:text-gray-400">
                  {r.lineNumber}
                </span>
                <span className="text-xs text-gray-400 truncate font-mono group-hover:text-gray-200">
                  {highlightMatch(r.lineContent, query)}
                </span>
              </button>
            ))}
          </div>
        ))}

        {!isSearching && query.length >= 2 && results.length === 0 && !error && (
          <div className="px-3 py-8 text-center text-sm text-gray-500">
            Aucun résultat pour &quot;{query}&quot;
          </div>
        )}
      </div>
    </div>
  );
}
