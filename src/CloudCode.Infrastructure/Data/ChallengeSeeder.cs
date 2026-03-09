using System.Text.Json;
using CloudCode.Domain.Entities;
using CloudCode.Domain.Enums;
using CloudCode.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace CloudCode.Infrastructure.Data;

public static class ChallengeSeeder
{
    public static async Task SeedChallengesAsync(IServiceProvider serviceProvider)
    {
        using var scope = serviceProvider.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var passwordHasher = scope.ServiceProvider.GetRequiredService<PasswordHasher>();

        await db.Database.MigrateAsync();

        // Seed admin user
        const string adminEmail = "devalinloic@gmail.com";
        var existingAdmin = await db.Users.FirstOrDefaultAsync(u => u.Email == adminEmail);
        if (existingAdmin == null)
        {
            db.Users.Add(new User
            {
                Id = Guid.NewGuid(),
                Email = adminEmail,
                Username = "devalinloic",
                PasswordHash = passwordHasher.HashPassword("Admin@2026!"),
                IsAdmin = true,
                EmailConfirmed = true,
                CreatedAt = DateTime.UtcNow
            });
            await db.SaveChangesAsync();
        }
        else if (!existingAdmin.IsAdmin)
        {
            existingAdmin.IsAdmin = true;
            await db.SaveChangesAsync();
        }

        // Upsert challenges by slug
        var seedChallenges = GetSeedChallenges();
        var existingChallenges = await db.Challenges
            .Include(c => c.TestCases)
            .ToListAsync();
        var existingBySlug = existingChallenges.ToDictionary(c => c.Slug);

        foreach (var seed in seedChallenges)
        {
            if (existingBySlug.TryGetValue(seed.Slug, out var existing))
            {
                // Update fields
                existing.Title = seed.Title;
                existing.Description = seed.Description;
                existing.Difficulty = seed.Difficulty;
                existing.SupportedLanguages = seed.SupportedLanguages;
                existing.StarterCodePython = seed.StarterCodePython;
                existing.StarterCodeJavaScript = seed.StarterCodeJavaScript;
                existing.IsFunction = seed.IsFunction;
                existing.TestRunnerPython = seed.TestRunnerPython;
                existing.TestRunnerJavaScript = seed.TestRunnerJavaScript;
                existing.Tags = seed.Tags;
                existing.IsPublished = seed.IsPublished;
                existing.UpdatedAt = DateTime.UtcNow;

                // Replace test cases
                db.TestCases.RemoveRange(existing.TestCases);
                foreach (var tc in seed.TestCases)
                {
                    tc.ChallengeId = existing.Id;
                    db.TestCases.Add(tc);
                }
            }
            else
            {
                db.Challenges.Add(seed);
            }
        }

        await db.SaveChangesAsync();
    }

    private static List<Challenge> GetSeedChallenges()
    {
        return
        [
            // 1. Two Sum
            new Challenge
            {
                Title = "Two Sum",
                Slug = "two-sum",
                Description = @"# Two Sum

Given an array of integers `nums` and an integer `target`, return the **indices** of the two numbers that add up to `target`.

Exactly one solution exists. You may not use the same element twice.

## Function Signature
```python
def two_sum(nums: list[int], target: int) -> list[int]:
```

## Examples
```
two_sum([2, 7, 11, 15], 9)  →  [0, 1]
two_sum([3, 2, 4], 6)       →  [1, 2]
two_sum([3, 3], 6)           →  [0, 1]
```",
                Difficulty = ChallengeDifficulty.Easy,
                SupportedLanguages = ChallengeLanguage.Both,
                IsFunction = true,
                StarterCodePython =
@"def two_sum(nums: list[int], target: int) -> list[int]:
    # Your code here
    pass",
                StarterCodeJavaScript =
@"function twoSum(nums, target) {
    // Your code here
}",
                TestRunnerPython =
@"nums = list(map(int, input().split()))
target = int(input())
result = two_sum(nums, target)
print(*result)",
                TestRunnerJavaScript =
@"const lines = require('fs').readFileSync(0, 'utf8').trim().split('\n');
const nums = lines[0].split(' ').map(Number);
const target = parseInt(lines[1]);
const result = twoSum(nums, target);
console.log(result.join(' '));",
                Tags = JsonSerializer.Serialize(new[] { "array", "hash-table" }),
                IsPublished = true,
                TestCases =
                [
                    new TestCase { Input = "2 7 11 15\n9",  ExpectedOutput = "0 1", IsHidden = false, OrderIndex = 0, Description = "Basic case" },
                    new TestCase { Input = "3 2 4\n6",       ExpectedOutput = "1 2", IsHidden = false, OrderIndex = 1, Description = "Non-adjacent" },
                    new TestCase { Input = "3 3\n6",          ExpectedOutput = "0 1", IsHidden = true,  OrderIndex = 2, Description = "Duplicates" },
                    new TestCase { Input = "1 5 3 7 2 8\n9", ExpectedOutput = "0 5", IsHidden = true,  OrderIndex = 3, Description = "Larger array" },
                ]
            },

            // 2. FizzBuzz
            new Challenge
            {
                Title = "FizzBuzz",
                Slug = "fizzbuzz",
                Description = @"# FizzBuzz

Given an integer `n`, return a list of strings for numbers 1 to `n`:
- `""FizzBuzz""` for multiples of both 3 and 5
- `""Fizz""` for multiples of 3
- `""Buzz""` for multiples of 5
- The number as a string otherwise

## Function Signature
```python
def fizzbuzz(n: int) -> list[str]:
```

## Examples
```
fizzbuzz(5)  →  [""1"", ""2"", ""Fizz"", ""4"", ""Buzz""]
fizzbuzz(15) →  [..., ""FizzBuzz""]
```",
                Difficulty = ChallengeDifficulty.Easy,
                SupportedLanguages = ChallengeLanguage.Both,
                IsFunction = true,
                StarterCodePython =
@"def fizzbuzz(n: int) -> list[str]:
    # Your code here
    pass",
                StarterCodeJavaScript =
@"function fizzbuzz(n) {
    // Your code here
}",
                TestRunnerPython =
@"n = int(input())
result = fizzbuzz(n)
print('\n'.join(result))",
                TestRunnerJavaScript =
@"const n = parseInt(require('fs').readFileSync(0, 'utf8').trim());
const result = fizzbuzz(n);
console.log(result.join('\n'));",
                Tags = JsonSerializer.Serialize(new[] { "basics", "conditionals" }),
                IsPublished = true,
                TestCases =
                [
                    new TestCase { Input = "5",  ExpectedOutput = "1\n2\nFizz\n4\nBuzz", IsHidden = false, OrderIndex = 0, Description = "n=5" },
                    new TestCase { Input = "15", ExpectedOutput = "1\n2\nFizz\n4\nBuzz\nFizz\n7\n8\nFizz\nBuzz\n11\nFizz\n13\n14\nFizzBuzz", IsHidden = false, OrderIndex = 1, Description = "n=15" },
                    new TestCase { Input = "1",  ExpectedOutput = "1", IsHidden = true, OrderIndex = 2, Description = "n=1" },
                    new TestCase { Input = "30", ExpectedOutput = "1\n2\nFizz\n4\nBuzz\nFizz\n7\n8\nFizz\nBuzz\n11\nFizz\n13\n14\nFizzBuzz\n16\n17\nFizz\n19\nBuzz\nFizz\n22\n23\nFizz\nBuzz\n26\nFizz\n28\n29\nFizzBuzz", IsHidden = true, OrderIndex = 3, Description = "n=30" },
                ]
            },

