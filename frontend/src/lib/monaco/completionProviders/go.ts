import type { Monaco } from '@monaco-editor/react';
import type * as monacoEditor from 'monaco-editor';
import { goSnippets } from '../snippets/go';
import type { BuiltinFunction } from '../types';

const GO_KEYWORDS = [
  'break', 'case', 'chan', 'const', 'continue', 'default', 'defer', 'else',
  'fallthrough', 'for', 'func', 'go', 'goto', 'if', 'import', 'interface',
  'map', 'package', 'range', 'return', 'select', 'struct', 'switch', 'type',
  'var', 'true', 'false', 'nil', 'iota',
];

const GO_TYPES = [
  'bool', 'byte', 'complex64', 'complex128', 'error', 'float32', 'float64',
  'int', 'int8', 'int16', 'int32', 'int64', 'rune', 'string', 'uint',
  'uint8', 'uint16', 'uint32', 'uint64', 'uintptr',
];

const GO_BUILTINS: BuiltinFunction[] = [
  { label: 'append', detail: 'append(slice, elems...)', documentation: 'Appends elements to a slice' },
  { label: 'cap', detail: 'cap(v)', documentation: 'Returns capacity of v' },
  { label: 'close', detail: 'close(c)', documentation: 'Closes a channel' },
  { label: 'complex', detail: 'complex(r, i)', documentation: 'Constructs a complex number' },
  { label: 'copy', detail: 'copy(dst, src)', documentation: 'Copies elements from src to dst' },
  { label: 'delete', detail: 'delete(m, key)', documentation: 'Deletes element from map' },
  { label: 'imag', detail: 'imag(c)', documentation: 'Returns imaginary part' },
  { label: 'len', detail: 'len(v)', documentation: 'Returns length of v' },
  { label: 'make', detail: 'make(t, size)', documentation: 'Allocates and initializes slice, map, or channel' },
  { label: 'new', detail: 'new(Type)', documentation: 'Allocates memory for type' },
  { label: 'panic', detail: 'panic(v)', documentation: 'Stops normal execution' },
  { label: 'print', detail: 'print(args...)', documentation: 'Formats and prints to stderr' },
  { label: 'println', detail: 'println(args...)', documentation: 'Formats and prints to stderr with newline' },
  { label: 'real', detail: 'real(c)', documentation: 'Returns real part' },
  { label: 'recover', detail: 'recover()', documentation: 'Regains control of a panicking goroutine' },
  { label: 'fmt.Println', detail: 'fmt.Println(a...)', documentation: 'Formats and prints with newline' },
  { label: 'fmt.Printf', detail: 'fmt.Printf(format, a...)', documentation: 'Formatted print' },
  { label: 'fmt.Sprintf', detail: 'fmt.Sprintf(format, a...)', documentation: 'Returns formatted string' },
  { label: 'fmt.Errorf', detail: 'fmt.Errorf(format, a...)', documentation: 'Returns formatted error' },
  { label: 'fmt.Scan', detail: 'fmt.Scan(a...)', documentation: 'Scans text from stdin' },
  { label: 'fmt.Scanln', detail: 'fmt.Scanln(a...)', documentation: 'Scans line from stdin' },
  { label: 'strings.Contains', detail: 'strings.Contains(s, substr)', documentation: 'Checks if s contains substr' },
  { label: 'strings.Split', detail: 'strings.Split(s, sep)', documentation: 'Splits string by separator' },
  { label: 'strings.Join', detail: 'strings.Join(elems, sep)', documentation: 'Joins strings with separator' },
  { label: 'strings.Replace', detail: 'strings.Replace(s, old, new, n)', documentation: 'Replaces occurrences' },
  { label: 'strings.TrimSpace', detail: 'strings.TrimSpace(s)', documentation: 'Removes leading/trailing whitespace' },
  { label: 'strings.ToLower', detail: 'strings.ToLower(s)', documentation: 'Converts to lowercase' },
  { label: 'strings.ToUpper', detail: 'strings.ToUpper(s)', documentation: 'Converts to uppercase' },
  { label: 'strconv.Itoa', detail: 'strconv.Itoa(i)', documentation: 'Int to string' },
  { label: 'strconv.Atoi', detail: 'strconv.Atoi(s)', documentation: 'String to int' },
  { label: 'strconv.ParseInt', detail: 'strconv.ParseInt(s, base, bitSize)', documentation: 'Parses string to int' },
  { label: 'strconv.ParseFloat', detail: 'strconv.ParseFloat(s, bitSize)', documentation: 'Parses string to float' },
  { label: 'errors.New', detail: 'errors.New(text)', documentation: 'Creates a new error' },
  { label: 'sort.Ints', detail: 'sort.Ints(x)', documentation: 'Sorts ints in ascending order' },
  { label: 'sort.Strings', detail: 'sort.Strings(x)', documentation: 'Sorts strings in ascending order' },
  { label: 'sort.Slice', detail: 'sort.Slice(x, less)', documentation: 'Sorts slice with custom comparator' },
  { label: 'time.Now', detail: 'time.Now()', documentation: 'Returns current local time' },
  { label: 'time.Sleep', detail: 'time.Sleep(d)', documentation: 'Pauses for duration d' },
  { label: 'time.Since', detail: 'time.Since(t)', documentation: 'Duration since t' },
  { label: 'json.Marshal', detail: 'json.Marshal(v)', documentation: 'Encodes v to JSON' },
  { label: 'json.Unmarshal', detail: 'json.Unmarshal(data, v)', documentation: 'Decodes JSON into v' },
  { label: 'os.Open', detail: 'os.Open(name)', documentation: 'Opens file for reading' },
  { label: 'os.Create', detail: 'os.Create(name)', documentation: 'Creates or truncates file' },
  { label: 'os.Exit', detail: 'os.Exit(code)', documentation: 'Exits with status code' },
  { label: 'os.Getenv', detail: 'os.Getenv(key)', documentation: 'Gets environment variable' },
  { label: 'ioutil.ReadFile', detail: 'ioutil.ReadFile(filename)', documentation: 'Reads entire file' },
  { label: 'ioutil.WriteFile', detail: 'ioutil.WriteFile(filename, data, perm)', documentation: 'Writes data to file' },
];

export function registerGoCompletions(monaco: Monaco): monacoEditor.IDisposable {
  return monaco.languages.registerCompletionItemProvider('go', {
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
      GO_KEYWORDS.forEach((keyword) => {
        suggestions.push({
          label: keyword,
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: keyword,
          range,
          detail: 'keyword',
        });
      });

      // Add types
      GO_TYPES.forEach((type) => {
        suggestions.push({
          label: type,
          kind: monaco.languages.CompletionItemKind.TypeParameter,
          insertText: type,
          range,
          detail: 'type',
        });
      });

      // Add built-in functions
      GO_BUILTINS.forEach((builtin) => {
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
      goSnippets.forEach((snippet) => {
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
