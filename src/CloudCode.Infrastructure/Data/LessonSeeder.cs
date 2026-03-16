using CloudCode.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace CloudCode.Infrastructure.Data;

public static class LessonSeeder
{
    public static async Task SeedLessonsAsync(IServiceProvider serviceProvider)
    {
        using var scope = serviceProvider.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

        // Get all challenge IDs we need for linking
        var challengeSlugs = new[]
        {
            // Python Ch1
            "temperature-converter", "simple-calculator", "greeting-format",
            "grade-classifier", "sum-multiples", "countdown",
            // Python Ch2
            "list-stats", "sort-by-score", "dict-invert",
            "common-elements", "even-squares", "group-by-first",
            // JS Ch1
            "js-greet", "js-is-even", "js-count-vowels",
            "js-fizzbuzz-single", "js-sum-array", "js-reverse-string",
            // JS Ch2
            "js-array-max", "js-count-words", "js-unique", "js-flatten-once",
        };

        var challengesBySlug = await db.Challenges
            .Where(c => challengeSlugs.Contains(c.Slug))
            .ToDictionaryAsync(c => c.Slug, c => c.Id);

        // Seed each course's lessons independently — skip courses that already have lessons
        await SeedCourseIfEmpty(db, "python-beginner-ch1", challengesBySlug, GetChapter1Lessons);
        await SeedCourseIfEmpty(db, "python-beginner-ch2", challengesBySlug, GetChapter2Lessons);
        await SeedCourseIfEmpty(db, "js-beginner-ch1", challengesBySlug, GetJsChapter1Lessons);
        await SeedCourseIfEmpty(db, "js-beginner-ch2", challengesBySlug, GetJsChapter2Lessons);
    }

    private static async Task SeedCourseIfEmpty(
        ApplicationDbContext db,
        string courseSlug,
        Dictionary<string, Guid> challenges,
        Func<Dictionary<string, Guid>, List<Lesson>> getLessons)
    {
        var course = await db.Courses
            .Include(c => c.Lessons)
            .FirstOrDefaultAsync(c => c.Slug == courseSlug);

        if (course == null) return;

        var lessons = getLessons(challenges);
        var existingBySlug = course.Lessons.ToDictionary(l => l.Slug);

        foreach (var seed in lessons)
        {
            if (existingBySlug.TryGetValue(seed.Slug, out var existing))
            {
                // Upsert — update content in place, preserve ID
                existing.Title = seed.Title;
                existing.Content = seed.Content;
                existing.OrderIndex = seed.OrderIndex;
                existing.IsPublished = seed.IsPublished;
                existing.ChallengeId = seed.ChallengeId;
            }
            else
            {
                seed.CourseId = course.Id;
                db.Lessons.Add(seed);
            }
        }

        await db.SaveChangesAsync();
    }

    // ═══════════════════════════════════════════════════════════════
    // Chapter 1 — Introduction & Fundamentals
    // ═══════════════════════════════════════════════════════════════

    private static List<Lesson> GetChapter1Lessons(Dictionary<string, Guid> challenges)
    {
        return
        [
            // Lesson 1: Welcome + First Steps
            new Lesson
            {
                Title = "Welcome to Python",
                Slug = "welcome-to-python",
                OrderIndex = 0,
                IsPublished = true,
                Content = @"## Welcome to Chapter 1! 🐍

Welcome to your Python journey! This course is designed to take you from zero to writing your first functional scripts. We will cover the building blocks of programming: **storing data**, **making decisions**, and **repeating tasks**.

### What is Python?

Python is one of the most popular programming languages in the world. Created by **Guido van Rossum** in 1991, it was designed to be **easy to read** and **fun to use**.

Python is used everywhere:
- **Web Development** (Django, Flask, FastAPI)
- **Data Science & Machine Learning** (NumPy, Pandas, TensorFlow)
- **Automation & Scripting**
- **Game Development**
- **And much more!**

### Why Python?

```python
# This is Python — clean and readable
name = ""Alice""
if len(name) > 3:
    print(f""Hello, {name}!"")
```

Compare that to the same logic in Java:
```
// This is Java — more verbose
String name = ""Alice"";
if (name.length() > 3) {
    System.out.println(""Hello, "" + name + ""!"");
}
```

Python's philosophy is captured in **The Zen of Python** — type `import this` in a Python shell to see it. The key principles:

> **Beautiful is better than ugly.**
> **Simple is better than complex.**
> **Readability counts.**

### Your First Python Code

```python
print(""Hello, World!"")
```

That's it. One line. No semicolons, no brackets, no boilerplate. Just `print()` and your message.

### How Python Runs Code

Python is an **interpreted** language. This means your code is executed line by line, from top to bottom:

```python
print(""Line 1"")   # Runs first
print(""Line 2"")   # Runs second
print(""Line 3"")   # Runs third
```

### Comments

Use `#` to add comments — notes that Python ignores:

```python
# This is a comment — Python skips this line
print(""This runs!"")  # Inline comment
```

Comments help you (and others) understand your code later."
            },

            // Lesson 2: Variables & Data Types
            new Lesson
            {
                Title = "Variables & Data Types",
                Slug = "variables-and-data-types",
                OrderIndex = 1,
                IsPublished = true,
                ChallengeId = challenges.GetValueOrDefault("temperature-converter"),
                Content = @"## Variables & Data Types

In Python, a **variable** is like a labeled box where you store information. You don't need to declare the type explicitly — Python figures it out automatically. This is called **Dynamic Typing**.

### Creating Variables

```python
age = 25              # int (integer)
price = 19.99         # float (decimal)
name = ""Alice""        # str (string)
is_student = False    # bool (boolean)
```

No `int`, `String`, or `var` keyword needed. Just pick a name and assign a value with `=`.

### Common Data Types

| Type | Description | Examples |
|------|-------------|----------|
| `int` | Whole numbers | `5`, `-10`, `0`, `1000` |
| `float` | Decimal numbers | `3.14`, `-0.01`, `2.0` |
| `str` | Text strings | `""Hello""`, `'Python'` |
| `bool` | True/False values | `True`, `False` |

### Checking Types

Use the `type()` function to see what type a variable is:

```python
age = 25
print(type(age))      # <class 'int'>

price = 19.99
print(type(price))    # <class 'float'>

name = ""Alice""
print(type(name))     # <class 'str'>
```

### Type Conversion

You can convert between types using built-in functions:

```python
# String to integer
user_input = ""100""
number = int(user_input)    # 100 (int)

# Integer to float
x = float(42)              # 42.0

# Number to string
age = 25
text = str(age)            # ""25"" (string)

# Float to integer (truncates!)
pi = 3.14159
whole = int(pi)            # 3 (decimal part is dropped)
```

> **Important:** `int()` doesn't round — it truncates (cuts off the decimal part). `int(3.9)` gives `3`, not `4`.

### Variable Naming Rules

```python
# ✅ Valid names
my_name = ""Alice""
age2 = 25
_private = True
MAX_SIZE = 100

# ❌ Invalid names
2fast = ""no""       # Can't start with a number
my-name = ""no""     # No hyphens (use underscores)
class = ""no""       # Can't use reserved keywords
```

**Convention:** Python uses `snake_case` for variables and functions (words separated by underscores).

### Mini Exercise

> Create a variable called `pi` with the value `3.14159`. Convert it to an integer and print the result. What do you get?"
            },

            // Lesson 3: Operators & Expressions
            new Lesson
            {
                Title = "Operators & Expressions",
                Slug = "operators-and-expressions",
                OrderIndex = 2,
                IsPublished = true,
                ChallengeId = challenges.GetValueOrDefault("simple-calculator"),
                Content = @"## Operators & Expressions

Operators let you perform calculations, compare values, and combine conditions.

### Arithmetic Operators

```python
a = 10
b = 3

print(a + b)    # 13    Addition
print(a - b)    # 7     Subtraction
print(a * b)    # 30    Multiplication
print(a / b)    # 3.33  Division (always returns float)
print(a // b)   # 3     Floor division (rounds down)
print(a % b)    # 1     Modulo (remainder)
print(a ** b)   # 1000  Exponentiation (10³)
```

> **Key difference:** `/` always returns a float (`10 / 2` gives `5.0`), while `//` returns an integer (`10 // 2` gives `5`).

### Comparison Operators

These return `True` or `False`:

```python
x = 10
print(x == 10)   # True   Equal to
print(x != 5)    # True   Not equal to
print(x > 5)     # True   Greater than
print(x < 20)    # True   Less than
print(x >= 10)   # True   Greater or equal
print(x <= 9)    # False  Less or equal
```

### Logical Operators

Combine boolean expressions:

```python
age = 25
has_license = True

# and — both must be True
print(age >= 18 and has_license)  # True

# or — at least one must be True
print(age < 18 or has_license)    # True

# not — reverses the value
print(not has_license)            # False
```

### Operator Precedence

Just like math, Python follows an order of operations:

```python
result = 2 + 3 * 4    # 14 (not 20!)
result = (2 + 3) * 4  # 20 (parentheses first)
```

Order: `**` → `* / // %` → `+ -` → comparisons → `not` → `and` → `or`

### Augmented Assignment

Shortcuts for updating variables:

```python
x = 10
x += 5    # x = x + 5  → 15
x -= 3    # x = x - 3  → 12
x *= 2    # x = x * 2  → 24
x /= 4    # x = x / 4  → 6.0
```"
            },

            // Lesson 4: String Formatting
            new Lesson
            {
                Title = "User Interaction & Display",
                Slug = "user-interaction-and-display",
                OrderIndex = 3,
                IsPublished = true,
                ChallengeId = challenges.GetValueOrDefault("greeting-format"),
                Content = @"## User Interaction & Display

### The `print()` Function

`print()` is how you display output:

```python
print(""Hello, World!"")
print(42)
print(3.14)
print(True)
```

You can print multiple values separated by commas:

```python
name = ""Alice""
age = 25
print(""Name:"", name, ""Age:"", age)
# Output: Name: Alice Age: 25
```

### The `input()` Function

`input()` pauses the program and waits for the user to type something:

```python
name = input(""What is your name? "")
print(""Hello,"", name)
```

> **Important:** `input()` always returns a **string**, even if the user types a number. You must convert it:

```python
age_str = input(""How old are you? "")
age = int(age_str)  # Convert string to integer
print(""Next year you'll be"", age + 1)
```

### String Formatting with f-strings

**f-strings** (formatted string literals) are the modern, Pythonic way to embed variables in strings. Just add `f` before the quotes:

```python
name = ""Alice""
age = 25

# f-string — the best way
greeting = f""Hello, {name}! You are {age} years old.""
print(greeting)
# Output: Hello, Alice! You are 25 years old.
```

You can put **any expression** inside `{}`:

```python
price = 49.99
tax = 0.2

print(f""Total: ${price * (1 + tax):.2f}"")
# Output: Total: $59.99
```

The `:.2f` formats the number to 2 decimal places.

### Other String Methods

```python
text = ""  Hello, World!  ""

print(text.strip())       # ""Hello, World!"" (removes whitespace)
print(text.lower())       # ""  hello, world!  ""
print(text.upper())       # ""  HELLO, WORLD!  ""
print(text.replace(""World"", ""Python""))  # ""  Hello, Python!  ""
print(len(text))          # 19 (length including spaces)
```

### String Concatenation

```python
first = ""Hello""
second = ""World""

# Using +
result = first + "", "" + second + ""!""  # ""Hello, World!""

# Using f-string (preferred)
result = f""{first}, {second}!""          # ""Hello, World!""
```"
            },

            // Lesson 5: Conditionals
            new Lesson
            {
                Title = "Conditional Statements",
                Slug = "conditional-statements",
                OrderIndex = 4,
                IsPublished = true,
                ChallengeId = challenges.GetValueOrDefault("grade-classifier"),
                Content = @"## Conditional Statements

Conditionals let your program **make decisions** based on conditions.

### The `if` Statement

```python
age = 18

if age >= 18:
    print(""You are an adult"")
```

> **Critical:** Python uses **indentation** (4 spaces) to define code blocks, not curly braces `{}`. This is not optional — it's part of the syntax!

### `if` / `else`

```python
temperature = 35

if temperature > 30:
    print(""It's hot!"")
else:
    print(""It's not too hot"")
```

### `if` / `elif` / `else`

`elif` (short for ""else if"") lets you check multiple conditions:

```python
score = 85

if score >= 90:
    grade = ""A""
elif score >= 80:
    grade = ""B""
elif score >= 70:
    grade = ""C""
elif score >= 60:
    grade = ""D""
else:
    grade = ""F""

print(f""Your grade: {grade}"")  # Your grade: B
```

> **Order matters!** Python checks conditions from top to bottom and stops at the **first match**. Put the most specific conditions first.

### Nested Conditionals

You can put `if` statements inside other `if` statements:

```python
age = 25
has_ticket = True

if age >= 18:
    if has_ticket:
        print(""Welcome to the show!"")
    else:
        print(""You need a ticket"")
else:
    print(""You must be 18 or older"")
```

### Truthy and Falsy Values

In Python, some values are considered `False` in boolean context:

```python
# These are all ""falsy"":
if not 0:        print(""0 is falsy"")
if not """":       print(""empty string is falsy"")
if not []:       print(""empty list is falsy"")
if not None:     print(""None is falsy"")

# Everything else is ""truthy"":
if 42:           print(""42 is truthy"")
if ""hello"":     print(""non-empty string is truthy"")
if [1, 2, 3]:   print(""non-empty list is truthy"")
```

### Ternary Expression

A one-line `if/else`:

```python
age = 20
status = ""adult"" if age >= 18 else ""minor""
print(status)  # ""adult""
```"
            },

            // Lesson 6: Loops
            new Lesson
            {
                Title = "Loops & Iteration",
                Slug = "loops-and-iteration",
                OrderIndex = 5,
                IsPublished = true,
                ChallengeId = challenges.GetValueOrDefault("sum-multiples"),
                Content = @"## Loops & Iteration

Loops let you **repeat code** without writing it multiple times.

### The `for` Loop

The `for` loop iterates over a sequence (list, string, range, etc.):

```python
# Iterate over a list
fruits = [""apple"", ""banana"", ""cherry""]
for fruit in fruits:
    print(fruit)
# apple
# banana
# cherry
```

### `range()` — Generate Number Sequences

`range()` is your best friend for counting loops:

```python
# range(stop) — 0 to stop-1
for i in range(5):
    print(i)    # 0, 1, 2, 3, 4

# range(start, stop)
for i in range(2, 6):
    print(i)    # 2, 3, 4, 5

# range(start, stop, step)
for i in range(0, 10, 2):
    print(i)    # 0, 2, 4, 6, 8
```

### The `while` Loop

The `while` loop repeats **as long as a condition is true**:

```python
count = 5
while count > 0:
    print(count)
    count -= 1
print(""Go!"")
# 5, 4, 3, 2, 1, Go!
```

> **Warning:** If the condition never becomes `False`, you get an **infinite loop**! Always make sure something changes inside the loop.

### `break` and `continue`

```python
# break — exit the loop immediately
for i in range(10):
    if i == 5:
        break
    print(i)    # 0, 1, 2, 3, 4

# continue — skip to the next iteration
for i in range(5):
    if i == 2:
        continue
    print(i)    # 0, 1, 3, 4
```

### Common Patterns

**Summing numbers:**
```python
total = 0
for i in range(1, 11):
    total += i
print(total)    # 55
```

**Finding a value:**
```python
numbers = [4, 7, 2, 9, 1]
for n in numbers:
    if n > 8:
        print(f""Found: {n}"")
        break
```

**Counting occurrences:**
```python
text = ""hello world""
count = 0
for char in text:
    if char == ""l"":
        count += 1
print(f""Found {count} l's"")  # Found 3 l's
```

### `for` vs `while`

| Use `for` when... | Use `while` when... |
|---|---|
| You know how many iterations | You don't know how many iterations |
| Iterating over a collection | Waiting for a condition |
| Counting with `range()` | User input loops |"
            },

            // Lesson 7: While loops (with countdown challenge)
            new Lesson
            {
                Title = "Practice: While Loops",
                Slug = "practice-while-loops",
                OrderIndex = 6,
                IsPublished = true,
                ChallengeId = challenges.GetValueOrDefault("countdown"),
                Content = @"## Practice: While Loops

Now it's time to practice `while` loops with a hands-on challenge!

### Quick Recap

A `while` loop repeats a block of code as long as its condition is `True`:

```python
n = 3
while n > 0:
    print(n)
    n -= 1       # Don't forget to update!
# Output: 3, 2, 1
```

### Building a String in a Loop

Sometimes you need to build up a result as you loop. There are two common patterns:

**Pattern 1: Accumulate into a list, then join**
```python
parts = []
n = 5
while n > 0:
    parts.append(str(n))
    n -= 1
result = "" "".join(parts)    # ""5 4 3 2 1""
```

**Pattern 2: String concatenation**
```python
result = """"
n = 5
while n > 0:
    result += str(n) + "" ""
    n -= 1
result = result.strip()    # ""5 4 3 2 1""
```

> **Tip:** Pattern 1 (list + join) is more efficient for large strings, but both work fine for small outputs.

### Your Challenge

Now try the **Countdown** challenge below! You need to:
1. Start from `n`
2. Count down to `1`
3. Add `Go!` at the end
4. Return everything as a single string with spaces"
            },
        ];
    }

