'use client';

import { ChevronRight, FileCode, Folder } from 'lucide-react';

interface BreadcrumbsProps {
  filePath: string;
  projectName?: string;
  onNavigate?: (path: string) => void;
}

export default function Breadcrumbs({ filePath, projectName, onNavigate }: BreadcrumbsProps) {
  if (!filePath) return null;

  // Split path into segments
  const segments = filePath.split('/').filter(Boolean);
  const fileName = segments.pop() || '';
  const folders = segments;

  // Build paths for navigation
  const buildPath = (index: number) => {
    return '/' + folders.slice(0, index + 1).join('/');
  };

  return (
    <div className="flex items-center gap-1 px-3 py-1.5 bg-[var(--bg-secondary)] border-b border-[var(--border)] text-xs overflow-x-auto scrollbar-hide">
      {/* Project name */}
      {projectName && (
        <>
          <button
            onClick={() => onNavigate?.('/')}
            className="flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-[var(--bg-hover)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors whitespace-nowrap"
          >
            <Folder className="w-3.5 h-3.5" />
            <span>{projectName}</span>
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-[var(--text-muted)] flex-shrink-0" />
        </>
      )}

      {/* Folder segments */}
      {folders.map((folder, index) => (
        <div key={index} className="flex items-center gap-1">
          <button
            onClick={() => onNavigate?.(buildPath(index))}
            className="flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-[var(--bg-hover)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors whitespace-nowrap"
          >
            <Folder className="w-3.5 h-3.5" />
            <span>{folder}</span>
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-[var(--text-muted)] flex-shrink-0" />
        </div>
      ))}

      {/* File name */}
      <div className="flex items-center gap-1 px-1.5 py-0.5 text-[var(--text-primary)] whitespace-nowrap">
        <FileCode className="w-3.5 h-3.5 text-[var(--primary)]" />
        <span className="font-medium">{fileName}</span>
      </div>
    </div>
  );
}
