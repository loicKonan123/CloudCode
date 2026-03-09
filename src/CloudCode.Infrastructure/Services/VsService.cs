using CloudCode.Application.DTOs.Vs;
using CloudCode.Application.Interfaces;
using CloudCode.Domain.Entities;
using CloudCode.Domain.Enums;
using CloudCode.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace CloudCode.Infrastructure.Services;

public class VsService : IVsService
{
    private readonly ApplicationDbContext _db;
    private readonly IJudgeService _judge;

    public VsService(ApplicationDbContext db, IJudgeService judge)
    {
        _db = db;
        _judge = judge;
    }

    public async Task<VsRankDto> GetOrCreateRankAsync(Guid userId)
    {
        var rank = await _db.VsRanks
            .Include(r => r.User)
            .FirstOrDefaultAsync(r => r.UserId == userId);

        if (rank == null)
        {
            var user = await _db.Users.FindAsync(userId)
                ?? throw new Exception("User not found");

            rank = new VsRank { UserId = userId };
            _db.VsRanks.Add(rank);
            await _db.SaveChangesAsync();

            rank.User = user;
        }

        return MapRank(rank);
    }

    public async Task<VsMatchDto> GetMatchAsync(Guid matchId, Guid userId)
    {
        var match = await _db.VsMatches
            .Include(m => m.Player1)
            .Include(m => m.Player2)
            .Include(m => m.Challenge)
            .FirstOrDefaultAsync(m => m.Id == matchId)
            ?? throw new Exception("Match not found");

        if (match.Player1Id != userId && match.Player2Id != userId)
            throw new UnauthorizedAccessException("Not a participant of this match");

        return await MapMatch(match);
    }

    public async Task<List<VsMatchDto>> GetMatchHistoryAsync(Guid userId, int limit = 10)
    {
        var matches = await _db.VsMatches
            .Include(m => m.Player1)
            .Include(m => m.Player2)
            .Include(m => m.Challenge)
            .Where(m => (m.Player1Id == userId || m.Player2Id == userId)
                     && m.Status == VsMatchStatus.Finished)
            .OrderByDescending(m => m.FinishedAt)
            .Take(limit)
            .ToListAsync();

        var result = new List<VsMatchDto>();
        foreach (var m in matches)
            result.Add(await MapMatch(m));
        return result;
    }

    public async Task<List<VsLeaderboardEntryDto>> GetLeaderboardAsync(int limit = 50)
    {
        var ranks = await _db.VsRanks
            .Include(r => r.User)
            .Where(r => r.Wins + r.Losses + r.Draws > 0)
            .OrderByDescending(r => r.Elo)
            .Take(limit)
            .ToListAsync();

        return ranks.Select((r, i) => new VsLeaderboardEntryDto
        {
            Rank = i + 1,
            UserId = r.UserId,
            Username = r.User.Username,
            Avatar = r.User.Avatar,
            Elo = r.Elo,
            Tier = r.GetTier(),
            Wins = r.Wins,
            Losses = r.Losses,
            WinRate = (r.Wins + r.Losses + r.Draws) == 0
                ? 0
                : Math.Round((double)r.Wins / (r.Wins + r.Losses + r.Draws) * 100, 1)
        }).ToList();
    }