    // ═══════════════════════════════════════════════════════════════
    // Chapter 2 — Essential Data Structures
    // ═══════════════════════════════════════════════════════════════

    private static List<Lesson> GetChapter2Lessons(Dictionary<string, Guid> challenges)
    {
        return
        [
            // Lesson 1: Introduction to Data Structures
            new Lesson
            {
                Title = "Introduction to Data Structures",
                Slug = "intro-data-structures",
                OrderIndex = 0,
                IsPublished = true,
                Content = @"## Welcome to Chapter 2: Data Structures

In Chapter 1, you learned to work with single values — a number, a string, a boolean. But real programs deal with **collections** of data: a list of names, a set of unique tags, a mapping of students to grades.

Python comes with four powerful built-in data structures:

### The Big Four

| Structure | Ordered? | Mutable? | Duplicates? | Example |
|-----------|----------|----------|-------------|---------|
| **List** | Yes | Yes | Yes | `[1, 2, 3, 2]` |
| **Tuple** | Yes | **No** | Yes | `(1, 2, 3, 2)` |
| **Dictionary** | Yes* | Yes | Keys: No | `{""a"": 1, ""b"": 2}` |
| **Set** | **No** | Yes | **No** | `{1, 2, 3}` |

*Dictionaries are insertion-ordered since Python 3.7.

### When to Use What?

```python
# LIST — ordered collection you can modify
shopping = [""milk"", ""eggs"", ""bread""]

# TUPLE — fixed data that shouldn't change
coordinates = (48.8566, 2.3522)  # Paris

# DICTIONARY — key-value lookup
grades = {""Alice"": 90, ""Bob"": 85}

# SET — unique elements, fast membership test
visited = {""Paris"", ""London"", ""Tokyo""}
```

### Quick Decision Guide

- Need to **maintain order** and **modify**? → **List**
- Need **immutable** ordered data? → **Tuple**
- Need to **look up values by key**? → **Dictionary**
- Need **unique elements** or **set math**? → **Set**

### What You'll Learn

In this chapter, you'll master each of these structures:
1. **Lists** — the workhorse of Python collections
2. **Tuples** — lightweight, immutable sequences
3. **Dictionaries** — the most powerful built-in type
4. **Sets** — mathematical set operations
5. **Comprehensions** — Python's secret weapon for concise code

Let's dive in!"
            },

            // Lesson 2: Lists
            new Lesson
            {
                Title = "Lists",
                Slug = "lists",
                OrderIndex = 1,
                IsPublished = true,
                ChallengeId = challenges.GetValueOrDefault("list-stats"),
                Content = @"## Lists — Python's Workhorse

A **list** is an ordered, mutable collection. It's the most commonly used data structure in Python.

### Creating Lists

```python
# Empty list
empty = []
empty2 = list()

# List with values
numbers = [1, 2, 3, 4, 5]
names = [""Alice"", ""Bob"", ""Charlie""]
mixed = [1, ""hello"", True, 3.14]  # Can mix types (but usually don't)

# From other iterables
chars = list(""hello"")            # [""h"", ""e"", ""l"", ""l"", ""o""]
from_range = list(range(5))      # [0, 1, 2, 3, 4]
from_tuple = list((1, 2, 3))    # [1, 2, 3]
```

### Accessing Elements

Python uses **zero-based indexing**:

```python
fruits = [""apple"", ""banana"", ""cherry"", ""date""]

print(fruits[0])    # ""apple""   (first)
print(fruits[2])    # ""cherry""  (third)
print(fruits[-1])   # ""date""    (last)
print(fruits[-2])   # ""cherry""  (second to last)
```

### Slicing

Extract a sub-list with `[start:stop:step]`:

```python
numbers = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]

print(numbers[2:5])     # [2, 3, 4]         (index 2 to 4)
print(numbers[:3])      # [0, 1, 2]         (first 3)
print(numbers[7:])      # [7, 8, 9]         (from index 7)
print(numbers[::2])     # [0, 2, 4, 6, 8]   (every 2nd)
print(numbers[::-1])    # [9, 8, ..., 0]     (reversed!)

# Slice assignment
numbers[2:5] = [20, 30]          # Replace slice with different length
numbers[::2] = [0, 0, 0, 0, 0]  # Replace every 2nd element
```

> **Key insight:** `numbers[a:b]` gives you elements from index `a` up to (but **not including**) `b`.

---

### Complete List Methods Reference

#### Adding Elements

| Method | Description | Example |
|--------|-------------|---------|
| `.append(x)` | Add `x` to the end | `lst.append(4)` |
| `.insert(i, x)` | Insert `x` at index `i` | `lst.insert(0, ""first"")` |
| `.extend(iterable)` | Add all elements from iterable | `lst.extend([4, 5, 6])` |
| `+` operator | Concatenate two lists (new list) | `new = lst + [4, 5]` |
| `*` operator | Repeat a list | `new = [0] * 5` → `[0,0,0,0,0]` |

```python
fruits = [""apple""]
fruits.append(""banana"")          # [""apple"", ""banana""]
fruits.insert(1, ""avocado"")      # [""apple"", ""avocado"", ""banana""]
fruits.extend([""cherry"", ""date""])  # [""apple"", ""avocado"", ""banana"", ""cherry"", ""date""]
```

> **`.append()` vs `.extend()`** : `append([1,2])` adds the list as a single element; `extend([1,2])` adds each element individually.

#### Removing Elements

| Method | Description | Returns |
|--------|-------------|---------|
| `.remove(x)` | Remove **first** occurrence of `x` | Nothing (`None`) |
| `.pop()` | Remove and return **last** element | The removed element |
| `.pop(i)` | Remove and return element at index `i` | The removed element |
| `.clear()` | Remove **all** elements | Nothing (`None`) |
| `del lst[i]` | Delete element at index `i` | — |
| `del lst[a:b]` | Delete a slice | — |

```python
numbers = [1, 2, 3, 2, 4]
numbers.remove(2)       # [1, 3, 2, 4] — removes FIRST 2 only
last = numbers.pop()    # last = 4, numbers = [1, 3, 2]
second = numbers.pop(1) # second = 3, numbers = [1, 2]
numbers.clear()         # []
```

> **Warning:** `.remove(x)` raises `ValueError` if `x` is not in the list. Check with `if x in lst:` first.

#### Searching & Counting

| Method | Description | Returns |
|--------|-------------|---------|
| `.index(x)` | Index of **first** occurrence of `x` | `int` |
| `.index(x, start, end)` | Search in slice `[start:end]` | `int` |
| `.count(x)` | Count occurrences of `x` | `int` |
| `x in lst` | Check membership | `bool` |
| `x not in lst` | Check absence | `bool` |

```python
letters = [""a"", ""b"", ""c"", ""b"", ""d"", ""b""]

print(letters.index(""b""))        # 1 (first occurrence)
print(letters.index(""b"", 2))     # 3 (search from index 2)
print(letters.count(""b""))        # 3
print(""c"" in letters)            # True
print(""z"" not in letters)        # True
```

> **Warning:** `.index(x)` raises `ValueError` if `x` is not found. Use `if x in lst:` before calling it.

#### Ordering & Reversing

| Method | Description | In-place? |
|--------|-------------|-----------|
| `.sort()` | Sort the list ascending | Yes |
| `.sort(reverse=True)` | Sort descending | Yes |
| `.sort(key=func)` | Sort by custom key | Yes |
| `.reverse()` | Reverse the list | Yes |
| `sorted(lst)` | Return a new sorted list | No (new list) |
| `reversed(lst)` | Return a reverse iterator | No (iterator) |

```python
numbers = [3, 1, 4, 1, 5, 9]

# In-place sort
numbers.sort()                    # [1, 1, 3, 4, 5, 9]
numbers.sort(reverse=True)        # [9, 5, 4, 3, 1, 1]

# Sort by custom key
words = [""banana"", ""apple"", ""cherry""]
words.sort(key=len)               # [""apple"", ""banana"", ""cherry""]
words.sort(key=str.lower)         # Case-insensitive sort

# Reverse in place
numbers.reverse()                 # [1, 1, 3, 4, 5, 9]

# Non-destructive alternatives
original = [3, 1, 4]
new_sorted = sorted(original)        # original unchanged
new_reversed = list(reversed(original))  # original unchanged
```

> **`.sort()` vs `sorted()`** : `.sort()` modifies the list in place and returns `None`. `sorted()` returns a **new** list and leaves the original unchanged.

#### Copying

| Method | Description | Depth |
|--------|-------------|-------|
| `.copy()` | Shallow copy | Shallow |
| `lst[:]` | Shallow copy via slice | Shallow |
| `list(lst)` | Shallow copy via constructor | Shallow |
| `copy.deepcopy(lst)` | Deep copy (nested structures) | Deep |

```python
import copy

a = [[1, 2], [3, 4]]
b = a.copy()             # Shallow: b[0] is same object as a[0]
c = copy.deepcopy(a)     # Deep: c[0] is a new independent list

b[0].append(99)
print(a[0])  # [1, 2, 99] — affected by shallow copy!
print(c[0])  # [1, 2]     — not affected by deep copy
```

---

### Complete Built-in Functions for Lists

| Function | Description | Example |
|----------|-------------|---------|
| `len(lst)` | Number of elements | `len([1,2,3])` → `3` |
| `min(lst)` | Smallest element | `min([3,1,2])` → `1` |
| `max(lst)` | Largest element | `max([3,1,2])` → `3` |
| `sum(lst)` | Sum of all elements | `sum([1,2,3])` → `6` |
| `sum(lst, start)` | Sum with initial value | `sum([1,2], 10)` → `13` |
| `sorted(lst)` | New sorted list | `sorted([3,1,2])` → `[1,2,3]` |
| `reversed(lst)` | Reverse iterator | `list(reversed([1,2,3]))` → `[3,2,1]` |
| `enumerate(lst)` | Index + value pairs | `list(enumerate([""a"",""b""]))` → `[(0,""a""),(1,""b"")]` |
| `zip(a, b)` | Pair elements | `list(zip([1,2],[""a"",""b""]))` → `[(1,""a""),(2,""b"")]` |
| `map(func, lst)` | Apply function to each | `list(map(str, [1,2,3]))` → `[""1"",""2"",""3""]` |
| `filter(func, lst)` | Keep elements where func is True | `list(filter(lambda x: x>2, [1,2,3,4]))` → `[3,4]` |
| `any(lst)` | True if any element is truthy | `any([0, False, 3])` → `True` |
| `all(lst)` | True if all elements are truthy | `all([1, True, ""hi""])` → `True` |
| `abs(x)` | Absolute value (single number) | `abs(-5)` → `5` |
| `round(x, n)` | Round to n decimals | `round(3.14159, 2)` → `3.14` |

```python
numbers = [4, 2, 9, 1, 7]

# Basic stats
print(len(numbers))      # 5
print(min(numbers))       # 1
print(max(numbers))       # 9
print(sum(numbers))       # 23

# Average
avg = sum(numbers) / len(numbers)
print(round(avg, 2))     # 4.6

# enumerate — get index + value
for i, val in enumerate(numbers):
    print(f""Index {i}: {val}"")

# zip — pair two lists
names = [""Alice"", ""Bob"", ""Charlie""]
scores = [90, 85, 92]
for name, score in zip(names, scores):
    print(f""{name}: {score}"")

# any / all
print(any([0, 0, 1]))    # True (at least one truthy)
print(all([1, 2, 3]))    # True (all truthy)
print(all([1, 0, 3]))    # False (0 is falsy)

# map and filter
doubled = list(map(lambda x: x * 2, numbers))    # [8, 4, 18, 2, 14]
big = list(filter(lambda x: x > 5, numbers))     # [9, 7]
```

---

### Membership & Identity

```python
lst = [1, 2, 3, 4, 5]

# in / not in
print(3 in lst)       # True
print(6 not in lst)   # True

# Identity vs equality
a = [1, 2, 3]
b = [1, 2, 3]
c = a

print(a == b)    # True  — same content
print(a is b)    # False — different objects
print(a is c)    # True  — same object
```

### Your Challenge

Use `min()`, `max()`, `sum()`, `len()` and `round()` to compute statistics for a list of numbers!"
            },

            // Lesson 3: Tuples
            new Lesson
            {
                Title = "Tuples",
                Slug = "tuples",
                OrderIndex = 2,
                IsPublished = true,
                ChallengeId = challenges.GetValueOrDefault("sort-by-score"),
                Content = @"## Tuples — Immutable Sequences

A **tuple** is like a list, but **immutable** — once created, you can't change it. This makes tuples perfect for data that shouldn't be modified.

### Creating Tuples

```python
# With parentheses
point = (3, 4)
rgb = (255, 128, 0)

# Without parentheses (packing)
coordinates = 48.8566, 2.3522

# Single-element tuple (note the comma!)
single = (42,)     # This is a tuple
not_tuple = (42)   # This is just an int!

# Empty tuple
empty = ()
empty2 = tuple()

# From other iterables
from_list = tuple([1, 2, 3])      # (1, 2, 3)
from_str = tuple(""hello"")         # (""h"", ""e"", ""l"", ""l"", ""o"")
from_range = tuple(range(5))      # (0, 1, 2, 3, 4)
```

### Accessing Elements

Works exactly like lists:

```python
colors = (""red"", ""green"", ""blue"", ""yellow"")

print(colors[0])      # ""red""
print(colors[-1])     # ""yellow""
print(colors[1:3])    # (""green"", ""blue"")
print(colors[::-1])   # (""yellow"", ""blue"", ""green"", ""red"")
```

### Tuple Unpacking

One of Python's most elegant features:

```python
# Basic unpacking
point = (3, 4)
x, y = point
print(x)  # 3
print(y)  # 4

# Swap two variables (no temp needed!)
a, b = 1, 2
a, b = b, a    # a=2, b=1

# Star unpacking (*)
first, *rest = (1, 2, 3, 4, 5)
print(first)   # 1
print(rest)    # [2, 3, 4, 5]  (note: rest is a list!)

head, *middle, tail = (1, 2, 3, 4, 5)
print(middle)  # [2, 3, 4]

*start, last = (1, 2, 3, 4, 5)
print(start)   # [1, 2, 3, 4]
print(last)    # 5

# Nested unpacking
(a, b), (c, d) = (1, 2), (3, 4)
print(a, b, c, d)  # 1 2 3 4

# Ignore values with _
name, _, age = (""Alice"", ""ignored"", 25)
first, *_, last = (1, 2, 3, 4, 5)  # Ignore the middle
```

---

### Complete Tuple Methods Reference

Tuples only have **2 methods** (because they are immutable):

| Method | Description | Example |
|--------|-------------|---------|
| `.count(x)` | Count occurrences of `x` | `(1,2,2,3).count(2)` → `2` |
| `.index(x)` | Index of first occurrence of `x` | `(1,2,3).index(2)` → `1` |
| `.index(x, start, end)` | Search in slice `[start:end]` | `(1,2,3,2).index(2, 2)` → `3` |

```python
t = (1, 2, 3, 2, 4, 2)

print(t.count(2))          # 3
print(t.index(2))          # 1 (first occurrence)
print(t.index(2, 2))       # 3 (search from index 2)
print(t.index(2, 4))       # 5 (search from index 4)
```

> **Warning:** `.index(x)` raises `ValueError` if `x` is not found.

---

### Built-in Functions with Tuples

All the same built-in functions that work on lists also work on tuples:

| Function | Description | Example |
|----------|-------------|---------|
| `len(t)` | Number of elements | `len((1,2,3))` → `3` |
| `min(t)` | Smallest element | `min((3,1,2))` → `1` |
| `max(t)` | Largest element | `max((3,1,2))` → `3` |
| `sum(t)` | Sum of all elements | `sum((1,2,3))` → `6` |
| `sorted(t)` | New sorted **list** | `sorted((3,1,2))` → `[1,2,3]` |
| `reversed(t)` | Reverse iterator | `tuple(reversed((1,2,3)))` → `(3,2,1)` |
| `enumerate(t)` | Index + value pairs | `list(enumerate((""a"",""b"")))` → `[(0,""a""),(1,""b"")]` |
| `zip(t1, t2)` | Pair elements | `list(zip((1,2),(""a"",""b"")))` → `[(1,""a""),(2,""b"")]` |
| `any(t)` | True if any truthy | `any((0, False, 1))` → `True` |
| `all(t)` | True if all truthy | `all((1, 2, 3))` → `True` |
| `tuple(iterable)` | Convert to tuple | `tuple([1,2,3])` → `(1,2,3)` |

```python
nums = (4, 2, 9, 1, 7)

print(len(nums))     # 5
print(min(nums))     # 1
print(max(nums))     # 9
print(sum(nums))     # 23
print(sorted(nums))  # [1, 2, 4, 7, 9]  (returns a list!)
```

---

### Membership & Comparison

```python
t = (1, 2, 3, 4, 5)

# Membership
print(3 in t)       # True
print(6 not in t)   # True

# Tuples support comparison (element by element)
print((1, 2, 3) < (1, 2, 4))   # True  (compares 3 < 4)
print((1, 2) < (1, 2, 0))      # True  (shorter tuple is ""less"")

# Concatenation and repetition (creates new tuples)
a = (1, 2)
b = (3, 4)
print(a + b)     # (1, 2, 3, 4)
print(a * 3)     # (1, 2, 1, 2, 1, 2)
```

### Why Tuples?

1. **Data integrity** — can't accidentally modify
2. **Dictionary keys** — tuples can be dict keys, lists can't
3. **Function returns** — functions naturally return tuples
4. **Performance** — slightly faster than lists
5. **Hashable** — can be used in sets

```python
# Multiple return values are tuples
def min_max(numbers):
    return min(numbers), max(numbers)

lo, hi = min_max([3, 1, 4, 1, 5])
print(lo, hi)  # 1 5

# Tuples as dict keys (lists can't do this!)
grid = {}
grid[(0, 0)] = ""start""
grid[(1, 2)] = ""treasure""
```

### Named Tuples

For tuples with meaningful field names, use `namedtuple`:

```python
from collections import namedtuple

Point = namedtuple(""Point"", [""x"", ""y""])
p = Point(3, 4)

print(p.x)       # 3 (access by name)
print(p[0])      # 3 (access by index — still works)
print(p)         # Point(x=3, y=4)

# _asdict() — convert to dictionary
print(p._asdict())    # {""x"": 3, ""y"": 4}

# _replace() — create a new namedtuple with some values changed
p2 = p._replace(x=10)
print(p2)             # Point(x=10, y=4)

# _fields — list of field names
print(Point._fields)  # (""x"", ""y"")
```

### Tuples as Records

Tuples are great for representing fixed-structure data:

```python
# Student records: (name, age, grade)
students = [
    (""Alice"", 20, ""A""),
    (""Bob"", 22, ""B""),
    (""Charlie"", 19, ""A""),
]

# Sort by grade
students.sort(key=lambda s: s[2])

# Sort by age (descending)
students.sort(key=lambda s: s[1], reverse=True)
```

### Sorting with `sorted()` and `key`

```python
# Sort a list of tuples by the second element
scores = [(""Alice"", 85), (""Bob"", 92), (""Charlie"", 78)]

# Using sorted() — returns a new list
ranked = sorted(scores, key=lambda s: s[1], reverse=True)
print(ranked)
# [(""Bob"", 92), (""Alice"", 85), (""Charlie"", 78)]

# Extract just the names
names = [name for name, score in ranked]
print(names)  # [""Bob"", ""Alice"", ""Charlie""]

# Sort by multiple criteria (age descending, then name ascending)
people = [(""Bob"", 25), (""Alice"", 25), (""Charlie"", 20)]
result = sorted(people, key=lambda p: (-p[1], p[0]))
# [(""Alice"", 25), (""Bob"", 25), (""Charlie"", 20)]
```

### Your Challenge

Sort a list of `[name, score]` pairs by score in descending order and return the names!"
            },

            // Lesson 4: Dictionaries
            new Lesson
            {
                Title = "Dictionaries",
                Slug = "dictionaries",
                OrderIndex = 3,
                IsPublished = true,
                ChallengeId = challenges.GetValueOrDefault("dict-invert"),
                Content = @"## Dictionaries — Key-Value Pairs

A **dictionary** maps keys to values. It's Python's most powerful built-in data structure and is used everywhere.

### Creating Dictionaries

```python
# Curly braces
student = {""name"": ""Alice"", ""age"": 20, ""grade"": ""A""}

# dict() constructor
student = dict(name=""Alice"", age=20, grade=""A"")

# From list of tuples
student = dict([(""name"", ""Alice""), (""age"", 20)])

# dict.fromkeys() — create with default value
keys = [""a"", ""b"", ""c""]
d = dict.fromkeys(keys, 0)     # {""a"": 0, ""b"": 0, ""c"": 0}
d = dict.fromkeys(keys)        # {""a"": None, ""b"": None, ""c"": None}

# Empty dictionary
empty = {}
empty2 = dict()
```

### Accessing Values

```python
student = {""name"": ""Alice"", ""age"": 20, ""grade"": ""A""}

# Square brackets (raises KeyError if missing)
print(student[""name""])     # ""Alice""

# .get() — returns None (or default) if missing
print(student.get(""age""))          # 20
print(student.get(""email""))        # None
print(student.get(""email"", ""N/A""))  # ""N/A""
```

---

### Complete Dictionary Methods Reference

#### Accessing Data

| Method | Description | Returns |
|--------|-------------|---------|
| `d[key]` | Get value for key | Value (raises `KeyError` if missing) |
| `.get(key)` | Get value or `None` | Value or `None` |
| `.get(key, default)` | Get value or default | Value or `default` |
| `.keys()` | All keys | `dict_keys` view |
| `.values()` | All values | `dict_values` view |
| `.items()` | All (key, value) pairs | `dict_items` view |

```python
scores = {""Alice"": 90, ""Bob"": 85, ""Charlie"": 92}

print(list(scores.keys()))     # [""Alice"", ""Bob"", ""Charlie""]
print(list(scores.values()))   # [90, 85, 92]
print(list(scores.items()))    # [(""Alice"", 90), (""Bob"", 85), (""Charlie"", 92)]

# Views are dynamic — they reflect changes
keys = scores.keys()
scores[""Dave""] = 88
print(list(keys))  # [""Alice"", ""Bob"", ""Charlie"", ""Dave""] — auto-updated!
```

#### Adding & Modifying

| Method | Description | Returns |
|--------|-------------|---------|
| `d[key] = value` | Set or overwrite | — |
| `.update(other)` | Merge another dict or iterable of pairs | `None` |
| `.setdefault(key, default)` | Get value, or set to default if missing | Value |
| `d \| other` | Merge (new dict, Python 3.9+) | New `dict` |
| `d \|= other` | Merge in place (Python 3.9+) | — |

```python
student = {""name"": ""Alice""}

# Add / modify
student[""age""] = 20
student[""name""] = ""Alice Smith""

# Update multiple keys at once
student.update({""grade"": ""A"", ""email"": ""alice@example.com""})
student.update(city=""Paris"", country=""FR"")  # keyword args work too

# setdefault — get or set
scores = {""Alice"": 90}
val = scores.setdefault(""Bob"", 0)   # Adds ""Bob"": 0, returns 0
val = scores.setdefault(""Alice"", 0)  # Already exists, returns 90 (no change)

# Merge operator (Python 3.9+)
a = {""x"": 1, ""y"": 2}
b = {""y"": 3, ""z"": 4}
merged = a | b       # {""x"": 1, ""y"": 3, ""z"": 4}  (b overwrites)
a |= b               # In-place merge
```

#### Removing

| Method | Description | Returns |
|--------|-------------|---------|
| `.pop(key)` | Remove key, return value | Value (raises `KeyError` if missing) |
| `.pop(key, default)` | Remove key, or return default | Value or `default` |
| `.popitem()` | Remove and return last inserted pair | `(key, value)` tuple |
| `.clear()` | Remove all entries | `None` |
| `del d[key]` | Delete key | — (raises `KeyError` if missing) |

```python
student = {""name"": ""Alice"", ""age"": 20, ""grade"": ""A"", ""email"": ""a@b.com""}

# pop — remove and return
age = student.pop(""age"")              # 20
missing = student.pop(""phone"", None)  # None (no error)

# popitem — remove last inserted
key, val = student.popitem()           # (""email"", ""a@b.com"")

# del — remove by key
del student[""grade""]

# clear — remove everything
student.clear()                        # {}
```

#### Copying

| Method | Description | Depth |
|--------|-------------|-------|
| `.copy()` | Shallow copy | Shallow |
| `dict(d)` | Shallow copy via constructor | Shallow |
| `copy.deepcopy(d)` | Deep copy (nested structures) | Deep |

```python
import copy

original = {""a"": [1, 2], ""b"": [3, 4]}
shallow = original.copy()
deep = copy.deepcopy(original)

shallow[""a""].append(99)
print(original[""a""])  # [1, 2, 99] — affected!
print(deep[""a""])      # [1, 2]     — independent
```

#### Class Methods

| Method | Description | Returns |
|--------|-------------|---------|
| `dict.fromkeys(keys)` | Create dict with keys, values=None | New `dict` |
| `dict.fromkeys(keys, value)` | Create dict with keys, same value | New `dict` |

```python
keys = [""a"", ""b"", ""c""]
d = dict.fromkeys(keys, 0)   # {""a"": 0, ""b"": 0, ""c"": 0}
```

---

### Built-in Functions with Dictionaries

| Function | Description | Example |
|----------|-------------|---------|
| `len(d)` | Number of key-value pairs | `len({""a"":1, ""b"":2})` → `2` |
| `min(d)` | Smallest **key** | `min({""b"":1, ""a"":2})` → `""a""` |
| `max(d)` | Largest **key** | `max({""b"":1, ""a"":2})` → `""b""` |
| `sorted(d)` | Sorted list of **keys** | `sorted({""b"":1, ""a"":2})` → `[""a"", ""b""]` |
| `any(d)` | True if any **key** is truthy | `any({0: ""a"", 1: ""b""})` → `True` |
| `all(d)` | True if all **keys** are truthy | `all({1: ""a"", 2: ""b""})` → `True` |

```python
scores = {""Alice"": 90, ""Bob"": 85, ""Charlie"": 92}

# Sort by value (common pattern)
by_score = sorted(scores.items(), key=lambda item: item[1], reverse=True)
# [(""Charlie"", 92), (""Alice"", 90), (""Bob"", 85)]

# Get key with max value
best = max(scores, key=scores.get)    # ""Charlie""

# Get key with min value
worst = min(scores, key=scores.get)   # ""Bob""
```

---

### Membership & Iteration

```python
scores = {""Alice"": 90, ""Bob"": 85, ""Charlie"": 92}

# Check if KEY exists
print(""Alice"" in scores)    # True
print(""Dave"" in scores)     # False
print(90 in scores)          # False (checks keys, not values!)

# Check if VALUE exists
print(90 in scores.values())  # True

# Iterate keys (default)
for name in scores:
    print(name)

# Iterate values
for score in scores.values():
    print(score)

# Iterate key-value pairs
for name, score in scores.items():
    print(f""{name}: {score}"")
```

### Inverting a Dictionary

A common pattern — swap keys and values:

```python
original = {""a"": 1, ""b"": 2, ""c"": 3}

# Loop approach
inverted = {}
for key, value in original.items():
    inverted[value] = key

print(inverted)  # {1: ""a"", 2: ""b"", 3: ""c""}

# Dict comprehension (concise)
inverted = {v: k for k, v in original.items()}
```

### Nested Dictionaries

```python
students = {
    ""Alice"": {""age"": 20, ""grade"": ""A"", ""courses"": [""Math"", ""CS""]},
    ""Bob"": {""age"": 22, ""grade"": ""B"", ""courses"": [""CS"", ""Physics""]},
}

# Access nested values
print(students[""Alice""][""grade""])          # ""A""
print(students[""Bob""][""courses""][0])       # ""CS""

# Safe nested access
age = students.get(""Charlie"", {}).get(""age"", ""Unknown"")  # ""Unknown""
```

### Your Challenge

Implement `invert_dict()` — swap all keys and values of a dictionary!"
            },

            // Lesson 5: Sets
            new Lesson
            {
                Title = "Sets",
                Slug = "sets",
                OrderIndex = 4,
                IsPublished = true,
                ChallengeId = challenges.GetValueOrDefault("common-elements"),
                Content = @"## Sets — Unique Collections

A **set** is an unordered collection of **unique** elements. Sets are perfect for removing duplicates and performing mathematical set operations.

### Creating Sets

```python
# From a literal
colors = {""red"", ""green"", ""blue""}

# From a list (removes duplicates!)
numbers = set([1, 2, 2, 3, 3, 3])
print(numbers)  # {1, 2, 3}

# From any iterable
chars = set(""hello"")       # {""h"", ""e"", ""l"", ""o""}
nums = set(range(5))       # {0, 1, 2, 3, 4}

# Empty set (NOT {} — that's a dict!)
empty = set()
```

---

### Complete Set Methods Reference

#### Adding Elements

| Method | Description | Returns |
|--------|-------------|---------|
| `.add(x)` | Add a single element | `None` |
| `.update(iterable)` | Add all elements from iterable(s) | `None` |

```python
fruits = {""apple""}

fruits.add(""banana"")                        # {""apple"", ""banana""}
fruits.add(""apple"")                         # No effect — already exists

fruits.update([""cherry"", ""date""])            # Add multiple from a list
fruits.update(""fig"")                        # Add each char: ""f"", ""i"", ""g""
fruits.update([""grape""], {""honeydew""})       # Multiple iterables at once
```

#### Removing Elements

| Method | Description | Returns |
|--------|-------------|---------|
| `.remove(x)` | Remove `x` (raises `KeyError` if missing) | `None` |
| `.discard(x)` | Remove `x` (no error if missing) | `None` |
| `.pop()` | Remove and return an **arbitrary** element | The element |
| `.clear()` | Remove all elements | `None` |

```python
s = {1, 2, 3, 4, 5}

s.remove(3)          # {1, 2, 4, 5} — KeyError if 3 not in s
s.discard(10)        # No error even though 10 is not in s
elem = s.pop()       # Removes and returns an arbitrary element
s.clear()            # set()
```

> **Tip:** Prefer `.discard()` over `.remove()` when you're not sure the element exists.

#### Set Operations (Non-Mutating)

These return a **new set** and leave the originals unchanged:

| Method | Operator | Description |
|--------|----------|-------------|
| `.union(other)` | `a \| b` | All elements from both |
| `.intersection(other)` | `a & b` | Elements in both |
| `.difference(other)` | `a - b` | In `a` but not in `b` |
| `.symmetric_difference(other)` | `a ^ b` | In one but not both |

```python
a = {1, 2, 3, 4, 5}
b = {4, 5, 6, 7, 8}

# Union — all elements from both
print(a | b)        # {1, 2, 3, 4, 5, 6, 7, 8}
print(a.union(b))   # Same

# Intersection — elements in both
print(a & b)              # {4, 5}
print(a.intersection(b))  # Same

# Difference — in a but not in b
print(a - b)              # {1, 2, 3}
print(a.difference(b))    # Same

# Symmetric difference — in one but not both
print(a ^ b)                        # {1, 2, 3, 6, 7, 8}
print(a.symmetric_difference(b))    # Same

# Methods accept ANY iterable, operators require sets
a.union([4, 5, 6])           # Works
a.intersection(range(3, 8))  # Works
# a | [4, 5, 6]              # TypeError! Operator needs a set
```

> **Key difference:** Methods (`.union()`, `.intersection()`, etc.) accept **any iterable** as argument. Operators (`|`, `&`, `-`, `^`) require **both operands to be sets**.

#### Set Operations (Mutating / In-Place)

These modify the set **in place** and return `None`:

| Method | Operator | Description |
|--------|----------|-------------|
| `.update(other)` | `a \|= b` | Add all elements from `other` |
| `.intersection_update(other)` | `a &= b` | Keep only elements in both |
| `.difference_update(other)` | `a -= b` | Remove elements found in `other` |
| `.symmetric_difference_update(other)` | `a ^= b` | Keep elements in one but not both |

```python
a = {1, 2, 3, 4, 5}

a.update({6, 7})                     # {1, 2, 3, 4, 5, 6, 7}
a.intersection_update({2, 4, 6, 8})  # {2, 4, 6}
a.difference_update({6})             # {2, 4}
a.symmetric_difference_update({4, 5}) # {2, 5}
```

#### Comparison Methods

| Method | Operator | Description |
|--------|----------|-------------|
| `.issubset(other)` | `a <= b` | Is `a` a subset of `b`? |
| `a < b` | — | Is `a` a **strict** subset of `b`? |
| `.issuperset(other)` | `a >= b` | Is `a` a superset of `b`? |
| `a > b` | — | Is `a` a **strict** superset of `b`? |
| `.isdisjoint(other)` | — | Do `a` and `b` have **no** elements in common? |

```python
required = {""python"", ""git""}
skills = {""python"", ""git"", ""docker"", ""linux""}
other = {""java"", ""go""}

print(required.issubset(skills))     # True
print(required <= skills)            # True
print(required < skills)             # True (strict: not equal)

print(skills.issuperset(required))   # True
print(skills >= required)            # True
print(skills > required)             # True (strict: not equal)

print(required.isdisjoint(other))    # True (no common elements)
print(required.isdisjoint(skills))   # False (they share elements)
```

#### Copying

| Method | Description |
|--------|-------------|
| `.copy()` | Shallow copy |
| `set(s)` | Shallow copy via constructor |

```python
a = {1, 2, 3}
b = a.copy()
b.add(4)
print(a)  # {1, 2, 3} — unchanged
```

---

### Built-in Functions with Sets

| Function | Description | Example |
|----------|-------------|---------|
| `len(s)` | Number of elements | `len({1,2,3})` → `3` |
| `min(s)` | Smallest element | `min({3,1,2})` → `1` |
| `max(s)` | Largest element | `max({3,1,2})` → `3` |
| `sum(s)` | Sum of elements | `sum({1,2,3})` → `6` |
| `sorted(s)` | Sorted **list** | `sorted({3,1,2})` → `[1,2,3]` |
| `any(s)` | True if any truthy | `any({0, 1})` → `True` |
| `all(s)` | True if all truthy | `all({1, 2})` → `True` |
| `enumerate(s)` | Index + value | Only useful after `sorted()` |

---

### Frozenset — Immutable Set

A `frozenset` is an **immutable** version of `set`. It can be used as a dict key or as an element of another set.

```python
fs = frozenset([1, 2, 3])

# Has all non-mutating methods
print(fs | {4, 5})               # frozenset({1, 2, 3, 4, 5})
print(fs & {2, 3, 4})            # frozenset({2, 3})
print(fs.issubset({1, 2, 3, 4})) # True

# Cannot modify
# fs.add(4)    # AttributeError!
# fs.remove(1) # AttributeError!

# Can be used as dict key or set element
d = {frozenset({1, 2}): ""pair""}
s = {frozenset({1}), frozenset({2})}
```

---

### Membership Testing (Very Fast!)

Sets use hash tables, making `in` checks **O(1)** — constant time:

```python
# List: O(n) — checks every element
big_list = list(range(1_000_000))
print(999_999 in big_list)    # Slow!

# Set: O(1) — instant lookup
big_set = set(range(1_000_000))
print(999_999 in big_set)     # Fast!
```

### Practical Examples

**Remove duplicates preserving order:**
```python
names = [""Alice"", ""Bob"", ""Alice"", ""Charlie"", ""Bob""]

# set() loses order:
unique_unordered = list(set(names))  # Order may vary

# Preserve order with dict.fromkeys():
unique_ordered = list(dict.fromkeys(names))
# [""Alice"", ""Bob"", ""Charlie""]
```

**Find common elements:**
```python
list1 = [1, 2, 3, 4, 5]
list2 = [3, 4, 5, 6, 7]

common = sorted(set(list1) & set(list2))
print(common)  # [3, 4, 5]
```

### Your Challenge

Use set intersection to find all elements common to two lists!"
            },

            // Lesson 6: Comprehensions
            new Lesson
            {
                Title = "Comprehensions",
                Slug = "comprehensions",
                OrderIndex = 5,
                IsPublished = true,
                ChallengeId = challenges.GetValueOrDefault("even-squares"),
                Content = @"## Comprehensions — Python's Secret Weapon

Comprehensions let you create collections in a single, readable line. They're one of Python's most distinctive and powerful features.

---

### 1. List Comprehensions

**Basic syntax:** `[expression for item in iterable]`

```python
# Traditional loop
squares = []
for x in range(1, 6):
    squares.append(x ** 2)
# squares = [1, 4, 9, 16, 25]

# List comprehension — same result, one line!
squares = [x ** 2 for x in range(1, 6)]
```

#### With Filtering (`if`)

**Syntax:** `[expression for item in iterable if condition]`

```python
# Even numbers from 1 to 10
evens = [x for x in range(1, 11) if x % 2 == 0]
# [2, 4, 6, 8, 10]

# Squares of even numbers
even_squares = [x ** 2 for x in range(1, 11) if x % 2 == 0]
# [4, 16, 36, 64, 100]

# Words longer than 3 characters
words = [""hi"", ""hello"", ""hey"", ""world"", ""ok""]
long_words = [w for w in words if len(w) > 3]
# [""hello"", ""world""]

# Multiple conditions
nums = [x for x in range(1, 51) if x % 2 == 0 if x % 3 == 0]
# [6, 12, 18, 24, 30, 36, 42, 48]  — divisible by 2 AND 3
```

#### With Conditional Expression (`if/else` in output)

```python
names = [""alice"", ""bob"", ""charlie""]

# Capitalize all
capitalized = [name.capitalize() for name in names]
# [""Alice"", ""Bob"", ""Charlie""]

# Conditional expression in the output (ternary)
labels = [""even"" if x % 2 == 0 else ""odd"" for x in range(5)]
# [""even"", ""odd"", ""even"", ""odd"", ""even""]

# Transform with condition
grades = [90, 65, 78, 85, 55]
results = [""Pass"" if g >= 70 else ""Fail"" for g in grades]
# [""Pass"", ""Fail"", ""Pass"", ""Pass"", ""Fail""]
```

> **Filter vs ternary:** `if` **after** `for` = filter (excludes items). `if/else` **before** `for` = ternary (transforms all items).

#### With Function Calls

```python
# Apply any function
numbers = ["" 42 "", "" 7 "", "" 13 ""]
cleaned = [int(n.strip()) for n in numbers]
# [42, 7, 13]

# Chain methods
words = ["" Hello "", "" WORLD "", "" Python ""]
processed = [w.strip().lower() for w in words]
# [""hello"", ""world"", ""python""]

# With enumerate
indexed = [f""{i}: {name}"" for i, name in enumerate([""Alice"", ""Bob""])]
# [""0: Alice"", ""1: Bob""]

# With zip
pairs = [f""{n}={v}"" for n, v in zip([""x"", ""y""], [1, 2])]
# [""x=1"", ""y=2""]
```

---

### 2. Dictionary Comprehensions

**Syntax:** `{key_expr: value_expr for item in iterable}`

```python
# Square mapping
squares = {x: x ** 2 for x in range(1, 6)}
# {1: 1, 2: 4, 3: 9, 4: 16, 5: 25}

# Invert a dictionary
original = {""a"": 1, ""b"": 2, ""c"": 3}
inverted = {v: k for k, v in original.items()}
# {1: ""a"", 2: ""b"", 3: ""c""}

# Filter a dictionary
scores = {""Alice"": 90, ""Bob"": 65, ""Charlie"": 85}
passed = {name: score for name, score in scores.items() if score >= 70}
# {""Alice"": 90, ""Charlie"": 85}

# From two lists
keys = [""name"", ""age"", ""city""]
values = [""Alice"", 25, ""Paris""]
d = {k: v for k, v in zip(keys, values)}
# {""name"": ""Alice"", ""age"": 25, ""city"": ""Paris""}

# Transform values
prices = {""apple"": 1.0, ""banana"": 0.5, ""cherry"": 2.0}
with_tax = {item: round(price * 1.2, 2) for item, price in prices.items()}
# {""apple"": 1.2, ""banana"": 0.6, ""cherry"": 2.4}

# Conditional value
status = {name: (""Pass"" if score >= 70 else ""Fail"")
          for name, score in scores.items()}
```

---

### 3. Set Comprehensions

**Syntax:** `{expression for item in iterable}`

```python
# Unique first letters
words = [""apple"", ""banana"", ""avocado"", ""cherry"", ""apricot""]
first_letters = {w[0] for w in words}
# {""a"", ""b"", ""c""}

# Unique word lengths
lengths = {len(w) for w in words}
# {5, 6, 7}

# With filter
even_digits = {int(c) for c in ""1234567890"" if int(c) % 2 == 0}
# {0, 2, 4, 6, 8}
```

---

### 4. Generator Expressions

Same syntax as list comprehension but with **parentheses `()`**. Produces values **lazily** (one at a time, memory-efficient):

```python
# Generator expression (lazy — doesn't create a list in memory)
gen = (x ** 2 for x in range(1_000_000))
print(next(gen))  # 0
print(next(gen))  # 1

# Perfect for sum(), min(), max(), any(), all()
total = sum(x ** 2 for x in range(1, 11))     # 385
has_big = any(x > 100 for x in [1, 50, 200])  # True
all_pos = all(x > 0 for x in [1, 2, 3])       # True

# Find first match
first_even = next(x for x in [1, 3, 4, 7] if x % 2 == 0)  # 4
```

> **List comp vs generator:** `[x for x in range(10)]` creates the full list in memory. `(x for x in range(10))` yields one value at a time — use this for large data or when you only need to iterate once.

---

### 5. Nested Comprehensions

#### Flatten a list of lists

```python
matrix = [[1, 2, 3], [4, 5, 6], [7, 8, 9]]

# Flatten
flat = [num for row in matrix for num in row]
# [1, 2, 3, 4, 5, 6, 7, 8, 9]

# Equivalent loop:
flat = []
for row in matrix:
    for num in row:
        flat.append(num)
```

> **Reading order:** Nested comprehensions read left-to-right, same as the loop version.

#### Cartesian product

```python
colors = [""red"", ""blue""]
sizes = [""S"", ""M"", ""L""]

combos = [(c, s) for c in colors for s in sizes]
# [(""red"", ""S""), (""red"", ""M""), (""red"", ""L""),
#  (""blue"", ""S""), (""blue"", ""M""), (""blue"", ""L"")]
```

#### Nested with filter

```python
# Only flat elements > 5
matrix = [[1, 8, 3], [4, 5, 9], [7, 2, 6]]
big = [n for row in matrix for n in row if n > 5]
# [8, 9, 7, 6]
```

---

### 6. Walrus Operator in Comprehensions (Python 3.8+)

The walrus operator `:=` lets you assign and use a value in the same expression:

```python
# Avoid computing the same expression twice
import math
values = [1, 4, -2, 9, 16, -3]
results = [y for x in values if (y := math.sqrt(abs(x))) > 2]
# [3.0, 4.0]

# Filter + transform in one pass
data = [""  hello  "", ""  "", ""  world  "", """"]
cleaned = [c for s in data if (c := s.strip())]
# [""hello"", ""world""]
```

---

### Summary: All Comprehension Patterns

| Type | Syntax | Returns |
|------|--------|---------|
| **List** | `[expr for x in iter]` | `list` |
| **List + filter** | `[expr for x in iter if cond]` | `list` |
| **List + ternary** | `[a if cond else b for x in iter]` | `list` |
| **Dict** | `{k: v for x in iter}` | `dict` |
| **Set** | `{expr for x in iter}` | `set` |
| **Generator** | `(expr for x in iter)` | `generator` |
| **Nested** | `[expr for x in iter1 for y in iter2]` | `list` |

### When NOT to Use Comprehensions

```python
# Too complex — use a regular loop instead
result = [transform(x) for x in data if validate(x) for y in process(x) if check(y)]

# Better: regular loop for complex logic
result = []
for x in data:
    if validate(x):
        for y in process(x):
            if check(y):
                result.append(transform(x))
```

> **Rule of thumb:** If the comprehension doesn't fit on one readable line, use a loop.

### Your Challenge

Use a list comprehension to return the squares of all even numbers from 1 to n!"
            },

            // Lesson 7: Practice — Combining Everything
            new Lesson
            {
                Title = "Practice: Combining Data Structures",
                Slug = "practice-combining-structures",
                OrderIndex = 6,
                IsPublished = true,
                ChallengeId = challenges.GetValueOrDefault("group-by-first"),
                Content = @"## Practice: Combining Data Structures

Now let's put everything together! Real Python code often combines multiple data structures. This lesson shows common patterns you'll use constantly.

### Pattern 1: Grouping with Dictionaries

Group items into categories using a dictionary of lists:

```python
words = [""apple"", ""banana"", ""avocado"", ""blueberry"", ""cherry""]

groups = {}
for word in words:
    first_letter = word[0]
    if first_letter not in groups:
        groups[first_letter] = []
    groups[first_letter].append(word)

print(groups)
# {""a"": [""apple"", ""avocado""], ""b"": [""banana"", ""blueberry""], ""c"": [""cherry""]}
```

### A Cleaner Way: `setdefault()`

```python
groups = {}
for word in words:
    groups.setdefault(word[0], []).append(word)
```

`setdefault(key, default)` returns the value if the key exists, or sets it to `default` and returns that. This eliminates the `if key not in dict` check.

### Pattern 2: Counting with Dictionaries

```python
text = ""banana""
counter = {}
for char in text:
    counter[char] = counter.get(char, 0) + 1

print(counter)  # {""b"": 1, ""a"": 3, ""n"": 2}
```

### Pattern 3: Converting Between Structures

```python
# List → Set (remove duplicates)
names = [""Alice"", ""Bob"", ""Alice"", ""Charlie""]
unique = set(names)  # {""Alice"", ""Bob"", ""Charlie""}

# Set → sorted List
sorted_names = sorted(unique)  # [""Alice"", ""Bob"", ""Charlie""]

# Dict → List of tuples
grades = {""Alice"": 90, ""Bob"": 85}
pairs = list(grades.items())  # [(""Alice"", 90), (""Bob"", 85)]

# List of tuples → Dict
pairs = [(""x"", 1), (""y"", 2)]
d = dict(pairs)  # {""x"": 1, ""y"": 2}
```

### Pattern 4: Comprehension Combos

```python
# Dict comprehension + set
words = [""apple"", ""banana"", ""avocado"", ""cherry""]
first_letters = {word[0]: [w for w in words if w[0] == word[0]] for word in words}
# {""a"": [""apple"", ""avocado""], ""b"": [""banana""], ""c"": [""cherry""]}
```

### Summary: Chapter 2 at a Glance

| Structure | Create | Access | Key Feature |
|-----------|--------|--------|-------------|
| **List** | `[1, 2, 3]` | `lst[0]` | Ordered, mutable |
| **Tuple** | `(1, 2, 3)` | `tup[0]` | Ordered, immutable |
| **Dict** | `{""a"": 1}` | `d[""a""]` | Key-value lookup |
| **Set** | `{1, 2, 3}` | `x in s` | Unique, fast lookup |
| **Comprehension** | `[x for x in ...]` | — | Concise creation |

### Your Challenge

Combine dictionaries and lists: group words by their first letter!"
            },
        ];
    }