            // 3. Palindrome
            new Challenge
            {
                Title = "Palindrome Check",
                Slug = "palindrome",
                Description = @"# Palindrome Check

Given a string `s`, return `True` if it is a palindrome (considering only alphanumeric characters, case-insensitive).

## Function Signature
```python
def is_palindrome(s: str) -> bool:
```

## Examples
```
is_palindrome(""A man, a plan, a canal: Panama"")  →  True
is_palindrome(""race a car"")                       →  False
is_palindrome("" "")                                →  True
```",
                Difficulty = ChallengeDifficulty.Easy,
                SupportedLanguages = ChallengeLanguage.Both,
                IsFunction = true,
                StarterCodePython =
@"def is_palindrome(s: str) -> bool:
    # Your code here
    pass",
                StarterCodeJavaScript =
@"function isPalindrome(s) {
    // Your code here
}",
                TestRunnerPython =
@"s = input()
print(str(is_palindrome(s)).lower())",
                TestRunnerJavaScript =
@"const s = require('fs').readFileSync(0, 'utf8').trimEnd();
console.log(String(isPalindrome(s)));",
                Tags = JsonSerializer.Serialize(new[] { "string", "two-pointers" }),
                IsPublished = true,
                TestCases =
                [
                    new TestCase { Input = "A man, a plan, a canal: Panama", ExpectedOutput = "true",  IsHidden = false, OrderIndex = 0, Description = "Classic palindrome" },
                    new TestCase { Input = "race a car",                      ExpectedOutput = "false", IsHidden = false, OrderIndex = 1, Description = "Not a palindrome" },
                    new TestCase { Input = " ",                               ExpectedOutput = "true",  IsHidden = true,  OrderIndex = 2, Description = "Space only" },
                    new TestCase { Input = "ab",                              ExpectedOutput = "false", IsHidden = true,  OrderIndex = 3, Description = "Short non-palindrome" },
                    new TestCase { Input = "aba",                             ExpectedOutput = "true",  IsHidden = true,  OrderIndex = 4, Description = "Short palindrome" },
                ]
            },

            // 4. Fibonacci
            new Challenge
            {
                Title = "Fibonacci",
                Slug = "fibonacci",
                Description = @"# Fibonacci

Return the `n`-th Fibonacci number.

- F(0) = 0, F(1) = 1
- F(n) = F(n-1) + F(n-2)

## Function Signature
```python
def fibonacci(n: int) -> int:
```

## Examples
```
fibonacci(0)  →  0
fibonacci(6)  →  8
fibonacci(10) →  55
```",
                Difficulty = ChallengeDifficulty.Easy,
                SupportedLanguages = ChallengeLanguage.Both,
                IsFunction = true,
                StarterCodePython =
@"def fibonacci(n: int) -> int:
    # Your code here
    pass",
                StarterCodeJavaScript =
@"function fibonacci(n) {
    // Your code here
}",
                TestRunnerPython =
@"n = int(input())
print(fibonacci(n))",
                TestRunnerJavaScript =
@"const n = parseInt(require('fs').readFileSync(0, 'utf8').trim());
console.log(fibonacci(n));",
                Tags = JsonSerializer.Serialize(new[] { "math", "recursion", "dynamic-programming" }),
                IsPublished = true,
                TestCases =
                [
                    new TestCase { Input = "0",  ExpectedOutput = "0",      IsHidden = false, OrderIndex = 0, Description = "F(0)" },
                    new TestCase { Input = "1",  ExpectedOutput = "1",      IsHidden = false, OrderIndex = 1, Description = "F(1)" },
                    new TestCase { Input = "6",  ExpectedOutput = "8",      IsHidden = false, OrderIndex = 2, Description = "F(6)" },
                    new TestCase { Input = "10", ExpectedOutput = "55",     IsHidden = true,  OrderIndex = 3, Description = "F(10)" },
                    new TestCase { Input = "20", ExpectedOutput = "6765",   IsHidden = true,  OrderIndex = 4, Description = "F(20)" },
                    new TestCase { Input = "30", ExpectedOutput = "832040", IsHidden = true,  OrderIndex = 5, Description = "F(30)" },
                ]
            },

            // 5. Anagram
            new Challenge
            {
                Title = "Anagram Check",
                Slug = "anagram",
                Description = @"# Anagram Check

Given two strings `s` and `t`, return `True` if `t` is an anagram of `s` (same letters, same frequency, case-sensitive).

## Function Signature
```python
def is_anagram(s: str, t: str) -> bool:
```

## Examples
```
is_anagram(""anagram"", ""nagaram"")  →  True
is_anagram(""rat"", ""car"")          →  False
is_anagram(""listen"", ""silent"")    →  True
```",
                Difficulty = ChallengeDifficulty.Easy,
                SupportedLanguages = ChallengeLanguage.Both,
                IsFunction = true,
                StarterCodePython =
@"def is_anagram(s: str, t: str) -> bool:
    # Your code here
    pass",
                StarterCodeJavaScript =
@"function isAnagram(s, t) {
    // Your code here
}",
                TestRunnerPython =
@"s = input()
t = input()
print(str(is_anagram(s, t)).lower())",
                TestRunnerJavaScript =
