import type { Monaco } from '@monaco-editor/react';
import type * as monacoEditor from 'monaco-editor';
import { pythonSnippets } from '../snippets/python';
import type { BuiltinFunction } from '../types';

const PYTHON_KEYWORDS = [
  'False', 'None', 'True', 'and', 'as', 'assert', 'async', 'await',
  'break', 'class', 'continue', 'def', 'del', 'elif', 'else', 'except',
  'finally', 'for', 'from', 'global', 'if', 'import', 'in', 'is',
  'lambda', 'nonlocal', 'not', 'or', 'pass', 'raise', 'return', 'try',
  'while', 'with', 'yield',
];

const PYTHON_BUILTINS: BuiltinFunction[] = [
  { label: 'print', detail: 'print(*values, sep=" ", end="\\n")', documentation: 'Print values to stdout' },
  { label: 'len', detail: 'len(obj)', documentation: 'Return the length of an object' },
  { label: 'range', detail: 'range(start, stop, step)', documentation: 'Create a sequence of numbers' },
  { label: 'str', detail: 'str(obj)', documentation: 'Convert object to string' },
  { label: 'int', detail: 'int(x, base=10)', documentation: 'Convert to integer' },
  { label: 'float', detail: 'float(x)', documentation: 'Convert to float' },
  { label: 'bool', detail: 'bool(x)', documentation: 'Convert to boolean' },
  { label: 'list', detail: 'list(iterable)', documentation: 'Create a list' },
  { label: 'dict', detail: 'dict(**kwargs)', documentation: 'Create a dictionary' },
  { label: 'set', detail: 'set(iterable)', documentation: 'Create a set' },
  { label: 'tuple', detail: 'tuple(iterable)', documentation: 'Create a tuple' },
  { label: 'input', detail: 'input(prompt)', documentation: 'Read a line from input' },
  { label: 'open', detail: 'open(file, mode="r")', documentation: 'Open a file' },
  { label: 'type', detail: 'type(obj)', documentation: 'Return the type of an object' },
  { label: 'isinstance', detail: 'isinstance(obj, classinfo)', documentation: 'Check if object is instance' },
  { label: 'issubclass', detail: 'issubclass(cls, classinfo)', documentation: 'Check if class is subclass' },
  { label: 'enumerate', detail: 'enumerate(iterable, start=0)', documentation: 'Return enumerate object' },
  { label: 'zip', detail: 'zip(*iterables)', documentation: 'Aggregate elements from iterables' },
  { label: 'map', detail: 'map(func, *iterables)', documentation: 'Apply function to items' },
  { label: 'filter', detail: 'filter(func, iterable)', documentation: 'Filter items by function' },
  { label: 'sorted', detail: 'sorted(iterable, key=None, reverse=False)', documentation: 'Return sorted list' },
  { label: 'reversed', detail: 'reversed(seq)', documentation: 'Return reversed iterator' },
  { label: 'abs', detail: 'abs(x)', documentation: 'Return absolute value' },
  { label: 'max', detail: 'max(iterable)', documentation: 'Return maximum value' },
  { label: 'min', detail: 'min(iterable)', documentation: 'Return minimum value' },
  { label: 'sum', detail: 'sum(iterable, start=0)', documentation: 'Return sum of items' },
  { label: 'round', detail: 'round(number, ndigits=None)', documentation: 'Round a number' },
  { label: 'pow', detail: 'pow(base, exp, mod=None)', documentation: 'Return base to the power exp' },
  { label: 'divmod', detail: 'divmod(a, b)', documentation: 'Return quotient and remainder' },
  { label: 'all', detail: 'all(iterable)', documentation: 'Return True if all elements are true' },
  { label: 'any', detail: 'any(iterable)', documentation: 'Return True if any element is true' },
  { label: 'ord', detail: 'ord(c)', documentation: 'Return Unicode code point' },
  { label: 'chr', detail: 'chr(i)', documentation: 'Return character from Unicode' },
  { label: 'hex', detail: 'hex(x)', documentation: 'Convert to hexadecimal string' },
  { label: 'bin', detail: 'bin(x)', documentation: 'Convert to binary string' },
  { label: 'oct', detail: 'oct(x)', documentation: 'Convert to octal string' },
  { label: 'hasattr', detail: 'hasattr(obj, name)', documentation: 'Check if object has attribute' },
  { label: 'getattr', detail: 'getattr(obj, name, default)', documentation: 'Get attribute of object' },
  { label: 'setattr', detail: 'setattr(obj, name, value)', documentation: 'Set attribute of object' },
  { label: 'delattr', detail: 'delattr(obj, name)', documentation: 'Delete attribute of object' },
  { label: 'repr', detail: 'repr(obj)', documentation: 'Return printable representation' },
  { label: 'format', detail: 'format(value, format_spec)', documentation: 'Format a value' },
  { label: 'id', detail: 'id(obj)', documentation: 'Return identity of object' },
  { label: 'hash', detail: 'hash(obj)', documentation: 'Return hash value of object' },
  { label: 'iter', detail: 'iter(obj)', documentation: 'Return iterator object' },
  { label: 'next', detail: 'next(iterator, default)', documentation: 'Return next item from iterator' },
  { label: 'slice', detail: 'slice(start, stop, step)', documentation: 'Create a slice object' },
  { label: 'callable', detail: 'callable(obj)', documentation: 'Check if object is callable' },
  { label: 'exec', detail: 'exec(code)', documentation: 'Execute Python code dynamically' },
  { label: 'eval', detail: 'eval(expression)', documentation: 'Evaluate Python expression' },
];

export function registerPythonCompletions(monaco: Monaco): monacoEditor.IDisposable {
  return monaco.languages.registerCompletionItemProvider('python', {
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
      PYTHON_KEYWORDS.forEach((keyword) => {
        suggestions.push({
          label: keyword,
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: keyword,
          range,
          detail: 'keyword',
        });
      });

      // Add built-in functions
      PYTHON_BUILTINS.forEach((builtin) => {
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
      pythonSnippets.forEach((snippet) => {
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