    // ═══════════════════════════════════════════════════════════════
    // JS Chapter 1 — Introduction & Fundamentals
    // ═══════════════════════════════════════════════════════════════

    private static List<Lesson> GetJsChapter1Lessons(Dictionary<string, Guid> challenges)
    {
        return
        [
            // Lesson 1: First Steps with JavaScript
            new Lesson
            {
                Title = "First Steps with JavaScript",
                Slug = "js-ch1-premiers-pas",
                OrderIndex = 0,
                IsPublished = true,
                Content = @"## Welcome to Chapter 1! 🟨

Welcome to JavaScript! This course takes you from zero to writing your first functional scripts.

### What is JavaScript?

JavaScript is the **only programming language native to web browsers**. Created in 1995 by Brendan Eich, it runs:
- **In the browser** — to make web pages interactive
- **On the server** — with **Node.js** (what this platform uses for challenges)
- **Everywhere** — mobile apps, IoT, games, AI...

### Node.js vs Browser

| Context | Access to | Example |
|---------|-----------|---------|
| Browser | DOM, window, fetch | Manipulate web pages |
| Node.js | File system, processes | Scripts, APIs, servers |

All challenges on this platform run in **Node.js**.

### console.log()

The basic way to print output:

```js
console.log('Hello, world!');
console.log(42);
console.log(true);
console.log(1 + 2); // 3
```

You can log multiple values at once:

```js
console.log('Value:', 42, 'Type:', typeof 42);
```

### Comments

```js
// Single line comment

/* Multi-line
   comment */
```

### Your first script

```js
let message = 'I am coding in JavaScript!';
console.log(message);
```

Run this in your browser (F12 → Console) or with `node file.js`."
            },

            // Lesson 2: Variables & Data Types
            new Lesson
            {
                Title = "Variables & Data Types",
                Slug = "js-ch1-variables-types",
                OrderIndex = 1,
                IsPublished = true,
                Content = @"## Variables & Data Types

### Declaring a variable

JavaScript has three keywords to declare variables:

```js
var old = 'avoid this';    // old syntax, function scope
let counter = 0;            // reassignable variable
const PI = 3.14159;         // constant (cannot be reassigned)
```

**Golden rule**: use `const` by default, `let` when you need to reassign. Forget `var`.

```js
const name = 'Alice';
let age = 25;
age = 26; // ✅ OK
// name = 'Bob'; // ❌ TypeError: Assignment to constant variable
```

### Primitive types

JavaScript has **7 primitive types**:

| Type | Example | Description |
|------|---------|-------------|
| `number` | `42`, `3.14`, `-7` | Integers AND decimals |
| `string` | `'hello'`, `""world""` | Text |
| `boolean` | `true`, `false` | True or false |
| `null` | `null` | Intentional absence of value |
| `undefined` | `undefined` | Declared but not initialized |
| `symbol` | `Symbol('id')` | Unique identifier |
| `bigint` | `9007199254740993n` | Very large integer |

### The typeof operator

```js
typeof 42           // 'number'
typeof 'hello'      // 'string'
typeof true         // 'boolean'
typeof undefined    // 'undefined'
typeof null         // 'object' ← historical bug in JS!
typeof {}           // 'object'
typeof []           // 'object'
typeof function(){} // 'function'
```

### Dynamic typing

JavaScript is **dynamically typed**: a variable can change type.

```js
let x = 42;
console.log(typeof x); // 'number'
x = 'hello';
console.log(typeof x); // 'string'
```

### Type conversion

```js
Number('42')       // 42
Number(true)       // 1
Number(false)      // 0
Number('abc')      // NaN

String(42)         // '42'
String(true)       // 'true'

Boolean(0)         // false
Boolean('')        // false
Boolean(null)      // false
Boolean(undefined) // false
Boolean('hello')   // true
Boolean(1)         // true
```"
            },

            // Lesson 3: Operators & Expressions
            new Lesson
            {
                Title = "Operators & Expressions",
                Slug = "js-ch1-operateurs",
                OrderIndex = 2,
                IsPublished = true,
                Content = @"## Operators & Expressions

### Arithmetic operators

```js
5 + 3   // 8   addition
5 - 3   // 2   subtraction
5 * 3   // 15  multiplication
5 / 2   // 2.5 division (always decimal)
5 % 2   // 1   modulo (remainder)
5 ** 3  // 125 exponentiation
```

### Comparison operators

```js
5 == '5'    // true  loose equality (with coercion)
5 === '5'   // false strict equality (type + value)
5 != '5'    // false
5 !== '5'   // true  ← always use !==
5 > 3       // true
5 >= 5      // true
```

> **Golden rule**: always use `===` and `!==` to avoid coercion surprises.

### Loose equality traps

```js
0 == false         // true  😱
'' == false        // true  😱
null == undefined  // true  😱
```

With `===`: none of those would be `true`.

### Logical operators

```js
true && false  // false  AND
true || false  // true   OR
!true          // false  NOT

// Nullish coalescing — right side if left is null/undefined
null ?? 'default'       // 'default'
undefined ?? 'default'  // 'default'
0 ?? 'default'          // 0 (0 is not null/undefined)
```

### Assignment operators

```js
let x = 10;
x += 5;   // 15
x -= 3;   // 12
x *= 2;   // 24
x /= 4;   // 6
x %= 4;   // 2
x **= 3;  // 8
x++;      // 9
x--;      // 8
```"
            },

            // Lesson 4: Strings
            new Lesson
            {
                Title = "Strings",
                Slug = "js-ch1-strings",
                OrderIndex = 3,
                IsPublished = true,
                Content = @"## Strings

### Creating a string

```js
const s1 = 'single quotes';
const s2 = ""double quotes"";
const s3 = `backticks (template literal)`;
```

### Template Literals (ES6)

Backticks let you **interpolate** variables and write multi-line strings:

```js
const name = 'Alice';
const age = 25;
console.log(`My name is ${name} and I am ${age} years old.`);

const multiline = `Line 1
Line 2
Line 3`;
```

### Essential properties and methods

```js
const s = 'Hello, World!';

s.length              // 13
s.toUpperCase()       // 'HELLO, WORLD!'
s.toLowerCase()       // 'hello, world!'
s.trim()              // removes leading/trailing spaces
s.includes('World')   // true
s.startsWith('Hello') // true
s.endsWith('!')       // true
s.indexOf('o')        // 4 (first occurrence)
s.lastIndexOf('o')    // 8 (last occurrence)

s.replace('World', 'JS')  // 'Hello, JS!'
s.replaceAll('l', 'L')    // 'HeLLo, WorLd!'

s.slice(0, 5)    // 'Hello'
s.slice(7)       // 'World!'
s.slice(-6)      // 'World!'

s.split(', ')    // ['Hello', 'World!']
s.split('')      // ['H', 'e', 'l', ...]

'ha'.repeat(3)        // 'hahaha'
'5'.padStart(3, '0')  // '005'
'5'.padEnd(3, '0')    // '500'

s[0]             // 'H'
s.charCodeAt(0)  // 72
```

### Concatenation

```js
const first = 'John';
const last = 'Doe';

// Old way
const full1 = first + ' ' + last;

// Modern way (preferred)
const full2 = `${first} ${last}`;
```"
            },

            // Lesson 5: Conditionals
            new Lesson
            {
                Title = "Conditionals",
                Slug = "js-ch1-conditionnelles",
                OrderIndex = 4,
                IsPublished = true,
                Content = @"## Conditionals

### if / else if / else

```js
const age = 18;

if (age < 13) {
    console.log('Child');
} else if (age < 18) {
    console.log('Teen');
} else {
    console.log('Adult');
}
```

### Ternary operator

Perfect for a single-line condition:

```js
const status = age >= 18 ? 'Adult' : 'Minor';
console.log(status); // 'Adult'
```

### switch / case

```js
const day = 'monday';

switch (day) {
    case 'saturday':
    case 'sunday':
        console.log('Weekend!');
        break;
    case 'monday':
        console.log('Start of week');
        break;
    default:
        console.log('Regular day');
}
```

> Don't forget `break`! Without it, execution ""falls through"" to the next case.

### Truthy and Falsy values

Every value in JavaScript is either **truthy** or **falsy** in a boolean context.

**The 6 falsy values:**
```js
false, 0, '', null, undefined, NaN
```

**Everything else is truthy:**
```js
1, -1, 'hello', [], {}, function(){}
```

Examples:
```js
if (0)           { } // ❌ falsy — does not run
if ('')          { } // ❌ falsy
if ([])          { } // ✅ truthy — empty array!
if (0 || 'JS')   { console.log('truthy'); } // ✅

// Default value pattern
function greet(name) {
    name = name || 'stranger';
    return `Hello, ${name}!`;
}
```"
            },

            // Lesson 6: Loops & Iteration
            new Lesson
            {
                Title = "Loops & Iteration",
                Slug = "js-ch1-boucles",
                OrderIndex = 5,
                IsPublished = true,
                Content = @"## Loops & Iteration

### Classic for loop

```js
for (let i = 0; i < 5; i++) {
    console.log(i); // 0, 1, 2, 3, 4
}

// Count down
for (let i = 5; i > 0; i--) {
    console.log(i); // 5, 4, 3, 2, 1
}
```

### while

```js
let n = 1;
while (n <= 5) {
    console.log(n);
    n++;
}
```

### do...while

Runs **at least once** before checking the condition:

```js
let x = 0;
do {
    console.log(x);
    x++;
} while (x < 3); // 0, 1, 2
```

### for...of (iterate over values)

The modern way to loop over arrays and strings:

```js
const fruits = ['apple', 'banana', 'cherry'];
for (const fruit of fruits) {
    console.log(fruit);
}

// Iterate over a string character by character
for (const char of 'hello') {
    console.log(char); // h, e, l, l, o
}
```

### for...in (iterate over object keys)

```js
const person = { name: 'Alice', age: 25 };
for (const key in person) {
    console.log(key, ':', person[key]);
}
// name : Alice
// age : 25
```

### break and continue

```js
// break — exit the loop early
for (let i = 0; i < 10; i++) {
    if (i === 5) break;
    console.log(i); // 0, 1, 2, 3, 4
}

// continue — skip to next iteration
for (let i = 0; i < 5; i++) {
    if (i === 2) continue;
    console.log(i); // 0, 1, 3, 4
}
```"
            },

            // Lesson 7: Introduction to Functions
            new Lesson
            {
                Title = "Introduction to Functions",
                Slug = "js-ch1-fonctions",
                OrderIndex = 6,
                IsPublished = true,
                ChallengeId = challenges.TryGetValue("js-greet", out var jsGreetId) ? jsGreetId : null,
                Content = @"## Introduction to Functions

The challenges in this course ask you to write a **function**. Here is everything you need to get started.

### Declaring a function

```js
function sayHello(name) {
    return 'Hello, ' + name + '!';
}

console.log(sayHello('Alice')); // 'Hello, Alice!'
```

Anatomy of a function:
- `function` — keyword
- `sayHello` — name of the function
- `(name)` — parameter(s)
- `{ ... }` — function body
- `return` — value returned (function stops here)

### return

Without `return`, the function returns `undefined`:

```js
function noReturn() {
    let x = 2 + 2; // computed but never returned
}
console.log(noReturn()); // undefined

function withReturn() {
    return 2 + 2;
}
console.log(withReturn()); // 4
```

### Arrow Functions

Shorter syntax, widely used in modern JavaScript:

```js
// Classic function
function square(n) {
    return n * n;
}

// Arrow function equivalent
const square = (n) => {
    return n * n;
};

// Even shorter (implicit return on one line)
const square = n => n * n;

console.log(square(5)); // 25
```

### Multiple parameters

```js
function add(a, b) {
    return a + b;
}

console.log(add(3, 7)); // 10
```

### Practical examples

```js
function isEven(n) {
    return n % 2 === 0;
}

function greet(name) {
    return `Hello, ${name}!`;
}

function sumArray(arr) {
    let total = 0;
    for (const n of arr) {
        total += n;
    }
    return total;
}
```

### Your first challenge

Write the function `greet` that takes a name and returns `Hello, {name}!`.

```js
function greet(name) {
    // Your code here
}
```"
            },
        ];
    }