    public async Task<VsMatchResultDto> SubmitCodeAsync(Guid matchId, Guid userId, string code, string language)
    {
        var match = await _db.VsMatches
            .Include(m => m.Challenge)
            .FirstOrDefaultAsync(m => m.Id == matchId)
            ?? throw new Exception("Match not found");

        if (match.Status != VsMatchStatus.InProgress)
            throw new InvalidOperationException("Match is not in progress");

        if (match.Player1Id != userId && match.Player2Id != userId)
            throw new UnauthorizedAccessException("Not a participant");

        // Use the player's own language stored at match creation (ignore submitted language)
        var playerLanguage = match.Player1Id == userId ? match.Player1Language : match.Player2Language;
        var langEnum = playerLanguage.ToLower() == "python" ? ChallengeLanguage.Python : ChallengeLanguage.JavaScript;

        // Run judge with all test cases
        var judgeResult = await _judge.RunTestsAsync(match.ChallengeId, code, langEnum, visibleOnly: false);

        bool passed = judgeResult.Score == 100;

        // Mark submission
        if (match.Player1Id == userId)
            match.Player1Submitted = true;
        else
            match.Player2Submitted = true;

        // If passed → they win
        if (passed && match.WinnerId == null)
        {
            match.WinnerId = userId;
            match.Status = VsMatchStatus.Finished;
            match.FinishedAt = DateTime.UtcNow;
            await UpdateEloAsync(match, userId);
        }
        else if (match.Player1Submitted && match.Player2Submitted && match.WinnerId == null)
        {
            // Both submitted but neither got 100% — draw or best score wins
            match.Status = VsMatchStatus.Finished;
            match.FinishedAt = DateTime.UtcNow;
            await UpdateEloDrawAsync(match);
        }

        await _db.SaveChangesAsync();

        return new VsMatchResultDto
        {
            Passed = passed,
            PassedTests = judgeResult.PassedTests,
            TotalTests = judgeResult.TotalTests,
            Score = judgeResult.Score,
            ExecutionTimeMs = (long)judgeResult.TotalExecutionTimeMs,
            ErrorOutput = judgeResult.Results.FirstOrDefault(r => r.Error != null)?.Error
        };
    }

    public async Task<VsMatchDto> CreateMatchAsync(Guid player1Id, Guid player2Id, string player1Language, string player2Language)
    {
        // Pick a random published challenge
        var challenges = await _db.Challenges
            .Where(c => c.IsPublished)
            .ToListAsync();

        if (!challenges.Any())
            throw new Exception("No challenges available for VS mode");

        var challenge = challenges[Random.Shared.Next(challenges.Count)];

        var match = new VsMatch
        {
            Player1Id = player1Id,
            Player2Id = player2Id,
            ChallengeId = challenge.Id,
            Player1Language = player1Language,
            Player2Language = player2Language,
            Status = VsMatchStatus.InProgress,
            StartedAt = DateTime.UtcNow
        };

        _db.VsMatches.Add(match);
        await _db.SaveChangesAsync();

        // Ensure both have rank entries
        await EnsureRankExistsAsync(player1Id);
        await EnsureRankExistsAsync(player2Id);

        // Reload with navigations
        return await GetMatchAsync(match.Id, player1Id);
    }

    public async Task CancelMatchAsync(Guid matchId, Guid requestingUserId)
    {
        var match = await _db.VsMatches.FindAsync(matchId)
            ?? throw new Exception("Match not found");

        if (match.Player1Id != requestingUserId && match.Player2Id != requestingUserId)
            throw new UnauthorizedAccessException("Not a participant");

        if (match.Status == VsMatchStatus.Finished)
            return;

        // Forfeit = opponent wins
        var winnerId = match.Player1Id == requestingUserId ? match.Player2Id : match.Player1Id;
        match.WinnerId = winnerId;
        match.Status = VsMatchStatus.Cancelled;
        match.FinishedAt = DateTime.UtcNow;

        await UpdateEloAsync(match, winnerId);
        await _db.SaveChangesAsync();
    }

    // ── Elo helpers ──────────────────────────────────────────────────────────

