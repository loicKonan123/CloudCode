import type { Monaco } from '@monaco-editor/react';
import type * as monacoEditor from 'monaco-editor';

import { registerPythonCompletions } from './python';
import { registerCSharpCompletions } from './csharp';
import { registerJavaCompletions } from './java';
import { registerCppCompletions } from './cpp';
import { registerGoCompletions } from './go';
import { registerRustCompletions } from './rust';
import { registerRubyCompletions } from './ruby';
import { registerPhpCompletions } from './php';

let disposables: monacoEditor.IDisposable[] = [];

export function registerAllCompletionProviders(monaco: Monaco): void {
  // Clean up any existing providers
  disposables.forEach((d) => d.dispose());
  disposables = [];

  // Register providers for all supported languages
  disposables.push(registerPythonCompletions(monaco));
  disposables.push(registerCSharpCompletions(monaco));
  disposables.push(registerJavaCompletions(monaco));
  disposables.push(registerCppCompletions(monaco));
  disposables.push(registerGoCompletions(monaco));
  disposables.push(registerRustCompletions(monaco));
  disposables.push(registerRubyCompletions(monaco));
  disposables.push(registerPhpCompletions(monaco));
}

export function disposeAllCompletionProviders(): void {
  disposables.forEach((d) => d.dispose());
  disposables = [];
}