    // ═══════════════════════════════════════════════════════════════
    // JS Chapter 2 — Essential Data Structures
    // ═══════════════════════════════════════════════════════════════

    private static List<Lesson> GetJsChapter2Lessons(Dictionary<string, Guid> challenges)
    {
        return
        [
            // Lesson 1: Arrays
            new Lesson
            {
                Title = "Arrays",
                Slug = "js-ch2-arrays",
                OrderIndex = 0,
                IsPublished = true,
                ChallengeId = challenges.TryGetValue("js-array-max", out var arrayMaxId) ? arrayMaxId : null,
                Content = @"## Arrays

An array is an **ordered list** of values. It can hold any type: numbers, strings, objects, other arrays.

### Creating and accessing

```js
const fruits = ['apple', 'banana', 'cherry'];
console.log(fruits[0]); // 'apple'
console.log(fruits[2]); // 'cherry'
console.log(fruits.length); // 3
```

### Mutation methods (modify in place)

```js
const arr = [1, 2, 3];
arr.push(4);         // [1, 2, 3, 4] — add at end
arr.pop();           // [1, 2, 3]    — remove from end
arr.unshift(0);      // [0, 1, 2, 3] — add at start
arr.shift();         // [1, 2, 3]    — remove from start
arr.reverse();       // [3, 2, 1]    — reverse in place
arr.sort();          // sorts in place (lexicographic by default)
arr.sort((a, b) => a - b); // numeric sort ascending
arr.splice(1, 1);    // removes 1 element at index 1
```

### Functional methods (return a new array)

```js
const nums = [1, 2, 3, 4, 5];

nums.map(n => n * 2)         // [2, 4, 6, 8, 10]
nums.filter(n => n % 2 === 0) // [2, 4]
nums.reduce((sum, n) => sum + n, 0) // 15
nums.slice(1, 3)             // [2, 3] (from index 1 to 3 exclusive)
nums.flat()                  // flattens one level
nums.concat([6, 7])          // [1, 2, 3, 4, 5, 6, 7]
```

### Search methods

```js
const arr = [10, 20, 30, 20];

arr.indexOf(20)      // 1
arr.lastIndexOf(20)  // 3
arr.includes(30)     // true
arr.find(n => n > 15)      // 20
arr.findIndex(n => n > 15) // 1
arr.some(n => n > 25)      // true
arr.every(n => n > 5)      // true
```

### Other useful methods

```js
arr.join(', ')       // '10, 20, 30, 20'
arr.forEach(n => console.log(n))

// Spread operator
const copy = [...arr];
const merged = [...arr, ...otherArr];

// Destructuring
const [first, second, ...rest] = [1, 2, 3, 4];
// first=1, second=2, rest=[3,4]
```

### Finding the max

```js
const nums = [3, 1, 4, 1, 5, 9];
Math.max(...nums)  // 9 — spread turns array into args
```"
            },

            // Lesson 2: Objects
            new Lesson
            {
                Title = "Objects",
                Slug = "js-ch2-objects",
                OrderIndex = 1,
                IsPublished = true,
                ChallengeId = challenges.TryGetValue("js-count-words", out var countWordsId) ? countWordsId : null,
                Content = @"## Objects

An object stores **key-value pairs**. Keys are strings (or symbols), values can be anything.

### Creating an object

```js
const person = {
    name: 'Alice',
    age: 25,
    isAdmin: false
};
```

### Accessing properties

```js
person.name      // 'Alice'  — dot notation
person['age']    // 25       — bracket notation (useful with variables)

const key = 'name';
person[key]      // 'Alice'
```

### Adding, modifying, deleting

```js
person.email = 'alice@example.com'; // add
person.age = 26;                     // modify
delete person.isAdmin;               // delete
```

### Object methods

```js
const obj = { a: 1, b: 2, c: 3 };

Object.keys(obj)    // ['a', 'b', 'c']
Object.values(obj)  // [1, 2, 3]
Object.entries(obj) // [['a', 1], ['b', 2], ['c', 3]]

// Iterate
for (const [key, value] of Object.entries(obj)) {
    console.log(key, ':', value);
}

// Merge objects
const merged = Object.assign({}, obj1, obj2);
const merged2 = { ...obj1, ...obj2 }; // spread (preferred)

// Convert entries back to object
Object.fromEntries([['a', 1], ['b', 2]]) // { a: 1, b: 2 }
```

### Object as a map / counter

A common pattern — use an object to count or group things:

```js
function countWords(str) {
    const count = {};
    for (const word of str.split(' ')) {
        count[word] = (count[word] || 0) + 1;
    }
    return count;
}

countWords('hello world hello');
// { hello: 2, world: 1 }
```

### Shorthand and computed properties

```js
const x = 1, y = 2;
const point = { x, y };           // { x: 1, y: 2 }

const key = 'dynamic';
const obj = { [key]: 42 };        // { dynamic: 42 }
```"
            },

            // Lesson 3: Map and Set
            new Lesson
            {
                Title = "Map and Set",
                Slug = "js-ch2-map-set",
                OrderIndex = 2,
                IsPublished = true,
                ChallengeId = challenges.TryGetValue("js-unique", out var uniqueId) ? uniqueId : null,
                Content = @"## Map and Set

### Set — unique values

A `Set` stores **unique values** in insertion order.

```js
const s = new Set([1, 2, 1, 3, 2]);
console.log(s); // Set { 1, 2, 3 }
s.size          // 3
s.has(2)        // true
s.add(4)        // Set { 1, 2, 3, 4 }
s.delete(1)     // Set { 2, 3, 4 }

// Convert back to array
const unique = [...s]; // [2, 3, 4]
```

**Common pattern**: remove duplicates from an array:

```js
const arr = [1, 2, 1, 3, 2, 4];
const unique = [...new Set(arr)]; // [1, 2, 3, 4]
```

### Map — key-value store

A `Map` is like an object but **keys can be any type** and it maintains insertion order.

```js
const m = new Map();
m.set('name', 'Alice');
m.set(42, 'the answer');
m.set(true, 'yes');

m.get('name')   // 'Alice'
m.has(42)       // true
m.size          // 3
m.delete(true)

// Iterate
for (const [key, value] of m) {
    console.log(key, '->', value);
}
```

### Map vs Object — when to use which

| | Object | Map |
|--|--------|-----|
| Key types | string/symbol only | any type |
| Insertion order | not guaranteed (older JS) | guaranteed |
| Size | manual (`Object.keys().length`) | `.size` |
| Best for | structured data, configs | dynamic key-value store, counters |

### WeakMap and WeakSet

Similar but hold **weak references** — keys are garbage-collected when no longer referenced elsewhere. Use for caching or storing private data tied to objects.

```js
const cache = new WeakMap();
// keys must be objects (not primitives)
```"
            },

            // Lesson 4: Destructuring and Spread/Rest
            new Lesson
            {
                Title = "Destructuring & Spread/Rest",
                Slug = "js-ch2-destructuring",
                OrderIndex = 3,
                IsPublished = true,
                ChallengeId = challenges.TryGetValue("js-flatten-once", out var flattenId) ? flattenId : null,
                Content = @"## Destructuring & Spread/Rest

### Array destructuring

```js
const [a, b, c] = [1, 2, 3];
// a=1, b=2, c=3

// Skip elements
const [first, , third] = [1, 2, 3];
// first=1, third=3

// Default values
const [x = 0, y = 0] = [5];
// x=5, y=0

// Swap two variables
let p = 1, q = 2;
[p, q] = [q, p];
// p=2, q=1
```

### Rest in destructuring

```js
const [head, ...tail] = [1, 2, 3, 4];
// head=1, tail=[2,3,4]
```

### Object destructuring

```js
const person = { name: 'Alice', age: 25, city: 'Paris' };

const { name, age } = person;
// name='Alice', age=25

// Rename while destructuring
const { name: fullName } = person;
// fullName='Alice'

// Default values
const { country = 'Unknown' } = person;
// country='Unknown'
```

### Nested destructuring

```js
const user = { profile: { name: 'Bob', score: 100 } };
const { profile: { name, score } } = user;
// name='Bob', score=100
```

### Spread operator `...`

```js
// Copy an array
const copy = [...original];

// Merge arrays
const merged = [...arr1, ...arr2];

// Flatten one level — arr.flat()
const nested = [[1, 2], [3, 4], [5]];
console.log(nested.flat()); // [1, 2, 3, 4, 5]

// Copy an object
const clone = { ...obj };

// Merge objects (last one wins on conflict)
const result = { ...defaults, ...overrides };
```

### Rest parameters

```js
function sum(...numbers) {
    return numbers.reduce((total, n) => total + n, 0);
}
sum(1, 2, 3, 4); // 10
```

### Object.assign vs spread

```js
// Both merge objects, but spread is cleaner:
const a = Object.assign({}, obj1, obj2); // old way
const b = { ...obj1, ...obj2 };          // modern way
```"
            },
        ];
    }
}
