import type { Monaco } from '@monaco-editor/react';
import type * as monacoEditor from 'monaco-editor';
import { cppSnippets } from '../snippets/cpp';
import type { BuiltinFunction } from '../types';

const CPP_KEYWORDS = [
  'alignas', 'alignof', 'and', 'and_eq', 'asm', 'auto', 'bitand', 'bitor',
  'bool', 'break', 'case', 'catch', 'char', 'char8_t', 'char16_t', 'char32_t',
  'class', 'compl', 'concept', 'const', 'consteval', 'constexpr', 'constinit',
  'const_cast', 'continue', 'co_await', 'co_return', 'co_yield', 'decltype',
  'default', 'delete', 'do', 'double', 'dynamic_cast', 'else', 'enum',
  'explicit', 'export', 'extern', 'false', 'float', 'for', 'friend', 'goto',
  'if', 'inline', 'int', 'long', 'mutable', 'namespace', 'new', 'noexcept',
  'not', 'not_eq', 'nullptr', 'operator', 'or', 'or_eq', 'private', 'protected',
  'public', 'register', 'reinterpret_cast', 'requires', 'return', 'short',
  'signed', 'sizeof', 'static', 'static_assert', 'static_cast', 'struct',
  'switch', 'template', 'this', 'thread_local', 'throw', 'true', 'try',
  'typedef', 'typeid', 'typename', 'union', 'unsigned', 'using', 'virtual',
  'void', 'volatile', 'wchar_t', 'while', 'xor', 'xor_eq',
];

const CPP_BUILTINS: BuiltinFunction[] = [
  { label: 'std::cout', detail: 'std::cout << value', documentation: 'Standard output stream' },
  { label: 'std::cin', detail: 'std::cin >> value', documentation: 'Standard input stream' },
  { label: 'std::cerr', detail: 'std::cerr << value', documentation: 'Standard error stream' },
  { label: 'std::endl', detail: 'std::endl', documentation: 'End line and flush' },
  { label: 'std::string', detail: 'std::string', documentation: 'String class' },
  { label: 'std::vector', detail: 'std::vector<T>', documentation: 'Dynamic array container' },
  { label: 'std::map', detail: 'std::map<K, V>', documentation: 'Ordered key-value container' },
  { label: 'std::unordered_map', detail: 'std::unordered_map<K, V>', documentation: 'Hash map container' },
  { label: 'std::set', detail: 'std::set<T>', documentation: 'Ordered unique element container' },
  { label: 'std::unordered_set', detail: 'std::unordered_set<T>', documentation: 'Hash set container' },
  { label: 'std::pair', detail: 'std::pair<T1, T2>', documentation: 'Pair of values' },
  { label: 'std::tuple', detail: 'std::tuple<T...>', documentation: 'Tuple of values' },
  { label: 'std::make_pair', detail: 'std::make_pair(a, b)', documentation: 'Create a pair' },
  { label: 'std::make_tuple', detail: 'std::make_tuple(args...)', documentation: 'Create a tuple' },
  { label: 'std::make_unique', detail: 'std::make_unique<T>(args)', documentation: 'Create unique_ptr' },
  { label: 'std::make_shared', detail: 'std::make_shared<T>(args)', documentation: 'Create shared_ptr' },
  { label: 'std::unique_ptr', detail: 'std::unique_ptr<T>', documentation: 'Unique ownership pointer' },
  { label: 'std::shared_ptr', detail: 'std::shared_ptr<T>', documentation: 'Shared ownership pointer' },
  { label: 'std::weak_ptr', detail: 'std::weak_ptr<T>', documentation: 'Weak reference pointer' },
  { label: 'std::move', detail: 'std::move(x)', documentation: 'Cast to rvalue reference' },
  { label: 'std::forward', detail: 'std::forward<T>(x)', documentation: 'Perfect forwarding' },
  { label: 'std::swap', detail: 'std::swap(a, b)', documentation: 'Swap two values' },
  { label: 'std::sort', detail: 'std::sort(begin, end)', documentation: 'Sort elements' },
  { label: 'std::find', detail: 'std::find(begin, end, value)', documentation: 'Find element' },
  { label: 'std::binary_search', detail: 'std::binary_search(begin, end, value)', documentation: 'Binary search' },
  { label: 'std::lower_bound', detail: 'std::lower_bound(begin, end, value)', documentation: 'Lower bound iterator' },
  { label: 'std::upper_bound', detail: 'std::upper_bound(begin, end, value)', documentation: 'Upper bound iterator' },
  { label: 'std::max', detail: 'std::max(a, b)', documentation: 'Return maximum' },
  { label: 'std::min', detail: 'std::min(a, b)', documentation: 'Return minimum' },
  { label: 'std::abs', detail: 'std::abs(x)', documentation: 'Absolute value' },
  { label: 'std::sqrt', detail: 'std::sqrt(x)', documentation: 'Square root' },
  { label: 'std::pow', detail: 'std::pow(base, exp)', documentation: 'Power function' },
  { label: 'std::to_string', detail: 'std::to_string(value)', documentation: 'Convert to string' },
  { label: 'std::stoi', detail: 'std::stoi(str)', documentation: 'String to int' },
  { label: 'std::stod', detail: 'std::stod(str)', documentation: 'String to double' },
  { label: 'std::getline', detail: 'std::getline(stream, str)', documentation: 'Read line from stream' },
  { label: 'std::thread', detail: 'std::thread(func, args)', documentation: 'Thread class' },
  { label: 'std::mutex', detail: 'std::mutex', documentation: 'Mutex class' },
  { label: 'std::lock_guard', detail: 'std::lock_guard<std::mutex>', documentation: 'RAII mutex wrapper' },
  { label: 'std::async', detail: 'std::async(func, args)', documentation: 'Async execution' },
  { label: 'std::future', detail: 'std::future<T>', documentation: 'Future value' },
];

export function registerCppCompletions(monaco: Monaco): monacoEditor.IDisposable {
  return monaco.languages.registerCompletionItemProvider('cpp', {
    triggerCharacters: ['.', ':', '<'],

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
      CPP_KEYWORDS.forEach((keyword) => {
        suggestions.push({
          label: keyword,
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: keyword,
          range,
          detail: 'keyword',
        });
      });

      // Add built-in functions
      CPP_BUILTINS.forEach((builtin) => {
        const isContainer = ['std::vector', 'std::map', 'std::set', 'std::unordered_map', 'std::unordered_set', 'std::pair', 'std::tuple', 'std::unique_ptr', 'std::shared_ptr', 'std::weak_ptr', 'std::string', 'std::thread', 'std::mutex', 'std::lock_guard', 'std::future'].includes(builtin.label);
        suggestions.push({
          label: builtin.label,
          kind: isContainer ? monaco.languages.CompletionItemKind.Class : monaco.languages.CompletionItemKind.Function,
          insertText: isContainer ? builtin.label : `${builtin.label}($0)`,
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          range,
          detail: builtin.detail,
          documentation: { value: builtin.documentation },
        });
      });

      // Add snippets
      cppSnippets.forEach((snippet) => {
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
