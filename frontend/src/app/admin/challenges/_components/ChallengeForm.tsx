'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChallengeDifficulty, ChallengeLanguage, CreateChallengeDto, CreateTestCaseDto, ChallengeDetail } from '@/types';

interface ChallengeFormProps {
  initial?: ChallengeDetail;
  onSubmit: (data: CreateChallengeDto) => Promise<void>;
  isSubmitting: boolean;
}

interface TestCaseForm extends CreateTestCaseDto {
  _id: number;
}

const emptyTestCase = (orderIndex: number, id: number): TestCaseForm => ({
  _id: id,
  input: '',
  expectedOutput: '',
  isHidden: false,
  orderIndex,
  description: '',
});

export default function ChallengeForm({ initial, onSubmit, isSubmitting }: ChallengeFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initial?.title ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [difficulty, setDifficulty] = useState<ChallengeDifficulty>(initial?.difficulty ?? ChallengeDifficulty.Easy);
  const [supportedLanguages, setSupportedLanguages] = useState<ChallengeLanguage>(initial?.supportedLanguages ?? ChallengeLanguage.Both);
  const [starterPython, setStarterPython] = useState(initial?.starterCodePython ?? 'def solution():\n    pass\n');
  const [starterJS, setStarterJS] = useState(initial?.starterCodeJavaScript ?? 'function solution() {\n    \n}\n');
  const [tagsInput, setTagsInput] = useState(initial?.tags.join(', ') ?? '');
  const [testCases, setTestCases] = useState<TestCaseForm[]>(
    initial?.visibleTestCases.map((tc, i) => ({
      _id: i,
      input: tc.input,
      expectedOutput: tc.expectedOutput,
      isHidden: false,
      orderIndex: tc.orderIndex,
      description: tc.description ?? '',
    })) ?? [emptyTestCase(1, 0)]
  );
  const [nextId, setNextId] = useState(testCases.length);
  const [activeTab, setActiveTab] = useState<'info' | 'code' | 'tests'>('info');
  const [error, setError] = useState('');

  const addTestCase = () => {
    setTestCases(prev => [...prev, emptyTestCase(prev.length + 1, nextId)]);
    setNextId(n => n + 1);
  };

  const removeTestCase = (id: number) => {
    setTestCases(prev => prev.filter(tc => tc._id !== id).map((tc, i) => ({ ...tc, orderIndex: i + 1 })));
  };

  const updateTestCase = (id: number, field: keyof TestCaseForm, value: string | boolean | number) => {
    setTestCases(prev => prev.map(tc => tc._id === id ? { ...tc, [field]: value } : tc));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) { setError('Title is required.'); setActiveTab('info'); return; }
    if (!description.trim()) { setError('Description is required.'); setActiveTab('info'); return; }
    if (testCases.length === 0) { setError('At least one test case is required.'); setActiveTab('tests'); return; }
    const emptyTest = testCases.find(tc => !tc.input.trim() || !tc.expectedOutput.trim());
    if (emptyTest) { setError('All test cases must have an input and an output.'); setActiveTab('tests'); return; }

    const data: CreateChallengeDto = {
      title: title.trim(),
      description: description.trim(),
      difficulty,
      supportedLanguages,
      starterCodePython: starterPython || undefined,
      starterCodeJavaScript: starterJS || undefined,
      tags: tagsInput.split(',').map(t => t.trim()).filter(Boolean),
      testCases: testCases.map(({ _id, ...tc }) => tc),
    };

    await onSubmit(data);
  };

  const tabs = [
    { id: 'info', label: 'Information', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    { id: 'code', label: 'Starter Code', icon: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4' },
    { id: 'tests', label: `Tests (${testCases.length})`, icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
  ] as const;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">{error}</div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-800">
        {tabs.map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors border-b-2 ${
              activeTab === tab.id
                ? 'border-[#3caff6] text-[#3caff6]'
                : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
            </svg>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: Informations */}
      {activeTab === 'info' && (
        <div className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Title *</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="ex: Two Sum"
              className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-[#3caff6]/50 focus:border-[#3caff6] text-sm transition"
            />
          </div>

          {/* Difficulty + Language */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Difficulty</label>
              <div className="flex gap-2">
                {([ChallengeDifficulty.Easy, ChallengeDifficulty.Medium, ChallengeDifficulty.Hard] as const).map(d => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDifficulty(d)}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-colors ${
                      difficulty === d
                        ? d === ChallengeDifficulty.Easy ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                          : d === ChallengeDifficulty.Medium ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                          : 'bg-rose-500/20 border-rose-500/40 text-rose-400'
                        : 'bg-slate-800 border-slate-700 text-slate-500 hover:border-slate-600'
                    }`}
                  >
                    {d === ChallengeDifficulty.Easy ? 'Easy' : d === ChallengeDifficulty.Medium ? 'Medium' : 'Hard'}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Languages</label>
              <div className="flex gap-2">
                {([ChallengeLanguage.Python, ChallengeLanguage.JavaScript, ChallengeLanguage.Both] as const).map(l => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => setSupportedLanguages(l)}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-colors ${
                      supportedLanguages === l
                        ? 'bg-[#3caff6]/20 border-[#3caff6]/40 text-[#3caff6]'
                        : 'bg-slate-800 border-slate-700 text-slate-500 hover:border-slate-600'
                    }`}
                  >
                    {l === ChallengeLanguage.Python ? 'Python' : l === ChallengeLanguage.JavaScript ? 'JS' : 'Both'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Tags <span className="normal-case text-slate-600">(comma-separated)</span></label>
            <input
              value={tagsInput}
              onChange={e => setTagsInput(e.target.value)}
              placeholder="ex: arrays, hash-map, two-pointers"
              className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-[#3caff6]/50 focus:border-[#3caff6] text-sm transition"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Description * <span className="normal-case text-slate-600">(Markdown supported)</span></label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={12}
              placeholder="## Description&#10;&#10;Given an array of integers...&#10;&#10;## Constraints&#10;- 2 ≤ nums.length ≤ 10⁴"
              className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-[#3caff6]/50 focus:border-[#3caff6] text-sm font-mono transition resize-y"
            />
          </div>
        </div>
      )}

      {/* Tab: Starter Code */}
      {activeTab === 'code' && (
        <div className="space-y-6">
          {(supportedLanguages === ChallengeLanguage.Python || supportedLanguages === ChallengeLanguage.Both) && (
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                <span className="text-blue-400">Python</span> — Starter Code
              </label>
              <textarea
                value={starterPython}
                onChange={e => setStarterPython(e.target.value)}
                rows={10}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-[#3caff6] focus:outline-none focus:ring-2 focus:ring-[#3caff6]/50 focus:border-[#3caff6] text-sm font-mono transition resize-y"
              />
            </div>
          )}
          {(supportedLanguages === ChallengeLanguage.JavaScript || supportedLanguages === ChallengeLanguage.Both) && (
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                <span className="text-yellow-400">JavaScript</span> — Starter Code
              </label>
              <textarea
                value={starterJS}
                onChange={e => setStarterJS(e.target.value)}
                rows={10}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-[#3caff6] focus:outline-none focus:ring-2 focus:ring-[#3caff6]/50 focus:border-[#3caff6] text-sm font-mono transition resize-y"
              />
            </div>
          )}
        </div>
      )}

      {/* Tab: Test Cases */}
      {activeTab === 'tests' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500"><span className="text-slate-400 font-medium">Visible</span> tests appear as examples. <span className="text-slate-400 font-medium">Hidden</span> tests are used only for evaluation.</p>
            <button
              type="button"
              onClick={addTestCase}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-bold rounded-lg transition"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add test
            </button>
          </div>

          {testCases.map((tc, i) => (
            <div key={tc._id} className="rounded-xl border border-slate-800 bg-slate-800/30 p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-500 uppercase">Test {i + 1}</span>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <div
                      onClick={() => updateTestCase(tc._id, 'isHidden', !tc.isHidden)}
                      className={`w-8 h-4 rounded-full transition-colors relative ${tc.isHidden ? 'bg-[#3caff6]' : 'bg-slate-700'}`}
                    >
                      <div className={`w-3 h-3 bg-white rounded-full absolute top-0.5 transition-transform ${tc.isHidden ? 'translate-x-4' : 'translate-x-0.5'}`} />
                    </div>
                    <span className="text-xs text-slate-400">Hidden</span>
                  </label>
                </div>
                {testCases.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeTestCase(tc._id)}
                    className="text-slate-600 hover:text-red-400 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Input</label>
                  <textarea
                    value={tc.input}
                    onChange={e => updateTestCase(tc._id, 'input', e.target.value)}
                    rows={3}
                    placeholder="ex: [2,7,11,15]\n9"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-700 focus:outline-none focus:ring-1 focus:ring-[#3caff6]/50 text-xs font-mono resize-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Expected Output</label>
                  <textarea
                    value={tc.expectedOutput}
                    onChange={e => updateTestCase(tc._id, 'expectedOutput', e.target.value)}
                    rows={3}
                    placeholder="ex: [0,1]"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-700 focus:outline-none focus:ring-1 focus:ring-[#3caff6]/50 text-xs font-mono resize-none"
                  />
                </div>
              </div>
              <div className="mt-3">
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Description <span className="normal-case font-normal">(optional)</span></label>
                <input
                  value={tc.description ?? ''}
                  onChange={e => updateTestCase(tc._id, 'description', e.target.value)}
                  placeholder="ex: target = 9, nums = [2,7,11,15]"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-700 focus:outline-none focus:ring-1 focus:ring-[#3caff6]/50 text-xs"
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer actions */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-800">
        <button
          type="button"
          onClick={() => router.push('/admin/challenges')}
          className="px-5 py-2.5 text-sm font-medium text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center gap-2 px-6 py-2.5 bg-[#3caff6] hover:bg-[#3caff6]/90 text-[#101b22] text-sm font-bold rounded-lg transition disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-[#101b22] border-t-transparent rounded-full animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {initial ? 'Save changes' : 'Create challenge'}
            </>
          )}
        </button>
      </div>
    </form>
  );
}
