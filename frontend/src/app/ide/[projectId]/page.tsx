'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { projectsApi, filesApi, executionApi, formattingApi } from '@/lib/api';
import { Project, CodeFile, ExecutionResult } from '@/types';
import { getMonacoLanguageFromFilename, getProgrammingLanguageFromFilename, getFileIcon } from '@/lib/utils';
import {
  signalRMethods,
  stopConnection,
  resetConnectionState,
  registerSignalREvents,
  unregisterSignalREvents,
  ConnectedUser,
} from '@/lib/signalr';
import Editor, { Monaco } from '@monaco-editor/react';
import { configureMonaco, enhancedEditorOptions } from '@/lib/monaco';
import { registerAllCompletionProviders } from '@/lib/monaco/completionProviders';
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
  UserPlus,
  Package,
  Pencil,
  Download,
  Keyboard,
  Columns2,
  PanelRightClose,
} from 'lucide-react';
import CollaboratorsModal from '@/components/collaboration/CollaboratorsModal';
import PackageManager from '@/components/packages/PackageManager';
import TerminalComponent from '@/components/terminal/Terminal';
import { ConfirmDialog, InputDialog, KeyboardShortcutsModal, ToastContainer, useToast, ThemeSwitcher, FontSizeControl, SettingsPanel, Breadcrumbs } from '@/components/ui';
import { useThemeStore } from '@/stores/themeStore';
import { useEditorStore } from '@/stores/editorStore';
import { TerminalSquare, Settings, Wand2 } from 'lucide-react';

