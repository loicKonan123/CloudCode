'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { projectsApi, filesApi, executionApi } from '@/lib/api';
import { Project, CodeFile, ExecutionResult } from '@/types';
import { getMonacoLanguage, getFileIcon } from '@/lib/utils';
import { signalRMethods, startConnection, stopConnection } from '@/lib/signalr';
import Editor from '@monaco-editor/react';
import {
  Code2,
  ChevronLeft,
  Play,
  Save,
  Plus,
  FolderPlus,
  Trash2,
  ChevronRight,
  ChevronDown,
  Loader2,
  Users,
  Terminal,
  X,
} from 'lucide-react';

export default function IDEPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;
  const { isAuthenticated, checkAuth, user } = useAuthStore();

  const [project, setProject] = useState<Project | null>(null);
  const [files, setFiles] = useState<CodeFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<CodeFile | null>(null);
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState<ExecutionResult | null>(null);
  const [showOutput, setShowOutput] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [connectedUsers, setConnectedUsers] = useState<{ userId: string; username: string }[]>([]);

  // Load project and files
  useEffect(() => {
    checkAuth();
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    loadProject();
    loadFiles();
    setupSignalR();

    return () => {
      signalRMethods.leaveProject(projectId);
      stopConnection();
    };
  }, [projectId, isAuthenticated]);

  const setupSignalR = async () => {
    try {
      await startConnection();
      await signalRMethods.joinProject(projectId);

      signalRMethods.onUserJoined((event) => {
        setConnectedUsers((prev) => {
          if (prev.find((u) => u.userId === event.userId)) return prev;
          return [...prev, { userId: event.userId, username: event.username }];
        });
      });

      signalRMethods.onUserLeft((userId) => {
        setConnectedUsers((prev) => prev.filter((u) => u.userId !== userId));
      });

      signalRMethods.onCodeChange((event) => {
        if (event.userId !== user?.id && event.fileId === selectedFile?.id) {
          setCode(event.content);
        }
      });
    } catch (error) {
      console.error('SignalR connection failed:', error);
    }
  };

  const loadProject = async () => {
    try {
      const response = await projectsApi.getById(projectId);
      setProject(response.data);
    } catch (error) {
      console.error('Error loading project:', error);
      router.push('/dashboard');
    }
  };

  const loadFiles = async () => {
    try {
      setIsLoading(true);
      const response = await filesApi.getProjectFiles(projectId);
      setFiles(response.data);
    } catch (error) {
      console.error('Error loading files:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = async (file: CodeFile) => {
    if (file.isFolder) {
      toggleFolder(file.id);
      return;
    }

    try {
      const response = await filesApi.getFile(projectId, file.id);
      setSelectedFile(response.data);
      setCode(response.data.content || '');
    } catch (error) {
      console.error('Error loading file:', error);
    }
  };

  const toggleFolder = (folderId: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  const handleCodeChange = useCallback(
    (value: string | undefined) => {
      const newCode = value || '';
      setCode(newCode);

      // Send to collaborators
      if (selectedFile) {
        signalRMethods.sendCodeChange(projectId, selectedFile.id, newCode, { line: 0, column: 0 });
      }
    },
    [projectId, selectedFile]
  );

  const handleSave = async () => {
    if (!selectedFile) return;

    try {
      setIsSaving(true);
      await filesApi.update(projectId, selectedFile.id, code);
    } catch (error) {
      console.error('Error saving file:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRun = async () => {
    if (!selectedFile) return;

    try {
      setIsRunning(true);
      setShowOutput(true);
      const response = await executionApi.run(projectId, selectedFile.id);
      setOutput(response.data);
    } catch (error: any) {
      setOutput({
        id: '',
        output: '',
        errors: error.response?.data?.message || 'Erreur lors de l\'exécution',
        exitCode: 1,
        executionTime: 0,
        status: 'failed',
      });
    } finally {
      setIsRunning(false);
    }
  };

  const handleCreateFile = async (isFolder: boolean) => {
    const name = prompt(isFolder ? 'Nom du dossier:' : 'Nom du fichier:');
    if (!name) return;

    try {
      await filesApi.create(projectId, {
        name,
        isFolder,
        parentId: selectedFile?.isFolder ? selectedFile.id : selectedFile?.parentId,
      });
      loadFiles();
    } catch (error) {
      console.error('Error creating file:', error);
    }
  };

  const handleDeleteFile = async (file: CodeFile) => {
    if (!confirm(`Supprimer "${file.name}" ?`)) return;

    try {
      await filesApi.delete(projectId, file.id);
      if (selectedFile?.id === file.id) {
        setSelectedFile(null);
        setCode('');
      }
      loadFiles();
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleRun();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedFile, code]);

  const renderFileTree = (items: CodeFile[], parentId?: string) => {
    const filteredItems = items.filter((f) => f.parentId === parentId);
    if (filteredItems.length === 0) return null;

    return (
      <ul className="space-y-0.5">
        {filteredItems.map((file) => (
          <li key={file.id}>
            <div
              className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer group ${
                selectedFile?.id === file.id
                  ? 'bg-blue-600/30 text-blue-300'
                  : 'hover:bg-gray-700/50 text-gray-300'
              }`}
              onClick={() => handleFileSelect(file)}
            >
              {file.isFolder && (
                <span className="text-gray-500">
                  {expandedFolders.has(file.id) ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </span>
              )}
              <span>{getFileIcon(file.name, file.isFolder)}</span>
              <span className="flex-1 truncate text-sm">{file.name}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteFile(file);
                }}
                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-600 rounded transition"
              >
                <Trash2 className="w-3 h-3 text-gray-400" />
              </button>
            </div>
            {file.isFolder && expandedFolders.has(file.id) && (
              <div className="ml-4">{renderFileTree(items, file.id)}</div>
            )}
          </li>
        ))}
      </ul>
    );
  };

  if (!isAuthenticated || !project) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-900">
      {/* Header */}
      <header className="h-12 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/dashboard')}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Code2 className="w-5 h-5 text-blue-400" />
            <span className="font-medium text-white">{project.name}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Connected users */}
          {connectedUsers.length > 0 && (
            <div className="flex items-center gap-1 px-2 py-1 bg-gray-700 rounded-lg">
              <Users className="w-4 h-4 text-green-400" />
              <span className="text-sm text-gray-300">{connectedUsers.length + 1}</span>
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={!selectedFile || isSaving}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Sauvegarder
          </button>

          <button
            onClick={handleRun}
            disabled={!selectedFile || isRunning}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg transition disabled:opacity-50"
          >
            {isRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            Exécuter
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - File Explorer */}
        <aside className="w-64 bg-gray-850 border-r border-gray-700 flex flex-col flex-shrink-0">
          <div className="p-3 border-b border-gray-700 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-300">Fichiers</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleCreateFile(false)}
                className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition"
                title="Nouveau fichier"
              >
                <Plus className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleCreateFile(true)}
                className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition"
                title="Nouveau dossier"
              >
                <FolderPlus className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 text-gray-500 animate-spin" />
              </div>
            ) : files.length === 0 ? (
              <p className="text-center text-gray-500 text-sm py-8">Aucun fichier</p>
            ) : (
              renderFileTree(files)
            )}
          </div>
        </aside>

        {/* Editor Area */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {selectedFile ? (
            <>
              {/* File Tab */}
              <div className="h-10 bg-gray-800 border-b border-gray-700 flex items-center px-4">
                <span className="text-sm text-gray-300">{selectedFile.name}</span>
              </div>

              {/* Monaco Editor */}
              <div className="flex-1">
                <Editor
                  height="100%"
                  language={getMonacoLanguage(project.language)}
                  value={code}
                  onChange={handleCodeChange}
                  theme="vs-dark"
                  options={{
                    fontSize: 14,
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    tabSize: 2,
                    wordWrap: 'on',
                  }}
                />
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <Code2 className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>Sélectionnez un fichier pour commencer</p>
              </div>
            </div>
          )}

          {/* Output Panel */}
          {showOutput && (
            <div className="h-48 bg-gray-850 border-t border-gray-700 flex flex-col">
              <div className="h-8 bg-gray-800 flex items-center justify-between px-3">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-300">Sortie</span>
                </div>
                <button
                  onClick={() => setShowOutput(false)}
                  className="p-1 text-gray-400 hover:text-white rounded transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1 overflow-auto p-3 font-mono text-sm">
                {output ? (
                  <>
                    {output.output && (
                      <pre className="text-green-400 whitespace-pre-wrap">{output.output}</pre>
                    )}
                    {output.errors && (
                      <pre className="text-red-400 whitespace-pre-wrap">{output.errors}</pre>
                    )}
                    <div className="mt-2 text-gray-500 text-xs">
                      Code de sortie: {output.exitCode} | Temps: {output.executionTime}ms
                    </div>
                  </>
                ) : (
                  <span className="text-gray-500">En attente...</span>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
