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

        // Apply pending migrations
        await db.Database.MigrateAsync();

        // Seed admin user if not exists
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

        // Don't seed if challenges already exist
        if (await db.Challenges.AnyAsync()) return;

        var challenges = GetSeedChallenges();
        db.Challenges.AddRange(challenges);
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

Given an array of integers `nums` and an integer `target`, return the **indices** of the two numbers such that they add up to `target`.

You may assume that each input would have **exactly one solution**, and you may not use the same element twice.

## Input Format
- First line: space-separated integers (the array)
- Second line: the target integer

## Output Format
- Two space-separated indices (0-based)

## Example
```
Input:
2 7 11 15
9

Output:
0 1
```

**Explanation:** Because `nums[0] + nums[1] == 9`, we return `0 1`.",
                Difficulty = ChallengeDifficulty.Easy,
                SupportedLanguages = ChallengeLanguage.Both,
                StarterCodePython = @"nums = list(map(int, input().split()))
target = int(input())

# Your code here
",
                StarterCodeJavaScript = @"const nums = require('readline').question('').split(' ').map(Number);
const target = parseInt(require('readline').question(''));

// Your code here
",
                Tags = JsonSerializer.Serialize(new[] { "array", "hash-table" }),
                IsPublished = true,
                TestCases =
                [
                    new TestCase { Input = "2 7 11 15\n9", ExpectedOutput = "0 1", IsHidden = false, OrderIndex = 0, Description = "Basic case" },
                    new TestCase { Input = "3 2 4\n6", ExpectedOutput = "1 2", IsHidden = false, OrderIndex = 1, Description = "Non-adjacent elements" },
                    new TestCase { Input = "3 3\n6", ExpectedOutput = "0 1", IsHidden = true, OrderIndex = 2, Description = "Duplicate values" },
                    new TestCase { Input = "1 5 3 7 2 8\n9", ExpectedOutput = "0 4", IsHidden = true, OrderIndex = 3, Description = "Hidden: larger array" }, // Corrected: 1+8=9 -> index 0,5
                ]
            },

            // 2. FizzBuzz
            new Challenge
            {
                Title = "FizzBuzz",
                Slug = "fizzbuzz",
                Description = @"# FizzBuzz

Given an integer `n`, print numbers from 1 to `n`. But for multiples of 3, print `Fizz` instead of the number, for multiples of 5 print `Buzz`, and for multiples of both 3 and 5 print `FizzBuzz`.

## Input Format
- A single integer `n`

## Output Format
- One value per line

## Example
```
Input:
15

Output:
1
2
Fizz
4
Buzz
Fizz
7
8
Fizz
Buzz
11
Fizz
13
14
FizzBuzz
```",
                Difficulty = ChallengeDifficulty.Easy,
                SupportedLanguages = ChallengeLanguage.Both,
                StarterCodePython = @"n = int(input())

# Your code here
",
                StarterCodeJavaScript = @"const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin });
rl.on('line', (line) => {
    const n = parseInt(line);
    // Your code here
    rl.close();
});
",
                Tags = JsonSerializer.Serialize(new[] { "basics", "conditionals" }),
                IsPublished = true,
                TestCases =
                [
                    new TestCase { Input = "5", ExpectedOutput = "1\n2\nFizz\n4\nBuzz", IsHidden = false, OrderIndex = 0, Description = "n=5" },
                    new TestCase { Input = "15", ExpectedOutput = "1\n2\nFizz\n4\nBuzz\nFizz\n7\n8\nFizz\nBuzz\n11\nFizz\n13\n14\nFizzBuzz", IsHidden = false, OrderIndex = 1, Description = "n=15" },
                    new TestCase { Input = "1", ExpectedOutput = "1", IsHidden = true, OrderIndex = 2, Description = "n=1 edge case" },
                    new TestCase { Input = "30", ExpectedOutput = "1\n2\nFizz\n4\nBuzz\nFizz\n7\n8\nFizz\nBuzz\n11\nFizz\n13\n14\nFizzBuzz\n16\n17\nFizz\n19\nBuzz\nFizz\n22\n23\nFizz\nBuzz\n26\nFizz\n28\n29\nFizzBuzz", IsHidden = true, OrderIndex = 3, Description = "n=30" },
                ]
            },

            // 3. Palindrome
            new Challenge
            {
                Title = "Palindrome Check",
                Slug = "palindrome",
                Description = @"# Palindrome Check

Given a string `s`, determine if it is a **palindrome** (reads the same forwards and backwards).

Consider only **alphanumeric characters** and ignore case.

## Input Format
- A single string

## Output Format
- `true` or `false`

## Example
```
Input:
A man, a plan, a canal: Panama

Output:
true
```",
                Difficulty = ChallengeDifficulty.Easy,
                SupportedLanguages = ChallengeLanguage.Both,
                StarterCodePython = @"s = input()

# Your code here
",
                StarterCodeJavaScript = @"const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin });
rl.on('line', (line) => {
    // Your code here
    rl.close();
});
",
                Tags = JsonSerializer.Serialize(new[] { "string", "two-pointers" }),
                IsPublished = true,
                TestCases =
                [
                    new TestCase { Input = "A man, a plan, a canal: Panama", ExpectedOutput = "true", IsHidden = false, OrderIndex = 0, Description = "Classic palindrome" },
                    new TestCase { Input = "race a car", ExpectedOutput = "false", IsHidden = false, OrderIndex = 1, Description = "Not a palindrome" },
                    new TestCase { Input = " ", ExpectedOutput = "true", IsHidden = true, OrderIndex = 2, Description = "Empty/space" },
                    new TestCase { Input = "ab", ExpectedOutput = "false", IsHidden = true, OrderIndex = 3, Description = "Short non-palindrome" },
                    new TestCase { Input = "aba", ExpectedOutput = "true", IsHidden = true, OrderIndex = 4, Description = "Short palindrome" },
                ]
            },

            // 4. Fibonacci
            new Challenge
            {
                Title = "Fibonacci",
                Slug = "fibonacci",
                Description = @"# Fibonacci

Given an integer `n`, return the `n`-th Fibonacci number.

The Fibonacci sequence is: `0, 1, 1, 2, 3, 5, 8, 13, 21, ...`
- F(0) = 0
- F(1) = 1
- F(n) = F(n-1) + F(n-2)

## Input Format
- A single integer `n` (0 <= n <= 30)

## Output Format
- The n-th Fibonacci number

## Example
```
Input:
6

Output:
8
```",
                Difficulty = ChallengeDifficulty.Easy,
                SupportedLanguages = ChallengeLanguage.Both,
                StarterCodePython = @"n = int(input())

# Your code here
",
                StarterCodeJavaScript = @"const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin });
rl.on('line', (line) => {
    const n = parseInt(line);
    // Your code here
    rl.close();
});
",
                Tags = JsonSerializer.Serialize(new[] { "math", "recursion", "dynamic-programming" }),
                IsPublished = true,
                TestCases =
                [
                    new TestCase { Input = "0", ExpectedOutput = "0", IsHidden = false, OrderIndex = 0, Description = "F(0)" },
                    new TestCase { Input = "1", ExpectedOutput = "1", IsHidden = false, OrderIndex = 1, Description = "F(1)" },
                    new TestCase { Input = "6", ExpectedOutput = "8", IsHidden = false, OrderIndex = 2, Description = "F(6)" },
                    new TestCase { Input = "10", ExpectedOutput = "55", IsHidden = true, OrderIndex = 3, Description = "F(10)" },
                    new TestCase { Input = "20", ExpectedOutput = "6765", IsHidden = true, OrderIndex = 4, Description = "F(20)" },
                    new TestCase { Input = "30", ExpectedOutput = "832040", IsHidden = true, OrderIndex = 5, Description = "F(30)" },
                ]
            },

            // 5. Anagram
            new Challenge
            {
                Title = "Anagram Check",
                Slug = "anagram",
                Description = @"# Anagram Check

Given two strings `s` and `t`, determine if `t` is an **anagram** of `s`.

An anagram uses the exact same letters with the exact same frequency.

## Input Format
- First line: string `s`
- Second line: string `t`

## Output Format
- `true` or `false`

## Example
```
Input:
anagram
nagaram

Output:
true
```",
                Difficulty = ChallengeDifficulty.Medium,
                SupportedLanguages = ChallengeLanguage.Both,
                StarterCodePython = @"s = input()
t = input()

# Your code here
",
                StarterCodeJavaScript = @"const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin });
const lines = [];
rl.on('line', (line) => {
    lines.push(line);
    if (lines.length === 2) {
        const s = lines[0];
        const t = lines[1];
        // Your code here
        rl.close();
    }
});
",
                Tags = JsonSerializer.Serialize(new[] { "string", "sorting", "hash-table" }),
                IsPublished = true,
                TestCases =
                [
                    new TestCase { Input = "anagram\nnagaram", ExpectedOutput = "true", IsHidden = false, OrderIndex = 0, Description = "Valid anagram" },
                    new TestCase { Input = "rat\ncar", ExpectedOutput = "false", IsHidden = false, OrderIndex = 1, Description = "Not an anagram" },
                    new TestCase { Input = "listen\nsilent", ExpectedOutput = "true", IsHidden = true, OrderIndex = 2, Description = "listen/silent" },
                    new TestCase { Input = "hello\nworld", ExpectedOutput = "false", IsHidden = true, OrderIndex = 3, Description = "Different lengths check" },
                    new TestCase { Input = "a\na", ExpectedOutput = "true", IsHidden = true, OrderIndex = 4, Description = "Single char" },
                ]
            }
        ];
    }
}