export default function IDEPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;
  const { isAuthenticated, checkAuth, user } = useAuthStore();

  const [project, setProject] = useState<Project | null>(null);
  const [files, setFiles] = useState<CodeFile[]>([]);

  // Multi-tab state
  interface OpenTab {
    file: CodeFile;
    content: string;
    originalContent: string;
    hasUnsavedChanges: boolean;
  }
  const [openTabs, setOpenTabs] = useState<OpenTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState<ExecutionResult | null>(null);
  const [showOutput, setShowOutput] = useState(true);
  const [showStdinInput, setShowStdinInput] = useState(false);
  const [stdinInput, setStdinInput] = useState('');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [connectedUsers, setConnectedUsers] = useState<ConnectedUser[]>([]);
  const [showCollaborators, setShowCollaborators] = useState(false);
  const [showPackages, setShowPackages] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showTerminal, setShowTerminal] = useState(false);
  const [isTerminalMaximized, setIsTerminalMaximized] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [monacoInitialized, setMonacoInitialized] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isSplitView, setIsSplitView] = useState(false);
  const [splitActiveTabId, setSplitActiveTabId] = useState<string | null>(null);
  const [isFormatting, setIsFormatting] = useState(false);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Derived state for active tab
  const activeTab = openTabs.find(tab => tab.file.id === activeTabId);
  const splitActiveTab = openTabs.find(tab => tab.file.id === splitActiveTabId);
  const selectedFile = activeTab?.file || null;
  const code = activeTab?.content || '';
  const hasUnsavedChanges = activeTab?.hasUnsavedChanges || false;

  // Toast notifications
  const toast = useToast();

  // Theme
  const { theme } = useThemeStore();

  // Editor settings
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
  } = useEditorStore();

  // Dialog states
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    variant?: 'danger' | 'warning' | 'info';
    onConfirm: () => void;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  const [inputDialog, setInputDialog] = useState<{
    isOpen: boolean;
    title: string;
    message?: string;
    placeholder?: string;
    defaultValue?: string;
    onConfirm: (value: string) => void;
  }>({ isOpen: false, title: '', onConfirm: () => {} });

  // Monaco editor handlers for IntelliSense
  const handleEditorWillMount = (monaco: Monaco) => {
    if (!monacoInitialized) {
      configureMonaco(monaco);
      registerAllCompletionProviders(monaco);
      setMonacoInitialized(true);
    }
  };

  // Check if current user is the project owner
  const isOwner = project?.owner?.id === user?.id;

  const handleDeleteProject = () => {
    if (!isOwner) return;
    setConfirmDialog({
      isOpen: true,
      title: 'Supprimer le projet',
      message: `Êtes-vous sûr de vouloir supprimer "${project?.name}" ? Cette action est irréversible.`,
      variant: 'danger',
      onConfirm: async () => {
        try {
          await projectsApi.delete(projectId);
          router.push('/dashboard');
        } catch (error) {
          console.error('Error deleting project:', error);
          toast.error('Erreur lors de la suppression du projet');
        }
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      },
    });
  };

  // Load project and files
  useEffect(() => {
    checkAuth();
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    loadProject();
    loadFiles();
  }, [projectId, isAuthenticated, checkAuth, router]);

  // SignalR connection for real-time collaboration
  useEffect(() => {
    if (!isAuthenticated || !projectId) return;

    // Reset connection state when entering the page
    resetConnectionState();

    const setupSignalR = async () => {
      try {
        await signalRMethods.joinProject(projectId);

        registerSignalREvents({
          onUserJoined: (user) => {
            setConnectedUsers((prev) => {
              if (prev.some((u) => u.id === user.id)) return prev;
              return [...prev, user];
            });
          },
          onUserLeft: (user) => {
            setConnectedUsers((prev) => prev.filter((u) => u.id !== user.id));
          },
          onActiveUsers: (users) => {
            setConnectedUsers(users);
          },
          onFileChanged: () => {
            loadFiles();
          },
        });
      } catch (error) {
        console.error('SignalR setup error:', error);
      }
    };

    setupSignalR();

    return () => {
      unregisterSignalREvents();
      signalRMethods.leaveProject(projectId);
      stopConnection();
    };
  }, [projectId, isAuthenticated]);


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

    // Check if file is already open
    const existingTab = openTabs.find(tab => tab.file.id === file.id);
    if (existingTab) {
      setActiveTabId(file.id);
      return;
    }

    try {
      const response = await filesApi.getFile(projectId, file.id);
      const content = response.data.content || '';

      // Add new tab
      setOpenTabs(prev => [...prev, {
        file: response.data,
        content,
        originalContent: content,
        hasUnsavedChanges: false,
      }]);
      setActiveTabId(file.id);
    } catch (error) {
      console.error('Error loading file:', error);
    }
  };

  const handleCloseTab = async (fileId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();

    const tab = openTabs.find(t => t.file.id === fileId);
    if (tab?.hasUnsavedChanges) {
      // Save before closing
      await handleSaveTab(fileId);
    }

    setOpenTabs(prev => prev.filter(t => t.file.id !== fileId));

    // If closing active tab, switch to another
    if (activeTabId === fileId) {
      const remainingTabs = openTabs.filter(t => t.file.id !== fileId);
      setActiveTabId(remainingTabs.length > 0 ? remainingTabs[remainingTabs.length - 1].file.id : null);
    }
  };

  const handleSwitchTab = (fileId: string) => {
    setActiveTabId(fileId);
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

  const updateTabContent = useCallback(
    (targetTabId: string, newCode: string) => {
      setOpenTabs(prev => prev.map(tab => {
        if (tab.file.id === targetTabId) {
          return {
            ...tab,
            content: newCode,
            hasUnsavedChanges: newCode !== tab.originalContent,
          };
        }
        return tab;
      }));

      // Auto-save after 2 seconds of inactivity
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
      autoSaveTimerRef.current = setTimeout(() => {
        const tab = openTabs.find(t => t.file.id === targetTabId);
        if (tab && newCode !== tab.originalContent) {
          handleSaveTab(targetTabId);
        }
      }, 2000);
    },
    [openTabs]
  );

  const handleCodeChange = useCallback(
    (value: string | undefined) => {
      if (!activeTabId) return;
      updateTabContent(activeTabId, value || '');
    },
    [activeTabId, updateTabContent]
  );

  const handleSplitCodeChange = useCallback(
    (value: string | undefined) => {
      if (!splitActiveTabId) return;
      updateTabContent(splitActiveTabId, value || '');
    },
    [splitActiveTabId, updateTabContent]
  );

  const toggleSplitView = useCallback(() => {
    if (!isSplitView) {
      // When enabling split view, set split to the current active tab or the second tab if available
      const otherTab = openTabs.find(t => t.file.id !== activeTabId);
      setSplitActiveTabId(otherTab?.file.id || activeTabId);
    } else {
      setSplitActiveTabId(null);
    }
    setIsSplitView(!isSplitView);
  }, [isSplitView, openTabs, activeTabId]);

  const handleSaveTab = async (fileId: string) => {
    const tab = openTabs.find(t => t.file.id === fileId);
    if (!tab) return;

    try {
      setIsSaving(true);
      await filesApi.update(projectId, fileId, tab.content);
      setOpenTabs(prev => prev.map(t => {
        if (t.file.id === fileId) {
          return { ...t, originalContent: t.content, hasUnsavedChanges: false };
        }
        return t;
      }));
    } catch (error) {
      console.error('Error saving file:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async () => {
    if (!activeTabId) return;
    await handleSaveTab(activeTabId);
  };

  const handleRun = async () => {
    if (!selectedFile || !project) return;

    // Save before running
    if (hasUnsavedChanges) {
      await handleSave();
    }

    // Determine language from file extension
    const fileLanguage = getProgrammingLanguageFromFilename(selectedFile.name);

    if (fileLanguage === null) {
      setOutput({
        id: '',
        output: '',
        errorOutput: `Le fichier "${selectedFile.name}" n'est pas un fichier exécutable supporté.`,
        exitCode: 1,
        executionTimeMs: 0,
        status: 3,
      });
      setShowOutput(true);
      return;
    }

    try {
      setIsRunning(true);
      setShowOutput(true);
      const response = await executionApi.run(projectId, selectedFile.id, code, fileLanguage, stdinInput || undefined);
      setOutput(response.data);
    } catch (error: any) {
      setOutput({
        id: '',
        output: '',
        errorOutput: error.response?.data?.message || 'Erreur lors de l\'exécution',
        exitCode: 1,
        executionTimeMs: 0,
        status: 3,
      });
    } finally {
      setIsRunning(false);
    }
  };

  const handleFormat = async () => {
    if (!selectedFile || !activeTabId) return;

    const fileLanguage = getProgrammingLanguageFromFilename(selectedFile.name);
    if (fileLanguage === null) {
      toast.error('Le formatage n\'est pas supporté pour ce type de fichier');
      return;
    }

    try {
      setIsFormatting(true);
      const response = await formattingApi.format(code, fileLanguage, tabSize);

      if (response.data.success) {
        // Update the tab content with formatted code
        updateTabContent(activeTabId, response.data.formattedCode);
        toast.success('Code formaté');
      } else {
        toast.error(response.data.error || 'Erreur lors du formatage');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors du formatage');
    } finally {
      setIsFormatting(false);
    }
  };

  const handleCreateFile = (isFolder: boolean) => {
    setInputDialog({
      isOpen: true,
      title: isFolder ? 'Nouveau dossier' : 'Nouveau fichier',
      message: isFolder ? 'Entrez le nom du dossier' : 'Entrez le nom du fichier (avec extension)',
      placeholder: isFolder ? 'mon-dossier' : 'index.js',
      onConfirm: async (name) => {
        setInputDialog(prev => ({ ...prev, isOpen: false }));
        try {
          const parentId = selectedFile?.isFolder ? selectedFile.id : selectedFile?.parentId;
          await filesApi.create(projectId, {
            name,
            isFolder,
            parentId: parentId || undefined,
          });
          await loadFiles();
          toast.success(isFolder ? 'Dossier créé' : 'Fichier créé');
        } catch (error: any) {
          console.error('Error creating file:', error);
          toast.error(error.response?.data?.message || 'Impossible de créer le fichier');
        }
      },
    });
  };

  const handleDeleteFile = (file: CodeFile) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Supprimer le fichier',
      message: `Êtes-vous sûr de vouloir supprimer "${file.name}" ?`,
      variant: 'danger',
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        try {
          await filesApi.delete(projectId, file.id);
          // Close tab if file was open
          const tabIndex = openTabs.findIndex(t => t.file.id === file.id);
          if (tabIndex !== -1) {
            setOpenTabs(prev => prev.filter(t => t.file.id !== file.id));
            if (activeTabId === file.id) {
              const remaining = openTabs.filter(t => t.file.id !== file.id);
              setActiveTabId(remaining.length > 0 ? remaining[remaining.length - 1].file.id : null);
            }
          }
          loadFiles();
          toast.success('Fichier supprimé');
        } catch (error) {
          console.error('Error deleting file:', error);
          toast.error('Erreur lors de la suppression');
        }
      },
    });
  };

  const handleRenameFile = (file: CodeFile) => {
    setInputDialog({
      isOpen: true,
      title: 'Renommer le fichier',
      message: 'Entrez le nouveau nom du fichier',
      defaultValue: file.name,
      onConfirm: async (newName) => {
        setInputDialog(prev => ({ ...prev, isOpen: false }));
        if (newName === file.name) return;
        try {
          await filesApi.rename(projectId, file.id, newName);
          // Update tab if file is open
          setOpenTabs(prev => prev.map(t => {
            if (t.file.id === file.id) {
              return { ...t, file: { ...t.file, name: newName } };
            }
            return t;
          }));
          loadFiles();
          toast.success('Fichier renommé');
        } catch (error: any) {
          console.error('Error renaming file:', error);
          toast.error(error.response?.data?.message || 'Impossible de renommer le fichier');
        }
      },
    });
  };

  const handleRenameProject = () => {
    if (!project) return;
    setInputDialog({
      isOpen: true,
      title: 'Renommer le projet',
      message: 'Entrez le nouveau nom du projet',
      defaultValue: project.name,
      onConfirm: async (newName) => {
        setInputDialog(prev => ({ ...prev, isOpen: false }));
        if (newName === project.name) return;
        try {
          const response = await projectsApi.update(projectId, { name: newName });
          setProject({ ...project, name: response.data.name });
          toast.success('Projet renommé');
        } catch (error: any) {
          console.error('Error renaming project:', error);
          toast.error(error.response?.data?.message || 'Impossible de renommer le projet');
        }
      },
    });
  };

  const handleDownloadProject = async () => {
    if (!project) return;
    try {
      setIsDownloading(true);
      await filesApi.downloadProject(projectId, project.name);
      toast.success('Projet téléchargé');
    } catch (error: any) {
      console.error('Error downloading project:', error);
      toast.error('Erreur lors du téléchargement');
    } finally {
      setIsDownloading(false);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+S - Save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
      // Ctrl+Enter - Run
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleRun();
      }
      // Shift+Alt+F - Format code
      if (e.shiftKey && e.altKey && e.key === 'F') {
        e.preventDefault();
        handleFormat();
      }
      // Ctrl+Shift+? - Show shortcuts
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === '?' || e.key === '/')) {
        e.preventDefault();
        setShowShortcuts(true);
      }
      // Ctrl+N - New file
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        handleCreateFile(false);
      }
      // Ctrl+Shift+N - New folder
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'N') {
        e.preventDefault();
        handleCreateFile(true);
      }
      // Ctrl+W - Close current tab
      if ((e.ctrlKey || e.metaKey) && e.key === 'w' && activeTabId) {
        e.preventDefault();
        handleCloseTab(activeTabId);
      }
      // Escape - Close output panel
      if (e.key === 'Escape' && showOutput) {
        setShowOutput(false);
      }
      // Ctrl+` - Toggle terminal
      if ((e.ctrlKey || e.metaKey) && e.key === '`') {
        e.preventDefault();
        setShowTerminal(!showTerminal);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedFile, code, activeTabId, showOutput, showTerminal]);

  // Cleanup auto-save timer and warn on page leave
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [hasUnsavedChanges]);

  const renderFileTree = (items: CodeFile[], parentId?: string | null) => {
    // Handle both null and undefined for root-level files
    const filteredItems = items.filter((f) => {
      if (parentId === undefined || parentId === null) {
        return f.parentId === null || f.parentId === undefined;
      }
      return f.parentId === parentId;
    });
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
              {!file.isFolder && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRenameFile(file);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-600 rounded transition"
                  title="Renommer"
                >
                  <Pencil className="w-3 h-3 text-gray-400" />
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteFile(file);
                }}
                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-600 rounded transition"
                title="Supprimer"
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
            {isOwner && (
              <button
                onClick={handleRenameProject}
                className="p-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition"
                title="Renommer le projet"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Font Size Control */}
          <FontSizeControl />

          {/* Theme Switcher */}
          <ThemeSwitcher />

          {/* Keyboard shortcuts */}
          <button
            onClick={() => setShowShortcuts(true)}
            className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded transition"
            title="Raccourcis clavier (Ctrl+Shift+?)"
          >
            <Keyboard className="w-4 h-4" />
          </button>

          {/* Settings */}
          <button
            onClick={() => setShowSettings(true)}
            className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded transition"
            title="Paramètres de l'éditeur"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Split View Toggle */}
          <button
            onClick={toggleSplitView}
            disabled={openTabs.length < 1}
            className={`p-1.5 rounded transition ${
              isSplitView
                ? 'text-blue-400 bg-blue-600/20 hover:bg-blue-600/30'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
            title={isSplitView ? 'Fermer la vue divisée' : 'Diviser l\'éditeur'}
          >
            {isSplitView ? <PanelRightClose className="w-4 h-4" /> : <Columns2 className="w-4 h-4" />}
          </button>

          {/* Download project */}
          <button
            onClick={handleDownloadProject}
            disabled={isDownloading}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition disabled:opacity-50"
            title="Télécharger le projet"
          >
            {isDownloading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
          </button>

          {/* Delete Project button - owner only */}
          {isOwner && (
            <button
              onClick={handleDeleteProject}
              className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded transition"
              title="Supprimer le projet"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          {/* Collaborators button */}
          <button
            onClick={() => setShowCollaborators(true)}
            className="flex items-center gap-1.5 px-2 py-1.5 text-sm bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white rounded-lg transition"
            title="Gérer les collaborateurs"
          >
            <UserPlus className="w-4 h-4" />
            {connectedUsers.length > 0 && (
              <>
                <div className="flex -space-x-1">
                  {connectedUsers.slice(0, 3).map((u) => (
                    <div
                      key={u.id}
                      className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white border border-gray-600"
                      style={{ backgroundColor: u.color }}
                      title={u.username}
                    >
                      {u.username.charAt(0).toUpperCase()}
                    </div>
                  ))}
                  {connectedUsers.length > 3 && (
                    <div className="w-5 h-5 rounded-full bg-gray-600 flex items-center justify-center text-[10px] text-gray-300 border border-gray-500">
                      +{connectedUsers.length - 3}
                    </div>
                  )}
                </div>
                <Users className="w-4 h-4 text-green-400" />
                <span className="text-sm">{connectedUsers.length + 1}</span>
              </>
            )}
          </button>

          <button
            onClick={handleFormat}
            disabled={!selectedFile || isFormatting}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition disabled:opacity-50"
            title="Formater le code (Shift+Alt+F)"
          >
            {isFormatting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
            Formater
          </button>

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

          {/* Packages Button */}
          <button
            onClick={() => setShowPackages(true)}
            className="mx-3 mt-2 flex items-center gap-2 px-3 py-2 text-sm bg-gray-700/50 hover:bg-gray-700 text-gray-300 hover:text-white rounded-lg transition"
          >
            <Package className="w-4 h-4" />
            <span>Packages</span>
          </button>

          {/* Terminal Button */}
          <button
            onClick={() => setShowTerminal(true)}
            className={`mx-3 mt-2 flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition ${
              showTerminal
                ? 'bg-green-600/30 text-green-400 hover:bg-green-600/40'
                : 'bg-gray-700/50 hover:bg-gray-700 text-gray-300 hover:text-white'
            }`}
          >
            <TerminalSquare className="w-4 h-4" />
            <span>Terminal</span>
          </button>

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
          {/* Top section: Editor + Output */}
          <div className={`flex flex-row overflow-hidden ${showTerminal && !isTerminalMaximized ? 'flex-1' : 'flex-1'}`}>
            {/* Editor Content */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            {openTabs.length > 0 ? (
              <>
                {/* Breadcrumbs */}
                {activeTab && (
                  <Breadcrumbs
                    filePath={activeTab.file.name}
                    projectName={project?.name}
                    onNavigate={(path) => {
                      // Navigate to folder in file tree
                      if (path === '/') {
                        setExpandedFolders(new Set());
                      }
                    }}
                  />
                )}

                {/* Tabs Bar */}
                <div className="h-10 bg-gray-800 border-b border-gray-700 flex items-center justify-between">
                  <div className="flex items-center overflow-x-auto flex-1 scrollbar-hide">
                    {openTabs.map((tab) => (
                      <div
                        key={tab.file.id}
                        onClick={() => handleSwitchTab(tab.file.id)}
                        className={`flex items-center gap-2 px-3 h-10 border-r border-gray-700 cursor-pointer group min-w-0 ${
                          activeTabId === tab.file.id
                            ? 'bg-gray-900 text-white'
                            : 'bg-gray-800 text-gray-400 hover:bg-gray-750 hover:text-gray-200'
                        }`}
                      >
                        <span className="text-xs">{getFileIcon(tab.file.name, false)}</span>
                        <span className="text-sm truncate max-w-32">{tab.file.name}</span>
                        {tab.hasUnsavedChanges && (
                          <span className="w-2 h-2 bg-orange-400 rounded-full flex-shrink-0" title="Non sauvegardé" />
                        )}
                        <button
                          onClick={(e) => handleCloseTab(tab.file.id, e)}
                          className="p-0.5 text-gray-500 hover:text-white hover:bg-gray-600 rounded opacity-0 group-hover:opacity-100 transition flex-shrink-0"
                          title="Fermer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 px-2 flex-shrink-0">
                    {isSaving && (
                      <span className="text-xs text-gray-500">Sauvegarde...</span>
                    )}
                    {!showOutput && (
                      <button
                        onClick={() => setShowOutput(true)}
                        className="flex items-center gap-1.5 px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition"
                        title="Afficher la sortie"
                      >
                        <Terminal className="w-3.5 h-3.5" />
                        Sortie
                      </button>
                    )}
                  </div>
                </div>

                {/* Monaco Editor(s) */}
                <div className={`flex-1 flex ${isSplitView ? 'flex-row' : 'flex-col'}`}>
                  {/* Primary Editor */}
                  <div className={`flex flex-col ${isSplitView ? 'flex-1 border-r border-gray-700' : 'flex-1'}`}>
                    {isSplitView && (
                      <div className="h-8 bg-gray-800 border-b border-gray-700 flex items-center px-2">
                        <select
                          value={activeTabId || ''}
                          onChange={(e) => setActiveTabId(e.target.value)}
                          className="text-xs bg-gray-700 text-gray-300 rounded px-2 py-1 border border-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          {openTabs.map((tab) => (
                            <option key={tab.file.id} value={tab.file.id}>
                              {tab.file.name} {tab.hasUnsavedChanges ? '•' : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    <div className="flex-1">
                      {activeTab && (
                        <Editor
                          height="100%"
                          language={getMonacoLanguageFromFilename(activeTab.file.name)}
                          value={activeTab.content}
                          onChange={handleCodeChange}
                          theme={theme.monacoTheme}
                          beforeMount={handleEditorWillMount}
                          options={{
                            ...enhancedEditorOptions,
                            fontSize,
                            minimap: { enabled: showMinimap },
                            wordWrap,
                            lineNumbers: showLineNumbers ? 'on' : 'off',
                            tabSize,
                            renderWhitespace,
                            cursorBlinking,
                            cursorStyle,
                            bracketPairColorization: { enabled: bracketPairColorization },
                            autoClosingBrackets,
                          }}
                        />
                      )}
                    </div>
                  </div>

                  {/* Split Editor (Secondary) */}
                  {isSplitView && (
                    <div className="flex-1 flex flex-col">
                      <div className="h-8 bg-gray-800 border-b border-gray-700 flex items-center px-2">
                        <select
                          value={splitActiveTabId || ''}
                          onChange={(e) => setSplitActiveTabId(e.target.value)}
                          className="text-xs bg-gray-700 text-gray-300 rounded px-2 py-1 border border-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          {openTabs.map((tab) => (
                            <option key={tab.file.id} value={tab.file.id}>
                              {tab.file.name} {tab.hasUnsavedChanges ? '•' : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex-1">
                        {splitActiveTab && (
                          <Editor
                            height="100%"
                            language={getMonacoLanguageFromFilename(splitActiveTab.file.name)}
                            value={splitActiveTab.content}
                            onChange={handleSplitCodeChange}
                            theme={theme.monacoTheme}
                            beforeMount={handleEditorWillMount}
                            options={{
                              ...enhancedEditorOptions,
                              fontSize,
                              minimap: { enabled: showMinimap },
                              wordWrap,
                              lineNumbers: showLineNumbers ? 'on' : 'off',
                              tabSize,
                              renderWhitespace,
                              cursorBlinking,
                              cursorStyle,
                              bracketPairColorization: { enabled: bracketPairColorization },
                              autoClosingBrackets,
                            }}
                          />
                        )}
                      </div>
                    </div>
                  )}
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
          </div>

          {/* Output Panel - Right Side */}
          {showOutput && (
            <div className="w-96 bg-gray-850 border-l border-gray-700 flex flex-col flex-shrink-0">
              <div className="h-10 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-3">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-green-400" />
                  <span className="text-sm font-medium text-gray-200">Sortie</span>
                </div>
                <button
                  onClick={() => setShowOutput(false)}
                  className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition"
                  title="Fermer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Stdin Input Section */}
              <div className="border-b border-gray-700">
                <button
                  onClick={() => setShowStdinInput(!showStdinInput)}
                  className="w-full px-3 py-2 flex items-center justify-between text-sm text-gray-400 hover:text-gray-200 hover:bg-gray-800 transition"
                >
                  <div className="flex items-center gap-2">
                    <ChevronRight className={`w-4 h-4 transition-transform ${showStdinInput ? 'rotate-90' : ''}`} />
                    <span>Entrée (stdin)</span>
                    {stdinInput && <span className="w-2 h-2 bg-blue-400 rounded-full" title="Contient des données" />}
                  </div>
                </button>
                {showStdinInput && (
                  <div className="px-3 pb-3">
                    <textarea
                      value={stdinInput}
                      onChange={(e) => setStdinInput(e.target.value)}
                      placeholder="Entrez les données à passer au programme..."
                      className="w-full h-24 px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-gray-200 font-mono placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Ces données seront passées au programme lors de l'exécution
                    </p>
                  </div>
                )}
              </div>

              <div className="flex-1 overflow-auto p-4 font-mono text-sm bg-gray-900">
                {isRunning ? (
                  <div className="flex items-center gap-2 text-gray-400">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Exécution en cours...</span>
                  </div>
                ) : output ? (
                  <div className="space-y-3">
                    {output.output && (
                      <div>
                        <div className="text-xs text-gray-500 mb-1 uppercase tracking-wide">Sortie standard</div>
                        <pre className="text-green-400 whitespace-pre-wrap break-words">{output.output}</pre>
                      </div>
                    )}
                    {output.errorOutput && (
                      <div>
                        <div className="text-xs text-gray-500 mb-1 uppercase tracking-wide">Erreurs</div>
                        <pre className="text-red-400 whitespace-pre-wrap break-words">{output.errorOutput}</pre>
                      </div>
                    )}
                    <div className="pt-3 border-t border-gray-700 flex items-center justify-between text-xs">
                      <span className={`px-2 py-0.5 rounded ${output.exitCode === 0 ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}>
                        Code: {output.exitCode}
                      </span>
                      <span className="text-gray-500">
                        {output.executionTimeMs.toFixed(0)}ms
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-gray-500 text-center py-8">
                    <Terminal className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>Exécutez votre code pour voir la sortie</p>
                    <p className="text-xs mt-1">Ctrl + Enter</p>
                  </div>
                )}
              </div>
            </div>
          )}
          </div>

          {/* Terminal Panel - Bottom */}
          {showTerminal && (
            <div className={`border-t border-gray-700 ${isTerminalMaximized ? 'flex-1' : 'h-64'}`}>
              <TerminalComponent
                projectId={projectId}
                isVisible={showTerminal}
                onClose={() => setShowTerminal(false)}
                onToggleMaximize={() => setIsTerminalMaximized(!isTerminalMaximized)}
                isMaximized={isTerminalMaximized}
              />
            </div>
          )}
        </main>
      </div>

      {/* Collaborators Modal */}
      {showCollaborators && (
        <CollaboratorsModal
          projectId={projectId}
          isOwner={isOwner}
          onClose={() => setShowCollaborators(false)}
        />
      )}

      {/* Package Manager Modal */}
      <PackageManager
        projectId={projectId}
        isOpen={showPackages}
        onClose={() => setShowPackages(false)}
      />

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        variant={confirmDialog.variant}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
      />

      {/* Input Dialog */}
      <InputDialog
        isOpen={inputDialog.isOpen}
        title={inputDialog.title}
        message={inputDialog.message}
        placeholder={inputDialog.placeholder}
        defaultValue={inputDialog.defaultValue}
        onConfirm={inputDialog.onConfirm}
        onCancel={() => setInputDialog(prev => ({ ...prev, isOpen: false }))}
      />

      {/* Keyboard Shortcuts Modal */}
      <KeyboardShortcutsModal
        isOpen={showShortcuts}
        onClose={() => setShowShortcuts(false)}
      />

      {/* Settings Panel */}
      <SettingsPanel
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />

      {/* Toast Notifications */}
      <ToastContainer toasts={toast.toasts} onClose={toast.removeToast} />
    </div>
  );
}
