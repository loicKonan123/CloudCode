'use client';

import { useState, useEffect } from 'react';
import { challengesApi } from '@/lib/api';
import { ChallengeListItem, ChallengeLanguage, CreateCourseDto, CourseDetail } from '@/types';

interface Props {
  initial?: CourseDetail;
  onSubmit: (data: CreateCourseDto) => Promise<void>;
  isSubmitting: boolean;
}

export default function CourseForm({ initial, onSubmit, isSubmitting }: Props) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [language, setLanguage] = useState<ChallengeLanguage>(initial?.language ?? ChallengeLanguage.Python);
  const [orderIndex, setOrderIndex] = useState(initial?.orderIndex ?? 0);
  const [isPublished, setIsPublished] = useState(initial?.isPublished ?? false);
  const [allChallenges, setAllChallenges] = useState<ChallengeListItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>(
    initial?.challenges.map(c => c.id) ?? []
  );
  const [error, setError] = useState('');

  useEffect(() => {
    loadChallenges();
  }, []);

  const loadChallenges = async () => {
    try {
      const res = await challengesApi.adminGetAll();
      setAllChallenges(res.data);
    } catch { }
  };

  // Filter challenges by selected language
  const filteredChallenges = allChallenges.filter(c =>
    c.supportedLanguages === language || c.supportedLanguages === ChallengeLanguage.Both
  );

  const handleLanguageChange = (lang: ChallengeLanguage) => {
    setLanguage(lang);
    setSelectedIds([]); // Reset selection when language changes
  };

  const toggleChallenge = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const moveUp = (idx: number) => {
    if (idx === 0) return;
    const next = [...selectedIds];
    [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
    setSelectedIds(next);
  };

  const moveDown = (idx: number) => {
    if (idx === selectedIds.length - 1) return;
    const next = [...selectedIds];
    [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
    setSelectedIds(next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!title.trim()) { setError('Title is required.'); return; }
    if (!description.trim()) { setError('Description is required.'); return; }
    if (selectedIds.length === 0) { setError('Add at least one challenge.'); return; }
    try {
      await onSubmit({ title, description, language, orderIndex, isPublished, challengeIds: selectedIds });
    } catch (err: any) {
      setError(err.message || 'An error occurred.');
    }
  };

  const selectedChallenges = selectedIds.map(id => allChallenges.find(c => c.id === id)).filter(Boolean) as ChallengeListItem[];
  const availableChallenges = filteredChallenges.filter(c => !selectedIds.includes(c.id));

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">{error}</div>
      )}

      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Title *</label>
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="e.g. Python for Beginners"
          className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#3caff6]/50 focus:border-[#3caff6] text-sm"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Description *</label>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          rows={3}
          placeholder="Describe what students will learn in this course..."
          className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#3caff6]/50 focus:border-[#3caff6] text-sm resize-none"
        />
      </div>

      {/* Language */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Language *</label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => handleLanguageChange(ChallengeLanguage.Python)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
              language === ChallengeLanguage.Python
                ? 'bg-blue-500/20 border-blue-500/50 text-blue-300'
                : 'border-slate-700 text-slate-400 hover:border-slate-600'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-blue-400" />
            Python
          </button>
          <button
            type="button"
            onClick={() => handleLanguageChange(ChallengeLanguage.JavaScript)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
              language === ChallengeLanguage.JavaScript
                ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-300'
                : 'border-slate-700 text-slate-400 hover:border-slate-600'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-yellow-400" />
            JavaScript
          </button>
        </div>
      </div>

      {/* Order + Published */}
      <div className="flex gap-4 items-end">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Order index</label>
          <input
            type="number"
            min={0}
            value={orderIndex}
            onChange={e => setOrderIndex(Number(e.target.value))}
            className="w-24 bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#3caff6]/50 focus:border-[#3caff6] text-sm"
          />
        </div>
        <label className="flex items-center gap-2 cursor-pointer pb-2">
          <div
            onClick={() => setIsPublished(!isPublished)}
            className={`w-10 h-5 rounded-full transition-colors relative ${isPublished ? 'bg-[#3caff6]' : 'bg-slate-700'}`}
          >
            <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${isPublished ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </div>
          <span className="text-sm text-slate-300">Publish immediately</span>
        </label>
      </div>

      {/* Challenge selector */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-3">
          Challenges <span className="text-slate-500 font-normal">({selectedIds.length} selected)</span>
        </label>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Available challenges */}
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-2">Available</p>
            <div className="bg-slate-900/50 border border-slate-700 rounded-lg overflow-hidden max-h-64 overflow-y-auto">
              {availableChallenges.length === 0 ? (
                <p className="text-slate-600 text-sm text-center py-6">All matching challenges added</p>
              ) : (
                availableChallenges.map(c => (
                  <button
                    type="button"
                    key={c.id}
                    onClick={() => toggleChallenge(c.id)}
                    className="w-full text-left px-3 py-2.5 border-b border-slate-800 last:border-0 hover:bg-slate-800/50 transition-colors flex items-center gap-2 group"
                  >
                    <svg className="w-4 h-4 text-slate-600 group-hover:text-[#3caff6] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span className="text-sm text-slate-300 truncate">{c.title}</span>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Selected challenges (ordered) */}
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-2">Course order</p>
            <div className="bg-slate-900/50 border border-slate-700 rounded-lg overflow-hidden max-h-64 overflow-y-auto">
              {selectedChallenges.length === 0 ? (
                <p className="text-slate-600 text-sm text-center py-6">No challenges selected</p>
              ) : (
                selectedChallenges.map((c, idx) => (
                  <div key={c.id} className="flex items-center gap-2 px-3 py-2.5 border-b border-slate-800 last:border-0">
                    <span className="text-xs text-slate-600 w-4 text-center shrink-0">{idx + 1}</span>
                    <span className="text-sm text-slate-300 truncate flex-1">{c.title}</span>
                    <div className="flex gap-0.5 shrink-0">
                      <button type="button" onClick={() => moveUp(idx)} disabled={idx === 0} className="p-1 text-slate-600 hover:text-slate-300 disabled:opacity-30">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                      </button>
                      <button type="button" onClick={() => moveDown(idx)} disabled={idx === selectedChallenges.length - 1} className="p-1 text-slate-600 hover:text-slate-300 disabled:opacity-30">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                      </button>
                      <button type="button" onClick={() => toggleChallenge(c.id)} className="p-1 text-slate-600 hover:text-red-400">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Submit */}
      <div className="flex justify-end gap-3 pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center gap-2 px-6 py-2.5 bg-[#3caff6] text-[#101b22] font-bold rounded-lg hover:bg-[#3caff6]/90 transition disabled:opacity-50 text-sm"
        >
          {isSubmitting && <div className="w-4 h-4 border-2 border-[#101b22] border-t-transparent rounded-full animate-spin" />}
          {isSubmitting ? 'Saving...' : initial ? 'Save changes' : 'Create course'}
        </button>
      </div>
    </form>
  );
}