@"const lines = require('fs').readFileSync(0, 'utf8').trim().split('\n');
console.log(String(isAnagram(lines[0], lines[1])));",
                Tags = JsonSerializer.Serialize(new[] { "string", "hash-table" }),
                IsPublished = true,
                TestCases =
                [
                    new TestCase { Input = "anagram\nnagaram", ExpectedOutput = "true",  IsHidden = false, OrderIndex = 0, Description = "Valid anagram" },
                    new TestCase { Input = "rat\ncar",          ExpectedOutput = "false", IsHidden = false, OrderIndex = 1, Description = "Not anagram" },
                    new TestCase { Input = "listen\nsilent",    ExpectedOutput = "true",  IsHidden = true,  OrderIndex = 2, Description = "listen/silent" },
                    new TestCase { Input = "hello\nworld",      ExpectedOutput = "false", IsHidden = true,  OrderIndex = 3, Description = "Different" },
                    new TestCase { Input = "a\na",              ExpectedOutput = "true",  IsHidden = true,  OrderIndex = 4, Description = "Single char" },
                ]
            },

            // 6. Reverse String
            new Challenge
            {
                Title = "Reverse String",
                Slug = "reverse-string",
                Description = @"# Reverse String

Given a string `s`, return it reversed.

## Function Signature
```python
def reverse_string(s: str) -> str:
```

## Examples
```
reverse_string(""hello"")   →  ""olleh""
reverse_string(""racecar"") →  ""racecar""
```",
                Difficulty = ChallengeDifficulty.Easy,
                SupportedLanguages = ChallengeLanguage.Both,
                IsFunction = true,
                StarterCodePython =
@"def reverse_string(s: str) -> str:
    # Your code here
    pass",
                StarterCodeJavaScript =
@"function reverseString(s) {
    // Your code here
}",
                TestRunnerPython =
@"s = input()
print(reverse_string(s))",
                TestRunnerJavaScript =
@"const s = require('fs').readFileSync(0, 'utf8').trimEnd();
console.log(reverseString(s));",
                Tags = JsonSerializer.Serialize(new[] { "string", "basics" }),
                IsPublished = true,
                TestCases =
                [
                    new TestCase { Input = "hello",   ExpectedOutput = "olleh",   IsHidden = false, OrderIndex = 0, Description = "Basic" },
                    new TestCase { Input = "world",   ExpectedOutput = "dlrow",   IsHidden = false, OrderIndex = 1, Description = "Basic 2" },
                    new TestCase { Input = "racecar", ExpectedOutput = "racecar", IsHidden = true,  OrderIndex = 2, Description = "Palindrome" },
                    new TestCase { Input = "a",       ExpectedOutput = "a",       IsHidden = true,  OrderIndex = 3, Description = "Single char" },
                    new TestCase { Input = "abcd",    ExpectedOutput = "dcba",    IsHidden = true,  OrderIndex = 4, Description = "Even length" },
                ]
            },

            // 7. Count Vowels
            new Challenge
            {
                Title = "Count Vowels",
                Slug = "count-vowels",
                Description = @"# Count Vowels

Given a string, return the number of vowels (`a e i o u`, case-insensitive).

## Function Signature
```python
def count_vowels(s: str) -> int:
```

## Examples
```
count_vowels(""hello"")  →  2
count_vowels(""aeiou"")  →  5
count_vowels(""rhythm"") →  0
```",
                Difficulty = ChallengeDifficulty.Easy,
                SupportedLanguages = ChallengeLanguage.Both,
                IsFunction = true,
                StarterCodePython =
@"def count_vowels(s: str) -> int:
    # Your code here
    pass",
                StarterCodeJavaScript =
@"function countVowels(s) {
    // Your code here
}",
                TestRunnerPython =
@"s = input()
print(count_vowels(s))",
                TestRunnerJavaScript =
@"const s = require('fs').readFileSync(0, 'utf8').trimEnd();
console.log(countVowels(s));",
                Tags = JsonSerializer.Serialize(new[] { "string", "basics" }),
                IsPublished = true,
                TestCases =
                [
                    new TestCase { Input = "hello",       ExpectedOutput = "2", IsHidden = false, OrderIndex = 0, Description = "hello" },
                    new TestCase { Input = "aeiou",       ExpectedOutput = "5", IsHidden = false, OrderIndex = 1, Description = "All vowels" },
                    new TestCase { Input = "programming", ExpectedOutput = "3", IsHidden = true,  OrderIndex = 2, Description = "programming" },
                    new TestCase { Input = "rhythm",      ExpectedOutput = "0", IsHidden = true,  OrderIndex = 3, Description = "No vowels" },
                    new TestCase { Input = "HELLO",       ExpectedOutput = "2", IsHidden = true,  OrderIndex = 4, Description = "Uppercase" },
                ]
            },

            // 8. Sum of Array
            new Challenge
            {
                Title = "Sum of Array",
                Slug = "sum-array",
                Description = @"# Sum of Array

Given a list of integers, return their sum.

## Function Signature
```python
def sum_array(nums: list[int]) -> int:
```

## Examples
```
sum_array([1, 2, 3, 4, 5])   →  15
sum_array([-1, 2, -3, 4])    →  2
sum_array([0])               →  0
```",
                Difficulty = ChallengeDifficulty.Easy,
                SupportedLanguages = ChallengeLanguage.Both,
                IsFunction = true,
                StarterCodePython =
@"def sum_array(nums: list[int]) -> int:
    # Your code here
    pass",
                StarterCodeJavaScript =
@"function sumArray(nums) {
    // Your code here
}",
                TestRunnerPython =
@"nums = list(map(int, input().split()))
print(sum_array(nums))",
                TestRunnerJavaScript =
@"const nums = require('fs').readFileSync(0, 'utf8').trim().split(' ').map(Number);
console.log(sumArray(nums));",
                Tags = JsonSerializer.Serialize(new[] { "array", "basics", "math" }),
                IsPublished = true,
                TestCases =
                [
                    new TestCase { Input = "1 2 3 4 5",       ExpectedOutput = "15",   IsHidden = false, OrderIndex = 0, Description = "Basic" },
                    new TestCase { Input = "10 20 30",         ExpectedOutput = "60",   IsHidden = false, OrderIndex = 1, Description = "Tens" },
                    new TestCase { Input = "-1 2 -3 4",        ExpectedOutput = "2",    IsHidden = true,  OrderIndex = 2, Description = "Negatives" },
                    new TestCase { Input = "0",                ExpectedOutput = "0",    IsHidden = true,  OrderIndex = 3, Description = "Single zero" },
                    new TestCase { Input = "100 200 300 400 500", ExpectedOutput = "1500", IsHidden = true, OrderIndex = 4, Description = "Larger" },
                ]
            },

            // 9. Max Element
            new Challenge
            {
                Title = "Max Element",
                Slug = "max-element",
                Description = @"# Max Element

Given a list of integers, return the maximum element.

## Function Signature
```python
def max_element(nums: list[int]) -> int:
```

## Examples
```
max_element([3, 1, 4, 1, 5, 9, 2, 6])  →  9
max_element([-5, -3, -1, -8])           →  -1
```",
                Difficulty = ChallengeDifficulty.Easy,
                SupportedLanguages = ChallengeLanguage.Both,
                IsFunction = true,
                StarterCodePython =
@"def max_element(nums: list[int]) -> int:
    # Your code here
    pass",
                StarterCodeJavaScript =
@"function maxElement(nums) {
    // Your code here
}",
                TestRunnerPython =
