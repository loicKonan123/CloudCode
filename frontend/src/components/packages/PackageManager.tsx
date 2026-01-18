'use client';

import { useState, useEffect } from 'react';
import { dependenciesApi } from '@/lib/api';
import { Dependency, DependencyType, DependencyTypeNames, InstallResultDto, EnvironmentStatusDto, ProjectEnvironmentDto } from '@/types';
import { Package, Plus, Trash2, Loader2, X, Check, Download, AlertCircle, Terminal, Server, FolderTree, HardDrive, RefreshCw } from 'lucide-react';

interface PackageManagerProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export default function PackageManager({ projectId, isOpen, onClose }: PackageManagerProps) {
  const [dependencies, setDependencies] = useState<Dependency[]>([]);
  const [defaultType, setDefaultType] = useState<DependencyType>(DependencyType.Pip);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [newPackageName, setNewPackageName] = useState('');
  const [newPackageVersion, setNewPackageVersion] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [installResult, setInstallResult] = useState<InstallResultDto | null>(null);
  const [showOutput, setShowOutput] = useState(false);
  const [envStatus, setEnvStatus] = useState<EnvironmentStatusDto | null>(null);
  const [projectEnv, setProjectEnv] = useState<ProjectEnvironmentDto | null>(null);
  const [showEnvStatus, setShowEnvStatus] = useState(false);
  const [showProjectEnv, setShowProjectEnv] = useState(true);
  const [isLoadingEnv, setIsLoadingEnv] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadDependencies();
      loadEnvironmentStatus();
      loadProjectEnvironment();
      setInstallResult(null);
      setShowOutput(false);
    }
  }, [isOpen, projectId]);

  const loadDependencies = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await dependenciesApi.getProjectDependencies(projectId);
      setDependencies(response.data.dependencies || []);
      setDefaultType(response.data.defaultType);
    } catch (err: any) {
      console.error('Error loading dependencies:', err);
      const message = err.response?.data?.message || err.message || 'Erreur lors du chargement des packages';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const loadEnvironmentStatus = async () => {
    try {
      const response = await dependenciesApi.checkEnvironment();
      setEnvStatus(response.data);
    } catch (err) {
      console.error('Error loading environment status:', err);
    }
  };

  const loadProjectEnvironment = async () => {
    try {
      setIsLoadingEnv(true);
      const response = await dependenciesApi.getProjectEnvironment(projectId);
      setProjectEnv(response.data);
    } catch (err) {
      console.error('Error loading project environment:', err);
    } finally {
      setIsLoadingEnv(false);
    }
  };

  const handleAddPackage = async () => {
    if (!newPackageName.trim()) return;

    try {
      setIsAdding(true);
      setError(null);
      const response = await dependenciesApi.add(projectId, {
        name: newPackageName.trim(),
        version: newPackageVersion.trim() || undefined,
      });
      setDependencies([...dependencies, response.data]);
      setNewPackageName('');
      setNewPackageVersion('');
    } catch (err: any) {
      console.error('Error adding package:', err);
      const message = err.response?.data?.message || err.message || 'Erreur lors de l\'ajout du package';
      setError(message);
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemovePackage = async (dependencyId: string) => {
    try {
      setError(null);
      await dependenciesApi.remove(projectId, dependencyId);
      setDependencies(dependencies.filter((d) => d.id !== dependencyId));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la suppression');
    }
  };

  const handleInstallAll = async () => {
    if (dependencies.length === 0) {
      setError('Aucun package à installer');
      return;
    }

    try {
      setIsInstalling(true);
      setError(null);
      setInstallResult(null);
      setShowOutput(true);

      const response = await dependenciesApi.install(projectId);
      setInstallResult(response.data);

      // Reload dependencies and environment to get updated status
      await loadDependencies();
      await loadProjectEnvironment();
    } catch (err: any) {
      console.error('Error installing dependencies:', err);
      const message = err.response?.data?.message || err.message || 'Erreur lors de l\'installation';
      setError(message);
      setInstallResult({
        success: false,
        output: '',
        error: message,
        installedCount: 0,
        failedCount: 0,
        dependencies: [],
      });
    } finally {
      setIsInstalling(false);
    }
  };

  if (!isOpen) return null;

  const pendingCount = dependencies.filter(d => !d.isInstalled).length;
  const isPython = defaultType === DependencyType.Pip;
  const isNode = defaultType === DependencyType.Npm;
  const runtimeAvailable = envStatus && (
    (isPython && envStatus.pythonAvailable) ||
    (isNode && envStatus.nodeAvailable && envStatus.npmAvailable)
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-semibold text-white">Gestionnaire de packages</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowProjectEnv(!showProjectEnv)}
              className={`p-1.5 rounded transition ${showProjectEnv ? 'text-green-400 bg-green-400/20' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}
              title="Environnement du projet"
            >
              <FolderTree className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowEnvStatus(!showEnvStatus)}
              className={`p-1.5 rounded transition ${showEnvStatus ? 'text-blue-400 bg-blue-400/20' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}
              title="Statut serveur"
            >
              <Server className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Project Environment */}
          {showProjectEnv && (
            <div className="mb-4 p-3 bg-gradient-to-r from-green-900/20 to-blue-900/20 rounded-lg border border-green-700/50">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <FolderTree className="w-4 h-4 text-green-400" />
                  <span className="text-sm font-medium text-white">Environnement du projet</span>
                </div>
                <button
                  onClick={loadProjectEnvironment}
                  disabled={isLoadingEnv}
                  className="p-1 text-gray-400 hover:text-white rounded transition"
                  title="Rafraîchir"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoadingEnv ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {isLoadingEnv ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                </div>
              ) : projectEnv ? (
                <div className="space-y-3">
                  {/* Venv Status */}
                  {isPython && (
                    <div className={`p-2 rounded ${projectEnv.hasVenv ? 'bg-green-900/30 border border-green-700/50' : 'bg-gray-700/30 border border-gray-600'}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {projectEnv.hasVenv ? (
                            <Check className="w-4 h-4 text-green-400" />
                          ) : (
                            <X className="w-4 h-4 text-gray-500" />
                          )}
                          <span className={projectEnv.hasVenv ? 'text-green-400 font-medium' : 'text-gray-400'}>
                            venv (Python)
                          </span>
                        </div>
                        {projectEnv.hasVenv && (
                          <div className="flex items-center gap-3 text-xs text-gray-400">
                            <span className="flex items-center gap-1">
                              <HardDrive className="w-3 h-3" />
                              {formatBytes(projectEnv.totalSizeBytes)}
                            </span>
                            <span>{projectEnv.fileCount} fichiers</span>
                          </div>
                        )}
                      </div>
                      {projectEnv.hasVenv && projectEnv.venvPath && (
                        <div className="mt-1 text-xs text-gray-500 font-mono truncate">
                          {projectEnv.venvPath}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Node Modules Status */}
                  {isNode && (
                    <div className={`p-2 rounded ${projectEnv.hasNodeModules ? 'bg-green-900/30 border border-green-700/50' : 'bg-gray-700/30 border border-gray-600'}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {projectEnv.hasNodeModules ? (
                            <Check className="w-4 h-4 text-green-400" />
                          ) : (
                            <X className="w-4 h-4 text-gray-500" />
                          )}
                          <span className={projectEnv.hasNodeModules ? 'text-green-400 font-medium' : 'text-gray-400'}>
                            node_modules
                          </span>
                        </div>
                        {projectEnv.hasNodeModules && (
                          <div className="flex items-center gap-3 text-xs text-gray-400">
                            <span className="flex items-center gap-1">
                              <HardDrive className="w-3 h-3" />
                              {formatBytes(projectEnv.totalSizeBytes)}
                            </span>
                            <span>{projectEnv.fileCount} fichiers</span>
                          </div>
                        )}
                      </div>
                      {projectEnv.hasPackageJson && (
                        <div className="mt-1 text-xs text-blue-400">
                          package.json présent
                        </div>
                      )}
                    </div>
                  )}

                  {/* Installed Packages */}
                  {projectEnv.installedPackages.length > 0 && (
                    <div className="mt-2">
                      <div className="text-xs text-gray-400 mb-1">Packages installés ({projectEnv.installedPackages.length}):</div>
                      <div className="flex flex-wrap gap-1">
                        {projectEnv.installedPackages.slice(0, 20).map((pkg, idx) => (
                          <span key={idx} className="px-2 py-0.5 bg-gray-700 text-gray-300 text-xs rounded">
                            {pkg}
                          </span>
                        ))}
                        {projectEnv.installedPackages.length > 20 && (
                          <span className="px-2 py-0.5 bg-gray-600 text-gray-400 text-xs rounded">
                            +{projectEnv.installedPackages.length - 20} autres
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* No environment message */}
                  {!projectEnv.hasVenv && !projectEnv.hasNodeModules && (
                    <div className="text-center py-2 text-gray-500 text-sm">
                      Aucun environnement créé. Cliquez sur "Installer tout" pour créer l'environnement.
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-2 text-gray-500 text-sm">
                  Impossible de charger l'environnement
                </div>
              )}
            </div>
          )}

          {/* Server Environment Status */}
          {showEnvStatus && envStatus && (
            <div className="mb-4 p-3 bg-gray-700/30 rounded-lg border border-gray-600">
              <div className="flex items-center gap-2 mb-2">
                <Server className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-medium text-white">Environnement serveur</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-2">
                  {envStatus.pythonAvailable ? (
                    <Check className="w-3 h-3 text-green-400" />
                  ) : (
                    <X className="w-3 h-3 text-red-400" />
                  )}
                  <span className={envStatus.pythonAvailable ? 'text-green-400' : 'text-red-400'}>
                    Python {envStatus.pythonVersion || 'non installé'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {envStatus.nodeAvailable ? (
                    <Check className="w-3 h-3 text-green-400" />
                  ) : (
                    <X className="w-3 h-3 text-red-400" />
                  )}
                  <span className={envStatus.nodeAvailable ? 'text-green-400' : 'text-red-400'}>
                    Node.js {envStatus.nodeVersion || 'non installé'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {envStatus.npmAvailable ? (
                    <Check className="w-3 h-3 text-green-400" />
                  ) : (
                    <X className="w-3 h-3 text-red-400" />
                  )}
                  <span className={envStatus.npmAvailable ? 'text-green-400' : 'text-red-400'}>
                    npm {envStatus.npmVersion || 'non installé'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Runtime Warning */}
          {envStatus && !runtimeAvailable && (
            <div className="mb-4 px-3 py-2 bg-yellow-900/30 border border-yellow-700 rounded-lg text-yellow-400 text-sm flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <strong>{isPython ? 'Python' : 'Node.js/npm'}</strong> n'est pas disponible sur le serveur.
              </div>
            </div>
          )}

          {/* Package Type Info */}
          <div className="mb-4 px-3 py-2 bg-gray-700/50 rounded-lg flex items-center justify-between">
            <div>
              <span className="text-sm text-gray-400">Gestionnaire: </span>
              <span className="text-sm font-medium text-blue-400">
                {DependencyTypeNames[defaultType]}
              </span>
              {envStatus && runtimeAvailable && (
                <span className="ml-2 text-xs text-green-400">(disponible)</span>
              )}
            </div>
            {pendingCount > 0 && (
              <span className="text-xs text-yellow-400 bg-yellow-400/10 px-2 py-1 rounded">
                {pendingCount} en attente
              </span>
            )}
          </div>

          {/* Add Package Form */}
          <div className="mb-4 p-3 bg-gray-700/30 rounded-lg">
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Nom du package (ex: numpy, express)"
                  value={newPackageName}
                  onChange={(e) => setNewPackageName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddPackage()}
                  className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm placeholder-gray-400 focus:outline-none focus:border-blue-500"
                />
                <input
                  type="text"
                  placeholder="Version"
                  value={newPackageVersion}
                  onChange={(e) => setNewPackageVersion(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddPackage()}
                  className="w-24 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm placeholder-gray-400 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleAddPackage}
                  disabled={isAdding || !newPackageName.trim()}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Ajouter
                </button>
                <button
                  onClick={handleInstallAll}
                  disabled={isInstalling || dependencies.length === 0}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isInstalling ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  Installer tout
                </button>
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 px-3 py-2 bg-red-900/30 border border-red-700 rounded-lg text-red-400 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Install Output */}
          {showOutput && installResult && (
            <div className="mb-4 rounded-lg overflow-hidden border border-gray-600">
              <div className="flex items-center justify-between px-3 py-2 bg-gray-700">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-medium text-white">Résultat d'installation</span>
                </div>
                <div className="flex items-center gap-2">
                  {installResult.success ? (
                    <span className="text-xs text-green-400 flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      {installResult.installedCount} installé(s)
                    </span>
                  ) : (
                    <span className="text-xs text-red-400 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {installResult.failedCount > 0 ? `${installResult.failedCount} échec(s)` : 'Erreur'}
                    </span>
                  )}
                  <button onClick={() => setShowOutput(false)} className="p-1 text-gray-400 hover:text-white rounded">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>
              <div className="bg-gray-900 p-3 max-h-40 overflow-y-auto">
                <pre className="text-xs text-gray-300 whitespace-pre-wrap font-mono">
                  {installResult.output || installResult.error || 'Aucune sortie'}
                </pre>
              </div>
            </div>
          )}

          {/* Dependencies List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
            </div>
          ) : dependencies.length === 0 ? (
            <div className="text-center py-6 text-gray-500">
              <Package className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p>Aucun package</p>
              <p className="text-sm mt-1">Ajoutez des dépendances pour commencer</p>
            </div>
          ) : (
            <div className="space-y-2">
              {dependencies.map((dep) => (
                <div
                  key={dep.id}
                  className="flex items-center justify-between px-3 py-2 bg-gray-700/50 rounded-lg group"
                >
                  <div className="flex items-center gap-3">
                    <Package className="w-4 h-4 text-gray-400" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium">{dep.name}</span>
                        {dep.version && <span className="text-xs text-gray-400">@{dep.version}</span>}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        {dep.isInstalled ? (
                          <span className="flex items-center gap-1 text-xs text-green-400">
                            <Check className="w-3 h-3" />
                            Installé
                          </span>
                        ) : (
                          <span className="text-xs text-yellow-400">En attente</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemovePackage(dep.id)}
                    className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-gray-600 rounded opacity-0 group-hover:opacity-100 transition"
                    title="Supprimer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-gray-700 bg-gray-850">
          <p className="text-xs text-gray-500 text-center">
            Les packages sont installés via {DependencyTypeNames[defaultType]} dans {isPython ? 'venv/' : 'node_modules/'}
          </p>
        </div>
      </div>
    </div>
  );
}
