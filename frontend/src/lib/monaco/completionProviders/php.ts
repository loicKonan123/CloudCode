import type { Monaco } from '@monaco-editor/react';
import type * as monacoEditor from 'monaco-editor';
import { phpSnippets } from '../snippets/php';
import type { BuiltinFunction } from '../types';

const PHP_KEYWORDS = [
  'abstract', 'and', 'array', 'as', 'break', 'callable', 'case', 'catch',
  'class', 'clone', 'const', 'continue', 'declare', 'default', 'die', 'do',
  'echo', 'else', 'elseif', 'empty', 'enddeclare', 'endfor', 'endforeach',
  'endif', 'endswitch', 'endwhile', 'eval', 'exit', 'extends', 'final',
  'finally', 'fn', 'for', 'foreach', 'function', 'global', 'goto', 'if',
  'implements', 'include', 'include_once', 'instanceof', 'insteadof',
  'interface', 'isset', 'list', 'match', 'namespace', 'new', 'or', 'print',
  'private', 'protected', 'public', 'readonly', 'require', 'require_once',
  'return', 'static', 'switch', 'throw', 'trait', 'try', 'unset', 'use',
  'var', 'while', 'xor', 'yield', 'yield from', 'true', 'false', 'null',
  'void', 'int', 'float', 'bool', 'string', 'object', 'mixed', 'never',
];