@"nums = list(map(int, input().split()))
print(max_element(nums))",
                TestRunnerJavaScript =
@"const nums = require('fs').readFileSync(0, 'utf8').trim().split(' ').map(Number);
console.log(maxElement(nums));",
                Tags = JsonSerializer.Serialize(new[] { "array", "basics" }),
                IsPublished = true,
                TestCases =
                [
                    new TestCase { Input = "3 1 4 1 5 9 2 6", ExpectedOutput = "9",  IsHidden = false, OrderIndex = 0, Description = "Basic" },
                    new TestCase { Input = "7",                ExpectedOutput = "7",  IsHidden = false, OrderIndex = 1, Description = "Single" },
                    new TestCase { Input = "-5 -3 -1 -8",     ExpectedOutput = "-1", IsHidden = true,  OrderIndex = 2, Description = "All negative" },
                    new TestCase { Input = "1 1 1 1",          ExpectedOutput = "1",  IsHidden = true,  OrderIndex = 3, Description = "All equal" },
                    new TestCase { Input = "0 100 -100",       ExpectedOutput = "100",IsHidden = true,  OrderIndex = 4, Description = "Mixed" },
                ]
            },

            // 10. Factorial
            new Challenge
            {
                Title = "Factorial",
                Slug = "factorial",
                Description = @"# Factorial

Given a non-negative integer `n`, return `n!`.

- `0! = 1`
- `n! = n × (n-1) × ... × 1`

## Function Signature
```python
def factorial(n: int) -> int:
```

## Examples
```
factorial(0)  →  1
factorial(5)  →  120
factorial(10) →  3628800
```",
                Difficulty = ChallengeDifficulty.Easy,
                SupportedLanguages = ChallengeLanguage.Both,
                IsFunction = true,
                StarterCodePython =
@"def factorial(n: int) -> int:
    # Your code here
    pass",
                StarterCodeJavaScript =
@"function factorial(n) {
    // Your code here
}",
                TestRunnerPython =
@"n = int(input())
print(factorial(n))",
                TestRunnerJavaScript =
@"const n = parseInt(require('fs').readFileSync(0, 'utf8').trim());
console.log(factorial(n));",
                Tags = JsonSerializer.Serialize(new[] { "math", "recursion" }),
                IsPublished = true,
                TestCases =
                [
                    new TestCase { Input = "0",  ExpectedOutput = "1",       IsHidden = false, OrderIndex = 0, Description = "0!" },
                    new TestCase { Input = "1",  ExpectedOutput = "1",       IsHidden = false, OrderIndex = 1, Description = "1!" },
                    new TestCase { Input = "5",  ExpectedOutput = "120",     IsHidden = false, OrderIndex = 2, Description = "5!" },
                    new TestCase { Input = "10", ExpectedOutput = "3628800", IsHidden = true,  OrderIndex = 3, Description = "10!" },
                    new TestCase { Input = "12", ExpectedOutput = "479001600", IsHidden = true, OrderIndex = 4, Description = "12!" },
                ]
            },

            // 11. Contains Duplicate
            new Challenge
            {
                Title = "Contains Duplicate",
                Slug = "contains-duplicate",
                Description = @"# Contains Duplicate

Given a list of integers, return `True` if any value appears more than once.

## Function Signature
```python
def contains_duplicate(nums: list[int]) -> bool:
```

## Examples
```
contains_duplicate([1, 2, 3, 1])  →  True
contains_duplicate([1, 2, 3, 4])  →  False
```",
                Difficulty = ChallengeDifficulty.Easy,
                SupportedLanguages = ChallengeLanguage.Both,
                IsFunction = true,
                StarterCodePython =
@"def contains_duplicate(nums: list[int]) -> bool:
    # Your code here
    pass",
                StarterCodeJavaScript =
@"function containsDuplicate(nums) {
    // Your code here
}",
                TestRunnerPython =
@"nums = list(map(int, input().split()))
print(str(contains_duplicate(nums)).lower())",
                TestRunnerJavaScript =
@"const nums = require('fs').readFileSync(0, 'utf8').trim().split(' ').map(Number);
console.log(String(containsDuplicate(nums)));",
                Tags = JsonSerializer.Serialize(new[] { "array", "hash-table" }),
                IsPublished = true,
                TestCases =
                [
                    new TestCase { Input = "1 2 3 1",    ExpectedOutput = "true",  IsHidden = false, OrderIndex = 0, Description = "Has duplicate" },
                    new TestCase { Input = "1 2 3 4",    ExpectedOutput = "false", IsHidden = false, OrderIndex = 1, Description = "No duplicate" },
                    new TestCase { Input = "1 1 1 3 3",  ExpectedOutput = "true",  IsHidden = true,  OrderIndex = 2, Description = "Multiple dups" },
                    new TestCase { Input = "5",           ExpectedOutput = "false", IsHidden = true,  OrderIndex = 3, Description = "Single" },
                ]
            },

            // 12. Valid Parentheses
            new Challenge
            {
                Title = "Valid Parentheses",
                Slug = "valid-parentheses",
                Description = @"# Valid Parentheses

Given a string containing only `(`, `)`, `{`, `}`, `[`, `]`, return `True` if the brackets are valid (properly opened and closed).

## Function Signature
```python
def is_valid(s: str) -> bool:
```

## Examples
```
is_valid(""()"")     →  True
is_valid(""()[]{}"") →  True
is_valid(""(]"")     →  False
is_valid(""([)]"")   →  False
```",
                Difficulty = ChallengeDifficulty.Easy,
                SupportedLanguages = ChallengeLanguage.Both,
                IsFunction = true,
                StarterCodePython =
@"def is_valid(s: str) -> bool:
    # Your code here
    pass",
                StarterCodeJavaScript =
@"function isValid(s) {
    // Your code here
}",
                TestRunnerPython =
@"s = input()
print(str(is_valid(s)).lower())",
                TestRunnerJavaScript =
