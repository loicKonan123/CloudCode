import type { Monaco } from '@monaco-editor/react';
import type * as monacoEditor from 'monaco-editor';
import { rustSnippets } from '../snippets/rust';
import type { BuiltinFunction } from '../types';

const RUST_KEYWORDS = [
  'as', 'async', 'await', 'break', 'const', 'continue', 'crate', 'dyn',
  'else', 'enum', 'extern', 'false', 'fn', 'for', 'if', 'impl', 'in',
  'let', 'loop', 'match', 'mod', 'move', 'mut', 'pub', 'ref', 'return',
  'self', 'Self', 'static', 'struct', 'super', 'trait', 'true', 'type',
  'unsafe', 'use', 'where', 'while', 'abstract', 'become', 'box', 'do',
  'final', 'macro', 'override', 'priv', 'typeof', 'unsized', 'virtual',
  'yield', 'try',
];

const RUST_TYPES = [
  'bool', 'char', 'str', 'i8', 'i16', 'i32', 'i64', 'i128', 'isize',
  'u8', 'u16', 'u32', 'u64', 'u128', 'usize', 'f32', 'f64',
  'String', 'Vec', 'Option', 'Result', 'Box', 'Rc', 'Arc', 'Cell',
  'RefCell', 'HashMap', 'HashSet', 'BTreeMap', 'BTreeSet',
];

const RUST_BUILTINS: BuiltinFunction[] = [
  { label: 'println!', detail: 'println!(format, args...)', documentation: 'Prints to stdout with newline' },
  { label: 'print!', detail: 'print!(format, args...)', documentation: 'Prints to stdout' },
  { label: 'eprintln!', detail: 'eprintln!(format, args...)', documentation: 'Prints to stderr with newline' },
  { label: 'eprint!', detail: 'eprint!(format, args...)', documentation: 'Prints to stderr' },
  { label: 'format!', detail: 'format!(format, args...)', documentation: 'Creates a String' },
  { label: 'panic!', detail: 'panic!(msg)', documentation: 'Panics with a message' },
  { label: 'assert!', detail: 'assert!(condition)', documentation: 'Asserts condition is true' },
  { label: 'assert_eq!', detail: 'assert_eq!(left, right)', documentation: 'Asserts left equals right' },
  { label: 'assert_ne!', detail: 'assert_ne!(left, right)', documentation: 'Asserts left not equals right' },
  { label: 'debug_assert!', detail: 'debug_assert!(condition)', documentation: 'Debug-only assertion' },
  { label: 'vec!', detail: 'vec![elements]', documentation: 'Creates a new Vec' },
  { label: 'dbg!', detail: 'dbg!(expr)', documentation: 'Debug prints and returns value' },
  { label: 'todo!', detail: 'todo!()', documentation: 'Indicates unfinished code' },
  { label: 'unimplemented!', detail: 'unimplemented!()', documentation: 'Indicates unimplemented code' },
  { label: 'unreachable!', detail: 'unreachable!()', documentation: 'Indicates unreachable code' },
  { label: 'Some', detail: 'Some(value)', documentation: 'Creates Some variant of Option' },
  { label: 'None', detail: 'None', documentation: 'None variant of Option' },
  { label: 'Ok', detail: 'Ok(value)', documentation: 'Creates Ok variant of Result' },
  { label: 'Err', detail: 'Err(error)', documentation: 'Creates Err variant of Result' },
  { label: 'String::new', detail: 'String::new()', documentation: 'Creates empty String' },
  { label: 'String::from', detail: 'String::from(s)', documentation: 'Creates String from &str' },
  { label: 'Vec::new', detail: 'Vec::new()', documentation: 'Creates empty Vec' },
  { label: 'Vec::with_capacity', detail: 'Vec::with_capacity(n)', documentation: 'Creates Vec with capacity' },
  { label: 'HashMap::new', detail: 'HashMap::new()', documentation: 'Creates empty HashMap' },
  { label: 'HashSet::new', detail: 'HashSet::new()', documentation: 'Creates empty HashSet' },
  { label: 'Box::new', detail: 'Box::new(value)', documentation: 'Creates Box containing value' },
  { label: 'Rc::new', detail: 'Rc::new(value)', documentation: 'Creates Rc containing value' },
  { label: 'Arc::new', detail: 'Arc::new(value)', documentation: 'Creates Arc containing value' },
  { label: 'std::mem::swap', detail: 'std::mem::swap(&mut a, &mut b)', documentation: 'Swaps two values' },
  { label: 'std::mem::take', detail: 'std::mem::take(&mut value)', documentation: 'Takes value, leaving default' },
  { label: 'std::mem::replace', detail: 'std::mem::replace(&mut dest, src)', documentation: 'Replaces value' },
  { label: 'std::cmp::max', detail: 'std::cmp::max(a, b)', documentation: 'Returns maximum' },
  { label: 'std::cmp::min', detail: 'std::cmp::min(a, b)', documentation: 'Returns minimum' },
  { label: 'std::iter::once', detail: 'std::iter::once(value)', documentation: 'Iterator yielding one element' },
  { label: 'std::iter::repeat', detail: 'std::iter::repeat(value)', documentation: 'Iterator yielding same element' },
  { label: 'std::fs::read_to_string', detail: 'std::fs::read_to_string(path)', documentation: 'Reads file to String' },
  { label: 'std::fs::write', detail: 'std::fs::write(path, contents)', documentation: 'Writes to file' },
  { label: 'std::env::var', detail: 'std::env::var(key)', documentation: 'Gets environment variable' },
  { label: 'std::thread::spawn', detail: 'std::thread::spawn(f)', documentation: 'Spawns new thread' },
  { label: 'std::thread::sleep', detail: 'std::thread::sleep(dur)', documentation: 'Sleeps current thread' },
];

export function registerRustCompletions(monaco: Monaco): monacoEditor.IDisposable {
  return monaco.languages.registerCompletionItemProvider('rust', {
    triggerCharacters: ['.', ':', '!'],

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
      RUST_KEYWORDS.forEach((keyword) => {
        suggestions.push({
          label: keyword,
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: keyword,
          range,
          detail: 'keyword',
        });
      });

      // Add types
      RUST_TYPES.forEach((type) => {
        suggestions.push({
          label: type,
          kind: monaco.languages.CompletionItemKind.TypeParameter,
          insertText: type,
          range,
          detail: 'type',
        });
      });

      // Add built-in functions and macros
      RUST_BUILTINS.forEach((builtin) => {
        const isMacro = builtin.label.endsWith('!');
        suggestions.push({
          label: builtin.label,
          kind: isMacro ? monaco.languages.CompletionItemKind.Function : monaco.languages.CompletionItemKind.Function,
          insertText: isMacro ? `${builtin.label}($0)` : `${builtin.label}($0)`,
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          range,
          detail: builtin.detail,
          documentation: { value: builtin.documentation },
        });
      });

      // Add snippets
      rustSnippets.forEach((snippet) => {
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
