using CloudCode.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CloudCode.Controllers;

[Authorize(Policy = "AdminOnly")]
[Route("api/admin/stats")]
public class AdminStatsController : BaseApiController
{
    private readonly ApplicationDbContext _db;

    public AdminStatsController(ApplicationDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<ActionResult> GetStats()
    {
        var now = DateTime.UtcNow;
        var todayStart = now.Date;
        var weekStart = todayStart.AddDays(-6);
        var monthStart = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);

        // Users
        var totalUsers = await _db.Users.CountAsync();
        var newUsersToday = await _db.Users.CountAsync(u => u.CreatedAt >= todayStart);
        var newUsersWeek = await _db.Users.CountAsync(u => u.CreatedAt >= weekStart);

        // Submissions
        var totalSubmissions = await _db.UserSubmissions.CountAsync();
        var submissionsToday = await _db.UserSubmissions.CountAsync(s => s.SubmittedAt >= todayStart);
        var submissionsWeek = await _db.UserSubmissions.CountAsync(s => s.SubmittedAt >= weekStart);

        // Challenges
        var totalChallenges = await _db.Challenges.CountAsync();
        var publishedChallenges = await _db.Challenges.CountAsync(c => c.IsPublished);
        var totalSolves = await _db.UserProgress.CountAsync(p => p.IsSolved);

        // VS Matches
        var totalMatches = await _db.VsMatches.CountAsync();
        var matchesToday = await _db.VsMatches.CountAsync(m => m.StartedAt >= todayStart);

        // Submissions per day — last 14 days
        var submissionsPerDay = await _db.UserSubmissions
            .Where(s => s.SubmittedAt >= todayStart.AddDays(-13))
            .GroupBy(s => s.SubmittedAt.Date)
            .Select(g => new { Date = g.Key, Count = g.Count() })
            .ToListAsync();

        var last14Days = Enumerable.Range(0, 14)
            .Select(i => todayStart.AddDays(-13 + i))
            .Select(d => new
            {
                date = d.ToString("MM-dd"),
                count = submissionsPerDay.FirstOrDefault(x => x.Date == d)?.Count ?? 0
            })
            .ToList();

        // Top 5 most popular challenges
        var topChallenges = await _db.UserSubmissions
            .GroupBy(s => s.ChallengeId)
            .Select(g => new { ChallengeId = g.Key, Count = g.Count() })
            .OrderByDescending(x => x.Count)
            .Take(5)
            .Join(_db.Challenges, s => s.ChallengeId, c => c.Id, (s, c) => new
            {
                title = c.Title,
                slug = c.Slug,
                difficulty = (int)c.Difficulty,
                submissions = s.Count
            })
            .ToListAsync();

        return Ok(new
        {
            users = new { total = totalUsers, today = newUsersToday, week = newUsersWeek },
            submissions = new { total = totalSubmissions, today = submissionsToday, week = submissionsWeek },
            challenges = new { total = totalChallenges, published = publishedChallenges, solves = totalSolves },
            matches = new { total = totalMatches, today = matchesToday },
            submissionsPerDay = last14Days,
            topChallenges,
        });
    }
}