@"const s = require('fs').readFileSync(0, 'utf8').trimEnd();
console.log(String(isValid(s)));",
                Tags = JsonSerializer.Serialize(new[] { "string", "stack" }),
                IsPublished = true,
                TestCases =
                [
                    new TestCase { Input = "()",     ExpectedOutput = "true",  IsHidden = false, OrderIndex = 0, Description = "Simple" },
                    new TestCase { Input = "()[]{}", ExpectedOutput = "true",  IsHidden = false, OrderIndex = 1, Description = "Mixed valid" },
                    new TestCase { Input = "(]",     ExpectedOutput = "false", IsHidden = false, OrderIndex = 2, Description = "Mismatch" },
                    new TestCase { Input = "([)]",   ExpectedOutput = "false", IsHidden = true,  OrderIndex = 3, Description = "Interleaved" },
                    new TestCase { Input = "{[]}",   ExpectedOutput = "true",  IsHidden = true,  OrderIndex = 4, Description = "Nested" },
                    new TestCase { Input = "]",      ExpectedOutput = "false", IsHidden = true,  OrderIndex = 5, Description = "Just close" },
                ]
            },

            // 13. Binary Search
            new Challenge
            {
                Title = "Binary Search",
                Slug = "binary-search",
                Description = @"# Binary Search

Given a sorted array of integers and a target, return the index of the target. If not found, return `-1`.

## Function Signature
```python
def binary_search(nums: list[int], target: int) -> int:
```

## Examples
```
binary_search([-1, 0, 3, 5, 9, 12], 9)  →  4
binary_search([-1, 0, 3, 5, 9, 12], 2)  →  -1
```",
                Difficulty = ChallengeDifficulty.Easy,
                SupportedLanguages = ChallengeLanguage.Both,
                IsFunction = true,
                StarterCodePython =
@"def binary_search(nums: list[int], target: int) -> int:
    # Your code here
    pass",
                StarterCodeJavaScript =
@"function binarySearch(nums, target) {
    // Your code here
}",
                TestRunnerPython =
@"nums = list(map(int, input().split()))
target = int(input())
print(binary_search(nums, target))",
                TestRunnerJavaScript =
@"const lines = require('fs').readFileSync(0, 'utf8').trim().split('\n');
const nums = lines[0].split(' ').map(Number);
const target = parseInt(lines[1]);
console.log(binarySearch(nums, target));",
                Tags = JsonSerializer.Serialize(new[] { "array", "binary-search" }),
                IsPublished = true,
                TestCases =
                [
                    new TestCase { Input = "-1 0 3 5 9 12\n9",  ExpectedOutput = "4",  IsHidden = false, OrderIndex = 0, Description = "Found" },
                    new TestCase { Input = "-1 0 3 5 9 12\n2",  ExpectedOutput = "-1", IsHidden = false, OrderIndex = 1, Description = "Not found" },
                    new TestCase { Input = "1\n1",               ExpectedOutput = "0",  IsHidden = true,  OrderIndex = 2, Description = "Single element found" },
                    new TestCase { Input = "1 3 5 7 9\n5",       ExpectedOutput = "2",  IsHidden = true,  OrderIndex = 3, Description = "Middle" },
                    new TestCase { Input = "2 4 6 8 10\n1",      ExpectedOutput = "-1", IsHidden = true,  OrderIndex = 4, Description = "Smaller than all" },
                ]
            },

            // 14. Merge Sorted Arrays
            new Challenge
            {
                Title = "Merge Sorted Arrays",
                Slug = "merge-sorted-arrays",
                Description = @"# Merge Sorted Arrays

Given two sorted arrays, return a single sorted merged array.

## Function Signature
```python
def merge_sorted(a: list[int], b: list[int]) -> list[int]:
```

## Examples
```
merge_sorted([1, 3, 5], [2, 4, 6])   →  [1, 2, 3, 4, 5, 6]
merge_sorted([1, 2], [3, 4])          →  [1, 2, 3, 4]
merge_sorted([], [1])                  →  [1]
```",
                Difficulty = ChallengeDifficulty.Easy,
                SupportedLanguages = ChallengeLanguage.Both,
                IsFunction = true,
                StarterCodePython =
@"def merge_sorted(a: list[int], b: list[int]) -> list[int]:
    # Your code here
    pass",
                StarterCodeJavaScript =
@"function mergeSorted(a, b) {
    // Your code here
}",
                TestRunnerPython =
@"a = list(map(int, input().split()))
b = list(map(int, input().split()))
print(*merge_sorted(a, b))",
                TestRunnerJavaScript =
@"const lines = require('fs').readFileSync(0, 'utf8').trim().split('\n');
const a = lines[0].split(' ').map(Number);
const b = lines[1].split(' ').map(Number);
console.log(mergeSorted(a, b).join(' '));",
                Tags = JsonSerializer.Serialize(new[] { "array", "sorting", "two-pointers" }),
                IsPublished = true,
                TestCases =
                [
                    new TestCase { Input = "1 3 5\n2 4 6",   ExpectedOutput = "1 2 3 4 5 6", IsHidden = false, OrderIndex = 0, Description = "Interleaved" },
                    new TestCase { Input = "1 2\n3 4",         ExpectedOutput = "1 2 3 4",     IsHidden = false, OrderIndex = 1, Description = "No overlap" },
                    new TestCase { Input = "1 5 9\n2 3 10",    ExpectedOutput = "1 2 3 5 9 10",IsHidden = true,  OrderIndex = 2, Description = "Mixed" },
                    new TestCase { Input = "1\n1",              ExpectedOutput = "1 1",          IsHidden = true,  OrderIndex = 3, Description = "Duplicates" },
                ]
            },

            // 15. Count Occurrences
            new Challenge
            {
                Title = "Count Occurrences",
                Slug = "count-occurrences",
                Description = @"# Count Occurrences

Given a list of integers and a target value, return how many times the target appears.

## Function Signature
```python
def count_occurrences(nums: list[int], target: int) -> int:
```

## Examples
```
count_occurrences([1, 2, 3, 2, 2, 5], 2)  →  3
count_occurrences([1, 1, 1], 1)             →  3
count_occurrences([1, 2, 3], 4)             →  0
```",
                Difficulty = ChallengeDifficulty.Easy,
                SupportedLanguages = ChallengeLanguage.Both,
                IsFunction = true,
                StarterCodePython =
@"def count_occurrences(nums: list[int], target: int) -> int:
    # Your code here
    pass",
                StarterCodeJavaScript =
@"function countOccurrences(nums, target) {
    // Your code here
}",
                TestRunnerPython =
@"nums = list(map(int, input().split()))
target = int(input())
print(count_occurrences(nums, target))",
                TestRunnerJavaScript =
