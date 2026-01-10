import type { Monaco } from '@monaco-editor/react';
import type * as monacoEditor from 'monaco-editor';
import { rubySnippets } from '../snippets/ruby';
import type { BuiltinFunction } from '../types';

const RUBY_KEYWORDS = [
  'BEGIN', 'END', 'alias', 'and', 'begin', 'break', 'case', 'class',
  'def', 'defined?', 'do', 'else', 'elsif', 'end', 'ensure', 'false',
  'for', 'if', 'in', 'module', 'next', 'nil', 'not', 'or', 'redo',
  'rescue', 'retry', 'return', 'self', 'super', 'then', 'true', 'undef',
  'unless', 'until', 'when', 'while', 'yield', '__FILE__', '__LINE__',
  '__ENCODING__', 'lambda', 'proc', 'raise', 'require', 'require_relative',
  'attr_accessor', 'attr_reader', 'attr_writer', 'private', 'protected',
  'public', 'include', 'extend', 'prepend',
];

const RUBY_BUILTINS: BuiltinFunction[] = [
  { label: 'puts', detail: 'puts(obj)', documentation: 'Writes to stdout with newline' },
  { label: 'print', detail: 'print(obj)', documentation: 'Writes to stdout' },
  { label: 'p', detail: 'p(obj)', documentation: 'Prints inspect result' },
  { label: 'pp', detail: 'pp(obj)', documentation: 'Pretty prints object' },
  { label: 'gets', detail: 'gets', documentation: 'Reads line from stdin' },
  { label: 'gets.chomp', detail: 'gets.chomp', documentation: 'Reads line without newline' },
  { label: 'to_s', detail: 'obj.to_s', documentation: 'Converts to string' },
  { label: 'to_i', detail: 'obj.to_i', documentation: 'Converts to integer' },
  { label: 'to_f', detail: 'obj.to_f', documentation: 'Converts to float' },
  { label: 'to_a', detail: 'obj.to_a', documentation: 'Converts to array' },
  { label: 'to_h', detail: 'obj.to_h', documentation: 'Converts to hash' },
  { label: 'to_sym', detail: 'str.to_sym', documentation: 'Converts to symbol' },
  { label: 'length', detail: 'obj.length', documentation: 'Returns length' },
  { label: 'size', detail: 'obj.size', documentation: 'Returns size' },
  { label: 'empty?', detail: 'obj.empty?', documentation: 'Checks if empty' },
  { label: 'nil?', detail: 'obj.nil?', documentation: 'Checks if nil' },
  { label: 'class', detail: 'obj.class', documentation: 'Returns class' },
  { label: 'is_a?', detail: 'obj.is_a?(klass)', documentation: 'Checks instance of class' },
  { label: 'respond_to?', detail: 'obj.respond_to?(method)', documentation: 'Checks if responds to method' },
  { label: 'each', detail: 'enum.each { |x| }', documentation: 'Iterates over elements' },
  { label: 'map', detail: 'enum.map { |x| }', documentation: 'Maps elements' },
  { label: 'select', detail: 'enum.select { |x| }', documentation: 'Selects matching elements' },
  { label: 'reject', detail: 'enum.reject { |x| }', documentation: 'Rejects matching elements' },
  { label: 'find', detail: 'enum.find { |x| }', documentation: 'Finds first matching element' },
  { label: 'reduce', detail: 'enum.reduce(init) { |acc, x| }', documentation: 'Reduces to single value' },
  { label: 'inject', detail: 'enum.inject(init) { |acc, x| }', documentation: 'Alias for reduce' },
  { label: 'sort', detail: 'enum.sort', documentation: 'Sorts elements' },
  { label: 'sort_by', detail: 'enum.sort_by { |x| }', documentation: 'Sorts by block result' },
  { label: 'reverse', detail: 'enum.reverse', documentation: 'Reverses elements' },
  { label: 'uniq', detail: 'arr.uniq', documentation: 'Returns unique elements' },
  { label: 'flatten', detail: 'arr.flatten', documentation: 'Flattens nested arrays' },
  { label: 'compact', detail: 'arr.compact', documentation: 'Removes nil elements' },
  { label: 'first', detail: 'arr.first', documentation: 'Returns first element' },
  { label: 'last', detail: 'arr.last', documentation: 'Returns last element' },
  { label: 'push', detail: 'arr.push(obj)', documentation: 'Appends to array' },
  { label: 'pop', detail: 'arr.pop', documentation: 'Removes and returns last element' },
  { label: 'shift', detail: 'arr.shift', documentation: 'Removes and returns first element' },
  { label: 'unshift', detail: 'arr.unshift(obj)', documentation: 'Prepends to array' },
  { label: 'join', detail: 'arr.join(sep)', documentation: 'Joins elements with separator' },
  { label: 'split', detail: 'str.split(sep)', documentation: 'Splits string by separator' },
  { label: 'strip', detail: 'str.strip', documentation: 'Removes leading/trailing whitespace' },
  { label: 'chomp', detail: 'str.chomp', documentation: 'Removes trailing newline' },
  { label: 'upcase', detail: 'str.upcase', documentation: 'Converts to uppercase' },
  { label: 'downcase', detail: 'str.downcase', documentation: 'Converts to lowercase' },
  { label: 'capitalize', detail: 'str.capitalize', documentation: 'Capitalizes first letter' },
  { label: 'gsub', detail: 'str.gsub(pattern, replacement)', documentation: 'Global substitution' },
  { label: 'sub', detail: 'str.sub(pattern, replacement)', documentation: 'Single substitution' },
  { label: 'include?', detail: 'str.include?(substr)', documentation: 'Checks if includes substring' },
  { label: 'start_with?', detail: 'str.start_with?(prefix)', documentation: 'Checks if starts with prefix' },
  { label: 'end_with?', detail: 'str.end_with?(suffix)', documentation: 'Checks if ends with suffix' },
  { label: 'keys', detail: 'hash.keys', documentation: 'Returns array of keys' },
  { label: 'values', detail: 'hash.values', documentation: 'Returns array of values' },
  { label: 'merge', detail: 'hash.merge(other)', documentation: 'Merges two hashes' },
  { label: 'fetch', detail: 'hash.fetch(key, default)', documentation: 'Gets value or default' },
  { label: 'File.read', detail: 'File.read(path)', documentation: 'Reads entire file' },
  { label: 'File.write', detail: 'File.write(path, data)', documentation: 'Writes to file' },
  { label: 'File.open', detail: 'File.open(path, mode)', documentation: 'Opens file' },
  { label: 'File.exist?', detail: 'File.exist?(path)', documentation: 'Checks if file exists' },
  { label: 'Time.now', detail: 'Time.now', documentation: 'Returns current time' },
  { label: 'rand', detail: 'rand(max)', documentation: 'Returns random number' },
  { label: 'sleep', detail: 'sleep(seconds)', documentation: 'Pauses execution' },
];

export function registerRubyCompletions(monaco: Monaco): monacoEditor.IDisposable {
  return monaco.languages.registerCompletionItemProvider('ruby', {
    triggerCharacters: ['.', ':'],

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
      RUBY_KEYWORDS.forEach((keyword) => {
        suggestions.push({
          label: keyword,
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: keyword,
          range,
          detail: 'keyword',
        });
      });

      // Add built-in methods
      RUBY_BUILTINS.forEach((builtin) => {
        suggestions.push({
          label: builtin.label,
          kind: monaco.languages.CompletionItemKind.Method,
          insertText: builtin.insertText || builtin.label,
          range,
          detail: builtin.detail,
          documentation: { value: builtin.documentation },
        });
      });

      // Add snippets
      rubySnippets.forEach((snippet) => {
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
