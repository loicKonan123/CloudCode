'use client';

import { useState, useCallback } from 'react';
import {
  GitBranch, GitCommit, GitMerge, Upload, Download, Plus, RefreshCw,
  X, Check, AlertCircle, ChevronDown, ChevronRight, Key, Loader2, Clock,
} from 'lucide-react';
import { gitApi } from '@/lib/api';
import { GitStatus, GitCommit as GitCommitType, GitCredentialInfo } from '@/types';

interface GitPanelProps {
  projectId: string;
  onClose: () => void;
}

type Tab = 'status' | 'commit' | 'history' | 'settings';

export default function GitPanel({ projectId, onClose }: GitPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>('status');
  const [status, setStatus] = useState<GitStatus | null>(null);
  const [commits, setCommits] = useState<GitCommitType[]>([]);
  const [branches, setBranches] = useState<string[]>([]);
  const [credentials, setCredentials] = useState<GitCredentialInfo | null>(null);
  const [commitMessage, setCommitMessage] = useState('');
  const [remoteUrl, setRemoteUrl] = useState('');
  const [newBranch, setNewBranch] = useState('');
  const [tokenInput, setTokenInput] = useState('');
  const [usernameInput, setUsernameInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [showNewBranch, setShowNewBranch] = useState(false);

  const showMsg = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 4000);
  };

  const withLoading = async (fn: () => Promise<void>) => {
    setIsLoading(true);
    try { await fn(); } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } };
      showMsg(err?.response?.data?.error || 'Erreur', 'error');
    } finally { setIsLoading(false); }
  };

  const loadStatus = useCallback(() => withLoading(async () => {
    const res = await gitApi.status(projectId);
    setStatus(res.data);
    if (res.data.remoteUrl) setRemoteUrl(res.data.remoteUrl);
  }), [projectId]);

  const loadHistory = useCallback(() => withLoading(async () => {
    const [logRes, branchRes, credRes] = await Promise.all([
      gitApi.log(projectId),
      gitApi.branches(projectId),
      gitApi.getCredentials(),
    ]);
    setCommits(logRes.data);
    setBranches(branchRes.data.filter(b => !b.includes('->')));
    setCredentials(credRes.data);
  }), [projectId]);

  const handleInit = () => withLoading(async () => {
    await gitApi.init(projectId);
    showMsg('Repo initialisé', 'success');
    loadStatus();
  });

  const handleStageAll = () => withLoading(async () => {
    await gitApi.stageAll(projectId);
    showMsg('Tous les fichiers stagés', 'success');
    loadStatus();
  });

  const handleStageFile = (path: string) => withLoading(async () => {
    await gitApi.stageFile(projectId, path);
    loadStatus();
  });

  const handleUnstageFile = (path: string) => withLoading(async () => {
    await gitApi.unstageFile(projectId, path);
    loadStatus();
  });

  const handleCommit = () => withLoading(async () => {
    if (!commitMessage.trim()) { showMsg('Message de commit requis', 'error'); return; }
    await gitApi.commit(projectId, commitMessage);
    setCommitMessage('');
    showMsg('Commit créé', 'success');
    loadStatus();
  });

  const handlePush = () => withLoading(async () => {
    const branch = status?.branch || 'main';
    await gitApi.push(projectId, branch);
    showMsg(`Push vers ${branch} réussi`, 'success');
    loadStatus();
  });

  const handlePull = () => withLoading(async () => {
    const branch = status?.branch || 'main';
    await gitApi.pull(projectId, branch);
    showMsg(`Pull depuis ${branch} réussi`, 'success');
    loadStatus();
  });

  const handleSetRemote = () => withLoading(async () => {
    if (!remoteUrl.trim()) { showMsg('URL requise', 'error'); return; }
    await gitApi.setRemote(projectId, remoteUrl);
    showMsg('Remote configuré', 'success');
    loadStatus();
  });

  const handleCheckout = (branch: string) => withLoading(async () => {
    await gitApi.checkout(projectId, branch, false);
    showMsg(`Basculé sur ${branch}`, 'success');
    loadStatus();
    loadHistory();
  });

  const handleCreateBranch = () => withLoading(async () => {
    if (!newBranch.trim()) return;
    await gitApi.checkout(projectId, newBranch, true);
    setNewBranch('');
    setShowNewBranch(false);
    showMsg(`Branche '${newBranch}' créée`, 'success');
    loadHistory();
  });

  const handleSaveCredentials = () => withLoading(async () => {
    if (!tokenInput || !usernameInput) { showMsg('Username et token requis', 'error'); return; }
    await gitApi.saveCredentials('github', tokenInput, usernameInput);
    setTokenInput('');
    setCredentials({ provider: 'github', username: usernameInput });
    showMsg('Credentials sauvegardés', 'success');
  });

  const handleDeleteCredentials = () => withLoading(async () => {
    await gitApi.deleteCredentials();
    setCredentials(null);
    showMsg('Credentials supprimés', 'success');
  });

  const statusColor = (s: string) => ({
    'M': 'text-yellow-400', 'A': 'text-green-400', 'D': 'text-red-400',
    'R': 'text-blue-400', '?': 'text-gray-400',
  }[s] ?? 'text-gray-400');

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'status', label: 'Status', icon: <GitBranch className="w-3.5 h-3.5" /> },
    { id: 'commit', label: 'Commit', icon: <GitCommit className="w-3.5 h-3.5" /> },
    { id: 'history', label: 'Historique', icon: <Clock className="w-3.5 h-3.5" /> },
    { id: 'settings', label: 'Config', icon: <Key className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="w-80 bg-gray-900 border-r border-gray-700 flex flex-col flex-shrink-0 h-full">
      {/* Header */}
      <div className="h-10 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-3 flex-shrink-0">
        <div className="flex items-center gap-2">
          <GitBranch className="w-4 h-4 text-purple-400" />
          <span className="text-sm font-medium text-gray-200">Git</span>
          {status?.branch && (
            <span className="text-xs bg-purple-600/30 text-purple-300 px-1.5 py-0.5 rounded">
              {status.branch}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-400" />}
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Message banner */}
      {message && (
        <div className={`px-3 py-2 text-xs flex items-center gap-2 flex-shrink-0 ${
          message.type === 'success' ? 'bg-green-900/50 text-green-300' : 'bg-red-900/50 text-red-300'
        }`}>
          {message.type === 'success' ? <Check className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
          {message.text}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-700 flex-shrink-0">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              if (tab.id === 'status') loadStatus();
              if (tab.id === 'history') loadHistory();
            }}
            className={`flex-1 flex items-center justify-center gap-1 py-2 text-xs transition ${
              activeTab === tab.id
                ? 'text-purple-300 border-b-2 border-purple-400'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">

        {/* ─── Status Tab ─── */}
        {activeTab === 'status' && (
          <div className="p-3 space-y-3">
            {!status ? (
              <button
                onClick={loadStatus}
                className="w-full flex items-center justify-center gap-2 py-2 bg-purple-600/20 text-purple-300 hover:bg-purple-600/30 rounded text-sm transition"
              >
                <RefreshCw className="w-4 h-4" /> Charger le status
              </button>
            ) : !status.isRepo ? (
              <div className="text-center space-y-3">
                <p className="text-sm text-gray-400">Ce projet n&apos;est pas un repo Git.</p>
                <button
                  onClick={handleInit}
                  className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white rounded text-sm transition"
                >
                  Initialiser le repo
                </button>
              </div>
            ) : (
              <>
                {/* Remote info */}
                {status.remoteUrl && (
                  <div className="text-xs text-gray-500 truncate" title={status.remoteUrl}>
                    Remote: {status.remoteUrl}
                  </div>
                )}
                {(status.aheadBy > 0 || status.behindBy > 0) && (
                  <div className="flex gap-2 text-xs">
                    {status.aheadBy > 0 && <span className="text-green-400">↑ {status.aheadBy} commits à pousser</span>}
                    {status.behindBy > 0 && <span className="text-orange-400">↓ {status.behindBy} commits à tirer</span>}
                  </div>
                )}

                {/* Push/Pull buttons */}
                <div className="flex gap-2">
                  <button onClick={handlePush} className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded text-xs transition">
                    <Upload className="w-3 h-3" /> Push
                  </button>
                  <button onClick={handlePull} className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded text-xs transition">
                    <Download className="w-3 h-3" /> Pull
                  </button>
                  <button onClick={loadStatus} className="p-1.5 bg-gray-700 hover:bg-gray-600 text-gray-400 rounded transition">
                    <RefreshCw className="w-3 h-3" />
                  </button>
                </div>

                {/* Staged files */}
                {status.staged.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-400 font-medium">Stagés ({status.staged.length})</span>
                    </div>
                    {status.staged.map(f => (
                      <div key={f.path} className="flex items-center gap-2 py-0.5 group">
                        <span className={`text-xs font-mono w-4 ${statusColor(f.status)}`}>{f.status}</span>
                        <span className="text-xs text-gray-300 truncate flex-1">{f.path}</span>
                        <button onClick={() => handleUnstageFile(f.path)} className="hidden group-hover:block text-gray-500 hover:text-red-400">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Unstaged files */}
                {status.unstaged.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-400 font-medium">Modifiés ({status.unstaged.length})</span>
                      <button onClick={handleStageAll} className="text-xs text-purple-400 hover:text-purple-300">
                        Tout stager
                      </button>
                    </div>
                    {status.unstaged.map(f => (
                      <div key={f.path} className="flex items-center gap-2 py-0.5 group">
                        <span className={`text-xs font-mono w-4 ${statusColor(f.status)}`}>{f.status}</span>
                        <span className="text-xs text-gray-300 truncate flex-1">{f.path}</span>
                        <button onClick={() => handleStageFile(f.path)} className="hidden group-hover:flex items-center text-gray-500 hover:text-green-400">
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Untracked */}
                {status.untracked.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-400 font-medium">Non suivis ({status.untracked.length})</span>
                    </div>
                    {status.untracked.map(f => (
                      <div key={f.path} className="flex items-center gap-2 py-0.5 group">
                        <span className="text-xs font-mono w-4 text-gray-500">?</span>
                        <span className="text-xs text-gray-500 truncate flex-1">{f.path}</span>
                        <button onClick={() => handleStageFile(f.path)} className="hidden group-hover:flex items-center text-gray-500 hover:text-green-400">
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {status.staged.length === 0 && status.unstaged.length === 0 && status.untracked.length === 0 && (
                  <p className="text-xs text-gray-500 text-center py-4">Working tree propre</p>
                )}
              </>
            )}
          </div>
        )}

        {/* ─── Commit Tab ─── */}
        {activeTab === 'commit' && (
          <div className="p-3 space-y-3">
            <textarea
              value={commitMessage}
              onChange={e => setCommitMessage(e.target.value)}
              placeholder="Message de commit..."
              rows={4}
              className="w-full bg-gray-800 text-gray-200 text-sm rounded p-2 border border-gray-600 focus:outline-none focus:border-purple-500 placeholder-gray-500 resize-none"
            />
            <button
              onClick={handleCommit}
              disabled={!commitMessage.trim() || isLoading}
              className="w-full py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded text-sm transition flex items-center justify-center gap-2"
            >
              <GitCommit className="w-4 h-4" />
              Commiter
            </button>

            <div className="border-t border-gray-700 pt-3">
              <p className="text-xs text-gray-500 mb-2">Remote origin URL</p>
              <div className="flex gap-2">
                <input
                  value={remoteUrl}
                  onChange={e => setRemoteUrl(e.target.value)}
                  placeholder="https://github.com/user/repo.git"
                  className="flex-1 bg-gray-800 text-gray-200 text-xs rounded px-2 py-1.5 border border-gray-600 focus:outline-none focus:border-purple-500 placeholder-gray-500"
                />
                <button
                  onClick={handleSetRemote}
                  disabled={!remoteUrl.trim()}
                  className="px-2 py-1.5 bg-gray-700 hover:bg-gray-600 disabled:opacity-40 text-gray-200 rounded text-xs transition"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── History Tab ─── */}
        {activeTab === 'history' && (
          <div className="p-3 space-y-3">
            {/* Branches */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-400 font-medium flex items-center gap-1">
                  <GitMerge className="w-3 h-3" /> Branches
                </span>
                <button
                  onClick={() => setShowNewBranch(!showNewBranch)}
                  className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Nouvelle
                </button>
              </div>

              {showNewBranch && (
                <div className="flex gap-2 mb-2">
                  <input
                    value={newBranch}
                    onChange={e => setNewBranch(e.target.value)}
                    placeholder="nom-branche"
                    onKeyDown={e => e.key === 'Enter' && handleCreateBranch()}
                    className="flex-1 bg-gray-800 text-gray-200 text-xs rounded px-2 py-1 border border-gray-600 focus:outline-none focus:border-purple-500 placeholder-gray-500"
                  />
                  <button onClick={handleCreateBranch} className="px-2 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded text-xs">
                    Créer
                  </button>
                </div>
              )}

              {branches.length === 0 ? (
                <button onClick={loadHistory} className="text-xs text-gray-500 hover:text-gray-300">
                  Charger les branches
                </button>
              ) : (
                branches.map(b => (
                  <button
                    key={b}
                    onClick={() => handleCheckout(b)}
                    className={`w-full flex items-center gap-2 px-2 py-1 rounded text-xs transition mb-0.5 ${
                      b === status?.branch
                        ? 'bg-purple-600/30 text-purple-300'
                        : 'hover:bg-gray-800 text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    <GitBranch className="w-3 h-3" />
                    {b}
                    {b === status?.branch && <Check className="w-3 h-3 ml-auto" />}
                  </button>
                ))
              )}
            </div>

            {/* Commits */}
            <div className="border-t border-gray-700 pt-3">
              <p className="text-xs text-gray-400 font-medium mb-2">Derniers commits</p>
              {commits.length === 0 ? (
                <button onClick={loadHistory} className="text-xs text-gray-500 hover:text-gray-300">
                  Charger l&apos;historique
                </button>
              ) : (
                commits.map(c => (
                  <div key={c.hash} className="flex items-start gap-2 py-1.5 border-b border-gray-800 last:border-0">
                    <span className="text-xs font-mono text-purple-400 flex-shrink-0">{c.shortHash}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-300 truncate">{c.message}</p>
                      <p className="text-xs text-gray-600">{c.author} · {c.date}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ─── Settings Tab ─── */}
        {activeTab === 'settings' && (
          <div className="p-3 space-y-4">
            <div>
              <p className="text-xs text-gray-400 font-medium mb-2 flex items-center gap-1">
                <Key className="w-3 h-3" /> GitHub / GitLab Personal Access Token
              </p>

              {credentials ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 p-2 bg-green-900/20 rounded text-xs text-green-300">
                    <Check className="w-3 h-3" />
                    Connecté en tant que <strong>{credentials.username}</strong> ({credentials.provider})
                  </div>
                  <button
                    onClick={handleDeleteCredentials}
                    className="w-full py-1.5 bg-red-900/30 hover:bg-red-900/50 text-red-400 rounded text-xs transition"
                  >
                    Supprimer le token
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <input
                    value={usernameInput}
                    onChange={e => setUsernameInput(e.target.value)}
                    placeholder="Username GitHub/GitLab"
                    className="w-full bg-gray-800 text-gray-200 text-sm rounded px-2 py-1.5 border border-gray-600 focus:outline-none focus:border-purple-500 placeholder-gray-500"
                  />
                  <input
                    value={tokenInput}
                    onChange={e => setTokenInput(e.target.value)}
                    type="password"
                    placeholder="ghp_xxxxxxxxxxxx"
                    className="w-full bg-gray-800 text-gray-200 text-sm rounded px-2 py-1.5 border border-gray-600 focus:outline-none focus:border-purple-500 placeholder-gray-500"
                  />
                  <button
                    onClick={handleSaveCredentials}
                    disabled={!tokenInput || !usernameInput}
                    className="w-full py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white rounded text-sm transition"
                  >
                    Sauvegarder
                  </button>
                  <p className="text-xs text-gray-600">
                    Nécessaire pour push/pull. Le token est stocké côté serveur.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
