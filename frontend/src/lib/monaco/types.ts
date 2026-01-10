import type * as monacoEditor from 'monaco-editor';

export interface LanguageSnippet {
  label: string;
  prefix: string;
  body: string;
  description: string;
  documentation?: string;
}

export interface BuiltinFunction {
  label: string;
  detail: string;
  documentation: string;
  insertText?: string;
}

export interface LanguageKeyword {
  label: string;
  kind: monacoEditor.languages.CompletionItemKind;
  detail?: string;
  documentation?: string;
  insertText: string;
}

export type SupportedLanguage =
  | 'python'
  | 'csharp'
  | 'java'
  | 'cpp'
  | 'go'
  | 'rust'
  | 'ruby'
  | 'php';