const PHP_BUILTINS: BuiltinFunction[] = [
  { label: 'echo', detail: 'echo $value', documentation: 'Output one or more strings' },
  { label: 'print', detail: 'print $value', documentation: 'Output a string' },
  { label: 'print_r', detail: 'print_r($value)', documentation: 'Prints human-readable info' },
  { label: 'var_dump', detail: 'var_dump($value)', documentation: 'Dumps variable info' },
  { label: 'var_export', detail: 'var_export($value, true)', documentation: 'Outputs parsable representation' },
  { label: 'strlen', detail: 'strlen($string)', documentation: 'Returns string length' },
  { label: 'substr', detail: 'substr($string, $start, $length)', documentation: 'Returns substring' },
  { label: 'strpos', detail: 'strpos($haystack, $needle)', documentation: 'Finds position of substring' },
  { label: 'str_replace', detail: 'str_replace($search, $replace, $subject)', documentation: 'Replaces occurrences' },
  { label: 'strtolower', detail: 'strtolower($string)', documentation: 'Converts to lowercase' },
  { label: 'strtoupper', detail: 'strtoupper($string)', documentation: 'Converts to uppercase' },
  { label: 'trim', detail: 'trim($string)', documentation: 'Strips whitespace' },
  { label: 'ltrim', detail: 'ltrim($string)', documentation: 'Strips left whitespace' },
  { label: 'rtrim', detail: 'rtrim($string)', documentation: 'Strips right whitespace' },
  { label: 'explode', detail: 'explode($delimiter, $string)', documentation: 'Splits string by delimiter' },
  { label: 'implode', detail: 'implode($glue, $array)', documentation: 'Joins array elements' },
  { label: 'sprintf', detail: 'sprintf($format, $args)', documentation: 'Returns formatted string' },
  { label: 'printf', detail: 'printf($format, $args)', documentation: 'Outputs formatted string' },
  { label: 'count', detail: 'count($array)', documentation: 'Counts array elements' },
  { label: 'array_push', detail: 'array_push($array, $value)', documentation: 'Pushes to end of array' },
  { label: 'array_pop', detail: 'array_pop($array)', documentation: 'Pops from end of array' },
  { label: 'array_shift', detail: 'array_shift($array)', documentation: 'Shifts from beginning' },
  { label: 'array_unshift', detail: 'array_unshift($array, $value)', documentation: 'Unshifts to beginning' },
  { label: 'array_merge', detail: 'array_merge($array1, $array2)', documentation: 'Merges arrays' },
  { label: 'array_keys', detail: 'array_keys($array)', documentation: 'Returns all keys' },
  { label: 'array_values', detail: 'array_values($array)', documentation: 'Returns all values' },
  { label: 'array_map', detail: 'array_map($callback, $array)', documentation: 'Applies callback to elements' },
  { label: 'array_filter', detail: 'array_filter($array, $callback)', documentation: 'Filters array' },
  { label: 'array_reduce', detail: 'array_reduce($array, $callback, $initial)', documentation: 'Reduces array' },
  { label: 'array_search', detail: 'array_search($needle, $haystack)', documentation: 'Searches for value' },
  { label: 'in_array', detail: 'in_array($needle, $haystack)', documentation: 'Checks if value exists' },
  { label: 'array_key_exists', detail: 'array_key_exists($key, $array)', documentation: 'Checks if key exists' },
  { label: 'sort', detail: 'sort($array)', documentation: 'Sorts array' },
  { label: 'rsort', detail: 'rsort($array)', documentation: 'Sorts array in reverse' },
  { label: 'usort', detail: 'usort($array, $callback)', documentation: 'Sorts with user function' },
  { label: 'array_unique', detail: 'array_unique($array)', documentation: 'Removes duplicates' },
  { label: 'array_reverse', detail: 'array_reverse($array)', documentation: 'Reverses array' },
  { label: 'isset', detail: 'isset($var)', documentation: 'Checks if set and not null' },
  { label: 'empty', detail: 'empty($var)', documentation: 'Checks if empty' },
  { label: 'is_null', detail: 'is_null($var)', documentation: 'Checks if null' },
  { label: 'is_array', detail: 'is_array($var)', documentation: 'Checks if array' },
  { label: 'is_string', detail: 'is_string($var)', documentation: 'Checks if string' },
  { label: 'is_int', detail: 'is_int($var)', documentation: 'Checks if integer' },
  { label: 'is_float', detail: 'is_float($var)', documentation: 'Checks if float' },
  { label: 'is_bool', detail: 'is_bool($var)', documentation: 'Checks if boolean' },
  { label: 'is_numeric', detail: 'is_numeric($var)', documentation: 'Checks if numeric' },
  { label: 'intval', detail: 'intval($var)', documentation: 'Converts to integer' },
  { label: 'floatval', detail: 'floatval($var)', documentation: 'Converts to float' },
  { label: 'strval', detail: 'strval($var)', documentation: 'Converts to string' },
  { label: 'json_encode', detail: 'json_encode($value)', documentation: 'Encodes to JSON' },
  { label: 'json_decode', detail: 'json_decode($json, true)', documentation: 'Decodes JSON' },
  { label: 'file_get_contents', detail: 'file_get_contents($filename)', documentation: 'Reads entire file' },
  { label: 'file_put_contents', detail: 'file_put_contents($filename, $data)', documentation: 'Writes to file' },
  { label: 'file_exists', detail: 'file_exists($filename)', documentation: 'Checks if file exists' },
  { label: 'fopen', detail: 'fopen($filename, $mode)', documentation: 'Opens file' },
  { label: 'fclose', detail: 'fclose($handle)', documentation: 'Closes file' },
  { label: 'fread', detail: 'fread($handle, $length)', documentation: 'Reads from file' },
  { label: 'fwrite', detail: 'fwrite($handle, $string)', documentation: 'Writes to file' },
  { label: 'date', detail: 'date($format, $timestamp)', documentation: 'Formats date' },
  { label: 'time', detail: 'time()', documentation: 'Returns current timestamp' },
  { label: 'strtotime', detail: 'strtotime($time)', documentation: 'Parses date string' },
  { label: 'preg_match', detail: 'preg_match($pattern, $subject, $matches)', documentation: 'Regex match' },
  { label: 'preg_replace', detail: 'preg_replace($pattern, $replacement, $subject)', documentation: 'Regex replace' },
  { label: 'class_exists', detail: 'class_exists($class)', documentation: 'Checks if class exists' },
  { label: 'method_exists', detail: 'method_exists($object, $method)', documentation: 'Checks if method exists' },
  { label: 'property_exists', detail: 'property_exists($class, $property)', documentation: 'Checks if property exists' },
];

export function registerPhpCompletions(monaco: Monaco): monacoEditor.IDisposable {
  return monaco.languages.registerCompletionItemProvider('php', {
    triggerCharacters: ['.', ':', '$', '>', '\\'],

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
      PHP_KEYWORDS.forEach((keyword) => {
        suggestions.push({
          label: keyword,
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: keyword,
          range,
          detail: 'keyword',
        });
      });

      // Add built-in functions
      PHP_BUILTINS.forEach((builtin) => {
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
      phpSnippets.forEach((snippet) => {
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
