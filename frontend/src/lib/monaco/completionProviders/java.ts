import type { Monaco } from '@monaco-editor/react';
import type * as monacoEditor from 'monaco-editor';
import { javaSnippets } from '../snippets/java';
import type { BuiltinFunction } from '../types';

const JAVA_KEYWORDS = [
  'abstract', 'assert', 'boolean', 'break', 'byte', 'case', 'catch', 'char',
  'class', 'const', 'continue', 'default', 'do', 'double', 'else', 'enum',
  'extends', 'final', 'finally', 'float', 'for', 'goto', 'if', 'implements',
  'import', 'instanceof', 'int', 'interface', 'long', 'native', 'new', 'null',
  'package', 'private', 'protected', 'public', 'return', 'short', 'static',
  'strictfp', 'super', 'switch', 'synchronized', 'this', 'throw', 'throws',
  'transient', 'true', 'false', 'try', 'void', 'volatile', 'while', 'var',
  'record', 'sealed', 'permits', 'non-sealed', 'yield',
];

const JAVA_BUILTINS: BuiltinFunction[] = [
  { label: 'System.out.println', detail: 'System.out.println(x)', documentation: 'Print to stdout with newline' },
  { label: 'System.out.print', detail: 'System.out.print(x)', documentation: 'Print to stdout' },
  { label: 'System.out.printf', detail: 'System.out.printf(format, args)', documentation: 'Formatted print' },
  { label: 'System.err.println', detail: 'System.err.println(x)', documentation: 'Print to stderr' },
  { label: 'System.currentTimeMillis', detail: 'System.currentTimeMillis()', documentation: 'Current time in milliseconds' },
  { label: 'System.nanoTime', detail: 'System.nanoTime()', documentation: 'Current time in nanoseconds' },
  { label: 'System.exit', detail: 'System.exit(status)', documentation: 'Terminate the JVM' },
  { label: 'Math.abs', detail: 'Math.abs(a)', documentation: 'Returns absolute value' },
  { label: 'Math.max', detail: 'Math.max(a, b)', documentation: 'Returns the greater of two values' },
  { label: 'Math.min', detail: 'Math.min(a, b)', documentation: 'Returns the smaller of two values' },
  { label: 'Math.pow', detail: 'Math.pow(a, b)', documentation: 'Returns a raised to power b' },
  { label: 'Math.sqrt', detail: 'Math.sqrt(a)', documentation: 'Returns the square root' },
  { label: 'Math.round', detail: 'Math.round(a)', documentation: 'Returns the closest long' },
  { label: 'Math.floor', detail: 'Math.floor(a)', documentation: 'Returns the largest integer less than or equal' },
  { label: 'Math.ceil', detail: 'Math.ceil(a)', documentation: 'Returns the smallest integer greater than or equal' },
  { label: 'Math.random', detail: 'Math.random()', documentation: 'Returns random double [0.0, 1.0)' },
  { label: 'String.valueOf', detail: 'String.valueOf(x)', documentation: 'Converts to string' },
  { label: 'String.format', detail: 'String.format(format, args)', documentation: 'Returns formatted string' },
  { label: 'Integer.parseInt', detail: 'Integer.parseInt(s)', documentation: 'Parses string to int' },
  { label: 'Integer.valueOf', detail: 'Integer.valueOf(s)', documentation: 'Returns Integer object' },
  { label: 'Integer.toString', detail: 'Integer.toString(i)', documentation: 'Converts int to string' },
  { label: 'Double.parseDouble', detail: 'Double.parseDouble(s)', documentation: 'Parses string to double' },
  { label: 'Boolean.parseBoolean', detail: 'Boolean.parseBoolean(s)', documentation: 'Parses string to boolean' },
  { label: 'Arrays.asList', detail: 'Arrays.asList(a)', documentation: 'Returns fixed-size list backed by array' },
  { label: 'Arrays.sort', detail: 'Arrays.sort(a)', documentation: 'Sorts array in ascending order' },
  { label: 'Arrays.binarySearch', detail: 'Arrays.binarySearch(a, key)', documentation: 'Searches for key in sorted array' },
  { label: 'Arrays.fill', detail: 'Arrays.fill(a, val)', documentation: 'Fills array with value' },
  { label: 'Arrays.copyOf', detail: 'Arrays.copyOf(a, newLength)', documentation: 'Copies array with new length' },
  { label: 'Collections.sort', detail: 'Collections.sort(list)', documentation: 'Sorts list in ascending order' },
  { label: 'Collections.reverse', detail: 'Collections.reverse(list)', documentation: 'Reverses the list' },
  { label: 'Collections.shuffle', detail: 'Collections.shuffle(list)', documentation: 'Randomly shuffles the list' },
  { label: 'Objects.equals', detail: 'Objects.equals(a, b)', documentation: 'Null-safe equals' },
  { label: 'Objects.requireNonNull', detail: 'Objects.requireNonNull(obj)', documentation: 'Checks for null' },
  { label: 'Optional.of', detail: 'Optional.of(value)', documentation: 'Returns Optional with value' },
  { label: 'Optional.ofNullable', detail: 'Optional.ofNullable(value)', documentation: 'Returns Optional that may be null' },
  { label: 'Optional.empty', detail: 'Optional.empty()', documentation: 'Returns empty Optional' },
  { label: 'Stream.of', detail: 'Stream.of(values)', documentation: 'Returns stream of values' },
];

export function registerJavaCompletions(monaco: Monaco): monacoEditor.IDisposable {
  return monaco.languages.registerCompletionItemProvider('java', {
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
      JAVA_KEYWORDS.forEach((keyword) => {
        suggestions.push({
          label: keyword,
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: keyword,
          range,
          detail: 'keyword',
        });
      });

      // Add built-in functions
      JAVA_BUILTINS.forEach((builtin) => {
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
      javaSnippets.forEach((snippet) => {
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
