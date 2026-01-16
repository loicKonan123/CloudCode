'use client';

import { useState, useEffect } from 'react';
import { dependenciesApi } from '@/lib/api';
import { Dependency, DependencyType, DependencyTypeNames } from '@/types';
import { Package, Plus, Trash2, Loader2, X, Check } from 'lucide-react';

interface PackageManagerProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function PackageManager({ projectId, isOpen, onClose }: PackageManagerProps) {
  const [dependencies, setDependencies] = useState<Dependency[]>([]);
  const [defaultType, setDefaultType] = useState<DependencyType>(DependencyType.Pip);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newPackageName, setNewPackageName] = useState('');
  const [newPackageVersion, setNewPackageVersion] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadDependencies();
    }
  }, [isOpen, projectId]);

  const loadDependencies = async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('Loading dependencies for project:', projectId);
      const response = await dependenciesApi.getProjectDependencies(projectId);
      console.log('Dependencies loaded:', response.data);
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

  const handleAddPackage = async () => {
    if (!newPackageName.trim()) return;

    try {
      setIsAdding(true);
      setError(null);
      console.log('Adding package:', newPackageName, 'to project:', projectId);
      const response = await dependenciesApi.add(projectId, {
        name: newPackageName.trim(),
        version: newPackageVersion.trim() || undefined,
      });
      console.log('Package added:', response.data);
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-semibold text-white">Gestionnaire de packages</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Package Type Info */}
          <div className="mb-4 px-3 py-2 bg-gray-700/50 rounded-lg">
            <span className="text-sm text-gray-400">Gestionnaire de packages: </span>
            <span className="text-sm font-medium text-blue-400">
              {DependencyTypeNames[defaultType]}
            </span>
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
                  placeholder="Version (optionnel)"
                  value={newPackageVersion}
                  onChange={(e) => setNewPackageVersion(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddPackage()}
                  className="w-28 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm placeholder-gray-400 focus:outline-none focus:border-blue-500"
                />
              </div>
              <button
                onClick={handleAddPackage}
                disabled={isAdding || !newPackageName.trim()}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAdding ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                Ajouter
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 px-3 py-2 bg-red-900/30 border border-red-700 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Dependencies List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
            </div>
          ) : dependencies.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Aucun package installé</p>
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
                        {dep.version && (
                          <span className="text-xs text-gray-400">@{dep.version}</span>
                        )}
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
        <div className="p-4 border-t border-gray-700 bg-gray-850">
          <p className="text-xs text-gray-500 text-center">
            Les packages seront installés automatiquement lors de l'exécution du code
          </p>
        </div>
      </div>
    </div>
  );
}
