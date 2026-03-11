using System.Text.Json;
using CloudCode.Application.DTOs.Challenges;
using CloudCode.Application.Interfaces;
using CloudCode.Domain.Entities;
using CloudCode.Domain.Enums;
using CloudCode.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
namespace CloudCode.Infrastructure.Services;

public class ChallengeService : IChallengeService
{
    private readonly ApplicationDbContext _db;

    public ChallengeService(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<List<ChallengeListItemDto>> GetPublishedChallengesAsync(
        Guid? userId, ChallengeDifficulty? difficulty = null, ChallengeLanguage? language = null)
    {
        var query = _db.Challenges
            .Where(c => c.IsPublished)
            .AsQueryable();

        if (difficulty.HasValue)
            query = query.Where(c => c.Difficulty == difficulty.Value);
        if (language.HasValue)
            query = query.Where(c => c.SupportedLanguages == language.Value || c.SupportedLanguages == ChallengeLanguage.Both);

        var challenges = await query.OrderBy(c => c.Difficulty).ThenBy(c => c.Title).ToListAsync();

        // Get user progress if authenticated
        Dictionary<Guid, UserProgress> progressMap = new();
        if (userId.HasValue)
        {
            var progressList = await _db.UserProgress
                .Where(p => p.UserId == userId.Value)
                .ToListAsync();
            progressMap = progressList.ToDictionary(p => p.ChallengeId);
        }

        // Get success rates
        var submissionStats = await _db.UserSubmissions
            .GroupBy(s => s.ChallengeId)
            .Select(g => new
            {
                ChallengeId = g.Key,
                TotalUsers = g.Select(s => s.UserId).Distinct().Count(),
                SolvedUsers = g.Where(s => s.Score == 100).Select(s => s.UserId).Distinct().Count()
            })
            .ToDictionaryAsync(x => x.ChallengeId);

        return challenges.Select(c =>
        {
            progressMap.TryGetValue(c.Id, out var progress);
            submissionStats.TryGetValue(c.Id, out var stats);

            return new ChallengeListItemDto
            {
                Id = c.Id,
                Title = c.Title,
                Slug = c.Slug,
                Difficulty = c.Difficulty,
                SupportedLanguages = c.SupportedLanguages,
                Tags = DeserializeTags(c.Tags),
                IsPublished = c.IsPublished,
                SuccessRate = stats != null && stats.TotalUsers > 0
                    ? Math.Round((double)stats.SolvedUsers / stats.TotalUsers * 100, 1)
                    : 0,
                IsSolved = progress?.IsSolved,
                BestScore = progress?.BestScore
            };
        }).ToList();
    }

    public async Task<ChallengeListItemDto?> GetDailyChallengeAsync(Guid? userId)
    {
        var challenges = await _db.Challenges
            .Where(c => c.IsPublished)
            .OrderBy(c => c.Id)
            .ToListAsync();

        if (challenges.Count == 0) return null;

        var epoch = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        var dayIndex = (int)(DateTime.UtcNow.Date - epoch).TotalDays % challenges.Count;
        var challenge = challenges[dayIndex];

        UserProgress? progress = null;
        if (userId.HasValue)
            progress = await _db.UserProgress.FirstOrDefaultAsync(p => p.UserId == userId.Value && p.ChallengeId == challenge.Id);

        var stats = await _db.UserSubmissions
            .Where(s => s.ChallengeId == challenge.Id)
            .GroupBy(_ => 1)
            .Select(g => new
            {
                TotalUsers = g.Select(s => s.UserId).Distinct().Count(),
                SolvedUsers = g.Where(s => s.Score == 100).Select(s => s.UserId).Distinct().Count()
            })
            .FirstOrDefaultAsync();

        return new ChallengeListItemDto
        {
            Id = challenge.Id,
            Title = challenge.Title,
            Slug = challenge.Slug,
            Difficulty = challenge.Difficulty,
            SupportedLanguages = challenge.SupportedLanguages,
            Tags = DeserializeTags(challenge.Tags),
            IsPublished = challenge.IsPublished,
            SuccessRate = stats != null && stats.TotalUsers > 0
                ? Math.Round((double)stats.SolvedUsers / stats.TotalUsers * 100, 1) : 0,
            IsSolved = progress?.IsSolved,
            BestScore = progress?.BestScore
        };
    }

    public async Task<ChallengeDetailDto?> GetBySlugAsync(string slug, Guid? userId)
    {
        var challenge = await _db.Challenges
            .Include(c => c.TestCases.OrderBy(t => t.OrderIndex))
            .FirstOrDefaultAsync(c => c.Slug == slug && c.IsPublished);

        if (challenge == null) return null;

        UserProgress? progress = null;
        if (userId.HasValue)
        {
            progress = await _db.UserProgress
                .FirstOrDefaultAsync(p => p.UserId == userId.Value && p.ChallengeId == challenge.Id);
        }

        return new ChallengeDetailDto
        {
            Id = challenge.Id,
            Title = challenge.Title,
            Slug = challenge.Slug,
            Description = challenge.Description,
            Difficulty = challenge.Difficulty,
            SupportedLanguages = challenge.SupportedLanguages,
            StarterCodePython = challenge.StarterCodePython,
            StarterCodeJavaScript = challenge.StarterCodeJavaScript,
            Tags = DeserializeTags(challenge.Tags),
            VisibleTestCases = challenge.TestCases
                .Where(t => !t.IsHidden)
                .Select(t => new TestCaseDto
                {
                    Id = t.Id,
                    Input = t.Input,
                    ExpectedOutput = t.ExpectedOutput,
                    OrderIndex = t.OrderIndex,
                    Description = t.Description
                }).ToList(),
            TotalTestCases = challenge.TestCases.Count,
            IsSolved = progress?.IsSolved,
            BestScore = progress?.BestScore,
            Hints = DeserializeHints(challenge.Hints),
            // Solution officielle uniquement si l'user a résolu le challenge (score 100)
            OfficialSolutionPython = (progress?.IsSolved == true) ? challenge.OfficialSolutionPython : null,
            OfficialSolutionJS = (progress?.IsSolved == true) ? challenge.OfficialSolutionJS : null,
        };
    }

    public async Task<List<SubmissionDto>> GetUserSubmissionsAsync(string slug, Guid userId)
    {
        var challenge = await _db.Challenges.FirstOrDefaultAsync(c => c.Slug == slug);
        if (challenge == null) return [];

        return await _db.UserSubmissions
            .Where(s => s.ChallengeId == challenge.Id && s.UserId == userId)
            .OrderByDescending(s => s.SubmittedAt)
            .Select(s => new SubmissionDto
            {
                Id = s.Id,
                Language = s.Language,
                Code = s.Code,
                Status = s.Status,
                PassedTests = s.PassedTests,
                TotalTests = s.TotalTests,
                Score = s.Score,
                ExecutionTimeMs = s.ExecutionTimeMs,
                ErrorOutput = s.ErrorOutput,
                SubmittedAt = s.SubmittedAt
            })
            .Take(50)
            .ToListAsync();
    }

    // --- Admin ---

    public async Task<List<ChallengeListItemDto>> GetAllChallengesAsync()
    {
        var challenges = await _db.Challenges
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync();

        return challenges.Select(c => new ChallengeListItemDto
        {
            Id = c.Id,
            Title = c.Title,
            Slug = c.Slug,
            Difficulty = c.Difficulty,
            SupportedLanguages = c.SupportedLanguages,
            Tags = DeserializeTags(c.Tags),
            IsPublished = c.IsPublished
        }).ToList();
    }

    public async Task<ChallengeDetailDto> CreateChallengeAsync(CreateChallengeDto dto)
    {
        var slug = GenerateSlug(dto.Title);

        // Ensure unique slug
        var existingSlug = await _db.Challenges.AnyAsync(c => c.Slug == slug);
        if (existingSlug)
            slug = $"{slug}-{Guid.NewGuid().ToString()[..6]}";

        var challenge = new Challenge
        {
            Title = dto.Title,
            Slug = slug,
            Description = dto.Description,
            Difficulty = dto.Difficulty,
            SupportedLanguages = dto.SupportedLanguages,
            StarterCodePython = dto.StarterCodePython,
            StarterCodeJavaScript = dto.StarterCodeJavaScript,
            Tags = JsonSerializer.Serialize(dto.Tags),
            IsPublished = false,
            OfficialSolutionPython = dto.OfficialSolutionPython,
            OfficialSolutionJS = dto.OfficialSolutionJS,
            Hints = dto.Hints != null ? JsonSerializer.Serialize(dto.Hints) : null
        };

        foreach (var tc in dto.TestCases)
        {
            challenge.TestCases.Add(new TestCase
            {
                Input = tc.Input,
                ExpectedOutput = tc.ExpectedOutput,
                IsHidden = tc.IsHidden,
                OrderIndex = tc.OrderIndex,
                Description = tc.Description
            });
        }

        _db.Challenges.Add(challenge);
        await _db.SaveChangesAsync();

        return await GetChallengeDetailForAdmin(challenge.Id);
    }

    public async Task<ChallengeDetailDto> UpdateChallengeAsync(Guid id, UpdateChallengeDto dto)
    {
        var challenge = await _db.Challenges
            .Include(c => c.TestCases)
            .FirstOrDefaultAsync(c => c.Id == id)
            ?? throw new KeyNotFoundException("Challenge not found");

        if (dto.Title != null)
        {
            challenge.Title = dto.Title;
            challenge.Slug = GenerateSlug(dto.Title);
        }
        if (dto.Description != null) challenge.Description = dto.Description;
        if (dto.Difficulty.HasValue) challenge.Difficulty = dto.Difficulty.Value;
        if (dto.SupportedLanguages.HasValue) challenge.SupportedLanguages = dto.SupportedLanguages.Value;
        if (dto.StarterCodePython != null) challenge.StarterCodePython = dto.StarterCodePython;
        if (dto.StarterCodeJavaScript != null) challenge.StarterCodeJavaScript = dto.StarterCodeJavaScript;
        if (dto.Tags != null) challenge.Tags = JsonSerializer.Serialize(dto.Tags);
        if (dto.OfficialSolutionPython != null) challenge.OfficialSolutionPython = dto.OfficialSolutionPython;
        if (dto.OfficialSolutionJS != null) challenge.OfficialSolutionJS = dto.OfficialSolutionJS;
        if (dto.Hints != null) challenge.Hints = JsonSerializer.Serialize(dto.Hints);

        if (dto.TestCases != null)
        {
            // Replace all test cases
            _db.TestCases.RemoveRange(challenge.TestCases);
            foreach (var tc in dto.TestCases)
            {
                challenge.TestCases.Add(new TestCase
                {
                    ChallengeId = challenge.Id,
                    Input = tc.Input,
                    ExpectedOutput = tc.ExpectedOutput,
                    IsHidden = tc.IsHidden,
                    OrderIndex = tc.OrderIndex,
                    Description = tc.Description
                });
            }
        }

        await _db.SaveChangesAsync();
        return await GetChallengeDetailForAdmin(challenge.Id);
    }

    public async Task DeleteChallengeAsync(Guid id)
    {
        var challenge = await _db.Challenges.FindAsync(id)
            ?? throw new KeyNotFoundException("Challenge not found");
        _db.Challenges.Remove(challenge);
        await _db.SaveChangesAsync();
    }

    public async Task<ChallengeDetailDto> TogglePublishAsync(Guid id)
    {
        var challenge = await _db.Challenges.FindAsync(id)
            ?? throw new KeyNotFoundException("Challenge not found");
        challenge.IsPublished = !challenge.IsPublished;
        await _db.SaveChangesAsync();
        return await GetChallengeDetailForAdmin(id);
    }

    // --- Leaderboard ---

    public async Task<LeaderboardPageDto> GetLeaderboardAsync(string period = "all", int page = 1, int pageSize = 20)
    {
        var query = _db.UserProgress.AsQueryable();

        if (period == "month")
            query = query.Where(p => p.LastAttemptAt >= DateTime.UtcNow.AddMonths(-1));
        else if (period == "week")
            query = query.Where(p => p.LastAttemptAt >= DateTime.UtcNow.AddDays(-7));

        var grouped = await query
            .GroupBy(p => p.UserId)
            .Select(g => new
            {
                UserId = g.Key,
                TotalScore = g.Sum(p => p.BestScore),
                ChallengesSolved = g.Count(p => p.IsSolved),
                PerfectScores = g.Count(p => p.BestScore == 100)
            })
            .OrderByDescending(x => x.TotalScore)
            .ThenByDescending(x => x.PerfectScores)
            .ToListAsync();

        var total = grouped.Count;
        var skip = (page - 1) * pageSize;
        var paged = grouped.Skip(skip).Take(pageSize).ToList();

        var userIds = paged.Select(l => l.UserId).ToList();
        var users = await _db.Users
            .Where(u => userIds.Contains(u.Id))
            .ToDictionaryAsync(u => u.Id, u => u.Username);

        var items = paged.Select((entry, index) => new LeaderboardEntryDto
        {
            Rank = skip + index + 1,
            UserId = entry.UserId,
            Username = users.GetValueOrDefault(entry.UserId, "Unknown"),
            TotalScore = entry.TotalScore,
            ChallengesSolved = entry.ChallengesSolved,
            PerfectScores = entry.PerfectScores
        }).ToList();

        return new LeaderboardPageDto { Items = items, Total = total, Page = page, PageSize = pageSize };
    }

    // --- Helpers ---

    private async Task<ChallengeDetailDto> GetChallengeDetailForAdmin(Guid id)
    {
        var challenge = await _db.Challenges
            .Include(c => c.TestCases.OrderBy(t => t.OrderIndex))
            .FirstAsync(c => c.Id == id);

        return new ChallengeDetailDto
        {
            Id = challenge.Id,
            Title = challenge.Title,
            Slug = challenge.Slug,
            Description = challenge.Description,
            Difficulty = challenge.Difficulty,
            SupportedLanguages = challenge.SupportedLanguages,
            StarterCodePython = challenge.StarterCodePython,
            StarterCodeJavaScript = challenge.StarterCodeJavaScript,
            Tags = DeserializeTags(challenge.Tags),
            VisibleTestCases = challenge.TestCases
                .Select(t => new TestCaseDto
                {
                    Id = t.Id,
                    Input = t.Input,
                    ExpectedOutput = t.ExpectedOutput,
                    OrderIndex = t.OrderIndex,
                    Description = t.Description
                }).ToList(),
            TotalTestCases = challenge.TestCases.Count,
            Hints = DeserializeHints(challenge.Hints),
            OfficialSolutionPython = challenge.OfficialSolutionPython,
            OfficialSolutionJS = challenge.OfficialSolutionJS,
        };
    }

    private static string GenerateSlug(string title)
    {
        return title.ToLowerInvariant()
            .Replace(" ", "-")
            .Replace("'", "")
            .Replace("\"", "")
            .Replace(".", "")
            .Replace(",", "");
    }

    private static string[] DeserializeTags(string tags)
    {
        if (string.IsNullOrEmpty(tags)) return [];
        try { return JsonSerializer.Deserialize<string[]>(tags) ?? []; }
        catch { return []; }
    }

    private static string[] DeserializeHints(string? hints)
    {
        if (string.IsNullOrEmpty(hints)) return [];
        try { return JsonSerializer.Deserialize<string[]>(hints) ?? []; }
        catch { return []; }
    }
}