@"const lines = require('fs').readFileSync(0, 'utf8').trim().split('\n');
const nums = lines[0].split(' ').map(Number);
const target = parseInt(lines[1]);
console.log(countOccurrences(nums, target));",
                Tags = JsonSerializer.Serialize(new[] { "array", "basics" }),
                IsPublished = true,
                TestCases =
                [
                    new TestCase { Input = "1 2 3 2 2 5\n2", ExpectedOutput = "3", IsHidden = false, OrderIndex = 0, Description = "Three 2s" },
                    new TestCase { Input = "1 1 1\n1",         ExpectedOutput = "3", IsHidden = false, OrderIndex = 1, Description = "All same" },
                    new TestCase { Input = "1 2 3\n4",         ExpectedOutput = "0", IsHidden = true,  OrderIndex = 2, Description = "Not found" },
                    new TestCase { Input = "5\n5",              ExpectedOutput = "1", IsHidden = true,  OrderIndex = 3, Description = "Single" },
                ]
            },

            // 16. Flatten List
            new Challenge
            {
                Title = "Flatten List",
                Slug = "flatten-list",
                Description = @"# Flatten List

Given a 2D list (list of lists) of integers, return a flat 1D list containing all elements in order.

## Function Signature
```python
def flatten(matrix: list[list[int]]) -> list[int]:
```

## Examples
```
flatten([[1, 2], [3, 4], [5]])  →  [1, 2, 3, 4, 5]
flatten([[1], [2], [3]])         →  [1, 2, 3]
```

## Input Format (stdin)
- First line: number of rows `n`
- Next `n` lines: space-separated integers per row",
                Difficulty = ChallengeDifficulty.Easy,
                SupportedLanguages = ChallengeLanguage.Both,
                IsFunction = true,
                StarterCodePython =
@"def flatten(matrix: list[list[int]]) -> list[int]:
    # Your code here
    pass",
                StarterCodeJavaScript =
@"function flatten(matrix) {
    // Your code here
}",
                TestRunnerPython =
@"n = int(input())
matrix = [list(map(int, input().split())) for _ in range(n)]
print(*flatten(matrix))",
                TestRunnerJavaScript =
@"const lines = require('fs').readFileSync(0, 'utf8').trim().split('\n');
const n = parseInt(lines[0]);
const matrix = lines.slice(1, n+1).map(l => l.split(' ').map(Number));
console.log(flatten(matrix).join(' '));",
                Tags = JsonSerializer.Serialize(new[] { "array", "basics" }),
                IsPublished = true,
                TestCases =
                [
                    new TestCase { Input = "3\n1 2\n3 4\n5",   ExpectedOutput = "1 2 3 4 5", IsHidden = false, OrderIndex = 0, Description = "Basic" },
                    new TestCase { Input = "3\n1\n2\n3",         ExpectedOutput = "1 2 3",     IsHidden = false, OrderIndex = 1, Description = "Single cols" },
                    new TestCase { Input = "2\n1 2 3\n4 5 6",   ExpectedOutput = "1 2 3 4 5 6",IsHidden = true,  OrderIndex = 2, Description = "2x3" },
                ]
            },

            // 17. Power
            new Challenge
            {
                Title = "Power Function",
                Slug = "power",
                Description = @"# Power Function

Implement `power(base, exp)` that returns `base` raised to the power `exp`. Do not use built-in power operators.

Both `base` and `exp` are non-negative integers (exp ≤ 20).

## Function Signature
```python
def power(base: int, exp: int) -> int:
```

## Examples
```
power(2, 10)  →  1024
power(3, 3)   →  27
power(5, 0)   →  1
```",
                Difficulty = ChallengeDifficulty.Easy,
                SupportedLanguages = ChallengeLanguage.Both,
                IsFunction = true,
                StarterCodePython =
@"def power(base: int, exp: int) -> int:
    # Your code here (don't use ** or pow())
    pass",
                StarterCodeJavaScript =
@"function power(base, exp) {
    // Your code here (don't use Math.pow or **)
}",
                TestRunnerPython =
@"base, exp = map(int, input().split())
print(power(base, exp))",
                TestRunnerJavaScript =
@"const parts = require('fs').readFileSync(0, 'utf8').trim().split(' ');
console.log(power(parseInt(parts[0]), parseInt(parts[1])));",
                Tags = JsonSerializer.Serialize(new[] { "math", "recursion" }),
                IsPublished = true,
                TestCases =
                [
                    new TestCase { Input = "2 10", ExpectedOutput = "1024",       IsHidden = false, OrderIndex = 0, Description = "2^10" },
                    new TestCase { Input = "3 3",  ExpectedOutput = "27",         IsHidden = false, OrderIndex = 1, Description = "3^3" },
                    new TestCase { Input = "5 0",  ExpectedOutput = "1",          IsHidden = false, OrderIndex = 2, Description = "x^0" },
                    new TestCase { Input = "1 20", ExpectedOutput = "1",          IsHidden = true,  OrderIndex = 3, Description = "1^20" },
                    new TestCase { Input = "2 20", ExpectedOutput = "1048576",    IsHidden = true,  OrderIndex = 4, Description = "2^20" },
                ]
            },

            // 18. Remove Duplicates
            new Challenge
            {
                Title = "Remove Duplicates",
                Slug = "remove-duplicates",
                Description = @"# Remove Duplicates

Given a sorted list of integers, return it with all duplicates removed (maintain order).

## Function Signature
```python
def remove_duplicates(nums: list[int]) -> list[int]:
```

## Examples
```
remove_duplicates([1, 1, 2])           →  [1, 2]
remove_duplicates([0, 0, 1, 1, 2, 3]) →  [0, 1, 2, 3]
```",
                Difficulty = ChallengeDifficulty.Easy,
                SupportedLanguages = ChallengeLanguage.Both,
                IsFunction = true,
                StarterCodePython =
@"def remove_duplicates(nums: list[int]) -> list[int]:
    # Your code here
    pass",
                StarterCodeJavaScript =
@"function removeDuplicates(nums) {
    // Your code here
}",
                TestRunnerPython =
@"nums = list(map(int, input().split()))
print(*remove_duplicates(nums))",
                TestRunnerJavaScript =
@"const nums = require('fs').readFileSync(0, 'utf8').trim().split(' ').map(Number);
console.log(removeDuplicates(nums).join(' '));",
                Tags = JsonSerializer.Serialize(new[] { "array", "two-pointers" }),
                IsPublished = true,
                TestCases =
                [
                    new TestCase { Input = "1 1 2",         ExpectedOutput = "1 2",    IsHidden = false, OrderIndex = 0, Description = "Basic" },
                    new TestCase { Input = "0 0 1 1 2 3",   ExpectedOutput = "0 1 2 3",IsHidden = false, OrderIndex = 1, Description = "Multiple dups" },
                    new TestCase { Input = "1",              ExpectedOutput = "1",       IsHidden = true,  OrderIndex = 2, Description = "Single" },
                    new TestCase { Input = "1 1 1 1",        ExpectedOutput = "1",       IsHidden = true,  OrderIndex = 3, Description = "All same" },
                ]
            },

            // 19. Longest Common Prefix
            new Challenge
            {
                Title = "Longest Common Prefix",
                Slug = "longest-common-prefix",
                Description = @"# Longest Common Prefix

Given a list of strings, return the longest common prefix. If none, return `""""`.

## Function Signature
```python
def longest_common_prefix(strs: list[str]) -> str:
```

## Examples
```
longest_common_prefix([""flower"", ""flow"", ""flight""])  →  ""fl""
longest_common_prefix([""dog"", ""racecar"", ""car""])      →  """"
```",
                Difficulty = ChallengeDifficulty.Easy,
                SupportedLanguages = ChallengeLanguage.Both,
                IsFunction = true,
                StarterCodePython =
@"def longest_common_prefix(strs: list[str]) -> str:
    # Your code here
    pass",
                StarterCodeJavaScript =
@"function longestCommonPrefix(strs) {
    // Your code here
}",
                TestRunnerPython =
