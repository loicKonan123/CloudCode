'use client';

import { useState } from 'react';
import { projectsApi, filesApi } from '@/lib/api';
import { ProgrammingLanguage, LanguageNames, CreateProjectDto } from '@/types';
import { projectTemplates, ProjectTemplate, getTemplatesByLanguage } from '@/lib/templates';
import { X, Loader2, FileCode, ChevronRight, Sparkles } from 'lucide-react';

interface Props {
  onClose: () => void;
  onCreated: (projectId?: string) => void;
}

type Step = 'template' | 'details';

export default function CreateProjectModal({ onClose, onCreated }: Props) {
  const [step, setStep] = useState<Step>('template');
  const [selectedTemplate, setSelectedTemplate] = useState<ProjectTemplate | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [language, setLanguage] = useState<ProgrammingLanguage>(ProgrammingLanguage.JavaScript);
  const [isPublic, setIsPublic] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSelectTemplate = (template: ProjectTemplate | null) => {
    setSelectedTemplate(template);
    if (template) {
      setLanguage(template.language);
      setName(template.name.replace(/\s+/g, '-').toLowerCase());
    }
    setStep('details');
  };

  const handleBack = () => {
    setStep('template');
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Le nom du projet est requis');
      return;
    }

    try {
      setIsLoading(true);

      // 1. Creer le projet
      const data: CreateProjectDto = {
        name: name.trim(),
        description: description.trim() || undefined,
        language,
        isPublic,
      };
      const projectResponse = await projectsApi.create(data);
      const projectId = projectResponse.data.id;

      // 2. Si un template est selectionne, creer les fichiers
      if (selectedTemplate) {
        for (const file of selectedTemplate.files) {
          await createFileFromTemplate(projectId, file, null);
        }
      }

      onCreated(projectId);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la creation');
    } finally {
      setIsLoading(false);
    }
  };

  const createFileFromTemplate = async (
    projectId: string,
    file: { name: string; content?: string; isFolder?: boolean; children?: any[] },
    parentId: string | null
  ) => {
    const response = await filesApi.create(projectId, {
      name: file.name,
      content: file.content || '',
      isFolder: file.isFolder || false,
      parentId: parentId || undefined,
    });

    // Si c'est un dossier avec des enfants, creer recursivement
    if (file.isFolder && file.children) {
      for (const child of file.children) {
        await createFileFromTemplate(projectId, child, response.data.id);
      }
    }
  };

  // Grouper les templates par langage
  const templatesByLanguage = [
    { name: 'JavaScript', icon: '🟨', templates: getTemplatesByLanguage(ProgrammingLanguage.JavaScript) },
    { name: 'Python', icon: '🐍', templates: getTemplatesByLanguage(ProgrammingLanguage.Python) },
    { name: 'TypeScript', icon: '💙', templates: getTemplatesByLanguage(ProgrammingLanguage.TypeScript) },
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div
        className="rounded-2xl w-full border shadow-2xl overflow-hidden"
        style={{
          maxWidth: step === 'template' ? '800px' : '480px',
          backgroundColor: 'var(--bg-secondary)',
          borderColor: 'var(--border)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-3">
            {step === 'details' && selectedTemplate && (
              <button
                onClick={handleBack}
                className="p-1 rounded-lg transition"
                style={{ color: 'var(--text-muted)' }}
              >
                <ChevronRight className="w-5 h-5 rotate-180" />
              </button>
            )}
            <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
              {step === 'template' ? 'Choisir un template' : 'Nouveau Projet'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg transition hover:bg-[var(--bg-hover)]"
            style={{ color: 'var(--text-muted)' }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {step === 'template' ? (
          <div className="p-5 max-h-[70vh] overflow-y-auto">
            {/* Projet vide */}
            <div className="mb-6">
              <button
                onClick={() => handleSelectTemplate(null)}
                className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-dashed transition group"
                style={{ borderColor: 'var(--border)' }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                  style={{ backgroundColor: 'var(--bg-tertiary)' }}
                >
                  <FileCode className="w-6 h-6" style={{ color: 'var(--text-muted)' }} />
                </div>
                <div className="text-left">
                  <h3 className="font-medium" style={{ color: 'var(--text-primary)' }}>Projet vide</h3>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Commencer de zero</p>
                </div>
                <ChevronRight className="w-5 h-5 ml-auto" style={{ color: 'var(--text-muted)' }} />
              </button>
            </div>

            {/* Templates par langage */}
            {templatesByLanguage.map((group) => (
              <div key={group.name} className="mb-6">
                <h3 className="flex items-center gap-2 text-sm font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>
                  <span>{group.icon}</span>
                  {group.name}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {group.templates.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => handleSelectTemplate(template)}
                      className="flex items-start gap-3 p-4 rounded-xl border transition text-left group hover:border-[var(--primary)]"
                      style={{ borderColor: 'var(--border)' }}
                    >
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                        style={{ backgroundColor: 'var(--bg-tertiary)' }}
                      >
                        {template.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                          {template.name}
                        </h4>
                        <p className="text-xs line-clamp-2" style={{ color: 'var(--text-muted)' }}>
                          {template.description}
                        </p>
                        <div className="flex gap-1 mt-2">
                          {template.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="px-1.5 py-0.5 text-[10px] rounded"
                              style={{ backgroundColor: 'var(--bg-hover)', color: 'var(--text-muted)' }}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-5">
            {/* Template selectionne */}
            {selectedTemplate && (
              <div
                className="flex items-center gap-3 p-3 rounded-lg border"
                style={{ backgroundColor: 'var(--primary-light)', borderColor: 'var(--primary)' }}
              >
                <Sparkles className="w-5 h-5" style={{ color: 'var(--primary)' }} />
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    Template: {selectedTemplate.name}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {selectedTemplate.files.length} fichier(s) seront crees
                  </p>
                </div>
              </div>
            )}

            {error && (
              <div
                className="p-3 rounded-lg text-sm"
                style={{ backgroundColor: 'rgba(248, 81, 73, 0.1)', borderColor: 'var(--error)', color: 'var(--error)' }}
              >
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Nom du projet *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2"
                style={{
                  backgroundColor: 'var(--bg-input)',
                  borderColor: 'var(--border)',
                  color: 'var(--text-primary)',
                }}
                placeholder="mon-projet"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-3 rounded-lg resize-none focus:outline-none focus:ring-2"
                style={{
                  backgroundColor: 'var(--bg-input)',
                  borderColor: 'var(--border)',
                  color: 'var(--text-primary)',
                }}
                placeholder="Description du projet..."
                rows={3}
              />
            </div>

            {!selectedTemplate && (
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Langage
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(Number(e.target.value) as ProgrammingLanguage)}
                  className="w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2"
                  style={{
                    backgroundColor: 'var(--bg-input)',
                    borderColor: 'var(--border)',
                    color: 'var(--text-primary)',
                  }}
                >
                  {Object.entries(LanguageNames).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isPublic"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="w-4 h-4 rounded"
              />
              <label htmlFor="isPublic" className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Projet public (visible par tous)
              </label>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={selectedTemplate ? handleBack : onClose}
                className="px-4 py-2 transition"
                style={{ color: 'var(--text-secondary)' }}
              >
                {selectedTemplate ? 'Retour' : 'Annuler'}
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-2 text-white font-medium rounded-lg transition flex items-center gap-2 disabled:opacity-50"
                style={{ backgroundColor: 'var(--primary)' }}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creation...
                  </>
                ) : (
                  'Creer le projet'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
