/**
 * IntelliSense très complet pour Python et JavaScript dans Monaco Editor.
 * Couvre : built-ins, méthodes, stdlib, patterns algorithmiques, snippets.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Monaco = any;

let registered = false;

// ---------------------------------------------------------------------------
// PYTHON — Built-in functions avec documentation
// ---------------------------------------------------------------------------
const PYTHON_BUILTINS: Array<{ label: string; doc: string; snippet?: string }> = [
  { label: 'abs', doc: '**abs(x)** → Returns the absolute value of a number.\n\n```python\nabs(-5)  # 5\nabs(-3.14)  # 3.14\n```' },
  { label: 'all', doc: '**all(iterable)** → Returns True if all elements are truthy.\n\n```python\nall([True, 1, "a"])  # True\nall([True, 0, "a"])  # False\n```' },
  { label: 'any', doc: '**any(iterable)** → Returns True if at least one element is truthy.\n\n```python\nany([False, 0, "a"])  # True\nany([False, 0, ""])   # False\n```' },
  { label: 'bin', doc: '**bin(x)** → Converts integer to binary string.\n\n```python\nbin(10)  # "0b1010"\n```' },
  { label: 'bool', doc: '**bool(x)** → Converts value to boolean.\n\n```python\nbool(0)    # False\nbool("hi") # True\n```' },
  { label: 'chr', doc: '**chr(i)** → Returns the character for Unicode code point i.\n\n```python\nchr(65)  # "A"\nchr(97)  # "a"\n```' },
  { label: 'dict', doc: '**dict(...)** → Creates a dictionary.\n\n```python\nd = dict(a=1, b=2)  # {"a": 1, "b": 2}\nd = dict(zip(keys, vals))\n```' },
  { label: 'dir', doc: '**dir(obj)** → Returns list of attributes and methods of an object.' },
  { label: 'divmod', doc: '**divmod(a, b)** → Returns (quotient, remainder) as a tuple.\n\n```python\ndivmod(17, 5)  # (3, 2)\n```' },
  { label: 'enumerate', doc: '**enumerate(iterable, start=0)** → Returns (index, value) pairs.\n\n```python\nfor i, v in enumerate(["a","b","c"]):\n    print(i, v)  # 0 a, 1 b, 2 c\n```', snippet: 'enumerate(${1:iterable}, ${2:0})' },
  { label: 'eval', doc: '**eval(expression)** → Evaluates a Python expression string.' },
  { label: 'filter', doc: '**filter(function, iterable)** → Filters elements where function returns True.\n\n```python\nlist(filter(lambda x: x > 0, [-1, 2, -3, 4]))  # [2, 4]\n```', snippet: 'filter(lambda ${1:x}: ${2:condition}, ${3:iterable})' },
  { label: 'float', doc: '**float(x)** → Converts value to a floating point number.\n\n```python\nfloat("3.14")  # 3.14\nfloat(5)       # 5.0\n```' },
  { label: 'format', doc: '**format(value, format_spec)** → Formats a value using format specification.' },
  { label: 'frozenset', doc: '**frozenset(iterable)** → Creates an immutable set.\n\n```python\nfs = frozenset([1, 2, 3])\n```' },
  { label: 'getattr', doc: '**getattr(obj, name, default=None)** → Gets attribute of an object by name.' },
  { label: 'hasattr', doc: '**hasattr(obj, name)** → Returns True if the object has the named attribute.' },
  { label: 'hash', doc: '**hash(obj)** → Returns the hash value of an object.' },
  { label: 'hex', doc: '**hex(x)** → Converts integer to hexadecimal string.\n\n```python\nhex(255)  # "0xff"\n```' },
  { label: 'id', doc: '**id(obj)** → Returns the identity (memory address) of an object.' },
  { label: 'input', doc: '**input(prompt="")** → Reads a line from stdin.\n\n```python\nname = input("Enter name: ")\n```' },
  { label: 'int', doc: '**int(x, base=10)** → Converts value to integer.\n\n```python\nint("42")    # 42\nint("ff", 16) # 255\nint(3.9)     # 3\n```' },
  { label: 'isinstance', doc: '**isinstance(obj, classinfo)** → Returns True if obj is an instance of classinfo.\n\n```python\nisinstance(5, int)        # True\nisinstance("hi", (str, bytes))  # True\n```', snippet: 'isinstance(${1:obj}, ${2:type})' },
  { label: 'issubclass', doc: '**issubclass(cls, classinfo)** → Returns True if cls is a subclass of classinfo.' },
  { label: 'iter', doc: '**iter(obj)** → Returns an iterator for the object.' },
  { label: 'len', doc: '**len(s)** → Returns the length of an object (string, list, tuple, dict, set...).\n\n```python\nlen([1, 2, 3])   # 3\nlen("hello")     # 5\n```' },
  { label: 'list', doc: '**list(iterable)** → Creates a list from an iterable.\n\n```python\nlist(range(5))       # [0, 1, 2, 3, 4]\nlist("abc")          # ["a", "b", "c"]\nlist({1: "a"}.keys()) # [1]\n```' },
  { label: 'map', doc: '**map(function, iterable)** → Applies function to every item of iterable.\n\n```python\nlist(map(int, ["1","2","3"]))  # [1, 2, 3]\nlist(map(lambda x: x*2, [1,2,3]))  # [2, 4, 6]\n```', snippet: 'map(lambda ${1:x}: ${2:x*2}, ${3:iterable})' },
  { label: 'max', doc: '**max(iterable, key=None)** → Returns the largest item.\n\n```python\nmax([3, 1, 4, 1, 5])        # 5\nmax("abc", "xyz")            # "xyz"\nmax(nums, key=lambda x: -x)  # custom key\n```', snippet: 'max(${1:iterable}, key=${2:lambda x: x})' },
  { label: 'min', doc: '**min(iterable, key=None)** → Returns the smallest item.\n\n```python\nmin([3, 1, 4, 1, 5])  # 1\nmin(words, key=len)   # shortest word\n```', snippet: 'min(${1:iterable}, key=${2:lambda x: x})' },
  { label: 'next', doc: '**next(iterator, default=None)** → Returns next item from iterator.' },
  { label: 'oct', doc: '**oct(x)** → Converts integer to octal string.\n\n```python\noct(8)  # "0o10"\n```' },
  { label: 'open', doc: '**open(file, mode="r", encoding=None)** → Opens a file.\n\n```python\nwith open("file.txt", "r") as f:\n    content = f.read()\n```', snippet: 'open(${1:"file.txt"}, ${2:"r"}, encoding=${3:"utf-8"})' },
  { label: 'ord', doc: '**ord(c)** → Returns the Unicode code point of a character.\n\n```python\nord("A")  # 65\nord("a")  # 97\n```' },
  { label: 'pow', doc: '**pow(base, exp, mod=None)** → Returns base**exp, optionally mod mod.\n\n```python\npow(2, 10)      # 1024\npow(2, 10, 100) # 24  (fast modular exponentiation)\n```' },
  { label: 'print', doc: '**print(*objects, sep=" ", end="\\n", file=sys.stdout)** → Prints to stdout.\n\n```python\nprint("Hello", "World")        # Hello World\nprint(1, 2, 3, sep=", ")      # 1, 2, 3\nprint("no newline", end="")    \n```', snippet: 'print(${1:value})' },
  { label: 'range', doc: '**range(stop)** or **range(start, stop, step=1)** → Generates a sequence of numbers.\n\n```python\nlist(range(5))          # [0, 1, 2, 3, 4]\nlist(range(1, 10, 2))   # [1, 3, 5, 7, 9]\nlist(range(10, 0, -1))  # [10, 9, ..., 1]\n```', snippet: 'range(${1:start}, ${2:stop}, ${3:step})' },
  { label: 'repr', doc: '**repr(obj)** → Returns a developer-friendly string representation of an object.' },
  { label: 'reversed', doc: '**reversed(seq)** → Returns a reverse iterator.\n\n```python\nlist(reversed([1, 2, 3]))  # [3, 2, 1]\n```' },
  { label: 'round', doc: '**round(number, ndigits=None)** → Rounds a number to ndigits decimal places.\n\n```python\nround(3.14159, 2)  # 3.14\nround(2.5)         # 2 (banker\'s rounding)\n```' },
  { label: 'set', doc: '**set(iterable)** → Creates a set from an iterable.\n\n```python\nset([1, 2, 2, 3])  # {1, 2, 3}\nset("hello")       # {"h", "e", "l", "o"}\n```' },
  { label: 'setattr', doc: '**setattr(obj, name, value)** → Sets an attribute on an object.' },
  { label: 'slice', doc: '**slice(start, stop, step)** → Creates a slice object.\n\n```python\ns = slice(1, 5, 2)\nlst[s]  # equivalent to lst[1:5:2]\n```' },
  { label: 'sorted', doc: '**sorted(iterable, key=None, reverse=False)** → Returns a sorted list.\n\n```python\nsorted([3, 1, 4, 1, 5])             # [1, 1, 3, 4, 5]\nsorted(words, key=len)               # sort by length\nsorted(items, key=lambda x: -x[1])  # sort desc by second element\n```', snippet: 'sorted(${1:iterable}, key=${2:lambda x: x}, reverse=${3:False})' },
  { label: 'str', doc: '**str(obj)** → Converts object to string.\n\n```python\nstr(42)        # "42"\nstr([1, 2, 3]) # "[1, 2, 3]"\n```' },
  { label: 'sum', doc: '**sum(iterable, start=0)** → Returns the sum of all elements.\n\n```python\nsum([1, 2, 3, 4])      # 10\nsum(x**2 for x in range(5))  # 30\n```' },
  { label: 'super', doc: '**super()** → Returns a proxy object for the parent class.\n\n```python\nclass Child(Parent):\n    def __init__(self):\n        super().__init__()\n```' },
  { label: 'tuple', doc: '**tuple(iterable)** → Creates a tuple from an iterable.\n\n```python\ntuple([1, 2, 3])  # (1, 2, 3)\ntuple("abc")      # ("a", "b", "c")\n```' },
  { label: 'type', doc: '**type(obj)** → Returns the type of an object.\n\n```python\ntype(5)        # <class "int">\ntype("hello")  # <class "str">\n```' },
  { label: 'vars', doc: '**vars(obj)** → Returns the __dict__ attribute of an object.' },
  { label: 'zip', doc: '**zip(*iterables, strict=False)** → Aggregates elements from iterables into tuples.\n\n```python\nlist(zip([1,2,3], ["a","b","c"]))  # [(1,"a"), (2,"b"), (3,"c")]\n# Unzip:\nkeys, vals = zip(*pairs)\n```', snippet: 'zip(${1:iter1}, ${2:iter2})' },
];

// ---------------------------------------------------------------------------
// PYTHON — Mots-clés
// ---------------------------------------------------------------------------
const PYTHON_KEYWORDS = [
  'False', 'None', 'True', 'and', 'as', 'assert', 'async', 'await',
  'break', 'class', 'continue', 'def', 'del', 'elif', 'else', 'except',
  'finally', 'for', 'from', 'global', 'if', 'import', 'in', 'is',
  'lambda', 'nonlocal', 'not', 'or', 'pass', 'raise', 'return', 'try',
  'while', 'with', 'yield',
];

// ---------------------------------------------------------------------------
// PYTHON — Snippets algorithmiques
// ---------------------------------------------------------------------------
const PYTHON_SNIPPETS = [
  {
    label: 'def',
    doc: 'Define a function',
    snippet: 'def ${1:function_name}(${2:params}):\n    ${3:pass}',
  },
  {
    label: 'class',
    doc: 'Define a class',
    snippet: 'class ${1:ClassName}:\n    def __init__(self${2:, params}):\n        ${3:pass}',
  },
  {
    label: 'for in range',
    doc: 'for loop with range',
    snippet: 'for ${1:i} in range(${2:n}):\n    ${3:pass}',
  },
  {
    label: 'for in enumerate',
    doc: 'for loop with enumerate',
    snippet: 'for ${1:i}, ${2:v} in enumerate(${3:lst}):\n    ${4:pass}',
  },
  {
    label: 'for in zip',
    doc: 'for loop with zip',
    snippet: 'for ${1:a}, ${2:b} in zip(${3:lst1}, ${4:lst2}):\n    ${5:pass}',
  },
  {
    label: 'list comprehension',
    doc: 'List comprehension',
    snippet: '[${1:expr} for ${2:x} in ${3:iterable}${4: if ${5:condition}}]',
  },
  {
    label: 'dict comprehension',
    doc: 'Dictionary comprehension',
    snippet: '{${1:key}: ${2:value} for ${3:k}, ${4:v} in ${5:iterable}.items()}',
  },
  {
    label: 'set comprehension',
    doc: 'Set comprehension',
    snippet: '{${1:expr} for ${2:x} in ${3:iterable}}',
  },
  {
    label: 'lambda',
    doc: 'Lambda function',
    snippet: 'lambda ${1:x}: ${2:x}',
  },
  {
    label: 'try except',
    doc: 'Try-except block',
    snippet: 'try:\n    ${1:pass}\nexcept ${2:Exception} as ${3:e}:\n    ${4:pass}',
  },
  {
    label: 'with open',
    doc: 'Open file safely',
    snippet: 'with open(${1:"file.txt"}, ${2:"r"}) as ${3:f}:\n    ${4:content} = ${3:f}.read()',
  },
  {
    label: 'defaultdict',
    doc: 'Collections defaultdict',
    snippet: 'from collections import defaultdict\n${1:d} = defaultdict(${2:list})',
  },
  {
    label: 'Counter',
    doc: 'Count occurrences in an iterable',
    snippet: 'from collections import Counter\n${1:cnt} = Counter(${2:iterable})',
  },
  {
    label: 'deque',
    doc: 'Double-ended queue',
    snippet: 'from collections import deque\n${1:q} = deque(${2:[]})',
  },
  {
    label: 'heapq push',
    doc: 'Min-heap push',
    snippet: 'import heapq\nheapq.heappush(${1:heap}, ${2:item})',
  },
  {
    label: 'heapq pop',
    doc: 'Min-heap pop',
    snippet: 'heapq.heappop(${1:heap})',
  },
  {
    label: 'heapq nlargest',
    doc: 'Get n largest elements',
    snippet: 'heapq.nlargest(${1:n}, ${2:iterable})',
  },
  {
    label: 'bisect left',
    doc: 'Binary search — leftmost insertion point',
    snippet: 'import bisect\nbisect.bisect_left(${1:lst}, ${2:value})',
  },
  {
    label: 'bisect right',
    doc: 'Binary search — rightmost insertion point',
    snippet: 'bisect.bisect_right(${1:lst}, ${2:value})',
  },
  {
    label: 'binary search',
    doc: 'Binary search template',
    snippet: 'lo, hi = 0, len(${1:nums}) - 1\nwhile lo <= hi:\n    mid = (lo + hi) // 2\n    if ${1:nums}[mid] == ${2:target}:\n        return mid\n    elif ${1:nums}[mid] < ${2:target}:\n        lo = mid + 1\n    else:\n        hi = mid - 1\nreturn -1',
  },
  {
    label: 'two pointers',
    doc: 'Two pointers template',
    snippet: 'left, right = 0, len(${1:nums}) - 1\nwhile left < right:\n    ${2:# process}\n    left += 1\n    right -= 1',
  },
  {
    label: 'sliding window',
    doc: 'Sliding window template',
    snippet: 'left = 0\nfor right in range(len(${1:nums})):\n    ${2:# expand window}\n    while ${3:condition}:\n        ${4:# shrink window}\n        left += 1\n    ${5:# update result}',
  },
  {
    label: 'dfs recursive',
    doc: 'DFS recursive template',
    snippet: 'def dfs(${1:node}, ${2:visited}):\n    if ${1:node} in ${2:visited}:\n        return\n    ${2:visited}.add(${1:node})\n    for ${3:neighbor} in ${4:graph}[${1:node}]:\n        dfs(${3:neighbor}, ${2:visited})',
  },
  {
    label: 'bfs',
    doc: 'BFS template with queue',
    snippet: 'from collections import deque\nq = deque([${1:start}])\nvisited = {${1:start}}\nwhile q:\n    ${2:node} = q.popleft()\n    for ${3:neighbor} in ${4:graph}[${2:node}]:\n        if ${3:neighbor} not in visited:\n            visited.add(${3:neighbor})\n            q.append(${3:neighbor})',
  },
  {
    label: 'dp 1d',
    doc: '1D dynamic programming array',
    snippet: 'dp = [${1:0}] * (${2:n} + 1)\ndp[${3:0}] = ${4:base}\nfor i in range(1, ${2:n} + 1):\n    dp[i] = ${5:dp[i-1]}',
  },
  {
    label: 'dp 2d',
    doc: '2D dynamic programming table',
    snippet: 'dp = [[${1:0}] * (${2:cols} + 1) for _ in range(${3:rows} + 1)]\nfor i in range(1, ${3:rows} + 1):\n    for j in range(1, ${2:cols} + 1):\n        dp[i][j] = ${4:dp[i-1][j]}',
  },
  {
    label: 'math.inf',
    doc: 'Positive infinity',
    snippet: 'float("inf")',
  },
  {
    label: 'math floor div',
    doc: 'Integer floor division',
    snippet: '${1:a} // ${2:b}',
  },
  {
    label: 'import math',
    doc: 'Import math module',
    snippet: 'import math\n',
  },
  {
    label: 'import sys',
    doc: 'Import sys (for sys.stdin, sys.maxsize)',
    snippet: 'import sys\nINF = sys.maxsize\n',
  },
  {
    label: 'lru_cache',
    doc: 'Memoization decorator',
    snippet: 'from functools import lru_cache\n\n@lru_cache(maxsize=None)\ndef ${1:func}(${2:n}):\n    ${3:pass}',
  },
  {
    label: 'cache',
    doc: 'Memoization decorator (Python 3.9+)',
    snippet: 'from functools import cache\n\n@cache\ndef ${1:func}(${2:n}):\n    ${3:pass}',
  },
];

// ---------------------------------------------------------------------------
// PYTHON — Méthodes sur types (après le point)
// ---------------------------------------------------------------------------
const PYTHON_STRING_METHODS = [
  { label: 'split', doc: '**str.split(sep=None, maxsplit=-1)** → Splits string into a list.\n\n```python\n"a,b,c".split(",")   # ["a","b","c"]\n"hello".split()      # ["hello"]\n```', snippet: 'split(${1:sep})' },
  { label: 'join', doc: '**str.join(iterable)** → Joins iterable elements with the string as separator.\n\n```python\n", ".join(["a","b","c"])  # "a, b, c"\n"".join(chars)            # concatenate\n```', snippet: 'join(${1:iterable})' },
  { label: 'strip', doc: '**str.strip(chars=None)** → Removes leading/trailing whitespace (or chars).\n\n```python\n"  hello  ".strip()    # "hello"\n"xxhelloxx".strip("x") # "hello"\n```', snippet: 'strip(${1:chars})' },
  { label: 'lstrip', doc: '**str.lstrip(chars=None)** → Removes leading whitespace or chars.', snippet: 'lstrip(${1:chars})' },
  { label: 'rstrip', doc: '**str.rstrip(chars=None)** → Removes trailing whitespace or chars.', snippet: 'rstrip(${1:chars})' },
  { label: 'replace', doc: '**str.replace(old, new, count=-1)** → Replaces occurrences of old with new.\n\n```python\n"hello".replace("l", "r")     # "herro"\n"aaa".replace("a", "b", 2)   # "bba"\n```', snippet: 'replace(${1:old}, ${2:new})' },
  { label: 'find', doc: '**str.find(sub, start=0, end=len)** → Returns index of first occurrence, -1 if not found.\n\n```python\n"hello".find("ll")  # 2\n"hello".find("x")   # -1\n```', snippet: 'find(${1:sub})' },
  { label: 'rfind', doc: '**str.rfind(sub)** → Returns index of last occurrence, -1 if not found.', snippet: 'rfind(${1:sub})' },
  { label: 'index', doc: '**str.index(sub)** → Returns index of first occurrence, raises ValueError if not found.', snippet: 'index(${1:sub})' },
  { label: 'upper', doc: '**str.upper()** → Returns uppercase copy of the string.\n\n```python\n"hello".upper()  # "HELLO"\n```', snippet: 'upper()' },
  { label: 'lower', doc: '**str.lower()** → Returns lowercase copy of the string.\n\n```python\n"HELLO".lower()  # "hello"\n```', snippet: 'lower()' },
  { label: 'capitalize', doc: '**str.capitalize()** → Returns copy with first character capitalized.', snippet: 'capitalize()' },
  { label: 'title', doc: '**str.title()** → Returns titlecased version (each word capitalized).\n\n```python\n"hello world".title()  # "Hello World"\n```', snippet: 'title()' },
  { label: 'startswith', doc: '**str.startswith(prefix, start=0, end=len)** → Returns True if string starts with prefix.\n\n```python\n"hello".startswith("he")       # True\n"hello".startswith(("he","wo")) # True (tuple of prefixes)\n```', snippet: 'startswith(${1:prefix})' },
  { label: 'endswith', doc: '**str.endswith(suffix)** → Returns True if string ends with suffix.', snippet: 'endswith(${1:suffix})' },
  { label: 'count', doc: '**str.count(sub, start=0, end=len)** → Returns number of non-overlapping occurrences.\n\n```python\n"hello".count("l")  # 2\n```', snippet: 'count(${1:sub})' },
  { label: 'isalpha', doc: '**str.isalpha()** → True if all characters are alphabetic and there is at least one character.', snippet: 'isalpha()' },
  { label: 'isdigit', doc: '**str.isdigit()** → True if all characters are digits.', snippet: 'isdigit()' },
  { label: 'isalnum', doc: '**str.isalnum()** → True if all characters are alphanumeric.', snippet: 'isalnum()' },
  { label: 'isspace', doc: '**str.isspace()** → True if all characters are whitespace.', snippet: 'isspace()' },
  { label: 'islower', doc: '**str.islower()** → True if all cased characters are lowercase.', snippet: 'islower()' },
  { label: 'isupper', doc: '**str.isupper()** → True if all cased characters are uppercase.', snippet: 'isupper()' },
  { label: 'zfill', doc: '**str.zfill(width)** → Pads string with zeros on the left.\n\n```python\n"42".zfill(5)  # "00042"\n```', snippet: 'zfill(${1:width})' },
  { label: 'center', doc: '**str.center(width, fillchar=" ")** → Centers the string within width.', snippet: 'center(${1:width})' },
  { label: 'ljust', doc: '**str.ljust(width, fillchar=" ")** → Left-justifies the string within width.', snippet: 'ljust(${1:width})' },
  { label: 'rjust', doc: '**str.rjust(width, fillchar=" ")** → Right-justifies the string within width.', snippet: 'rjust(${1:width})' },
  { label: 'encode', doc: '**str.encode(encoding="utf-8", errors="strict")** → Encodes to bytes.', snippet: 'encode(${1:"utf-8"})' },
  { label: 'format', doc: '**str.format(*args, **kwargs)** → Formats the string.\n\n```python\n"Hello, {}!".format("World")\n"{name} is {age}".format(name="Alice", age=30)\n```', snippet: 'format(${1:args})' },
  { label: 'format_map', doc: '**str.format_map(mapping)** → Similar to format but uses a mapping.', snippet: 'format_map(${1:dict})' },
  { label: 'splitlines', doc: '**str.splitlines()** → Splits on line boundaries.\n\n```python\n"a\\nb\\nc".splitlines()  # ["a","b","c"]\n```', snippet: 'splitlines()' },
  { label: 'expandtabs', doc: '**str.expandtabs(tabsize=8)** → Replaces tabs with spaces.', snippet: 'expandtabs(${1:4})' },
  { label: 'translate', doc: '**str.translate(table)** → Translates characters using a translation table.', snippet: 'translate(${1:table})' },
  { label: 'maketrans', doc: '**str.maketrans(x, y, z)** → Returns a translation table for translate().\n\n```python\ntable = str.maketrans("abc", "xyz")\n"abc".translate(table)  # "xyz"\n```', snippet: 'maketrans(${1:from}, ${2:to})' },
];

const PYTHON_LIST_METHODS = [
  { label: 'append', doc: '**list.append(item)** → Adds item to the end of the list.\n\n```python\nlst = [1, 2, 3]\nlst.append(4)  # [1, 2, 3, 4]\n```', snippet: 'append(${1:item})' },
  { label: 'extend', doc: '**list.extend(iterable)** → Appends all items from iterable to the list.\n\n```python\nlst.extend([4, 5])  # adds multiple items\n```', snippet: 'extend(${1:iterable})' },
  { label: 'insert', doc: '**list.insert(index, item)** → Inserts item before index.\n\n```python\nlst.insert(0, "first")  # insert at beginning\nlst.insert(-1, "before last")\n```', snippet: 'insert(${1:index}, ${2:item})' },
  { label: 'remove', doc: '**list.remove(item)** → Removes first occurrence of item. Raises ValueError if not found.', snippet: 'remove(${1:item})' },
  { label: 'pop', doc: '**list.pop(index=-1)** → Removes and returns item at index (default last).\n\n```python\nlst.pop()    # remove last\nlst.pop(0)   # remove first (stack/queue)\n```', snippet: 'pop(${1:index})' },
  { label: 'clear', doc: '**list.clear()** → Removes all items from the list.', snippet: 'clear()' },
  { label: 'index', doc: '**list.index(item, start=0, end=len)** → Returns index of first occurrence.', snippet: 'index(${1:item})' },
  { label: 'count', doc: '**list.count(item)** → Returns number of occurrences of item.\n\n```python\n[1,2,2,3].count(2)  # 2\n```', snippet: 'count(${1:item})' },
  { label: 'sort', doc: '**list.sort(key=None, reverse=False)** → Sorts the list in place.\n\n```python\nlst.sort()                          # ascending\nlst.sort(reverse=True)              # descending\nlst.sort(key=lambda x: x[1])       # by second element\nlst.sort(key=lambda x: (x[1], x[0])) # multiple keys\n```', snippet: 'sort(key=${1:lambda x: x}, reverse=${2:False})' },
  { label: 'reverse', doc: '**list.reverse()** → Reverses the list in place.\n\n```python\nlst.reverse()  # modifies in place\n# Alternative: lst[::-1] returns new list\n```', snippet: 'reverse()' },
  { label: 'copy', doc: '**list.copy()** → Returns a shallow copy of the list.', snippet: 'copy()' },
];

const PYTHON_DICT_METHODS = [
  { label: 'get', doc: '**dict.get(key, default=None)** → Returns value for key, or default if not found.\n\n```python\nd = {"a": 1}\nd.get("a")        # 1\nd.get("b")        # None\nd.get("b", 0)     # 0\n```', snippet: 'get(${1:key}, ${2:default})' },
  { label: 'keys', doc: '**dict.keys()** → Returns a view of all keys.\n\n```python\nlist(d.keys())  # list of keys\nfor k in d.keys(): ...\n```', snippet: 'keys()' },
  { label: 'values', doc: '**dict.values()** → Returns a view of all values.', snippet: 'values()' },
  { label: 'items', doc: '**dict.items()** → Returns a view of (key, value) pairs.\n\n```python\nfor k, v in d.items():\n    print(k, v)\n```', snippet: 'items()' },
  { label: 'update', doc: '**dict.update(other)** → Updates dict with key-value pairs from other.\n\n```python\nd.update({"c": 3, "d": 4})\nd.update(e=5)  # keyword args\n```', snippet: 'update(${1:other})' },
  { label: 'pop', doc: '**dict.pop(key, default=None)** → Removes and returns the value for key.\n\n```python\nd.pop("a")       # returns value, raises KeyError if missing\nd.pop("b", None) # safe: returns None if missing\n```', snippet: 'pop(${1:key}, ${2:None})' },
  { label: 'setdefault', doc: '**dict.setdefault(key, default=None)** → Returns value if key exists, else inserts and returns default.\n\n```python\nd.setdefault("a", []).append(1)  # common pattern for grouping\n```', snippet: 'setdefault(${1:key}, ${2:[]})' },
  { label: 'clear', doc: '**dict.clear()** → Removes all key-value pairs.', snippet: 'clear()' },
  { label: 'copy', doc: '**dict.copy()** → Returns a shallow copy of the dict.', snippet: 'copy()' },
  { label: 'fromkeys', doc: '**dict.fromkeys(iterable, value=None)** → Creates dict with keys from iterable.\n\n```python\ndict.fromkeys(["a","b","c"], 0)  # {"a":0, "b":0, "c":0}\n```', snippet: 'fromkeys(${1:iterable}, ${2:0})' },
  { label: 'popitem', doc: '**dict.popitem()** → Removes and returns the last (key, value) pair (LIFO).', snippet: 'popitem()' },
];

const PYTHON_SET_METHODS = [
  { label: 'add', doc: '**set.add(elem)** → Adds element to the set.\n\n```python\ns.add(4)\n```', snippet: 'add(${1:elem})' },
  { label: 'remove', doc: '**set.remove(elem)** → Removes elem. Raises KeyError if not found.', snippet: 'remove(${1:elem})' },
  { label: 'discard', doc: '**set.discard(elem)** → Removes elem if present (no error if missing).\n\n```python\ns.discard(99)  # safe removal\n```', snippet: 'discard(${1:elem})' },
  { label: 'pop', doc: '**set.pop()** → Removes and returns an arbitrary element.', snippet: 'pop()' },
  { label: 'clear', doc: '**set.clear()** → Removes all elements.', snippet: 'clear()' },
  { label: 'union', doc: '**set.union(*others)** → Returns new set with elements from all sets.\n\n```python\n{1,2} | {3,4}           # {1,2,3,4}\n{1,2}.union({3,4})      # {1,2,3,4}\n```', snippet: 'union(${1:other})' },
  { label: 'intersection', doc: '**set.intersection(*others)** → Returns new set with common elements.\n\n```python\n{1,2,3} & {2,3,4}       # {2,3}\n```', snippet: 'intersection(${1:other})' },
  { label: 'difference', doc: '**set.difference(*others)** → Returns elements in set but not in others.\n\n```python\n{1,2,3} - {2,3}  # {1}\n```', snippet: 'difference(${1:other})' },
  { label: 'symmetric_difference', doc: '**set.symmetric_difference(other)** → Elements in either set but not both.\n\n```python\n{1,2,3} ^ {2,3,4}  # {1,4}\n```', snippet: 'symmetric_difference(${1:other})' },
  { label: 'issubset', doc: '**set.issubset(other)** → True if all elements of set are in other.', snippet: 'issubset(${1:other})' },
  { label: 'issuperset', doc: '**set.issuperset(other)** → True if all elements of other are in set.', snippet: 'issuperset(${1:other})' },
  { label: 'isdisjoint', doc: '**set.isdisjoint(other)** → True if the two sets have no common elements.', snippet: 'isdisjoint(${1:other})' },
  { label: 'update', doc: '**set.update(*others)** → Adds elements from all others to the set.', snippet: 'update(${1:other})' },
  { label: 'intersection_update', doc: '**set.intersection_update(*others)** → Keeps only common elements.', snippet: 'intersection_update(${1:other})' },
  { label: 'difference_update', doc: '**set.difference_update(*others)** → Removes elements found in others.', snippet: 'difference_update(${1:other})' },
  { label: 'copy', doc: '**set.copy()** → Returns a shallow copy.', snippet: 'copy()' },
];

// ---------------------------------------------------------------------------
// JAVASCRIPT — Snippets et méthodes algorithmiques
// ---------------------------------------------------------------------------
const JS_SNIPPETS = [
  // Array methods
  {
    label: 'arr.map',
    doc: '**Array.map(callback)** → Creates new array with results of calling callback on each element.\n\n```js\n[1,2,3].map(x => x * 2)  // [2,4,6]\n```',
    snippet: '${1:arr}.map(${2:x} => ${3:x})',
  },
  {
    label: 'arr.filter',
    doc: '**Array.filter(callback)** → Creates new array with elements passing the test.\n\n```js\n[1,2,3,4].filter(x => x % 2 === 0)  // [2,4]\n```',
    snippet: '${1:arr}.filter(${2:x} => ${3:condition})',
  },
  {
    label: 'arr.reduce',
    doc: '**Array.reduce(callback, initialValue)** → Reduces array to a single value.\n\n```js\n[1,2,3,4].reduce((acc, x) => acc + x, 0)  // 10\n[1,2,3].reduce((acc, x) => { acc[x] = true; return acc; }, {})\n```',
    snippet: '${1:arr}.reduce((${2:acc}, ${3:cur}) => ${4:acc + cur}, ${5:0})',
  },
  {
    label: 'arr.forEach',
    doc: '**Array.forEach(callback)** → Executes callback for each element.',
    snippet: '${1:arr}.forEach((${2:item}, ${3:i}) => {\n  ${4:}\n})',
  },
  {
    label: 'arr.find',
    doc: '**Array.find(callback)** → Returns first element satisfying the condition (or undefined).\n\n```js\n[1,2,3].find(x => x > 1)  // 2\n```',
    snippet: '${1:arr}.find(${2:x} => ${3:condition})',
  },
  {
    label: 'arr.findIndex',
    doc: '**Array.findIndex(callback)** → Returns index of first element satisfying the condition (-1 if none).',
    snippet: '${1:arr}.findIndex(${2:x} => ${3:condition})',
  },
  {
    label: 'arr.some',
    doc: '**Array.some(callback)** → Returns true if at least one element passes the test.\n\n```js\n[1,2,3].some(x => x > 2)  // true\n```',
    snippet: '${1:arr}.some(${2:x} => ${3:condition})',
  },
  {
    label: 'arr.every',
    doc: '**Array.every(callback)** → Returns true if all elements pass the test.\n\n```js\n[2,4,6].every(x => x % 2 === 0)  // true\n```',
    snippet: '${1:arr}.every(${2:x} => ${3:condition})',
  },
  {
    label: 'arr.includes',
    doc: '**Array.includes(value, fromIndex=0)** → Returns true if value exists in array.',
    snippet: '${1:arr}.includes(${2:value})',
  },
  {
    label: 'arr.indexOf',
    doc: '**Array.indexOf(value, fromIndex=0)** → Returns first index of value, -1 if not found.',
    snippet: '${1:arr}.indexOf(${2:value})',
  },
  {
    label: 'arr.sort',
    doc: '**Array.sort(compareFn)** → Sorts array in place.\n\n```js\narr.sort((a, b) => a - b)      // ascending numbers\narr.sort((a, b) => b - a)      // descending numbers\narr.sort((a, b) => a.localeCompare(b))  // strings\n```',
    snippet: '${1:arr}.sort((${2:a}, ${3:b}) => ${2:a} - ${3:b})',
  },
  {
    label: 'arr.flat',
    doc: '**Array.flat(depth=1)** → Flattens nested arrays.\n\n```js\n[[1,2],[3,4]].flat()    // [1,2,3,4]\n[1,[2,[3]]].flat(Infinity) // [1,2,3]\n```',
    snippet: '${1:arr}.flat(${2:Infinity})',
  },
  {
    label: 'arr.flatMap',
    doc: '**Array.flatMap(callback)** → map + flat(1) combined.\n\n```js\n[1,2,3].flatMap(x => [x, x*2])  // [1,2,2,4,3,6]\n```',
    snippet: '${1:arr}.flatMap(${2:x} => ${3:[x]})',
  },
  {
    label: 'arr.slice',
    doc: '**Array.slice(start, end)** → Returns shallow copy of portion of array (non-destructive).\n\n```js\n[1,2,3,4,5].slice(1, 3)  // [2,3]\n[1,2,3].slice(-2)         // [2,3]  (from end)\n```',
    snippet: '${1:arr}.slice(${2:start}, ${3:end})',
  },
  {
    label: 'arr.splice',
    doc: '**Array.splice(start, deleteCount, ...items)** → Removes/replaces/inserts elements in place.\n\n```js\narr.splice(1, 2)         // remove 2 elements at index 1\narr.splice(1, 0, "a")   // insert "a" at index 1\n```',
    snippet: '${1:arr}.splice(${2:start}, ${3:deleteCount}, ${4:...items})',
  },
  {
    label: 'arr.push',
    doc: '**Array.push(...items)** → Adds items to the end. Returns new length.',
    snippet: '${1:arr}.push(${2:item})',
  },
  {
    label: 'arr.pop',
    doc: '**Array.pop()** → Removes and returns the last element.',
    snippet: '${1:arr}.pop()',
  },
  {
    label: 'arr.shift',
    doc: '**Array.shift()** → Removes and returns the first element.',
    snippet: '${1:arr}.shift()',
  },
  {
    label: 'arr.unshift',
    doc: '**Array.unshift(...items)** → Adds items to the beginning. Returns new length.',
    snippet: '${1:arr}.unshift(${2:item})',
  },
  {
    label: 'arr.join',
    doc: '**Array.join(separator=",")** → Joins array elements into a string.\n\n```js\n["a","b","c"].join(", ")  // "a, b, c"\n["a","b"].join("")         // "ab"\n```',
    snippet: '${1:arr}.join(${2:""})',
  },
  {
    label: 'arr.concat',
    doc: '**Array.concat(...arrays)** → Returns new array concatenating this with others.',
    snippet: '${1:arr}.concat(${2:other})',
  },
  {
    label: 'arr.fill',
    doc: '**Array.fill(value, start=0, end=length)** → Fills elements with value in place.\n\n```js\nnew Array(5).fill(0)         // [0,0,0,0,0]\n[1,2,3].fill(0, 1, 2)       // [1,0,3]\n```',
    snippet: '${1:arr}.fill(${2:0})',
  },
  {
    label: 'arr.reverse',
    doc: '**Array.reverse()** → Reverses array in place.',
    snippet: '${1:arr}.reverse()',
  },
  {
    label: 'arr.entries',
    doc: '**Array.entries()** → Returns [index, value] pairs iterator.\n\n```js\nfor (const [i, v] of arr.entries()) {}\n```',
    snippet: '${1:arr}.entries()',
  },
  {
    label: 'Array.from',
    doc: '**Array.from(iterable, mapFn)** → Creates array from iterable.\n\n```js\nArray.from("hello")           // ["h","e","l","l","o"]\nArray.from({length: 5}, (_, i) => i)  // [0,1,2,3,4]\nArray.from(new Set([1,2,2]))  // [1,2]\n```',
    snippet: 'Array.from(${1:iterable}, ${2:(_, i) => i})',
  },
  {
    label: 'Array.isArray',
    doc: '**Array.isArray(value)** → Returns true if value is an array.',
    snippet: 'Array.isArray(${1:value})',
  },
  // String methods
  {
    label: 'str.split',
    doc: '**String.split(separator, limit)** → Splits string into array.\n\n```js\n"a,b,c".split(",")   // ["a","b","c"]\n"hello".split("")    // ["h","e","l","l","o"]\n```',
    snippet: '${1:str}.split(${2:""})',
  },
  {
    label: 'str.includes',
    doc: '**String.includes(searchString, position=0)** → Returns true if searchString found.',
    snippet: '${1:str}.includes(${2:searchString})',
  },
  {
    label: 'str.indexOf',
    doc: '**String.indexOf(searchValue, fromIndex=0)** → Returns first index of searchValue (-1 if not found).',
    snippet: '${1:str}.indexOf(${2:searchValue})',
  },
  {
    label: 'str.slice',
    doc: '**String.slice(start, end)** → Extracts a section of a string.\n\n```js\n"hello".slice(1, 3)   // "el"\n"hello".slice(-3)     // "llo"\n```',
    snippet: '${1:str}.slice(${2:start}, ${3:end})',
  },
  {
    label: 'str.substring',
    doc: '**String.substring(start, end)** → Returns characters between start and end.',
    snippet: '${1:str}.substring(${2:start}, ${3:end})',
  },
  {
    label: 'str.trim',
    doc: '**String.trim()** → Removes whitespace from both ends.',
    snippet: '${1:str}.trim()',
  },
  {
    label: 'str.trimStart',
    doc: '**String.trimStart()** → Removes leading whitespace.',
    snippet: '${1:str}.trimStart()',
  },
  {
    label: 'str.trimEnd',
    doc: '**String.trimEnd()** → Removes trailing whitespace.',
    snippet: '${1:str}.trimEnd()',
  },
  {
    label: 'str.replace',
    doc: '**String.replace(search, replacement)** → Replaces first match.\n\n```js\n"hello".replace("l", "r")          // "herlo"\n"aaa".replace(/a/g, "b")           // "bbb" (regex global)\n"aaa".replaceAll("a", "b")         // "bbb"\n```',
    snippet: '${1:str}.replace(${2:/pattern/g}, ${3:replacement})',
  },
  {
    label: 'str.replaceAll',
    doc: '**String.replaceAll(search, replacement)** → Replaces all occurrences.',
    snippet: '${1:str}.replaceAll(${2:search}, ${3:replacement})',
  },
  {
    label: 'str.match',
    doc: '**String.match(regexp)** → Returns array of matches or null.\n\n```js\n"hello123".match(/\\d+/)    // ["123"]\n"hello".match(/[aeiou]/g)  // ["e","o"]\n```',
    snippet: '${1:str}.match(${2:/pattern/g})',
  },
  {
    label: 'str.padStart',
    doc: '**String.padStart(targetLength, padString=" ")** → Pads start with padString.\n\n```js\n"42".padStart(5, "0")  // "00042"\n```',
    snippet: '${1:str}.padStart(${2:length}, ${3:"0"})',
  },
  {
    label: 'str.padEnd',
    doc: '**String.padEnd(targetLength, padString=" ")** → Pads end with padString.',
    snippet: '${1:str}.padEnd(${2:length}, ${3:" "})',
  },
  {
    label: 'str.repeat',
    doc: '**String.repeat(count)** → Returns string repeated count times.\n\n```js\n"ab".repeat(3)  // "ababab"\n```',
    snippet: '${1:str}.repeat(${2:count})',
  },
  {
    label: 'str.toUpperCase',
    doc: '**String.toUpperCase()** → Returns uppercase copy.',
    snippet: '${1:str}.toUpperCase()',
  },
  {
    label: 'str.toLowerCase',
    doc: '**String.toLowerCase()** → Returns lowercase copy.',
    snippet: '${1:str}.toLowerCase()',
  },
  {
    label: 'str.charAt',
    doc: '**String.charAt(index)** → Returns character at index.\n\n```js\n"hello".charAt(0)  // "h"\n```',
    snippet: '${1:str}.charAt(${2:index})',
  },
  {
    label: 'str.charCodeAt',
    doc: '**String.charCodeAt(index)** → Returns Unicode code unit at index.\n\n```js\n"A".charCodeAt(0)  // 65\n```',
    snippet: '${1:str}.charCodeAt(${2:index})',
  },
  // Math
  {
    label: 'Math.max',
    doc: '**Math.max(...values)** → Returns the largest value.\n\n```js\nMath.max(1, 3, 2)      // 3\nMath.max(...arr)        // spread array\n```',
    snippet: 'Math.max(${1:...values})',
  },
  {
    label: 'Math.min',
    doc: '**Math.min(...values)** → Returns the smallest value.',
    snippet: 'Math.min(${1:...values})',
  },
  {
    label: 'Math.floor',
    doc: '**Math.floor(x)** → Returns the largest integer ≤ x.\n\n```js\nMath.floor(4.9)  // 4\nMath.floor(-4.1) // -5\n```',
    snippet: 'Math.floor(${1:x})',
  },
  {
    label: 'Math.ceil',
    doc: '**Math.ceil(x)** → Returns the smallest integer ≥ x.',
    snippet: 'Math.ceil(${1:x})',
  },
  {
    label: 'Math.round',
    doc: '**Math.round(x)** → Returns nearest integer.',
    snippet: 'Math.round(${1:x})',
  },
  {
    label: 'Math.abs',
    doc: '**Math.abs(x)** → Returns absolute value.',
    snippet: 'Math.abs(${1:x})',
  },
  {
    label: 'Math.pow',
    doc: '**Math.pow(base, exponent)** → Returns base raised to exponent power.\n\n```js\nMath.pow(2, 10)  // 1024\n2 ** 10           // same (ES7)\n```',
    snippet: 'Math.pow(${1:base}, ${2:exponent})',
  },
  {
    label: 'Math.sqrt',
    doc: '**Math.sqrt(x)** → Returns square root.',
    snippet: 'Math.sqrt(${1:x})',
  },
  {
    label: 'Math.log',
    doc: '**Math.log(x)** → Returns natural logarithm (ln).',
    snippet: 'Math.log(${1:x})',
  },
  {
    label: 'Math.log2',
    doc: '**Math.log2(x)** → Returns base-2 logarithm.',
    snippet: 'Math.log2(${1:x})',
  },
  {
    label: 'Math.log10',
    doc: '**Math.log10(x)** → Returns base-10 logarithm.',
    snippet: 'Math.log10(${1:x})',
  },
  {
    label: 'Math.PI',
    doc: '**Math.PI** → 3.141592653589793',
    snippet: 'Math.PI',
  },
  {
    label: 'Math.trunc',
    doc: '**Math.trunc(x)** → Returns integer part, truncating fractional digits.\n\n```js\nMath.trunc(4.9)  // 4\nMath.trunc(-4.9) // -4\n```',
    snippet: 'Math.trunc(${1:x})',
  },
  {
    label: 'Math.sign',
    doc: '**Math.sign(x)** → Returns 1, -1, or 0 based on the sign of x.',
    snippet: 'Math.sign(${1:x})',
  },
  // Object
  {
    label: 'Object.keys',
    doc: '**Object.keys(obj)** → Returns array of own enumerable property names.\n\n```js\nObject.keys({a:1, b:2})  // ["a","b"]\n```',
    snippet: 'Object.keys(${1:obj})',
  },
  {
    label: 'Object.values',
    doc: '**Object.values(obj)** → Returns array of own enumerable property values.',
    snippet: 'Object.values(${1:obj})',
  },
  {
    label: 'Object.entries',
    doc: '**Object.entries(obj)** → Returns array of [key, value] pairs.\n\n```js\nfor (const [k, v] of Object.entries(obj)) {}\n```',
    snippet: 'Object.entries(${1:obj})',
  },
  {
    label: 'Object.fromEntries',
    doc: '**Object.fromEntries(iterable)** → Creates object from [key, value] pairs.\n\n```js\nObject.fromEntries([["a",1],["b",2]])  // {a:1, b:2}\nObject.fromEntries(map)                 // Map to object\n```',
    snippet: 'Object.fromEntries(${1:entries})',
  },
  {
    label: 'Object.assign',
    doc: '**Object.assign(target, ...sources)** → Copies properties from sources to target.\n\n```js\nObject.assign({}, obj1, obj2)  // shallow merge\n```',
    snippet: 'Object.assign({}, ${1:source})',
  },
  // Map
  {
    label: 'new Map',
    doc: '**new Map()** → Creates a Map (key-value pairs, any key type).\n\n```js\nconst m = new Map();\nm.set("key", value);\nm.get("key");\nm.has("key");\nm.delete("key");\nm.size;\nfor (const [k, v] of m) {}\n```',
    snippet: 'new Map()',
  },
  {
    label: 'new Set',
    doc: '**new Set()** → Creates a Set (unique values).\n\n```js\nconst s = new Set([1,2,2,3]);\ns.add(4);\ns.has(2);       // true\ns.delete(2);\ns.size;\n[...s]          // convert to array\n```',
    snippet: 'new Set(${1:[]})',
  },
  // Patterns algorithmiques
  {
    label: 'binary search',
    doc: 'Binary search template for sorted array',
    snippet:
      'let lo = 0, hi = ${1:nums}.length - 1;\nwhile (lo <= hi) {\n  const mid = Math.floor((lo + hi) / 2);\n  if (${1:nums}[mid] === ${2:target}) return mid;\n  else if (${1:nums}[mid] < ${2:target}) lo = mid + 1;\n  else hi = mid - 1;\n}\nreturn -1;',
  },
  {
    label: 'two pointers',
    doc: 'Two pointers template',
    snippet:
      'let left = 0, right = ${1:arr}.length - 1;\nwhile (left < right) {\n  ${2:// process}\n  left++;\n  right--;\n}',
  },
  {
    label: 'sliding window',
    doc: 'Sliding window template',
    snippet:
      'let left = 0, ${1:result} = ${2:0};\nfor (let right = 0; right < ${3:arr}.length; right++) {\n  ${4:// expand window}\n  while (${5:condition}) {\n    ${6:// shrink}\n    left++;\n  }\n  ${7:// update result}\n}',
  },
  {
    label: 'dp array',
    doc: '1D dynamic programming array',
    snippet:
      'const dp = new Array(${1:n} + 1).fill(${2:0});\ndp[${3:0}] = ${4:1};\nfor (let i = 1; i <= ${1:n}; i++) {\n  dp[i] = ${5:dp[i-1]};\n}',
  },
  {
    label: 'frequency map',
    doc: 'Build frequency map from array',
    snippet:
      'const ${1:freq} = new Map();\nfor (const ${2:x} of ${3:arr}) {\n  ${1:freq}.set(${2:x}, (${1:freq}.get(${2:x}) ?? 0) + 1);\n}',
  },
  {
    label: 'graph adjacency list',
    doc: 'Build adjacency list from edges',
    snippet:
      'const graph = new Map();\nfor (const [${1:u}, ${2:v}] of ${3:edges}) {\n  if (!graph.has(${1:u})) graph.set(${1:u}, []);\n  if (!graph.has(${2:v})) graph.set(${2:v}, []);\n  graph.get(${1:u}).push(${2:v});\n  graph.get(${2:v}).push(${1:u});\n}',
  },
  {
    label: 'bfs',
    doc: 'BFS with queue',
    snippet:
      'const queue = [${1:start}];\nconst visited = new Set([${1:start}]);\nwhile (queue.length) {\n  const ${2:node} = queue.shift();\n  for (const ${3:next} of graph.get(${2:node}) ?? []) {\n    if (!visited.has(${3:next})) {\n      visited.add(${3:next});\n      queue.push(${3:next});\n    }\n  }\n}',
  },
  {
    label: 'dfs recursive',
    doc: 'DFS recursive template',
    snippet:
      'function dfs(${1:node}, visited = new Set()) {\n  if (visited.has(${1:node})) return;\n  visited.add(${1:node});\n  for (const ${2:next} of graph.get(${1:node}) ?? []) {\n    dfs(${2:next}, visited);\n  }\n}',
  },
  // Misc
  {
    label: 'Infinity',
    doc: '**Infinity** → Positive infinity constant.\n\n```js\nlet min = Infinity;\n```',
    snippet: 'Infinity',
  },
  {
    label: 'Number.MAX_SAFE_INTEGER',
    doc: '**Number.MAX_SAFE_INTEGER** → 2^53 - 1 = 9007199254740991',
    snippet: 'Number.MAX_SAFE_INTEGER',
  },
  {
    label: 'parseInt',
    doc: '**parseInt(string, radix=10)** → Parses a string and returns an integer.\n\n```js\nparseInt("42")      // 42\nparseInt("ff", 16)  // 255\n```',
    snippet: 'parseInt(${1:str}, ${2:10})',
  },
  {
    label: 'parseFloat',
    doc: '**parseFloat(string)** → Parses string and returns floating point number.',
    snippet: 'parseFloat(${1:str})',
  },
  {
    label: 'isNaN',
    doc: '**isNaN(value)** → Returns true if value is NaN.\n\nPrefer Number.isNaN() for strict checking.',
    snippet: 'Number.isNaN(${1:value})',
  },
  {
    label: 'JSON.stringify',
    doc: '**JSON.stringify(value, replacer, space)** → Converts value to JSON string.',
    snippet: 'JSON.stringify(${1:value}, ${2:null}, ${3:2})',
  },
  {
    label: 'JSON.parse',
    doc: '**JSON.parse(text)** → Parses JSON string and returns JavaScript value.',
    snippet: 'JSON.parse(${1:jsonString})',
  },
  {
    label: 'structuredClone',
    doc: '**structuredClone(value)** → Creates a deep clone of the value.',
    snippet: 'structuredClone(${1:value})',
  },
  {
    label: 'for of',
    doc: 'for...of loop — iterates over iterable values',
    snippet: 'for (const ${1:item} of ${2:iterable}) {\n  ${3:}\n}',
  },
  {
    label: 'for in',
    doc: 'for...in loop — iterates over object keys',
    snippet: 'for (const ${1:key} in ${2:obj}) {\n  ${3:}\n}',
  },
];

// ---------------------------------------------------------------------------
// Enregistrement des providers
// ---------------------------------------------------------------------------

function makeRange(monaco: Monaco, position: { lineNumber: number; column: number }, word: { startColumn: number; endColumn: number }) {
  return {
    startLineNumber: position.lineNumber,
    endLineNumber: position.lineNumber,
    startColumn: word.startColumn,
    endColumn: word.endColumn,
  };
}

export function registerIntelliSense(monaco: Monaco) {
  if (registered) return;
  registered = true;

  const { CompletionItemKind, CompletionItemInsertTextRule } = monaco.languages;

  // -------------------------------------------------------------------------
  // PYTHON — Completion provider
  // -------------------------------------------------------------------------
  monaco.languages.registerCompletionItemProvider('python', {
    triggerCharacters: ['.', '(', ','],
    provideCompletionItems: (model: Monaco, position: Monaco) => {
      const word = model.getWordUntilPosition(position);
      const range = makeRange(monaco, position, word);
      const line: string = model.getLineContent(position.lineNumber);
      const beforeCursor = line.substring(0, position.column - 1);

      // After a dot → méthodes contextuelles
      const dotMatch = beforeCursor.match(/(\w+)\.$/);
      if (dotMatch) {
        // On renvoie toutes les méthodes (le contexte est trop dynamique pour deviner le type)
        const allMethods = [
          ...PYTHON_STRING_METHODS,
          ...PYTHON_LIST_METHODS,
          ...PYTHON_DICT_METHODS,
          ...PYTHON_SET_METHODS,
        ];
        return {
          suggestions: allMethods.map((m) => ({
            label: m.label,
            kind: CompletionItemKind.Method,
            documentation: { value: m.doc },
            insertText: m.snippet ?? m.label,
            insertTextRules: CompletionItemInsertTextRule.InsertAsSnippet,
            range,
          })),
        };
      }

      // Global completions : built-ins + keywords + snippets
      const suggestions = [
        ...PYTHON_BUILTINS.map((b) => ({
          label: b.label,
          kind: CompletionItemKind.Function,
          documentation: { value: b.doc },
          insertText: b.snippet ?? b.label,
          insertTextRules: b.snippet ? CompletionItemInsertTextRule.InsertAsSnippet : undefined,
          detail: 'Python built-in',
          range,
        })),
        ...PYTHON_KEYWORDS.map((k) => ({
          label: k,
          kind: CompletionItemKind.Keyword,
          insertText: k,
          range,
        })),
        ...PYTHON_SNIPPETS.map((s) => ({
          label: s.label,
          kind: s.snippet?.includes('\n') ? CompletionItemKind.Snippet : CompletionItemKind.Function,
          documentation: { value: s.doc },
          insertText: s.snippet,
          insertTextRules: CompletionItemInsertTextRule.InsertAsSnippet,
          detail: 'Snippet',
          range,
        })),
      ];

      return { suggestions };
    },
  });

  // -------------------------------------------------------------------------
  // PYTHON — Hover provider
  // -------------------------------------------------------------------------
  monaco.languages.registerHoverProvider('python', {
    provideHover: (model: Monaco, position: Monaco) => {
      const word = model.getWordAtPosition(position);
      if (!word) return null;
      const found = PYTHON_BUILTINS.find((b) => b.label === word.word);
      if (!found) return null;
      return {
        range: {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn,
        },
        contents: [{ value: found.doc }],
      };
    },
  });

  // -------------------------------------------------------------------------
  // JAVASCRIPT — Completion provider (supplément aux completions natives)
  // -------------------------------------------------------------------------
  monaco.languages.registerCompletionItemProvider('javascript', {
    triggerCharacters: ['.', '(', ','],
    provideCompletionItems: (model: Monaco, position: Monaco) => {
      const word = model.getWordUntilPosition(position);
      const range = makeRange(monaco, position, word);

      return {
        suggestions: JS_SNIPPETS.map((s) => ({
          label: s.label,
          kind: s.snippet?.includes('\n') ? CompletionItemKind.Snippet : CompletionItemKind.Method,
          documentation: { value: s.doc },
          insertText: s.snippet,
          insertTextRules: CompletionItemInsertTextRule.InsertAsSnippet,
          detail: 'CloudCode',
          range,
        })),
      };
    },
  });
}
