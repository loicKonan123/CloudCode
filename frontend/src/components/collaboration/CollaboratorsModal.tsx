'use client';

import { useState, useEffect } from 'react';
import { collaborationsApi } from '@/lib/api';
import { Collaborator, CollaboratorRole } from '@/types';
import { X, Loader2, UserPlus, Trash2, Crown, Edit3, Eye } from 'lucide-react';

interface Props {
  projectId: string;
  isOwner: boolean;
  onClose: () => void;
}

const RoleNames: Record<CollaboratorRole, string> = {
  [CollaboratorRole.Read]: 'Lecture',
  [CollaboratorRole.Write]: 'Écriture',
  [CollaboratorRole.Admin]: 'Admin',
};

const RoleIcons: Record<CollaboratorRole, React.ReactNode> = {
  [CollaboratorRole.Read]: <Eye className="w-4 h-4" />,
  [CollaboratorRole.Write]: <Edit3 className="w-4 h-4" />,
  [CollaboratorRole.Admin]: <Crown className="w-4 h-4" />,
};

const RoleColors: Record<CollaboratorRole, string> = {
  [CollaboratorRole.Read]: 'text-gray-400 bg-gray-700',
  [CollaboratorRole.Write]: 'text-blue-400 bg-blue-900/30',
  [CollaboratorRole.Admin]: 'text-yellow-400 bg-yellow-900/30',
};

export default function CollaboratorsModal({ projectId, isOwner, onClose }: Props) {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Invite form
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<CollaboratorRole>(CollaboratorRole.Write);
  const [isInviting, setIsInviting] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState('');

  useEffect(() => {
    loadCollaborators();
  }, [projectId]);

  const loadCollaborators = async () => {
    try {
      setIsLoading(true);
      setError('');
      const response = await collaborationsApi.getCollaborators(projectId);
      setCollaborators(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors du chargement des collaborateurs');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    try {
      setIsInviting(true);
      setInviteError('');
      setInviteSuccess('');

      await collaborationsApi.invite(projectId, inviteEmail.trim(), inviteRole);

      setInviteSuccess(`Invitation envoyée à ${inviteEmail}`);
      setInviteEmail('');
      setShowInviteForm(false);
      await loadCollaborators();
    } catch (err: any) {
      setInviteError(err.response?.data?.message || 'Erreur lors de l\'invitation');
    } finally {
      setIsInviting(false);
    }
  };

  const handleUpdateRole = async (userId: string, newRole: CollaboratorRole) => {
    try {
      await collaborationsApi.updateRole(projectId, userId, newRole);
      await loadCollaborators();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la mise à jour du rôle');
    }
  };

  const handleRemove = async (userId: string, username: string) => {
    if (!confirm(`Retirer "${username}" du projet ?`)) return;

    try {
      await collaborationsApi.remove(projectId, userId);
      await loadCollaborators();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la suppression');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-2xl w-full max-w-lg border border-gray-700 shadow-xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white">Collaborateurs</h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* Success message */}
          {inviteSuccess && (
            <div className="mb-4 p-3 bg-green-500/10 border border-green-500/50 rounded-lg text-green-400 text-sm">
              {inviteSuccess}
            </div>
          )}

          {/* Error messages */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Invite button */}
          {isOwner && !showInviteForm && (
            <button
              onClick={() => setShowInviteForm(true)}
              className="w-full mb-4 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition"
            >
              <UserPlus className="w-5 h-5" />
              Inviter un collaborateur
            </button>
          )}

          {/* Invite form */}
          {showInviteForm && (
            <form onSubmit={handleInvite} className="mb-4 p-4 bg-gray-900 rounded-lg border border-gray-600">
              <h3 className="text-sm font-medium text-gray-300 mb-3">Nouvelle invitation</h3>

              {inviteError && (
                <div className="mb-3 p-2 bg-red-500/10 border border-red-500/50 rounded text-red-400 text-sm">
                  {inviteError}
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Email</label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="collaborateur@exemple.com"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">Rôle</label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(Number(e.target.value) as CollaboratorRole)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={CollaboratorRole.Read}>Lecture seule</option>
                    <option value={CollaboratorRole.Write}>Lecture et écriture</option>
                    <option value={CollaboratorRole.Admin}>Administrateur</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowInviteForm(false);
                      setInviteError('');
                    }}
                    className="flex-1 px-3 py-2 text-gray-300 hover:text-white transition"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={isInviting}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50"
                  >
                    {isInviting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <UserPlus className="w-4 h-4" />
                    )}
                    Inviter
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Collaborators list */}
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
            </div>
          ) : collaborators.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <UserPlus className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Aucun collaborateur</p>
              <p className="text-sm mt-1">Invitez des personnes pour travailler ensemble</p>
            </div>
          ) : (
            <div className="space-y-2">
              {collaborators.map((collab) => (
                <div
                  key={collab.id}
                  className="flex items-center justify-between p-3 bg-gray-900 rounded-lg border border-gray-700"
                >
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                      {collab.username.charAt(0).toUpperCase()}
                    </div>

                    {/* Info */}
                    <div>
                      <div className="font-medium text-white">{collab.username}</div>
                      <div className="text-sm text-gray-400">{collab.email}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Role badge */}
                    {isOwner ? (
                      <select
                        value={collab.role}
                        onChange={(e) => handleUpdateRole(collab.userId, Number(e.target.value) as CollaboratorRole)}
                        className={`px-2 py-1 rounded text-sm ${RoleColors[collab.role]} border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      >
                        <option value={CollaboratorRole.Read}>Lecture</option>
                        <option value={CollaboratorRole.Write}>Écriture</option>
                        <option value={CollaboratorRole.Admin}>Admin</option>
                      </select>
                    ) : (
                      <span className={`flex items-center gap-1 px-2 py-1 rounded text-sm ${RoleColors[collab.role]}`}>
                        {RoleIcons[collab.role]}
                        {RoleNames[collab.role]}
                      </span>
                    )}

                    {/* Remove button */}
                    {isOwner && (
                      <button
                        onClick={() => handleRemove(collab.userId, collab.username)}
                        className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-900/30 rounded transition"
                        title="Retirer du projet"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700">
          <p className="text-xs text-gray-500 text-center">
            Les collaborateurs peuvent voir et modifier les fichiers du projet en temps réel
          </p>
        </div>
      </div>
    </div>
  );
}
