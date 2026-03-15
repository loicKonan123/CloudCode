using CloudCode.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace CloudCode.Infrastructure.Data;

public static class CourseSeeder
{
    public static async Task SeedCoursesAsync(IServiceProvider serviceProvider)
    {
        using var scope = serviceProvider.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

        // All challenge slugs used across courses
        var allSlugs = new[]
        {
            // Chapter 1 — Beginner: Fundamentals
            "temperature-converter", "simple-calculator", "greeting-format",
            "grade-classifier", "sum-multiples", "countdown",
            // Chapter 2 — Beginner: Data Structures
            "list-stats", "sort-by-score", "dict-invert",
            "common-elements", "even-squares", "group-by-first",
            // Chapter 6 — Intermediate (Fluent Python)
            "vector-add", "matrix-flatten", "word-frequency", "caesar-cipher",
        };

        var allChallenges = await db.Challenges
            .Where(c => allSlugs.Contains(c.Slug))
            .ToDictionaryAsync(c => c.Slug, c => c.Id);

        // Existing course slugs — skip those already in DB (never re-create deleted ones)
        var existingSlugs = await db.Courses.Select(c => c.Slug).ToListAsync();

        var seedCourses = new List<(Course Course, string[] ChallengeSlugs)>
        {
            (
                new Course
                {
                    Id = Guid.NewGuid(),
                    Title = "Python Beginner — Chapter 1: Introduction & Fundamentals",
                    Slug = "python-beginner-ch1",
                    Description = @"## Level 1: Beginner — Chapter 1

This course covers the essential basics of Python programming: variables, types, operators, string formatting, conditionals and loops.

### Lessons covered
1. **Variables & Data Types** — int, float, str, bool, type conversion
2. **Operators & Expressions** — arithmetic, comparison, logical operators
3. **User Interaction & Display** — input(), print(), f-strings
4. **Conditionals** — if, elif, else
5. **Loops & Iteration** — for, while, break, continue, range()",
                    Language = 1, // Python
                    OrderIndex = 1,
                    IsPublished = true,
                    CreatedAt = DateTime.UtcNow
                },
                new[] { "temperature-converter", "simple-calculator", "greeting-format",
                        "grade-classifier", "sum-multiples", "countdown" }
            ),
            (
                new Course
                {
                    Id = Guid.NewGuid(),
                    Title = "Python Beginner — Chapter 2: Essential Data Structures",
                    Slug = "python-beginner-ch2",
                    Description = @"## Level 1: Beginner — Chapter 2

Master Python's built-in data structures: lists, tuples, dictionaries, sets, and the powerful comprehension syntax.

### Lessons covered
1. **Lists** — creation, access, slicing, methods (append, sort, pop)
2. **Tuples** — immutability, unpacking, sorting with tuples
3. **Dictionaries** — key-value pairs, methods (keys, values, items, get)
4. **Sets** — unique elements, union, intersection, difference
5. **Comprehensions** — list, dict and set comprehensions for concise code",
                    Language = 1, // Python
                    OrderIndex = 2,
                    IsPublished = true,
                    CreatedAt = DateTime.UtcNow
                },
                new[] { "list-stats", "sort-by-score", "dict-invert",
                        "common-elements", "even-squares", "group-by-first" }
            ),
            (
                new Course
                {
                    Id = Guid.NewGuid(),
                    Title = "Python Intermediate — The Python Data Model",
                    Slug = "python-intermediate-data-model",
                    Description = @"## Level 2: Intermediate — Pythonic Foundations

Inspired by *Fluent Python* by Luciano Ramalho.

This course is for developers who know Python syntax but still write code that looks like Java or C. The goal is to master **native data structures** and the **Python Data Model**.

### Topics covered
- **Special methods** (dunder) and object behavior
- **Sequences** — lists, tuples, slices, list comprehensions
- **Dictionaries and Sets** — hash tables, defaultdict, Counter
- **Text versus Bytes** — Unicode, encoding/decoding, ord/chr",
                    Language = 1, // Python
                    OrderIndex = 3,
                    IsPublished = true,
                    CreatedAt = DateTime.UtcNow
                },
                new[] { "vector-add", "matrix-flatten", "word-frequency", "caesar-cipher" }
            ),
        };

        var added = false;
        foreach (var (course, slugs) in seedCourses)
        {
            // Skip if this course already exists in DB
            if (existingSlugs.Contains(course.Slug)) continue;

            var order = 0;
            foreach (var slug in slugs)
            {
                if (allChallenges.TryGetValue(slug, out var challengeId))
                {
                    course.CourseChallenges.Add(new CourseChallenge
                    {
                        Id = Guid.NewGuid(),
                        CourseId = course.Id,
                        ChallengeId = challengeId,
                        OrderIndex = order++
                    });
                }
            }

            db.Courses.Add(course);
            added = true;
        }

        if (added) await db.SaveChangesAsync();
    }
}
