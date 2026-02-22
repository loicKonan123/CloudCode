'use client';

import { useState, useEffect } from 'react';
import { environmentApi } from '@/lib/api';
import { EnvironmentVariable } from '@/types';
import {
  Key,
  Plus,
  Trash2,
  Loader2,
  X,
  Eye,
  EyeOff,
  RefreshCw,
  Download,
  AlertCircle,
  Check,
  Pencil,
  Save,
  FileText,
} from 'lucide-react';

interface EnvManagerProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function EnvManager({ projectId, isOpen, onClose }: EnvManagerProps) {
  const [envVars, setEnvVars] = useState<EnvironmentVariable[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // New variable form
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [newIsSecret, setNewIsSecret] = useState(false);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editKey, setEditKey] = useState('');
  const [editValue, setEditValue] = useState('');
  const [editIsSecret, setEditIsSecret] = useState(false);

  // Visibility state for secrets
  const [visibleSecrets, setVisibleSecrets] = useState<Set<string>>(new Set());

  // Show .env file content
  const [showEnvFile, setShowEnvFile] = useState(false);
  const [envFileContent, setEnvFileContent] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadEnvVars();
      setError(null);
      setSuccess(null);
    }
  }, [isOpen, projectId]);

  const loadEnvVars = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await environmentApi.getAll(projectId);
      setEnvVars(response.data);
    } catch (err: any) {
      console.error('Error loading environment variables:', err);
      setError(err.response?.data?.message || 'Erreur lors du chargement');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!newKey.trim()) {
      setError('La clé est requise');
      return;
    }

    try {
      setIsAdding(true);
      setError(null);
      const response = await environmentApi.create(projectId, {
        key: newKey.trim(),
        value: newValue,
        isSecret: newIsSecret,
      });
      setEnvVars([...envVars, response.data]);
      setNewKey('');
      setNewValue('');
      setNewIsSecret(false);
      setSuccess('Variable ajoutée');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de l\'ajout');
    } finally {
      setIsAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setError(null);
      await environmentApi.delete(id);
      setEnvVars(envVars.filter((v) => v.id !== id));
      setSuccess('Variable supprimée');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la suppression');
    }
  };

  const startEdit = (envVar: EnvironmentVariable) => {
    setEditingId(envVar.id);
    setEditKey(envVar.key);
    setEditValue(envVar.isSecret ? '' : envVar.value);
    setEditIsSecret(envVar.isSecret);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditKey('');
    setEditValue('');
    setEditIsSecret(false);
  };

  const handleUpdate = async () => {
    if (!editingId) return;

    try {
      setError(null);
      const response = await environmentApi.update(editingId, {
        key: editKey.trim() || undefined,
        value: editValue || undefined,
        isSecret: editIsSecret,
      });
      setEnvVars(envVars.map((v) => (v.id === editingId ? response.data : v)));
      cancelEdit();
      setSuccess('Variable mise à jour');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la mise à jour');
    }
  };

  const handleSync = async () => {
    try {
      setIsSyncing(true);
      setError(null);
      await environmentApi.syncEnvFile(projectId);
      setSuccess('Fichier .env synchronisé');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la synchronisation');
    } finally {
      setIsSyncing(false);
    }
  };

  const loadEnvFileContent = async () => {
    try {
      const response = await environmentApi.getEnvFileContent(projectId);
      setEnvFileContent(response.data.content);
      setShowEnvFile(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors du chargement du fichier');
    }
  };

  const toggleSecretVisibility = (id: string) => {
    setVisibleSecrets((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <Key className="w-5 h-5 text-yellow-400" />
            <h2 className="text-lg font-semibold text-white">Variables d'environnement</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadEnvFileContent}
              className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition"
              title="Voir le fichier .env"
            >
              <FileText className="w-5 h-5" />
            </button>
            <button
              onClick={handleSync}
              disabled={isSyncing || envVars.length === 0}
              className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition disabled:opacity-50"
              title="Synchroniser le fichier .env"
            >
              {isSyncing ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <RefreshCw className="w-5 h-5" />
              )}
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
          {/* Error/Success Messages */}
          {error && (
            <div className="mb-4 px-3 py-2 bg-red-900/30 border border-red-700 rounded-lg text-red-400 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 px-3 py-2 bg-green-900/30 border border-green-700 rounded-lg text-green-400 text-sm flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" />
              {success}
            </div>
          )}

          {/* .env File Preview */}
          {showEnvFile && (
            <div className="mb-4 rounded-lg overflow-hidden border border-gray-600">
              <div className="flex items-center justify-between px-3 py-2 bg-gray-700">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-medium text-white">.env</span>
                </div>
                <button
                  onClick={() => setShowEnvFile(false)}
                  className="p-1 text-gray-400 hover:text-white rounded"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
              <div className="bg-gray-900 p-3 max-h-40 overflow-y-auto">
                <pre className="text-xs text-gray-300 whitespace-pre-wrap font-mono">
                  {envFileContent || 'Fichier vide'}
                </pre>
              </div>
            </div>
          )}

          {/* Add Variable Form */}
          <div className="mb-4 p-3 bg-gray-700/30 rounded-lg">
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="CLE"
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                  className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm placeholder-gray-400 focus:outline-none focus:border-blue-500 font-mono"
                />
                <input
                  type={newIsSecret ? 'password' : 'text'}
                  placeholder="valeur"
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                  className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm placeholder-gray-400 focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newIsSecret}
                    onChange={(e) => setNewIsSecret(e.target.checked)}
                    className="rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500"
                  />
                  <span className="flex items-center gap-1">
                    <EyeOff className="w-3 h-3" />
                    Secret (masqué)
                  </span>
                </label>
                <button
                  onClick={handleAdd}
                  disabled={isAdding || !newKey.trim()}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Ajouter
                </button>
              </div>
            </div>
          </div>

          {/* Variables List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
            </div>
          ) : envVars.length === 0 ? (
            <div className="text-center py-6 text-gray-500">
              <Key className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p>Aucune variable d'environnement</p>
              <p className="text-sm mt-1">Ajoutez des variables pour configurer votre projet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {envVars.map((envVar) => (
                <div
                  key={envVar.id}
                  className="px-3 py-2 bg-gray-700/50 rounded-lg group"
                >
                  {editingId === envVar.id ? (
                    // Edit Mode
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={editKey}
                          onChange={(e) => setEditKey(e.target.value.toUpperCase())}
                          className="flex-1 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm font-mono focus:outline-none focus:border-blue-500"
                        />
                        <input
                          type={editIsSecret ? 'password' : 'text'}
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          placeholder={envVar.isSecret ? 'Nouvelle valeur...' : ''}
                          className="flex-1 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm font-mono focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={editIsSecret}
                            onChange={(e) => setEditIsSecret(e.target.checked)}
                            className="rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500"
                          />
                          Secret
                        </label>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={cancelEdit}
                            className="px-2 py-1 text-xs text-gray-400 hover:text-white hover:bg-gray-600 rounded transition"
                          >
                            Annuler
                          </button>
                          <button
                            onClick={handleUpdate}
                            className="flex items-center gap-1 px-2 py-1 text-xs bg-green-600 hover:bg-green-700 text-white rounded transition"
                          >
                            <Save className="w-3 h-3" />
                            Enregistrer
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // View Mode
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <Key className="w-4 h-4 text-yellow-400 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-white font-mono font-medium">{envVar.key}</span>
                            {envVar.isSecret && (
                              <span className="px-1.5 py-0.5 text-[10px] bg-purple-900/50 text-purple-400 rounded">
                                SECRET
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1 mt-0.5">
                            <span className="text-sm text-gray-400 font-mono truncate">
                              {envVar.isSecret && !visibleSecrets.has(envVar.id)
                                ? '••••••••'
                                : envVar.value || '(vide)'}
                            </span>
                            {envVar.isSecret && (
                              <button
                                onClick={() => toggleSecretVisibility(envVar.id)}
                                className="p-0.5 text-gray-500 hover:text-gray-300 transition"
                                title={visibleSecrets.has(envVar.id) ? 'Masquer' : 'Afficher'}
                              >
                                {visibleSecrets.has(envVar.id) ? (
                                  <EyeOff className="w-3 h-3" />
                                ) : (
                                  <Eye className="w-3 h-3" />
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                        <button
                          onClick={() => startEdit(envVar)}
                          className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-600 rounded transition"
                          title="Modifier"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(envVar.id)}
                          className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-gray-600 rounded transition"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-gray-700 bg-gray-850">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">
              {envVars.length} variable{envVars.length !== 1 ? 's' : ''}
            </p>
            <button
              onClick={handleSync}
              disabled={isSyncing || envVars.length === 0}
              className="flex items-center gap-2 px-3 py-1.5 text-xs bg-green-600 hover:bg-green-700 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSyncing ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Download className="w-3 h-3" />
              )}
              Synchroniser .env
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