@"strs = input().split()
print(longest_common_prefix(strs))",
                TestRunnerJavaScript =
@"const strs = require('fs').readFileSync(0, 'utf8').trim().split(' ');
console.log(longestCommonPrefix(strs));",
                Tags = JsonSerializer.Serialize(new[] { "string", "basics" }),
                IsPublished = true,
                TestCases =
                [
                    new TestCase { Input = "flower flow flight", ExpectedOutput = "fl", IsHidden = false, OrderIndex = 0, Description = "fl" },
                    new TestCase { Input = "dog racecar car",    ExpectedOutput = "",   IsHidden = false, OrderIndex = 1, Description = "No prefix" },
                    new TestCase { Input = "abc abc abc",        ExpectedOutput = "abc",IsHidden = true,  OrderIndex = 2, Description = "All same" },
                    new TestCase { Input = "ab a",               ExpectedOutput = "a",  IsHidden = true,  OrderIndex = 3, Description = "Short prefix" },
                ]
            },

            // 20. Is Prime
            new Challenge
            {
                Title = "Is Prime",
                Slug = "is-prime",
                Description = @"# Is Prime

Given an integer `n`, return `True` if it is a prime number.

A prime number is greater than 1 and has no divisors other than 1 and itself.

## Function Signature
```python
def is_prime(n: int) -> bool:
```

## Examples
```
is_prime(2)   →  True
is_prime(17)  →  True
is_prime(1)   →  False
is_prime(15)  →  False
```",
                Difficulty = ChallengeDifficulty.Easy,
                SupportedLanguages = ChallengeLanguage.Both,
                IsFunction = true,
                StarterCodePython =
@"def is_prime(n: int) -> bool:
    # Your code here
    pass",
                StarterCodeJavaScript =
@"function isPrime(n) {
    // Your code here
}",
                TestRunnerPython =
@"n = int(input())
print(str(is_prime(n)).lower())",
                TestRunnerJavaScript =
@"const n = parseInt(require('fs').readFileSync(0, 'utf8').trim());
console.log(String(isPrime(n)));",
                Tags = JsonSerializer.Serialize(new[] { "math", "basics" }),
                IsPublished = true,
                TestCases =
                [
                    new TestCase { Input = "2",  ExpectedOutput = "true",  IsHidden = false, OrderIndex = 0, Description = "Smallest prime" },
                    new TestCase { Input = "17", ExpectedOutput = "true",  IsHidden = false, OrderIndex = 1, Description = "Prime" },
                    new TestCase { Input = "1",  ExpectedOutput = "false", IsHidden = false, OrderIndex = 2, Description = "1 not prime" },
                    new TestCase { Input = "15", ExpectedOutput = "false", IsHidden = true,  OrderIndex = 3, Description = "Composite" },
                    new TestCase { Input = "97", ExpectedOutput = "true",  IsHidden = true,  OrderIndex = 4, Description = "Large prime" },
                ]
            },

            // 21. Maximum Subarray (Kadane)
            new Challenge
            {
                Title = "Maximum Subarray",
                Slug = "max-subarray",
                Description = @"# Maximum Subarray

Given an array of integers, find the contiguous subarray with the largest sum and return that sum.

## Function Signature
```python
def max_subarray(nums: list[int]) -> int:
```

## Examples
```
max_subarray([-2, 1, -3, 4, -1, 2, 1, -5, 4])  →  6  (subarray [4,-1,2,1])
max_subarray([1])                                 →  1
max_subarray([-1, -2, -3])                        →  -1
```",
                Difficulty = ChallengeDifficulty.Medium,
                SupportedLanguages = ChallengeLanguage.Both,
                IsFunction = true,
                StarterCodePython =
@"def max_subarray(nums: list[int]) -> int:
    # Your code here
    pass",
                StarterCodeJavaScript =
@"function maxSubarray(nums) {
    // Your code here
}",
                TestRunnerPython =
@"nums = list(map(int, input().split()))
print(max_subarray(nums))",
                TestRunnerJavaScript =
@"const nums = require('fs').readFileSync(0, 'utf8').trim().split(' ').map(Number);
console.log(maxSubarray(nums));",
                Tags = JsonSerializer.Serialize(new[] { "array", "dynamic-programming" }),
                IsPublished = true,
                TestCases =
                [
                    new TestCase { Input = "-2 1 -3 4 -1 2 1 -5 4", ExpectedOutput = "6",  IsHidden = false, OrderIndex = 0, Description = "Classic Kadane" },
                    new TestCase { Input = "1",                       ExpectedOutput = "1",  IsHidden = false, OrderIndex = 1, Description = "Single" },
                    new TestCase { Input = "-1 -2 -3",                ExpectedOutput = "-1", IsHidden = false, OrderIndex = 2, Description = "All negative" },
                    new TestCase { Input = "5 4 -1 7 8",              ExpectedOutput = "23", IsHidden = true,  OrderIndex = 3, Description = "All positive dip" },
                ]
            },

            // 22. Climbing Stairs
            new Challenge
            {
                Title = "Climbing Stairs",
                Slug = "climbing-stairs",
                Description = @"# Climbing Stairs

You are climbing a staircase with `n` steps. Each time you can climb 1 or 2 steps. Return the number of distinct ways to reach the top.

## Function Signature
```python
def climb_stairs(n: int) -> int:
```

## Examples
```
climb_stairs(1)  →  1
climb_stairs(2)  →  2
climb_stairs(5)  →  8
```",
                Difficulty = ChallengeDifficulty.Easy,
                SupportedLanguages = ChallengeLanguage.Both,
                IsFunction = true,
                StarterCodePython =
@"def climb_stairs(n: int) -> int:
    # Your code here
    pass",
                StarterCodeJavaScript =
@"function climbStairs(n) {
    // Your code here
}",
                TestRunnerPython =
@"n = int(input())
print(climb_stairs(n))",
                TestRunnerJavaScript =
