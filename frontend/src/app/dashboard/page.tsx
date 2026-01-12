'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { projectsApi } from '@/lib/api';
import { ProjectListItem, ProgrammingLanguage, LanguageNames } from '@/types';
import { formatDate } from '@/lib/utils';
import {
  Code2,
  Plus,
  FolderOpen,
  Globe,
  Lock,
  LogOut,
  Loader2,
  Search,
  Trash2,
  Pencil,
} from 'lucide-react';
import CreateProjectModal from '@/components/projects/CreateProjectModal';
import { ConfirmDialog, InputDialog, ToastContainer, useToast, ThemeSwitcher } from '@/components/ui';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, logout, checkAuth } = useAuthStore();
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Toast notifications
  const toast = useToast();

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
    defaultValue?: string;
    onConfirm: (value: string) => void;
  }>({ isOpen: false, title: '', onConfirm: () => {} });

  useEffect(() => {
    checkAuth();
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    loadProjects();
  }, [isAuthenticated, router, checkAuth]);

  const loadProjects = async () => {
    try {
      setIsLoading(true);
      const response = await projectsApi.getMyProjects();
      setProjects(response.data);
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const handleProjectClick = (projectId: string) => {
    router.push(`/ide/${projectId}`);
  };

  const handleDeleteProject = (e: React.MouseEvent, project: ProjectListItem) => {
    e.stopPropagation();
    setConfirmDialog({
      isOpen: true,
      title: 'Supprimer le projet',
      message: `Êtes-vous sûr de vouloir supprimer "${project.name}" ? Cette action est irréversible.`,
      variant: 'danger',
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        try {
          await projectsApi.delete(project.id);
          setProjects(projects.filter(p => p.id !== project.id));
          toast.success('Projet supprimé');
        } catch (error: any) {
          console.error('Error deleting project:', error);
          toast.error(error.response?.data?.message || 'Erreur lors de la suppression du projet');
        }
      },
    });
  };

  const handleRenameProject = (e: React.MouseEvent, project: ProjectListItem) => {
    e.stopPropagation();
    setInputDialog({
      isOpen: true,
      title: 'Renommer le projet',
      message: 'Entrez le nouveau nom du projet',
      defaultValue: project.name,
      onConfirm: async (newName) => {
        setInputDialog(prev => ({ ...prev, isOpen: false }));
        if (newName === project.name) return;
        try {
          await projectsApi.update(project.id, { name: newName });
          setProjects(projects.map(p => p.id === project.id ? { ...p, name: newName } : p));
          toast.success('Projet renommé');
        } catch (error: any) {
          console.error('Error renaming project:', error);
          toast.error(error.response?.data?.message || 'Erreur lors du renommage du projet');
        }
      },
    });
  };

  const filteredProjects = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* Header */}
      <header className="border-b" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'var(--primary)' }}>
                <Code2 className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>CloudCode</span>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-[var(--text-secondary)]">
                Bonjour, <span className="font-medium text-[var(--text-primary)]">{user?.username}</span>
              </span>
              <ThemeSwitcher />
              <button
                onClick={handleLogout}
                className="p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded-lg transition"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Mes Projets</h1>
            <p className="text-gray-400 mt-1">
              {projects.length} projet{projects.length > 1 ? 's' : ''}
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-initial">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-64 pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition whitespace-nowrap"
            >
              <Plus className="w-5 h-5" />
              Nouveau
            </button>
          </div>
        </div>

        {/* Projects Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="text-center py-20">
            <FolderOpen className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-300 mb-2">
              {searchTerm ? 'Aucun projet trouvé' : 'Aucun projet'}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchTerm
                ? 'Essayez une autre recherche'
                : 'Créez votre premier projet pour commencer'}
            </p>
            {!searchTerm && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition"
              >
                <Plus className="w-5 h-5" />
                Créer un projet
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProjects.map((project) => (
              <div
                key={project.id}
                onClick={() => handleProjectClick(project.id)}
                className="bg-gray-800 border border-gray-700 rounded-xl p-5 hover:border-blue-500/50 hover:bg-gray-750 cursor-pointer transition group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center text-xl group-hover:bg-blue-600/20 transition">
                      <Code2 className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white group-hover:text-blue-400 transition">
                        {project.name}
                      </h3>
                      <span className="text-sm text-gray-500">
                        {LanguageNames[project.language as ProgrammingLanguage]}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <span title={project.isPublic ? "Public" : "Privé"}>
                      {project.isPublic ? (
                        <Globe className="w-4 h-4 text-green-400" />
                      ) : (
                        <Lock className="w-4 h-4 text-gray-500" />
                      )}
                    </span>
                    <button
                      onClick={(e) => handleRenameProject(e, project)}
                      className="p-1.5 text-gray-500 hover:text-white hover:bg-gray-600 rounded opacity-0 group-hover:opacity-100 transition"
                      title="Renommer"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => handleDeleteProject(e, project)}
                      className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-gray-600 rounded opacity-0 group-hover:opacity-100 transition"
                      title="Supprimer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {project.description && (
                  <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                    {project.description}
                  </p>
                )}

                <div className="text-xs text-gray-500">
                  Créé le {formatDate(project.createdAt)}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create Project Modal */}
      {showCreateModal && (
        <CreateProjectModal
          onClose={() => setShowCreateModal(false)}
          onCreated={(projectId) => {
            setShowCreateModal(false);
            if (projectId) {
              // Naviguer directement vers le projet cree
              router.push(`/ide/${projectId}`);
            } else {
              loadProjects();
            }
          }}
        />
      )}

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
        defaultValue={inputDialog.defaultValue}
        onConfirm={inputDialog.onConfirm}
        onCancel={() => setInputDialog(prev => ({ ...prev, isOpen: false }))}
      />

      {/* Toast Notifications */}
      <ToastContainer toasts={toast.toasts} onClose={toast.removeToast} />
    </div>
  );
}
