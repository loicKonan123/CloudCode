import type { Monaco } from '@monaco-editor/react';
import type * as monacoEditor from 'monaco-editor';
import { csharpSnippets } from '../snippets/csharp';
import type { BuiltinFunction } from '../types';

const CSHARP_KEYWORDS = [
  'abstract', 'as', 'base', 'bool', 'break', 'byte', 'case', 'catch',
  'char', 'checked', 'class', 'const', 'continue', 'decimal', 'default',
  'delegate', 'do', 'double', 'else', 'enum', 'event', 'explicit', 'extern',
  'false', 'finally', 'fixed', 'float', 'for', 'foreach', 'goto', 'if',
  'implicit', 'in', 'int', 'interface', 'internal', 'is', 'lock', 'long',
  'namespace', 'new', 'null', 'object', 'operator', 'out', 'override',
  'params', 'private', 'protected', 'public', 'readonly', 'ref', 'return',
  'sbyte', 'sealed', 'short', 'sizeof', 'stackalloc', 'static', 'string',
  'struct', 'switch', 'this', 'throw', 'true', 'try', 'typeof', 'uint',
  'ulong', 'unchecked', 'unsafe', 'ushort', 'using', 'virtual', 'void',
  'volatile', 'while', 'async', 'await', 'var', 'dynamic', 'yield',
  'partial', 'get', 'set', 'add', 'remove', 'value', 'global', 'where',
  'record', 'init', 'required', 'file', 'scoped',
];

const CSHARP_BUILTINS: BuiltinFunction[] = [
  { label: 'Console.WriteLine', detail: 'Console.WriteLine(value)', documentation: 'Writes to standard output with newline' },
  { label: 'Console.Write', detail: 'Console.Write(value)', documentation: 'Writes to standard output' },
  { label: 'Console.ReadLine', detail: 'Console.ReadLine()', documentation: 'Reads a line from standard input' },
  { label: 'Console.ReadKey', detail: 'Console.ReadKey()', documentation: 'Reads a key from standard input' },
  { label: 'Math.Abs', detail: 'Math.Abs(value)', documentation: 'Returns the absolute value' },
  { label: 'Math.Max', detail: 'Math.Max(a, b)', documentation: 'Returns the larger of two values' },
  { label: 'Math.Min', detail: 'Math.Min(a, b)', documentation: 'Returns the smaller of two values' },
  { label: 'Math.Pow', detail: 'Math.Pow(x, y)', documentation: 'Returns x raised to the power y' },
  { label: 'Math.Sqrt', detail: 'Math.Sqrt(d)', documentation: 'Returns the square root' },
  { label: 'Math.Round', detail: 'Math.Round(d, decimals)', documentation: 'Rounds to nearest integer or decimal' },
  { label: 'Math.Floor', detail: 'Math.Floor(d)', documentation: 'Returns the largest integer less than or equal' },
  { label: 'Math.Ceiling', detail: 'Math.Ceiling(d)', documentation: 'Returns the smallest integer greater than or equal' },
  { label: 'String.IsNullOrEmpty', detail: 'String.IsNullOrEmpty(s)', documentation: 'Checks if string is null or empty' },
  { label: 'String.IsNullOrWhiteSpace', detail: 'String.IsNullOrWhiteSpace(s)', documentation: 'Checks if string is null, empty, or whitespace' },
  { label: 'String.Format', detail: 'String.Format(format, args)', documentation: 'Formats a string' },
  { label: 'String.Join', detail: 'String.Join(separator, values)', documentation: 'Concatenates elements with separator' },
  { label: 'int.Parse', detail: 'int.Parse(s)', documentation: 'Converts string to int' },
  { label: 'int.TryParse', detail: 'int.TryParse(s, out result)', documentation: 'Tries to convert string to int' },
  { label: 'Convert.ToInt32', detail: 'Convert.ToInt32(value)', documentation: 'Converts value to Int32' },
  { label: 'Convert.ToString', detail: 'Convert.ToString(value)', documentation: 'Converts value to String' },
  { label: 'DateTime.Now', detail: 'DateTime.Now', documentation: 'Gets the current date and time' },
  { label: 'DateTime.Today', detail: 'DateTime.Today', documentation: 'Gets the current date' },
  { label: 'DateTime.Parse', detail: 'DateTime.Parse(s)', documentation: 'Converts string to DateTime' },
  { label: 'Guid.NewGuid', detail: 'Guid.NewGuid()', documentation: 'Creates a new GUID' },
  { label: 'Task.Run', detail: 'Task.Run(action)', documentation: 'Queues work to run on thread pool' },
  { label: 'Task.Delay', detail: 'Task.Delay(milliseconds)', documentation: 'Creates a task that completes after delay' },
  { label: 'Task.WhenAll', detail: 'Task.WhenAll(tasks)', documentation: 'Creates task that completes when all complete' },
  { label: 'Task.WhenAny', detail: 'Task.WhenAny(tasks)', documentation: 'Creates task that completes when any completes' },
  { label: 'Enumerable.Range', detail: 'Enumerable.Range(start, count)', documentation: 'Generates a sequence of integers' },
  { label: 'Enumerable.Repeat', detail: 'Enumerable.Repeat(element, count)', documentation: 'Generates a repeated sequence' },
];

export function registerCSharpCompletions(monaco: Monaco): monacoEditor.IDisposable {
  return monaco.languages.registerCompletionItemProvider('csharp', {
    triggerCharacters: ['.'],

    provideCompletionItems(model: monacoEditor.editor.ITextModel, position: monacoEditor.Position) {
      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
      };

      const suggestions: monacoEditor.languages.CompletionItem[] = [];

      // Add keywords
      CSHARP_KEYWORDS.forEach((keyword) => {
        suggestions.push({
          label: keyword,
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: keyword,
          range,
          detail: 'keyword',
        });
      });

      // Add built-in functions
      CSHARP_BUILTINS.forEach((builtin) => {
        suggestions.push({
          label: builtin.label,
          kind: monaco.languages.CompletionItemKind.Function,
          insertText: `${builtin.label}($0)`,
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          range,
          detail: builtin.detail,
          documentation: { value: builtin.documentation },
        });
      });

      // Add snippets
      csharpSnippets.forEach((snippet) => {
        suggestions.push({
          label: snippet.prefix,
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: snippet.body,
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          range,
          detail: snippet.description,
          documentation: { value: snippet.documentation || snippet.description },
        });
      });

      return { suggestions };
    },
  });
}