@"const n = parseInt(require('fs').readFileSync(0, 'utf8').trim());
console.log(climbStairs(n));",
                Tags = JsonSerializer.Serialize(new[] { "dynamic-programming", "math" }),
                IsPublished = true,
                TestCases =
                [
                    new TestCase { Input = "1",  ExpectedOutput = "1",   IsHidden = false, OrderIndex = 0, Description = "n=1" },
                    new TestCase { Input = "2",  ExpectedOutput = "2",   IsHidden = false, OrderIndex = 1, Description = "n=2" },
                    new TestCase { Input = "5",  ExpectedOutput = "8",   IsHidden = false, OrderIndex = 2, Description = "n=5" },
                    new TestCase { Input = "10", ExpectedOutput = "89",  IsHidden = true,  OrderIndex = 3, Description = "n=10" },
                    new TestCase { Input = "20", ExpectedOutput = "10946", IsHidden = true, OrderIndex = 4, Description = "n=20" },
                ]
            },

            // 23. Reverse Linked List (array-based)
            new Challenge
            {
                Title = "Reverse Array",
                Slug = "reverse-array",
                Description = @"# Reverse Array

Given a list of integers, return a new list with the elements in reverse order. Do not use built-in reverse functions.

## Function Signature
```python
def reverse_array(nums: list[int]) -> list[int]:
```

## Examples
```
reverse_array([1, 2, 3, 4, 5])  →  [5, 4, 3, 2, 1]
reverse_array([1])               →  [1]
```",
                Difficulty = ChallengeDifficulty.Easy,
                SupportedLanguages = ChallengeLanguage.Both,
                IsFunction = true,
                StarterCodePython =
@"def reverse_array(nums: list[int]) -> list[int]:
    # Your code here (don't use .reverse() or [::-1])
    pass",
                StarterCodeJavaScript =
@"function reverseArray(nums) {
    // Your code here (don't use .reverse())
}",
                TestRunnerPython =
@"nums = list(map(int, input().split()))
print(*reverse_array(nums))",
                TestRunnerJavaScript =
@"const nums = require('fs').readFileSync(0, 'utf8').trim().split(' ').map(Number);
console.log(reverseArray(nums).join(' '));",
                Tags = JsonSerializer.Serialize(new[] { "array", "two-pointers" }),
                IsPublished = true,
                TestCases =
                [
                    new TestCase { Input = "1 2 3 4 5", ExpectedOutput = "5 4 3 2 1", IsHidden = false, OrderIndex = 0, Description = "Basic" },
                    new TestCase { Input = "1",          ExpectedOutput = "1",          IsHidden = false, OrderIndex = 1, Description = "Single" },
                    new TestCase { Input = "1 2",        ExpectedOutput = "2 1",        IsHidden = true,  OrderIndex = 2, Description = "Two" },
                    new TestCase { Input = "5 4 3 2 1",  ExpectedOutput = "1 2 3 4 5", IsHidden = true,  OrderIndex = 3, Description = "Already reversed" },
                ]
            },

            // 24. Product Except Self
            new Challenge
            {
                Title = "Product Except Self",
                Slug = "product-except-self",
                Description = @"# Product Except Self

Given an array of integers, return an array where each element is the product of all other elements. Do not use division.

## Function Signature
```python
def product_except_self(nums: list[int]) -> list[int]:
```

## Examples
```
product_except_self([1, 2, 3, 4])   →  [24, 12, 8, 6]
product_except_self([-1, 1, 0, -3]) →  [0, 0, 3, 0]
```",
                Difficulty = ChallengeDifficulty.Medium,
                SupportedLanguages = ChallengeLanguage.Both,
                IsFunction = true,
                StarterCodePython =
@"def product_except_self(nums: list[int]) -> list[int]:
    # Your code here
    pass",
                StarterCodeJavaScript =
@"function productExceptSelf(nums) {
    // Your code here
}",
                TestRunnerPython =
@"nums = list(map(int, input().split()))
print(*product_except_self(nums))",
                TestRunnerJavaScript =
@"const nums = require('fs').readFileSync(0, 'utf8').trim().split(' ').map(Number);
console.log(productExceptSelf(nums).join(' '));",
                Tags = JsonSerializer.Serialize(new[] { "array", "prefix-sum" }),
                IsPublished = true,
                TestCases =
                [
                    new TestCase { Input = "1 2 3 4",   ExpectedOutput = "24 12 8 6", IsHidden = false, OrderIndex = 0, Description = "Basic" },
                    new TestCase { Input = "-1 1 0 -3", ExpectedOutput = "0 0 3 0",   IsHidden = false, OrderIndex = 1, Description = "With zero" },
                    new TestCase { Input = "2 3",        ExpectedOutput = "3 2",        IsHidden = true,  OrderIndex = 2, Description = "Two elements" },
                    new TestCase { Input = "1 2 3 4 5",  ExpectedOutput = "120 60 40 30 24", IsHidden = true, OrderIndex = 3, Description = "Five elements" },
                ]
            },

            // 25. Majority Element
            new Challenge
            {
                Title = "Majority Element",
                Slug = "majority-element",
                Description = @"# Majority Element

Given an array of integers, find the element that appears more than `n/2` times. It is guaranteed to always exist.

## Function Signature
```python
def majority_element(nums: list[int]) -> int:
```

## Examples
```
majority_element([3, 2, 3])        →  3
majority_element([2, 2, 1, 1, 2]) →  2
```",
                Difficulty = ChallengeDifficulty.Easy,
                SupportedLanguages = ChallengeLanguage.Both,
                IsFunction = true,
                StarterCodePython =
@"def majority_element(nums: list[int]) -> int:
    # Your code here
    pass",
                StarterCodeJavaScript =
@"function majorityElement(nums) {
    // Your code here
}",
                TestRunnerPython =
@"nums = list(map(int, input().split()))
print(majority_element(nums))",
                TestRunnerJavaScript =
@"const nums = require('fs').readFileSync(0, 'utf8').trim().split(' ').map(Number);
console.log(majorityElement(nums));",
                Tags = JsonSerializer.Serialize(new[] { "array", "hash-table", "voting" }),
                IsPublished = true,
                TestCases =
                [
                    new TestCase { Input = "3 2 3",       ExpectedOutput = "3", IsHidden = false, OrderIndex = 0, Description = "Basic" },
                    new TestCase { Input = "2 2 1 1 2",   ExpectedOutput = "2", IsHidden = false, OrderIndex = 1, Description = "Not at start" },
                    new TestCase { Input = "1",            ExpectedOutput = "1", IsHidden = true,  OrderIndex = 2, Description = "Single" },
                    new TestCase { Input = "6 5 5 5 6 5 5", ExpectedOutput = "5", IsHidden = true, OrderIndex = 3, Description = "Larger" },
                ]
            },
        ];
    }
}
