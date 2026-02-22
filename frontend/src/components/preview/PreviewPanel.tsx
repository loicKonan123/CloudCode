'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { RefreshCw, ExternalLink, X, Maximize2, Minimize2, Globe, AlertCircle } from 'lucide-react';

interface PreviewPanelProps {
  projectId: string;
  isVisible: boolean;
  onClose: () => void;
}

export default function PreviewPanel({ projectId, isVisible, onClose }: PreviewPanelProps) {
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [customPath, setCustomPath] = useState('/');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (isVisible && projectId) {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5072';
      setPreviewUrl(`${baseUrl}/app/${projectId}${customPath}`);
      setIsLoading(true);
      setHasError(false);
    }
  }, [projectId, isVisible, customPath]);

  const handleRefresh = useCallback(() => {
    if (iframeRef.current) {
      setIsLoading(true);
      setHasError(false);
      // Force reload by changing src
      const currentSrc = iframeRef.current.src;
      iframeRef.current.src = '';
      setTimeout(() => {
        if (iframeRef.current) {
          iframeRef.current.src = currentSrc;
        }
      }, 100);
    }
  }, []);

  const handleOpenExternal = useCallback(() => {
    if (previewUrl) {
      window.open(previewUrl, '_blank');
    }
  }, [previewUrl]);

  const handleIframeLoad = useCallback(() => {
    setIsLoading(false);
  }, []);

  const handleIframeError = useCallback(() => {
    setIsLoading(false);
    setHasError(true);
  }, []);

  const handlePathChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newPath = e.target.value.startsWith('/') ? e.target.value : `/${e.target.value}`;
    setCustomPath(newPath);
  }, []);

  const handlePathKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleRefresh();
    }
  }, [handleRefresh]);

  if (!isVisible) return null;

  const panelClasses = isMaximized
    ? 'fixed inset-0 z-50 bg-gray-900 flex flex-col'
    : 'w-96 bg-gray-850 border-l border-gray-700 flex flex-col flex-shrink-0';

  return (
    <div className={panelClasses}>
      {/* Header */}
      <div className="h-10 px-3 flex items-center justify-between border-b border-gray-700 bg-gray-900">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-blue-400" />
          <span className="text-sm font-medium text-gray-200">Preview</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleRefresh}
            className="p-1.5 rounded hover:bg-gray-700 transition-colors text-gray-400 hover:text-gray-200"
            title="Refresh (F5)"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleOpenExternal}
            className="p-1.5 rounded hover:bg-gray-700 transition-colors text-gray-400 hover:text-gray-200"
            title="Open in new tab"
          >
            <ExternalLink className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsMaximized(!isMaximized)}
            className="p-1.5 rounded hover:bg-gray-700 transition-colors text-gray-400 hover:text-gray-200"
            title={isMaximized ? 'Minimize' : 'Maximize'}
          >
            {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-gray-700 transition-colors text-gray-400 hover:text-gray-200"
            title="Close preview"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* URL Bar */}
      <div className="px-2 py-1.5 border-b border-gray-700 bg-gray-850">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 flex-shrink-0">Path:</span>
          <input
            type="text"
            value={customPath}
            onChange={handlePathChange}
            onKeyDown={handlePathKeyDown}
            className="flex-1 bg-gray-800 px-2 py-1 text-xs rounded border border-gray-700
                       focus:border-blue-500 focus:outline-none text-gray-300"
            placeholder="/"
          />
        </div>
      </div>

      {/* iFrame Container */}
      <div className="flex-1 relative bg-white">
        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-10">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 text-blue-400 animate-spin mx-auto mb-2" />
              <p className="text-sm text-gray-400">Loading preview...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {hasError && !isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-10">
            <div className="text-center p-4">
              <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-200 mb-2">Cannot load preview</h3>
              <p className="text-sm text-gray-400 mb-4">
                Make sure your application is running in the terminal.
              </p>
              <button
                onClick={handleRefresh}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg
                         transition-colors text-sm"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* iFrame */}
        <iframe
          ref={iframeRef}
          src={previewUrl}
          className="w-full h-full border-0"
          onLoad={handleIframeLoad}
          onError={handleIframeError}
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
          title="Application Preview"
        />
      </div>

      {/* Status Bar */}
      <div className="h-6 px-3 flex items-center justify-between border-t border-gray-700 bg-gray-900">
        <span className="text-xs text-gray-500 truncate" title={previewUrl}>
          {previewUrl}
        </span>
        <span className={`text-xs ${hasError ? 'text-red-400' : isLoading ? 'text-yellow-400' : 'text-green-400'}`}>
          {hasError ? 'Error' : isLoading ? 'Loading...' : 'Connected'}
        </span>
      </div>
    </div>
  );
}