    private async Task UpdateEloAsync(VsMatch match, Guid winnerId)
    {
        var rank1 = await EnsureRankExistsAsync(match.Player1Id);
        var rank2 = await EnsureRankExistsAsync(match.Player2Id);

        const int K = 32;
        double expected1 = 1.0 / (1.0 + Math.Pow(10, (rank2.Elo - rank1.Elo) / 400.0));
        double expected2 = 1.0 - expected1;

        double score1 = winnerId == match.Player1Id ? 1.0 : 0.0;
        double score2 = 1.0 - score1;

        int change1 = (int)Math.Round(K * (score1 - expected1));
        int change2 = (int)Math.Round(K * (score2 - expected2));

        rank1.Elo = Math.Max(100, rank1.Elo + change1);
        rank2.Elo = Math.Max(100, rank2.Elo + change2);

        if (winnerId == match.Player1Id) { rank1.Wins++; rank2.Losses++; rank1.CurrentStreak++; rank2.CurrentStreak = 0; }
        else { rank2.Wins++; rank1.Losses++; rank2.CurrentStreak++; rank1.CurrentStreak = 0; }

        if (rank1.CurrentStreak > rank1.BestStreak) rank1.BestStreak = rank1.CurrentStreak;
        if (rank2.CurrentStreak > rank2.BestStreak) rank2.BestStreak = rank2.CurrentStreak;

        match.Player1EloChange = change1;
        match.Player2EloChange = change2;
    }

    private async Task UpdateEloDrawAsync(VsMatch match)
    {
        var rank1 = await EnsureRankExistsAsync(match.Player1Id);
        var rank2 = await EnsureRankExistsAsync(match.Player2Id);

        const int K = 32;
        double expected1 = 1.0 / (1.0 + Math.Pow(10, (rank2.Elo - rank1.Elo) / 400.0));

        int change1 = (int)Math.Round(K * (0.5 - expected1));
        int change2 = -change1;

        rank1.Elo = Math.Max(100, rank1.Elo + change1);
        rank2.Elo = Math.Max(100, rank2.Elo + change2);

        rank1.Draws++;
        rank2.Draws++;
        rank1.CurrentStreak = 0;
        rank2.CurrentStreak = 0;

        match.Player1EloChange = change1;
        match.Player2EloChange = change2;
    }

    private async Task<VsRank> EnsureRankExistsAsync(Guid userId)
    {
        var rank = await _db.VsRanks.FirstOrDefaultAsync(r => r.UserId == userId);
        if (rank == null)
        {
            rank = new VsRank { UserId = userId };
            _db.VsRanks.Add(rank);
            await _db.SaveChangesAsync();
        }
        return rank;
    }

    // ── Mappers ──────────────────────────────────────────────────────────────

    private static VsRankDto MapRank(VsRank r) => new()
    {
        UserId = r.UserId,
        Username = r.User.Username,
        Avatar = r.User.Avatar,
        Elo = r.Elo,
        Tier = r.GetTier(),
        Wins = r.Wins,
        Losses = r.Losses,
        Draws = r.Draws,
        CurrentStreak = r.CurrentStreak,
        BestStreak = r.BestStreak
    };

    private async Task<VsMatchDto> MapMatch(VsMatch m)
    {
        var rank1 = await EnsureRankExistsAsync(m.Player1Id);
        var rank2 = await EnsureRankExistsAsync(m.Player2Id);

        return new VsMatchDto
        {
            Id = m.Id,
            Player1 = new VsPlayerDto
            {
                Id = m.Player1Id,
                Username = m.Player1.Username,
                Avatar = m.Player1.Avatar,
                Elo = rank1.Elo,
                Tier = rank1.GetTier(),
                Submitted = m.Player1Submitted
            },
            Player2 = new VsPlayerDto
            {
                Id = m.Player2Id,
                Username = m.Player2.Username,
                Avatar = m.Player2.Avatar,
                Elo = rank2.Elo,
                Tier = rank2.GetTier(),
                Submitted = m.Player2Submitted
            },
            ChallengeTitle = m.Challenge.Title,
            ChallengeSlug = m.Challenge.Slug,
            Player1Language = m.Player1Language,
            Player2Language = m.Player2Language,
            Status = m.Status,
            WinnerId = m.WinnerId,
            StartedAt = m.StartedAt,
            FinishedAt = m.FinishedAt,
            Player1EloChange = m.Player1EloChange,
            Player2EloChange = m.Player2EloChange
        };
    }
}
